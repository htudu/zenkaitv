from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..blob_storage import BlobStorageError, BlobStorageNotConfigured, blob_hls_manifest_exists
from ..db import get_db_session
from ..dependencies import get_current_user
from ..config import get_settings
from ..hls import HLSPackagingError, ensure_hls_package
from ..media_library import scan_local_media
from ..models import Entitlement, Movie, User
from ..schemas import PlaybackGrantRequest, PlaybackGrantResponse
from ..security import create_playback_token


router = APIRouter(prefix="/playback", tags=["playback"])


@router.post("/grant", response_model=PlaybackGrantResponse)
def create_grant(
    payload: PlaybackGrantRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
) -> PlaybackGrantResponse:
    settings = get_settings()
    movie = session.get(Movie, payload.movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")

    entitlement = session.scalar(
        select(Entitlement).where(
            Entitlement.user_id == current_user.id,
            Entitlement.movie_id == payload.movie_id,
        )
    )
    if entitlement is None:
        raise HTTPException(status_code=403, detail="You do not have access to this title")

    token, expires_at = create_playback_token(
        secret=settings.signing_secret,
        user_id=str(current_user.id),
        movie_id=payload.movie_id,
    )

    local_media = scan_local_media().get(payload.movie_id)
    if local_media is not None:
        try:
            ensure_hls_package(payload.movie_id)
            return PlaybackGrantResponse(
                movie_id=payload.movie_id,
                manifest_url=f"/api/v1/media/hls/{payload.movie_id}/master.m3u8?token={token}",
                token=token,
                expires_at=expires_at,
                user_id=current_user.id,
                stream_type="hls-local",
                delivery_notes=[
                    "This movie was imported from the local movie_uploads folder.",
                    "Playback is packaged locally into HLS using ffmpeg for browser testing.",
                    "This remains a local-development path and should move to object storage for production.",
                ],
            )
        except HLSPackagingError as exc:
            fallback_note = f"Falling back to direct MP4 because HLS packaging failed: {exc}"

        return PlaybackGrantResponse(
            movie_id=payload.movie_id,
            manifest_url=f"/api/v1/media/local/{payload.movie_id}?token={token}",
            token=token,
            expires_at=expires_at,
            user_id=current_user.id,
            stream_type="progressive-mp4",
            delivery_notes=[
                "This movie was imported from the local movie_uploads folder.",
                "Playback is served directly as an authenticated MP4 for local testing.",
                fallback_note,
            ],
        )

    blob_delivery_note: str | None = None
    try:
        if blob_hls_manifest_exists(payload.movie_id):
            return PlaybackGrantResponse(
                movie_id=payload.movie_id,
                manifest_url=f"/api/v1/media/blob/{payload.movie_id}/master.m3u8?token={token}",
                token=token,
                expires_at=expires_at,
                user_id=current_user.id,
                stream_type="hls-azure-blob",
                delivery_notes=[
                    "This movie is served from Azure Blob Storage for production playback.",
                    "Playback is delivered as authenticated HLS assets proxied through the API.",
                    "Recommended next step is signed CDN delivery in front of the Blob origin.",
                ],
            )
        blob_delivery_note = "No Azure Blob HLS manifest was found for this title."
    except BlobStorageNotConfigured as exc:
        blob_delivery_note = f"Azure Blob playback is not configured: {exc}"
    except BlobStorageError as exc:
        blob_delivery_note = f"Azure Blob playback check failed: {exc}"

    return PlaybackGrantResponse(
        movie_id=payload.movie_id,
        manifest_url=f"/stream/{payload.movie_id}/master.m3u8?token={token}&user={current_user.id}",
        token=token,
        expires_at=expires_at,
        user_id=current_user.id,
        stream_type="hls-placeholder",
        delivery_notes=[
            "This playback grant now requires an authenticated and entitled user.",
            "Replace the manifest path with real HLS assets served through signed CDN delivery.",
            blob_delivery_note or "Azure Blob playback is available once a matching HLS manifest is uploaded.",
            "Next hardening steps are device sessions, rate limits, and audit trails per grant.",
        ],
    )
