from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...blob_storage import BlobStorageError, BlobStorageNotConfigured
from ...config import get_settings
from ...db import get_db_session
from ...dependencies import get_admin_user
from ...media_library import scan_local_media
from ...models import Entitlement, Movie, User
from ...schemas import BlobCatalogSyncMovieResult, BlobCatalogSyncResponse, LocalMediaSyncResponse
from ...seed import sync_local_media
from ..blob_catalog import default_movie_metadata, extract_blob_movie_ids, list_relevant_blob_names, read_blob_movie_metadata


router = APIRouter()


@router.post('/local-media/sync', response_model=LocalMediaSyncResponse)
def sync_local_media_library(
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> LocalMediaSyncResponse:
    demo_user = session.scalar(select(User).where(User.username == 'demo'))
    curator_user = session.scalar(select(User).where(User.username == 'curator'))
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


@router.post('/blob/sync-catalog', response_model=BlobCatalogSyncResponse)
def sync_blob_catalog(
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> BlobCatalogSyncResponse:
    settings = get_settings()
    catalog_container_name = settings.azure_catalog_container.strip() or 'movies'

    try:
        scanned_blob_names = list_relevant_blob_names(catalog_container_name)
    except BlobStorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except BlobStorageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    discovered_movie_ids = extract_blob_movie_ids(scanned_blob_names)
    created_movie_ids: list[str] = []
    updated_movie_ids: list[str] = []
    movie_results: list[BlobCatalogSyncMovieResult] = []
    entitlement_records_created = 0
    current_year = datetime.now(UTC).year

    demo_user = session.scalar(select(User).where(User.username == 'demo'))
    curator_user = session.scalar(select(User).where(User.username == 'curator'))
    entitled_user_ids = {current_user.id}
    if demo_user is not None:
        entitled_user_ids.add(demo_user.id)
    if curator_user is not None:
        entitled_user_ids.add(curator_user.id)

    for movie_id in discovered_movie_ids:
        metadata_payload, metadata_found = read_blob_movie_metadata(movie_id, catalog_container_name)
        related_blob_count = sum(1 for blob_name in scanned_blob_names if f'/{movie_id}/' in f'/{blob_name}')
        defaults = default_movie_metadata(movie_id)
        resolved_title = str(defaults['title'])
        resolved_year = current_year
        resolved_duration_minutes = int(defaults['duration_minutes'])
        resolved_synopsis = str(defaults['synopsis'])
        resolved_poster_url = str(defaults['poster_url'])
        resolved_genres = str(defaults['genres'])

        if metadata_payload is not None:
            resolved_title = str(metadata_payload.get('title') or resolved_title)
            resolved_year = int(metadata_payload.get('year') or resolved_year)
            resolved_duration_minutes = int(metadata_payload.get('duration_minutes') or resolved_duration_minutes)
            resolved_synopsis = str(metadata_payload.get('synopsis') or resolved_synopsis)
            resolved_poster_url = str(metadata_payload.get('poster_url') or resolved_poster_url)
            genres_value = metadata_payload.get('genres')
            if isinstance(genres_value, list):
                resolved_genres = ','.join(str(item).strip() for item in genres_value if str(item).strip()) or resolved_genres
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
            status = 'created'
        else:
            was_deleted = movie.is_deleted
            movie.title = resolved_title
            movie.year = resolved_year
            movie.duration_minutes = resolved_duration_minutes
            movie.synopsis = resolved_synopsis
            movie.poster_url = resolved_poster_url
            movie.genres = resolved_genres
            movie.is_deleted = False
            updated_movie_ids.append(movie_id)
            status = 'restored' if was_deleted else 'updated'

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
        updated_tables=['movies', 'entitlements', 'catalog'],
        entitlement_records_created=entitlement_records_created,
        total_blobs=len(scanned_blob_names),
        movies=movie_results,
    )
