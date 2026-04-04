# pyright: reportMissingImports=false

from pathlib import PurePosixPath

from .config import get_settings


class BlobStorageError(RuntimeError):
    pass


class BlobStorageNotConfigured(BlobStorageError):
    pass


def _load_blob_dependencies():
    try:
        from azure.identity import DefaultAzureCredential
        from azure.storage.blob import BlobServiceClient, ContentSettings
    except ImportError as exc:
        raise BlobStorageNotConfigured(
            "Azure Blob SDK dependencies are not installed in the API environment."
        ) from exc

    return DefaultAzureCredential, BlobServiceClient, ContentSettings


def _get_container_client():
    settings = get_settings()
    DefaultAzureCredential, BlobServiceClient, _ = _load_blob_dependencies()

    container_name = settings.azure_storage_container.strip()
    if not container_name:
        raise BlobStorageNotConfigured("AZURE_STORAGE_CONTAINER is not configured.")

    connection_string = settings.azure_storage_connection_string.strip()
    account_url = settings.azure_storage_account_url.strip()

    if connection_string:
        service_client = BlobServiceClient.from_connection_string(connection_string)
    elif account_url:
        service_client = BlobServiceClient(account_url=account_url, credential=DefaultAzureCredential())
    else:
        raise BlobStorageNotConfigured(
            "Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_URL for production blob playback."
        )

    return service_client.get_container_client(container_name)


def _normalize_relative_blob_path(relative_path: str) -> str:
    normalized = relative_path.replace("\\", "/").strip().lstrip("/")
    if not normalized:
        raise BlobStorageError("Blob asset path cannot be empty.")

    parts = PurePosixPath(normalized).parts
    if any(part in {".", ".."} for part in parts):
        raise BlobStorageError("Blob asset path is invalid.")

    return "/".join(parts)


def normalize_blob_name(blob_name: str) -> str:
    return _normalize_relative_blob_path(blob_name)


def build_hls_blob_name(movie_id: str, relative_path: str) -> str:
    settings = get_settings()
    safe_relative_path = _normalize_relative_blob_path(relative_path)
    prefix = settings.azure_storage_hls_prefix.strip().strip("/")

    if prefix:
        return f"{prefix}/{movie_id}/{safe_relative_path}"

    return f"{movie_id}/{safe_relative_path}"


def blob_hls_manifest_exists(movie_id: str) -> bool:
    blob_name = build_hls_blob_name(movie_id, "master.m3u8")
    try:
        return _get_container_client().get_blob_client(blob_name).exists()
    except BlobStorageNotConfigured:
        raise
    except Exception as exc:
        raise BlobStorageError(f"Unable to check blob manifest '{blob_name}': {exc}") from exc


def read_blob_text(blob_name: str) -> str:
    try:
        payload = _get_container_client().download_blob(blob_name).readall()
    except BlobStorageNotConfigured:
        raise
    except Exception as exc:
        raise BlobStorageError(f"Unable to read blob '{blob_name}': {exc}") from exc

    return payload.decode("utf-8")


def stream_blob(blob_name: str):
    try:
        downloader = _get_container_client().download_blob(blob_name)
        return downloader.chunks()
    except BlobStorageNotConfigured:
        raise
    except Exception as exc:
        raise BlobStorageError(f"Unable to stream blob '{blob_name}': {exc}") from exc


def upload_blob(blob_name: str, data, content_type: str | None = None, overwrite: bool = False) -> dict[str, str | int | bool]:
    _, _, ContentSettings = _load_blob_dependencies()

    safe_blob_name = normalize_blob_name(blob_name)
    blob_client = _get_container_client().get_blob_client(safe_blob_name)

    try:
        if hasattr(data, "seek"):
            data.seek(0)

        upload_result = blob_client.upload_blob(
            data,
            overwrite=overwrite,
            content_settings=ContentSettings(content_type=content_type or "application/octet-stream"),
        )
        size_bytes = getattr(upload_result, "size", 0) or 0
        return {
            "blob_name": safe_blob_name,
            "url": blob_client.url,
            "content_type": content_type or "application/octet-stream",
            "size_bytes": int(size_bytes),
            "overwritten": overwrite,
        }
    except BlobStorageNotConfigured:
        raise
    except Exception as exc:
        raise BlobStorageError(f"Unable to upload blob '{safe_blob_name}': {exc}") from exc