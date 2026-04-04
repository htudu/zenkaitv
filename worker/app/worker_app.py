import os

from celery import Celery


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
