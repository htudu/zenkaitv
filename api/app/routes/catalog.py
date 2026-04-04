from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db_session
from ..dependencies import get_current_user
from ..media_library import scan_local_media
from ..models import Entitlement, Movie, User
from ..schemas import MovieListResponse


router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/movies", response_model=MovieListResponse)
def list_movies(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
) -> MovieListResponse:
    local_movie_ids = set(scan_local_media())
    statement = (
        select(Movie)
        .join(Entitlement, Entitlement.movie_id == Movie.id)
        .where(Entitlement.user_id == current_user.id)
        .order_by(Movie.title.asc())
    )
    movies = session.scalars(statement).all()
    return MovieListResponse(
        items=[
            {
                "id": movie.id,
                "title": movie.title,
                "year": movie.year,
                "duration_minutes": movie.duration_minutes,
                "synopsis": movie.synopsis,
                "poster_url": movie.poster_url,
                "genres": [genre for genre in movie.genres.split(",") if genre],
                "is_local": movie.id in local_movie_ids,
            }
            for movie in movies
        ]
    )
