from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings


settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    movie_columns = {column["name"] for column in inspector.get_columns("movies")} if inspector.has_table("movies") else set()

    if "is_deleted" not in movie_columns and inspector.has_table("movies"):
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE movies ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0"))


def get_db_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
