from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Entitlement, Movie, User
from ..schemas import AdminMovieSummary, UserSummary


def serialize_user(user: User) -> UserSummary:
    return UserSummary(id=user.id, username=user.username, full_name=user.full_name, is_admin=user.is_admin)


def serialize_admin_movie(movie: Movie, entitlement_count: int) -> AdminMovieSummary:
    return AdminMovieSummary(
        id=movie.id,
        title=movie.title,
        year=movie.year,
        duration_minutes=movie.duration_minutes,
        synopsis=movie.synopsis,
        poster_url=movie.poster_url,
        genres=[genre.strip() for genre in movie.genres.split(',') if genre.strip()],
        is_deleted=movie.is_deleted,
        entitlement_count=entitlement_count,
    )


def ensure_not_last_admin(session: Session, user: User, *, next_is_admin: bool | None = None) -> None:
    if not user.is_admin:
        return

    if next_is_admin is True:
        return

    admin_count = len(session.scalars(select(User).where(User.is_admin.is_(True))).all())
    if admin_count <= 1:
        raise HTTPException(status_code=400, detail='At least one admin user must remain.')


def get_entitlement_count(session: Session, movie_id: str) -> int:
    return len(session.scalars(select(Entitlement).where(Entitlement.movie_id == movie_id)).all())
