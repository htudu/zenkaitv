FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /workspace/worker

COPY pyproject.toml ./
COPY app ./app

RUN pip install --no-cache-dir -e .

CMD ["celery", "-A", "app.worker_app", "worker", "--loglevel=info"]
