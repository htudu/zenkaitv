# pyright: reportMissingImports=false

from pathlib import PurePosixPath

from .config import get_settings


class BlobStorageError(RuntimeError):
    pass


def _load_blob_dependencies():
    from azure.identity import DefaultAzureCredential
    from azure.storage.blob import BlobServiceClient, ContentSettings

    return DefaultAzureCredential, BlobServiceClient, ContentSettings


def _normalize_path(value: str) -> str:
    normalized = value.replace("\\", "/").strip().lstrip("/")
    if not normalized:
        raise BlobStorageError("Blob path cannot be empty")
    parts = PurePosixPath(normalized).parts
    if any(part in {".", ".."} for part in parts):
        raise BlobStorageError("Blob path is invalid")
    return "/".join(parts)


def _get_container_client():
    settings = get_settings()
    DefaultAzureCredential, BlobServiceClient, _ = _load_blob_dependencies()
    if settings.azure_storage_connection_string:
        service_client = BlobServiceClient.from_connection_string(settings.azure_storage_connection_string)
    elif settings.azure_storage_account_url:
        service_client = BlobServiceClient(
            account_url=settings.azure_storage_account_url,
            credential=DefaultAzureCredential(),
        )
    else:
        raise BlobStorageError("Azure Blob storage is not configured for the worker")

    if not settings.azure_storage_container:
        raise BlobStorageError("AZURE_STORAGE_CONTAINER is not configured for the worker")

    return service_client.get_container_client(settings.azure_storage_container)


def build_hls_blob_name(movie_id: str, relative_path: str) -> str:
    settings = get_settings()
    relative = _normalize_path(relative_path)
    prefix = settings.azure_storage_hls_prefix.strip().strip("/")
    if prefix:
        return f"{prefix}/{movie_id}/{relative}"
    return f"{movie_id}/{relative}"


def download_blob_to_path(blob_name: str, destination_path):
    blob_client = _get_container_client().get_blob_client(_normalize_path(blob_name))
    with destination_path.open("wb") as target:
        target.write(blob_client.download_blob().readall())


def upload_file(blob_name: str, local_path, content_type: str) -> None:
    _, _, ContentSettings = _load_blob_dependencies()
    blob_client = _get_container_client().get_blob_client(_normalize_path(blob_name))
    with local_path.open("rb") as source:
        blob_client.upload_blob(
            source,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type),
        )