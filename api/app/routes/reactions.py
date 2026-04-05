from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db_session
from ..models import Reaction
from ..schemas import ReactionRequest, ReactionResponse

ALLOWED_EMOJIS = {"❤️", "😂", "😮", "�", "👏", "🥰", "😳", "😐", "😒", "😤", "😢", "💔"}

router = APIRouter(prefix="/reactions", tags=["reactions"])


@router.get("/{note_id}", response_model=ReactionResponse)
def get_reaction(note_id: str, session: Session = Depends(get_db_session)):
    reaction = session.scalar(
        select(Reaction).where(Reaction.note_id == note_id).order_by(Reaction.id.desc()).limit(1)
    )

    if reaction is None:
        return ReactionResponse(note_id=note_id)

    return ReactionResponse(note_id=reaction.note_id, emoji=reaction.emoji, created_at=reaction.created_at)


@router.put("/{note_id}", response_model=ReactionResponse)
def set_reaction(note_id: str, payload: ReactionRequest, session: Session = Depends(get_db_session)):
    if payload.emoji not in ALLOWED_EMOJIS:
        raise HTTPException(status_code=400, detail="Invalid reaction emoji")

    now = datetime.now(timezone.utc).isoformat()

    existing = session.scalar(
        select(Reaction).where(Reaction.note_id == note_id).order_by(Reaction.id.desc()).limit(1)
    )

    if existing is not None:
        existing.emoji = payload.emoji
        existing.created_at = now
    else:
        session.add(Reaction(note_id=note_id, emoji=payload.emoji, created_at=now))

    session.commit()

    return ReactionResponse(note_id=note_id, emoji=payload.emoji, created_at=now)
