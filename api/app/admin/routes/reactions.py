from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ...db import get_db_session
from ...dependencies import get_admin_user
from ...models import Reaction, User
from ...schemas import ReactionListResponse, ReactionResponse

router = APIRouter()


@router.get('/reactions', response_model=ReactionListResponse)
def list_reactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> ReactionListResponse:
    total = session.scalar(select(func.count(Reaction.id))) or 0
    offset = (page - 1) * page_size

    reactions = session.scalars(
        select(Reaction).order_by(Reaction.id.desc()).offset(offset).limit(page_size)
    ).all()

    return ReactionListResponse(
        items=[
            ReactionResponse(
                note_id=r.note_id,
                emoji=r.emoji,
                note_message=r.note_message,
                created_at=r.created_at,
            )
            for r in reactions
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
