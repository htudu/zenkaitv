from datetime import UTC, datetime
import json
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..blob_storage import BlobStorageError, BlobStorageNotConfigured, build_hls_blob_name, build_source_blob_name, list_blob_names, read_blob_text, upload_blob
from ..celery_app import celery_app
from ..config import get_settings
from ..db import get_db_session
from ..dependencies import get_admin_user
from ..media_library import scan_local_media
from ..models import Entitlement, Movie, User
from ..schemas import BlobCatalogSyncMovieResult, BlobCatalogSyncResponse, BlobUploadResponse, LocalMediaSyncResponse, SourceVideoUploadResponse
from ..seed import sync_local_media


router = APIRouter(prefix="/admin", tags=["admin"])


def _humanize_movie_id(movie_id: str) -> str:
    cleaned = re.sub(r"[_-]+", " ", movie_id)
    return re.sub(r"\s+", " ", cleaned).strip().title() or movie_id


def _extract_blob_movie_ids(blob_names: list[str]) -> list[str]:
    settings = get_settings()
    prefixes = [
        settings.azure_storage_hls_prefix.strip().strip("/"),
        settings.azure_storage_source_prefix.strip().strip("/"),
    ]
    discovered: set[str] = set()

    for blob_name in blob_names:
        normalized_blob_name = blob_name.strip("/")
        for prefix in prefixes:
            if not prefix:
                continue
            prefix_with_separator = f"{prefix}/"
            if not normalized_blob_name.startswith(prefix_with_separator):
                continue

            remainder = normalized_blob_name[len(prefix_with_separator):]
            movie_id = remainder.split("/", 1)[0].strip()
            if movie_id:
                discovered.add(movie_id)
            break

    return sorted(discovered)


def _list_relevant_blob_names(container_name: str) -> list[str]:
    settings = get_settings()
    prefixes = [
        settings.azure_storage_hls_prefix.strip().strip("/"),
        settings.azure_storage_source_prefix.strip().strip("/"),
    ]
    collected: set[str] = set()

    for prefix in prefixes:
        if not prefix:
            continue
        collected.update(list_blob_names(prefix, container_name=container_name))

    return sorted(collected)


def _read_blob_movie_metadata(movie_id: str, container_name: str) -> tuple[dict[str, object] | None, bool]:
    metadata_candidates = [
        build_source_blob_name(movie_id, "metadata.json"),
        build_hls_blob_name(movie_id, "metadata.json"),
    ]

    for blob_name in metadata_candidates:
        try:
            raw_text = read_blob_text(blob_name, container_name=container_name)
        except BlobStorageError:
            continue

        try:
            payload = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise BlobStorageError(f"Blob metadata file '{blob_name}' is not valid JSON.") from exc

        if isinstance(payload, dict):
            return payload, True

    return None, False


@router.post("/local-media/sync", response_model=LocalMediaSyncResponse)
def sync_local_media_library(
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> LocalMediaSyncResponse:
    demo_user = session.scalar(select(User).where(User.username == "demo"))
    curator_user = session.scalar(select(User).where(User.username == "curator"))
    imported_movie_ids = sync_local_media(
        session,
        demo_user_id=demo_user.id,
        curator_user_id=curator_user.id,
    )
    session.commit()
    return LocalMediaSyncResponse(
        imported_movie_ids=imported_movie_ids,
        total_local_files=len(scan_local_media()),
    )


@router.post("/blob/sync-catalog", response_model=BlobCatalogSyncResponse)
def sync_blob_catalog(
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> BlobCatalogSyncResponse:
    settings = get_settings()
    catalog_container_name = settings.azure_catalog_container.strip() or "movies"

    try:
        scanned_blob_names = _list_relevant_blob_names(catalog_container_name)
    except BlobStorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except BlobStorageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    discovered_movie_ids = _extract_blob_movie_ids(scanned_blob_names)
    created_movie_ids: list[str] = []
    updated_movie_ids: list[str] = []
    movie_results: list[BlobCatalogSyncMovieResult] = []
    entitlement_records_created = 0
    current_year = datetime.now(UTC).year

    demo_user = session.scalar(select(User).where(User.username == "demo"))
    curator_user = session.scalar(select(User).where(User.username == "curator"))
    entitled_user_ids = {current_user.id}
    if demo_user is not None:
        entitled_user_ids.add(demo_user.id)
    if curator_user is not None:
        entitled_user_ids.add(curator_user.id)

    for movie_id in discovered_movie_ids:
        metadata_payload, metadata_found = _read_blob_movie_metadata(movie_id, catalog_container_name)
        related_blob_count = sum(1 for blob_name in scanned_blob_names if f"/{movie_id}/" in f"/{blob_name}")
        resolved_title = _humanize_movie_id(movie_id)
        resolved_year = current_year
        resolved_duration_minutes = 0
        resolved_synopsis = "Imported automatically from Azure Blob Storage during catalog sync."
        resolved_poster_url = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
        resolved_genres = "Blob Imported,Production"

        if metadata_payload is not None:
            resolved_title = str(metadata_payload.get("title") or resolved_title)
            resolved_year = int(metadata_payload.get("year") or resolved_year)
            resolved_duration_minutes = int(metadata_payload.get("duration_minutes") or resolved_duration_minutes)
            resolved_synopsis = str(metadata_payload.get("synopsis") or resolved_synopsis)
            resolved_poster_url = str(metadata_payload.get("poster_url") or resolved_poster_url)
            genres_value = metadata_payload.get("genres")
            if isinstance(genres_value, list):
                resolved_genres = ",".join(str(item).strip() for item in genres_value if str(item).strip()) or resolved_genres
            elif isinstance(genres_value, str) and genres_value.strip():
                resolved_genres = genres_value.strip()

        movie = session.get(Movie, movie_id)
        if movie is None:
            session.add(
                Movie(
                    id=movie_id,
                    title=resolved_title,
                    year=resolved_year,
                    duration_minutes=resolved_duration_minutes,
                    synopsis=resolved_synopsis,
                    poster_url=resolved_poster_url,
                    genres=resolved_genres,
                )
            )
            created_movie_ids.append(movie_id)
            status = "created"
        else:
            movie.title = resolved_title
            movie.year = resolved_year
            movie.duration_minutes = resolved_duration_minutes
            movie.synopsis = resolved_synopsis
            movie.poster_url = resolved_poster_url
            movie.genres = resolved_genres
            updated_movie_ids.append(movie_id)
            status = "updated"

        for user_id in entitled_user_ids:
            existing_entitlement = session.scalar(
                select(Entitlement).where(Entitlement.user_id == user_id, Entitlement.movie_id == movie_id)
            )
            if existing_entitlement is None:
                session.add(Entitlement(user_id=user_id, movie_id=movie_id))
                entitlement_records_created += 1

        movie_results.append(
            BlobCatalogSyncMovieResult(
                movie_id=movie_id,
                title=resolved_title,
                status=status,
                metadata_found=metadata_found,
                blob_count=related_blob_count,
            )
        )

    session.commit()

    return BlobCatalogSyncResponse(
        container_name=catalog_container_name,
        scanned_blob_names=scanned_blob_names,
        discovered_movie_ids=discovered_movie_ids,
        created_movie_ids=created_movie_ids,
        updated_movie_ids=updated_movie_ids,
        updated_tables=["movies", "entitlements", "catalog"],
        entitlement_records_created=entitlement_records_created,
        total_blobs=len(scanned_blob_names),
        movies=movie_results,
    )


@router.post("/blob/upload", response_model=BlobUploadResponse)
async def upload_blob_asset(
    blob_path: str = Form(...),
    file: UploadFile = File(...),
    overwrite: bool = Form(False),
    _: User = Depends(get_admin_user),
) -> BlobUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Select a file to upload")

    try:
        payload = upload_blob(
            blob_name=blob_path,
            data=file.file,
            content_type=file.content_type,
            overwrite=overwrite,
        )
    except BlobStorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except BlobStorageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        await file.close()

    return BlobUploadResponse(**payload)


@router.post("/source-video/upload", response_model=SourceVideoUploadResponse)
async def upload_source_video(
    movie_id: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    year: int = Form(default_factory=lambda: datetime.now(UTC).year),
    duration_minutes: int = Form(0),
    synopsis: str = Form("Uploaded for worker-based HLS packaging into Azure Blob Storage."),
    poster_url: str = Form(
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
    ),
    genres: str = Form("Uploaded,Production"),
    overwrite: bool = Form(False),
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> SourceVideoUploadResponse:
    normalized_movie_id = movie_id.strip()
    normalized_title = title.strip()
    if not normalized_movie_id:
        raise HTTPException(status_code=400, detail="Movie ID is required")
    if not normalized_title:
        raise HTTPException(status_code=400, detail="Title is required")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Select a source video file to upload")

    source_blob_name = build_source_blob_name(normalized_movie_id, file.filename)

    try:
        upload_blob(
            blob_name=source_blob_name,
            data=file.file,
            content_type=file.content_type or "video/mp4",
            overwrite=overwrite,
        )
    except BlobStorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except BlobStorageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        await file.close()

    movie = session.get(Movie, normalized_movie_id)
    if movie is None:
        movie = Movie(
            id=normalized_movie_id,
            title=normalized_title,
            year=year,
            duration_minutes=duration_minutes,
            synopsis=synopsis,
            poster_url=poster_url,
            genres=genres,
        )
        session.add(movie)
    else:
        movie.title = normalized_title
        movie.year = year
        movie.duration_minutes = duration_minutes
        movie.synopsis = synopsis
        movie.poster_url = poster_url
        movie.genres = genres

    demo_user = session.scalar(select(User).where(User.username == "demo"))
    for user_id in {current_user.id, demo_user.id if demo_user else None}:
        if user_id is None:
            continue
        existing_entitlement = session.scalar(
            select(Entitlement).where(Entitlement.user_id == user_id, Entitlement.movie_id == normalized_movie_id)
        )
        if existing_entitlement is None:
            session.add(Entitlement(user_id=user_id, movie_id=normalized_movie_id))

    session.commit()

    task = celery_app.send_task(
        "media.package_source_to_hls",
        kwargs={
            "movie_id": normalized_movie_id,
            "source_blob_name": source_blob_name,
        },
    )

    return SourceVideoUploadResponse(
        movie_id=normalized_movie_id,
        source_blob_name=source_blob_name,
        task_id=task.id,
        status="queued",
        message="Source video uploaded and worker packaging job queued.",
    )