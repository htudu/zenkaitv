from dataclasses import dataclass
from pathlib import Path
import re

from .config import get_settings


@dataclass(frozen=True)
class LocalMediaEntry:
    movie_id: str
    title: str
    file_path: Path
    file_name: str


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "local-video"


def _humanize_title(file_stem: str) -> str:
    cleaned = re.sub(r"[_-]+", " ", file_stem)
    return re.sub(r"\s+", " ", cleaned).strip().title()


def scan_local_media() -> dict[str, LocalMediaEntry]:
    uploads_dir = Path(get_settings().local_uploads_dir)
    if not uploads_dir.exists() or not uploads_dir.is_dir():
        return {}

    entries: dict[str, LocalMediaEntry] = {}
    for file_path in sorted(uploads_dir.iterdir()):
        if not file_path.is_file() or file_path.suffix.lower() not in {".mp4", ".mov", ".m4v", ".webm"}:
            continue

        title = _humanize_title(file_path.stem)
        movie_id = f"local-{_slugify(file_path.stem)}"
        entries[movie_id] = LocalMediaEntry(
            movie_id=movie_id,
            title=title,
            file_path=file_path.resolve(),
            file_name=file_path.name,
        )

    return entries
