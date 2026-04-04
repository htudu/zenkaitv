from pathlib import Path
import subprocess

from .config import get_settings
from .media_library import scan_local_media


class HLSPackagingError(RuntimeError):
    pass


def _package_dir(movie_id: str) -> Path:
    return Path(get_settings().local_hls_dir) / movie_id


def get_hls_manifest_path(movie_id: str) -> Path:
    return _package_dir(movie_id) / "master.m3u8"


def ensure_hls_package(movie_id: str) -> Path:
    settings = get_settings()
    if not settings.ffmpeg_path:
        raise HLSPackagingError("ffmpeg is not configured")

    media = scan_local_media().get(movie_id)
    if media is None:
        raise HLSPackagingError("Local media file not found")

    package_dir = _package_dir(movie_id)
    manifest_path = get_hls_manifest_path(movie_id)

    if manifest_path.exists() and manifest_path.stat().st_mtime >= media.file_path.stat().st_mtime:
        return manifest_path

    package_dir.mkdir(parents=True, exist_ok=True)
    for child in package_dir.iterdir():
        if child.is_file():
            child.unlink()

    command = [
        settings.ffmpeg_path,
        "-y",
        "-i",
        str(media.file_path),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-g",
        "48",
        "-sc_threshold",
        "0",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-f",
        "hls",
        "-hls_time",
        "6",
        "-hls_playlist_type",
        "vod",
        "-hls_segment_filename",
        str(package_dir / "segment_%03d.ts"),
        str(manifest_path),
    ]

    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0 or not manifest_path.exists():
        stderr = (result.stderr or "").strip().splitlines()
        detail = stderr[-1] if stderr else "Unknown ffmpeg packaging error"
        raise HLSPackagingError(f"Unable to package movie into HLS: {detail}")

    return manifest_path
