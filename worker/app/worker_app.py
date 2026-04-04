import os
import subprocess
import tempfile
from pathlib import Path

from celery import Celery

from .blob_storage import BlobStorageError, build_hls_blob_name, download_blob_to_path, upload_file
from .config import get_settings


worker_app = Celery(
    "stream_movies",
    broker=os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0")),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
)


@worker_app.task(name="media.generate_preview")
def generate_preview(movie_id: str) -> dict[str, str]:
    return {
        "movie_id": movie_id,
        "status": "queued-placeholder",
        "message": "Replace this task with FFmpeg-based thumbnail and preview generation.",
    }


@worker_app.task(name="media.package_source_to_hls")
def package_source_to_hls(movie_id: str, source_blob_name: str) -> dict[str, str | int]:
    settings = get_settings()
    if not settings.ffmpeg_path:
        raise RuntimeError("ffmpeg is not available in the worker container")

    with tempfile.TemporaryDirectory(prefix=f"stream-movies-{movie_id}-") as temp_dir:
        temp_path = Path(temp_dir)
        source_path = temp_path / Path(source_blob_name).name
        output_dir = temp_path / "hls"
        manifest_path = output_dir / "master.m3u8"

        download_blob_to_path(source_blob_name, source_path)
        output_dir.mkdir(parents=True, exist_ok=True)

        command = [
            settings.ffmpeg_path,
            "-y",
            "-i",
            str(source_path),
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
            str(output_dir / "segment_%03d.ts"),
            str(manifest_path),
        ]

        result = subprocess.run(command, capture_output=True, text=True, check=False)
        if result.returncode != 0 or not manifest_path.exists():
            stderr = (result.stderr or "").strip().splitlines()
            detail = stderr[-1] if stderr else "Unknown ffmpeg packaging error"
            raise RuntimeError(f"Unable to package source video into HLS: {detail}")

        uploaded_files = 0
        for file_path in sorted(output_dir.iterdir()):
            if not file_path.is_file():
                continue
            content_type = "application/vnd.apple.mpegurl" if file_path.suffix.lower() == ".m3u8" else "video/mp2t"
            upload_file(build_hls_blob_name(movie_id, file_path.name), file_path, content_type)
            uploaded_files += 1

    return {
        "movie_id": movie_id,
        "source_blob_name": source_blob_name,
        "status": "completed",
        "uploaded_files": uploaded_files,
    }
