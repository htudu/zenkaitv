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


class AdminUserCreateRequest(BaseModel):
    username: str
    full_name: str
    password: str
    is_admin: bool = False


class AdminUserUpdateRequest(BaseModel):
    username: str
    full_name: str
    password: str | None = None
    is_admin: bool


class AdminUserListResponse(BaseModel):
    items: list[UserSummary]


class AdminMovieSummary(BaseModel):
    id: str
    title: str
    year: int
    duration_minutes: int
    synopsis: str
    poster_url: str
    genres: list[str] = Field(default_factory=list)
    is_deleted: bool
    entitlement_count: int


class AdminMovieListResponse(BaseModel):
    items: list[AdminMovieSummary]


class AdminMovieUpdateRequest(BaseModel):
    title: str
    year: int
    duration_minutes: int
    synopsis: str
    poster_url: str
    genres: list[str] = Field(default_factory=list)


class AdminMovieVisibilityResponse(BaseModel):
    movie_id: str
    is_deleted: bool
    message: str


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


class ReactionRequest(BaseModel):
    emoji: str


class ReactionResponse(BaseModel):
    note_id: str
    emoji: str | None = None
    created_at: str | None = None


class RandomNoteResponse(BaseModel):
    note: str


class LocalMediaSyncResponse(BaseModel):
    imported_movie_ids: list[str]
    total_local_files: int


class BlobUploadResponse(BaseModel):
    blob_name: str
    url: str
    content_type: str
    size_bytes: int
    overwritten: bool


class BlobCatalogSyncMovieResult(BaseModel):
    movie_id: str
    title: str
    status: str
    metadata_found: bool
    blob_count: int


class BlobCatalogSyncResponse(BaseModel):
    container_name: str
    scanned_blob_names: list[str]
    discovered_movie_ids: list[str]
    created_movie_ids: list[str]
    updated_movie_ids: list[str]
    updated_tables: list[str]
    entitlement_records_created: int
    total_blobs: int
    movies: list[BlobCatalogSyncMovieResult]


class SourceVideoUploadResponse(BaseModel):
    movie_id: str
    source_blob_name: str
    task_id: str
    status: str
    message: str
