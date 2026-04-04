from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..blob_storage import BlobStorageError, BlobStorageNotConfigured, upload_blob
from ..db import get_db_session
from ..dependencies import get_admin_user
from ..media_library import scan_local_media
from ..models import User
from ..schemas import BlobUploadResponse, LocalMediaSyncResponse
from ..seed import sync_local_media


router = APIRouter(prefix="/admin", tags=["admin"])


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