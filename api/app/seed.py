from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from .media_library import scan_local_media
from .models import Entitlement, Movie, User
from .security import hash_password


def sync_local_media(session: Session, *, demo_user_id: int, curator_user_id: int) -> list[str]:
    current_year = datetime.now(UTC).year
    imported_movie_ids: list[str] = []

    for media in scan_local_media().values():
        existing_movie = session.get(Movie, media.movie_id)
        if existing_movie is None:
            session.add(
                Movie(
                    id=media.movie_id,
                    title=media.title,
                    year=current_year,
                    duration_minutes=0,
                    synopsis="Imported automatically from the local movie_uploads folder for direct playback testing.",
                    poster_url="https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=800&q=80",
                    genres="Local Test,Imported",
                )
            )
            imported_movie_ids.append(media.movie_id)

    session.flush()

    for media in scan_local_media().values():
        for user_id in (demo_user_id, curator_user_id):
            existing_entitlement = session.scalar(
                select(Entitlement).where(Entitlement.user_id == user_id, Entitlement.movie_id == media.movie_id)
            )
            if existing_entitlement is None:
                session.add(Entitlement(user_id=user_id, movie_id=media.movie_id))

    return imported_movie_ids


def seed_database(session: Session) -> None:
    user_specs = [
        {
            "username": "demo",
            "full_name": "Demo Viewer",
            "password_hash": hash_password("demo123"),
            "is_admin": False,
        },
        {
            "username": "curator",
            "full_name": "Catalog Curator",
            "password_hash": hash_password("curator123"),
            "is_admin": True,
        },
    ]

    users: dict[str, User] = {}
    for spec in user_specs:
        user = session.scalar(select(User).where(User.username == spec["username"]))
        if user is None:
            user = User(**spec)
            session.add(user)
            session.flush()
        users[user.username] = user

    sample_movies = [
        Movie(
            id="arrival",
            title="Arrival",
            year=2016,
            duration_minutes=116,
            synopsis="A linguist is recruited to interpret the arrival of alien visitors.",
            poster_url="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
            genres="Sci-Fi,Drama",
        ),
        Movie(
            id="moonlight",
            title="Moonlight",
            year=2016,
            duration_minutes=111,
            synopsis="A young man navigates identity, family, and belonging across three defining chapters.",
            poster_url="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
            genres="Drama",
        ),
        Movie(
            id="spirited-away",
            title="Spirited Away",
            year=2001,
            duration_minutes=125,
            synopsis="A girl enters a supernatural world and must free her parents from a curse.",
            poster_url="https://images.unsplash.com/photo-1518131678677-a699bc968b77?auto=format&fit=crop&w=800&q=80",
            genres="Fantasy,Adventure",
        ),
    ]

    for movie in sample_movies:
        existing_movie = session.get(Movie, movie.id)
        if existing_movie is None:
            session.add(movie)

    sync_local_media(session, demo_user_id=users["demo"].id, curator_user_id=users["curator"].id)

    session.flush()

    entitlement_pairs = [
        (users["demo"].id, "arrival"),
        (users["demo"].id, "moonlight"),
        (users["curator"].id, "arrival"),
        (users["curator"].id, "moonlight"),
        (users["curator"].id, "spirited-away"),
    ]

    for user_id, movie_id in entitlement_pairs:
        existing_entitlement = session.scalar(
            select(Entitlement).where(Entitlement.user_id == user_id, Entitlement.movie_id == movie_id)
        )
        if existing_entitlement is None:
            session.add(Entitlement(user_id=user_id, movie_id=movie_id))

    session.commit()
