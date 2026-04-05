from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db import get_db_session
from ...dependencies import get_admin_user
from ...models import User
from ...schemas import AdminUserCreateRequest, AdminUserListResponse, AdminUserUpdateRequest, UserSummary
from ...security import hash_password
from ..common import ensure_not_last_admin, serialize_user


router = APIRouter()


@router.get('/users', response_model=AdminUserListResponse)
def list_admin_users(
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> AdminUserListResponse:
    users = session.scalars(select(User).order_by(User.username.asc())).all()
    return AdminUserListResponse(items=[serialize_user(user) for user in users])


@router.post('/users', response_model=UserSummary)
def create_admin_user(
    payload: AdminUserCreateRequest,
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> UserSummary:
    normalized_username = payload.username.strip()
    normalized_full_name = payload.full_name.strip()
    if not normalized_username:
        raise HTTPException(status_code=400, detail='Username is required')
    if not normalized_full_name:
        raise HTTPException(status_code=400, detail='Full name is required')
    if not payload.password.strip():
        raise HTTPException(status_code=400, detail='Password is required')

    existing_user = session.scalar(select(User).where(User.username == normalized_username))
    if existing_user is not None:
        raise HTTPException(status_code=409, detail='Username already exists')

    user = User(
        username=normalized_username,
        full_name=normalized_full_name,
        password_hash=hash_password(payload.password.strip()),
        is_admin=payload.is_admin,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return serialize_user(user)


@router.put('/users/{user_id}', response_model=UserSummary)
def update_admin_user(
    user_id: int,
    payload: AdminUserUpdateRequest,
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> UserSummary:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail='User not found')

    normalized_username = payload.username.strip()
    normalized_full_name = payload.full_name.strip()
    if not normalized_username:
        raise HTTPException(status_code=400, detail='Username is required')
    if not normalized_full_name:
        raise HTTPException(status_code=400, detail='Full name is required')

    conflicting_user = session.scalar(select(User).where(User.username == normalized_username, User.id != user_id))
    if conflicting_user is not None:
        raise HTTPException(status_code=409, detail='Username already exists')

    if current_user.id == user.id and not payload.is_admin:
        raise HTTPException(status_code=400, detail='You cannot remove your own admin access.')

    ensure_not_last_admin(session, user, next_is_admin=payload.is_admin)

    user.username = normalized_username
    user.full_name = normalized_full_name
    user.is_admin = payload.is_admin
    if payload.password is not None and payload.password.strip():
        user.password_hash = hash_password(payload.password.strip())

    session.commit()
    return serialize_user(user)


@router.delete('/users/{user_id}', response_model=UserSummary)
def delete_admin_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> UserSummary:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail='User not found')
    if current_user.id == user.id:
        raise HTTPException(status_code=400, detail='You cannot delete your own account.')

    ensure_not_last_admin(session, user)

    serialized_user = serialize_user(user)
    session.delete(user)
    session.commit()
    return serialized_user
