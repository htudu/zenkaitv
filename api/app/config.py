import os
import shutil
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def _find_ffmpeg() -> str | None:
    detected = shutil.which("ffmpeg")
    if detected:
        return detected

    winget_path = (
        Path.home()
        / "AppData"
        / "Local"
        / "Microsoft"
        / "WinGet"
        / "Packages"
        / "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
        / "ffmpeg-8.1-full_build"
        / "bin"
        / "ffmpeg.exe"
    )
    if winget_path.exists():
        return str(winget_path)

    return None


def _parse_origins(raw_value: str | None) -> list[str]:
    if not raw_value:
        return ["http://localhost:5173"]

    return [item.strip() for item in raw_value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Stream Movies API"
    app_env: str = "development"
    app_debug: bool = True
    signing_secret: str = "change-me"
    database_url: str = "sqlite:///./stream_movies.db"
    local_uploads_dir: str = str(REPO_ROOT / "movie_uploads")
    local_hls_dir: str = str(REPO_ROOT / "generated_media" / "hls")
    azure_storage_account_name: str = ""
    azure_storage_account_url: str = ""
    azure_storage_container: str = ""
    azure_catalog_container: str = "movies"
    azure_storage_connection_string: str = ""
    azure_storage_hls_prefix: str = "hls"
    azure_storage_source_prefix: str = "source"
    ffmpeg_path: str | None = None
    api_cors_origins: list[str] | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Stream Movies API"),
        app_env=os.getenv("APP_ENV", "development"),
        app_debug=os.getenv("APP_DEBUG", "true").lower() in {"1", "true", "yes"},
        signing_secret=os.getenv("STREAM_SIGNING_SECRET", "change-me"),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./stream_movies.db"),
        local_uploads_dir=os.getenv("LOCAL_UPLOADS_DIR", str(REPO_ROOT / "movie_uploads")),
        local_hls_dir=os.getenv("LOCAL_HLS_DIR", str(REPO_ROOT / "generated_media" / "hls")),
        azure_storage_account_name=os.getenv("AZURE_STORAGE_ACCOUNT_NAME", ""),
        azure_storage_account_url=os.getenv("AZURE_STORAGE_ACCOUNT_URL", ""),
        azure_storage_container=os.getenv("AZURE_STORAGE_CONTAINER", ""),
        azure_catalog_container=os.getenv("AZURE_CATALOG_CONTAINER", "movies"),
        azure_storage_connection_string=os.getenv("AZURE_STORAGE_CONNECTION_STRING", ""),
        azure_storage_hls_prefix=os.getenv("AZURE_STORAGE_HLS_PREFIX", "hls"),
        azure_storage_source_prefix=os.getenv("AZURE_STORAGE_SOURCE_PREFIX", "source"),
        ffmpeg_path=os.getenv("FFMPEG_PATH") or _find_ffmpeg(),
        api_cors_origins=_parse_origins(os.getenv("API_CORS_ORIGINS")),
    )
