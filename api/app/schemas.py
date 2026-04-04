from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str


class Movie(BaseModel):
    id: str
    title: str
    year: int
    duration_minutes: int
    synopsis: str
    poster_url: str
    genres: list[str] = Field(default_factory=list)
    is_local: bool = False


class MovieListResponse(BaseModel):
    items: list[Movie]


class UserSummary(BaseModel):
    id: int
    username: str
    full_name: str
    is_admin: bool


class AuthLoginRequest(BaseModel):
    username: str
    password: str


class AuthLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSummary


class PlaybackGrantRequest(BaseModel):
    movie_id: str


class PlaybackGrantResponse(BaseModel):
    movie_id: str
    manifest_url: str
    token: str
    expires_at: datetime
    delivery_notes: list[str]
    user_id: int
    stream_type: str = "hls"


class LocalMediaSyncResponse(BaseModel):
    imported_movie_ids: list[str]
    total_local_files: int


class BlobUploadResponse(BaseModel):
    blob_name: str
    url: str
    content_type: str
    size_bytes: int
    overwritten: bool
