from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse, StreamingResponse

from ..blob_storage import BlobStorageError, build_hls_blob_name, read_blob_text, stream_blob
from ..hls import get_hls_manifest_path
from ..media_library import scan_local_media
from ..security import decode_playback_token


router = APIRouter(prefix="/media", tags=["media"])


def _rewrite_hls_manifest(movie_id: str, token: str, manifest_text: str, route_prefix: str) -> str:
    lines: list[str] = []
    for raw_line in manifest_text.splitlines():
        if not raw_line or raw_line.startswith("#"):
            lines.append(raw_line)
            continue

        encoded_path = quote(raw_line, safe="/-_.~")
        lines.append(f"{route_prefix}/{movie_id}/{encoded_path}?token={token}")

    return "\n".join(lines)


def _blob_media_type(asset_name: str) -> str:
    suffix = Path(asset_name).suffix.lower()
    if suffix == ".m3u8":
        return "application/vnd.apple.mpegurl"
    if suffix == ".ts":
        return "video/mp2t"
    if suffix == ".mp4":
        return "video/mp4"
    return "application/octet-stream"


def _verify_playback_token(token: str, movie_id: str) -> None:
    try:
        decode_playback_token(token, expected_movie_id=movie_id)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/local/{movie_id}")
def stream_local_movie(movie_id: str, token: str = Query(...)) -> FileResponse:
    entries = scan_local_media()
    media = entries.get(movie_id)
    if media is None:
        raise HTTPException(status_code=404, detail="Local media not found")

    _verify_playback_token(token, movie_id)

    return FileResponse(path=media.file_path, media_type="video/mp4", filename=media.file_name)


@router.get("/hls/{movie_id}/master.m3u8")
def stream_hls_manifest(movie_id: str, token: str = Query(...)) -> PlainTextResponse:
    _verify_playback_token(token, movie_id)

    manifest_path = get_hls_manifest_path(movie_id)
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="HLS manifest not found")

    return PlainTextResponse(
        _rewrite_hls_manifest(movie_id, token, manifest_path.read_text(encoding="utf-8"), "/api/v1/media/hls"),
        media_type="application/vnd.apple.mpegurl",
    )


@router.get("/hls/{movie_id}/{asset_name}")
def stream_hls_asset(movie_id: str, asset_name: str, token: str = Query(...)) -> FileResponse:
    _verify_playback_token(token, movie_id)

    asset_path = get_hls_manifest_path(movie_id).parent / asset_name
    if not asset_path.exists() or not asset_path.is_file():
        raise HTTPException(status_code=404, detail="HLS asset not found")

    media_type = "video/mp2t"
    if Path(asset_name).suffix.lower() == ".m3u8":
        media_type = "application/vnd.apple.mpegurl"

    return FileResponse(path=asset_path, media_type=media_type, filename=asset_path.name)


@router.get("/blob/{movie_id}/master.m3u8")
def stream_blob_hls_manifest(movie_id: str, token: str = Query(...)) -> PlainTextResponse:
    _verify_playback_token(token, movie_id)

    try:
        manifest_text = read_blob_text(build_hls_blob_name(movie_id, "master.m3u8"))
    except BlobStorageError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return PlainTextResponse(
        _rewrite_hls_manifest(movie_id, token, manifest_text, "/api/v1/media/blob"),
        media_type="application/vnd.apple.mpegurl",
    )


@router.get("/blob/{movie_id}/{asset_path:path}")
def stream_blob_hls_asset(movie_id: str, asset_path: str, token: str = Query(...)) -> StreamingResponse:
    _verify_playback_token(token, movie_id)

    try:
        blob_name = build_hls_blob_name(movie_id, asset_path)
        chunk_iterator = stream_blob(blob_name)
    except BlobStorageError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return StreamingResponse(chunk_iterator, media_type=_blob_media_type(asset_path))
