from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db_session
from ..dependencies import get_admin_user
from ..media_library import scan_local_media
from ..models import User
from ..schemas import LocalMediaSyncResponse
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