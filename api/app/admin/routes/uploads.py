from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...blob_storage import BlobStorageError, BlobStorageNotConfigured, build_source_blob_name, upload_blob
from ...celery_app import celery_app
from ...db import get_db_session
from ...dependencies import get_admin_user
from ...models import Entitlement, Movie, User
from ...schemas import BlobUploadResponse, SourceVideoUploadResponse


router = APIRouter()


@router.post('/blob/upload', response_model=BlobUploadResponse)
async def upload_blob_asset(
    blob_path: str = Form(...),
    file: UploadFile = File(...),
    overwrite: bool = Form(False),
    _: User = Depends(get_admin_user),
) -> BlobUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail='Select a file to upload')

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


@router.post('/source-video/upload', response_model=SourceVideoUploadResponse)
async def upload_source_video(
    movie_id: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    year: int = Form(default_factory=lambda: datetime.now(UTC).year),
    duration_minutes: int = Form(0),
    synopsis: str = Form('Uploaded for worker-based HLS packaging into Azure Blob Storage.'),
    poster_url: str = Form(
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'
    ),
    genres: str = Form('Uploaded,Production'),
    overwrite: bool = Form(False),
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> SourceVideoUploadResponse:
    normalized_movie_id = movie_id.strip()
    normalized_title = title.strip()
    if not normalized_movie_id:
        raise HTTPException(status_code=400, detail='Movie ID is required')
    if not normalized_title:
        raise HTTPException(status_code=400, detail='Title is required')
    if not file.filename:
        raise HTTPException(status_code=400, detail='Select a source video file to upload')

    source_blob_name = build_source_blob_name(normalized_movie_id, file.filename)

    try:
        upload_blob(
            blob_name=source_blob_name,
            data=file.file,
            content_type=file.content_type or 'video/mp4',
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

    demo_user = session.scalar(select(User).where(User.username == 'demo'))
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
        'media.package_source_to_hls',
        kwargs={
            'movie_id': normalized_movie_id,
            'source_blob_name': source_blob_name,
        },
    )

    return SourceVideoUploadResponse(
        movie_id=normalized_movie_id,
        source_blob_name=source_blob_name,
        task_id=task.id,
        status='queued',
        message='Source video uploaded and worker packaging job queued.',
    )
