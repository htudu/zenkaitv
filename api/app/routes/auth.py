from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db_session
from ..dependencies import get_current_user
from ..models import User
from ..schemas import AuthLoginRequest, AuthLoginResponse, UserSummary
from ..security import create_session_token, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_user(user: User) -> UserSummary:
    return UserSummary(id=user.id, username=user.username, full_name=user.full_name, is_admin=user.is_admin)


@router.post("/login", response_model=AuthLoginResponse)
def login(payload: AuthLoginRequest, session: Session = Depends(get_db_session)) -> AuthLoginResponse:
    user = session.scalar(select(User).where(User.username == payload.username))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token, _ = create_session_token(user_id=user.id, username=user.username)
    return AuthLoginResponse(access_token=token, user=_serialize_user(user))


@router.get("/me", response_model=UserSummary)
def get_me(current_user: User = Depends(get_current_user)) -> UserSummary:
    return _serialize_user(current_user)
