from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db import get_db_session
from ...dependencies import get_admin_user
from ...models import Movie, User
from ...schemas import AdminMovieListResponse, AdminMovieSummary, AdminMovieUpdateRequest, AdminMovieVisibilityResponse
from ..common import get_entitlement_count, serialize_admin_movie


router = APIRouter()


@router.get('/movies', response_model=AdminMovieListResponse)
def list_admin_movies(
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> AdminMovieListResponse:
    movies = session.scalars(select(Movie).order_by(Movie.title.asc())).all()
    items = [serialize_admin_movie(movie, get_entitlement_count(session, movie.id)) for movie in movies]
    return AdminMovieListResponse(items=items)


@router.put('/movies/{movie_id}', response_model=AdminMovieSummary)
def update_admin_movie(
    movie_id: str,
    payload: AdminMovieUpdateRequest,
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> AdminMovieSummary:
    movie = session.get(Movie, movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail='Movie not found')

    movie.title = payload.title.strip()
    movie.year = payload.year
    movie.duration_minutes = payload.duration_minutes
    movie.synopsis = payload.synopsis.strip()
    movie.poster_url = payload.poster_url.strip()
    movie.genres = ','.join(genre.strip() for genre in payload.genres if genre.strip())

    session.commit()
    return serialize_admin_movie(movie, get_entitlement_count(session, movie_id))


@router.post('/movies/{movie_id}/soft-delete', response_model=AdminMovieVisibilityResponse)
def soft_delete_admin_movie(
    movie_id: str,
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> AdminMovieVisibilityResponse:
    movie = session.get(Movie, movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail='Movie not found')

    movie.is_deleted = True
    session.commit()
    return AdminMovieVisibilityResponse(
        movie_id=movie_id,
        is_deleted=True,
        message='Movie soft deleted and removed from user catalogs.',
    )


@router.post('/movies/{movie_id}/restore', response_model=AdminMovieVisibilityResponse)
def restore_admin_movie(
    movie_id: str,
    _: User = Depends(get_admin_user),
    session: Session = Depends(get_db_session),
) -> AdminMovieVisibilityResponse:
    movie = session.get(Movie, movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail='Movie not found')

    movie.is_deleted = False
    session.commit()
    return AdminMovieVisibilityResponse(
        movie_id=movie_id,
        is_deleted=False,
        message='Movie restored to user catalogs for entitled viewers.',
    )
