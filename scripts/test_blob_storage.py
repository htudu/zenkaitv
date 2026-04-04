# pyright: reportMissingImports=false

import os
import sys
from uuid import uuid4


MAX_LIST_RESULTS = 100


def _load_clients():
    try:
        from azure.core.exceptions import AzureError
        from azure.identity import DefaultAzureCredential
        from azure.storage.blob import BlobServiceClient
    except ImportError as exc:
        raise SystemExit(
            "Missing dependencies. Install with: pip install -r scripts/requirements-azure-storage-test.txt"
        ) from exc

    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    account_url = os.getenv("AZURE_STORAGE_ACCOUNT_URL", "").strip()
    container_name = os.getenv("AZURE_STORAGE_CONTAINER", "").strip()

    if not container_name:
        raise SystemExit("Set AZURE_STORAGE_CONTAINER before running this script.")

    if connection_string:
        service_client = BlobServiceClient.from_connection_string(connection_string)
        auth_mode = "connection-string"
    elif account_url:
        service_client = BlobServiceClient(account_url=account_url, credential=DefaultAzureCredential())
        auth_mode = "default-credential"
    else:
        raise SystemExit(
            "Set either AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_URL before running this script."
        )

    return service_client, container_name, auth_mode, AzureError


def main() -> int:
    service_client, container_name, auth_mode, azure_error_type = _load_clients()
    container_client = service_client.get_container_client(container_name)

    try:
        container_client.get_container_properties()
    except azure_error_type as exc:
        print(f"Failed to access container '{container_name}': {exc}", file=sys.stderr)
        return 1

    try:
        blob_names = [blob.name for blob in container_client.list_blobs(results_per_page=MAX_LIST_RESULTS)]
    except azure_error_type as exc:
        print(f"Failed to list blobs in container '{container_name}': {exc}", file=sys.stderr)
        return 1

    blob_name = f"smoke-test-{uuid4().hex}.txt"
    payload = b"stream-movies-app azure blob smoke test\n"

    try:
        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(payload, overwrite=True)
        downloaded = blob_client.download_blob().readall()
        blob_client.delete_blob()
    except azure_error_type as exc:
        print(f"Blob read/write test failed: {exc}", file=sys.stderr)
        return 1

    print(f"Auth mode: {auth_mode}")
    print(f"Container: {container_name}")
    print(f"Existing blobs shown (up to {MAX_LIST_RESULTS}): {len(blob_names)}")
    if blob_names:
        for existing_blob_name in blob_names:
            print(f"- {existing_blob_name}")
    else:
        print("- No existing blobs found")
    print(f"Uploaded and read blob: {blob_name}")
    print(downloaded.decode("utf-8").strip())
    print("Smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())