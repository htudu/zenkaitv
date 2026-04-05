from datetime import UTC, datetime
import json
import re
from pathlib import Path

from ..blob_storage import BlobStorageError, build_hls_blob_name, build_source_blob_name, list_blob_names, read_blob_text
from ..config import get_settings
from ..media_library import SUPPORTED_VIDEO_EXTENSIONS


def humanize_movie_id(movie_id: str) -> str:
    cleaned = re.sub(r'[_-]+', ' ', movie_id)
    return re.sub(r'\s+', ' ', cleaned).strip().title() or movie_id


def extract_blob_movie_ids(blob_names: list[str]) -> list[str]:
    settings = get_settings()
    prefixes = [
        settings.azure_storage_hls_prefix.strip().strip('/'),
        settings.azure_storage_source_prefix.strip().strip('/'),
    ]
    discovered: set[str] = set()

    for blob_name in blob_names:
        normalized_blob_name = blob_name.strip('/')

        if '/' not in normalized_blob_name:
            blob_path = Path(normalized_blob_name)
            if blob_path.suffix.lower() in SUPPORTED_VIDEO_EXTENSIONS:
                discovered.add(blob_path.stem)
            continue

        for prefix in prefixes:
            if not prefix:
                continue
            prefix_with_separator = f'{prefix}/'
            if not normalized_blob_name.startswith(prefix_with_separator):
                continue

            remainder = normalized_blob_name[len(prefix_with_separator):]
            movie_id = remainder.split('/', 1)[0].strip()
            if movie_id:
                discovered.add(movie_id)
            break

    return sorted(discovered)


def list_relevant_blob_names(container_name: str) -> list[str]:
    return list_blob_names(container_name=container_name)


def read_blob_movie_metadata(movie_id: str, container_name: str) -> tuple[dict[str, object] | None, bool]:
    metadata_candidates = [
        f'{movie_id}.metadata.json',
        f'{movie_id}.json',
        build_source_blob_name(movie_id, 'metadata.json'),
        build_hls_blob_name(movie_id, 'metadata.json'),
    ]

    for blob_name in metadata_candidates:
        try:
            raw_text = read_blob_text(blob_name, container_name=container_name)
        except BlobStorageError:
            continue

        try:
            payload = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise BlobStorageError(f"Blob metadata file '{blob_name}' is not valid JSON.") from exc

        if isinstance(payload, dict):
            return payload, True

    return None, False


def default_movie_metadata(movie_id: str) -> dict[str, object]:
    current_year = datetime.now(UTC).year
    return {
        'title': humanize_movie_id(movie_id),
        'year': current_year,
        'duration_minutes': 0,
        'synopsis': 'Imported automatically from Azure Blob Storage during catalog sync.',
        'poster_url': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
        'genres': 'Blob Imported,Production',
    }
