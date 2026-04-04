import os
import shutil
from dataclasses import dataclass


def _find_ffmpeg() -> str | None:
    detected = shutil.which("ffmpeg")
    if detected:
        return detected
    return None


@dataclass(frozen=True)
class Settings:
    azure_storage_account_url: str = ""
    azure_storage_container: str = ""
    azure_storage_connection_string: str = ""
    azure_storage_hls_prefix: str = "hls"
    azure_storage_source_prefix: str = "source"
    ffmpeg_path: str | None = None


def get_settings() -> Settings:
    return Settings(
        azure_storage_account_url=os.getenv("AZURE_STORAGE_ACCOUNT_URL", ""),
        azure_storage_container=os.getenv("AZURE_STORAGE_CONTAINER", ""),
        azure_storage_connection_string=os.getenv("AZURE_STORAGE_CONNECTION_STRING", ""),
        azure_storage_hls_prefix=os.getenv("AZURE_STORAGE_HLS_PREFIX", "hls"),
        azure_storage_source_prefix=os.getenv("AZURE_STORAGE_SOURCE_PREFIX", "source"),
        ffmpeg_path=os.getenv("FFMPEG_PATH") or _find_ffmpeg(),
    )