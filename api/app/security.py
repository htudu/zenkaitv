import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta


from .config import get_settings


def _encode_payload(payload: dict[str, object]) -> str:
    return base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8").rstrip("=")


def _decode_payload(raw_value: str) -> dict[str, object]:
    padding = "=" * (-len(raw_value) % 4)
    decoded = base64.urlsafe_b64decode(f"{raw_value}{padding}")
    return json.loads(decoded.decode("utf-8"))


def hash_password(password: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), b"stream-movies", 200_000)
    return base64.urlsafe_b64encode(digest).decode("utf-8")


def verify_password(password: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), expected_hash)


def create_signed_token(payload: dict[str, object]) -> str:
    settings = get_settings()
    encoded_payload = _encode_payload(payload)
    signature = hmac.new(settings.signing_secret.encode("utf-8"), encoded_payload.encode("utf-8"), hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{encoded_payload}.{encoded_signature}"


def decode_signed_token(token: str) -> dict[str, object]:
    settings = get_settings()
    try:
        encoded_payload, encoded_signature = token.split(".", maxsplit=1)
    except ValueError as exc:
        raise ValueError("Malformed token") from exc

    expected_signature = hmac.new(
        settings.signing_secret.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    actual_signature = base64.urlsafe_b64decode(f"{encoded_signature}{'=' * (-len(encoded_signature) % 4)}")
    if not hmac.compare_digest(expected_signature, actual_signature):
        raise ValueError("Invalid token signature")

    payload = _decode_payload(encoded_payload)
    expires_at = payload.get("exp")
    if isinstance(expires_at, int) and expires_at < int(datetime.now(UTC).timestamp()):
        raise ValueError("Expired token")
    return payload


def create_session_token(*, user_id: int, username: str, ttl_hours: int = 12) -> tuple[str, datetime]:
    expires_at = datetime.now(UTC) + timedelta(hours=ttl_hours)
    payload = {
        "type": "session",
        "sub": user_id,
        "username": username,
        "exp": int(expires_at.timestamp()),
    }
    return create_signed_token(payload), expires_at


def create_playback_token(*, secret: str, user_id: str, movie_id: str, ttl_minutes: int = 10) -> tuple[str, datetime]:
    expires_at = datetime.now(UTC) + timedelta(minutes=ttl_minutes)
    payload = {
        "type": "playback",
        "sub": user_id,
        "movie_id": movie_id,
        "exp": int(expires_at.timestamp()),
    }
    encoded_payload = _encode_payload(payload)
    signature = hmac.new(secret.encode("utf-8"), encoded_payload.encode("utf-8"), hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{encoded_payload}.{encoded_signature}", expires_at


def decode_playback_token(token: str, *, expected_movie_id: str) -> dict[str, object]:
    payload = decode_signed_token(token)
    if payload.get("type") != "playback":
        raise ValueError("Invalid playback token")
    if payload.get("movie_id") != expected_movie_id:
        raise ValueError("Playback token does not match the requested movie")
    return payload
