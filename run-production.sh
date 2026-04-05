#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.production.yml"
ENV_FILE="$SCRIPT_DIR/.env.production"
PROJECT_NAME="$(basename "$SCRIPT_DIR")"
APP_IMAGES=(
  "${PROJECT_NAME}-api:latest"
  "${PROJECT_NAME}-web:latest"
  "${PROJECT_NAME}-worker:latest"
)

cd "$SCRIPT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.production. Create it before starting the production stack."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not available. Start Docker or fix permissions first."
  exit 1
fi

assert_env_value() {
  local key="$1"
  local value

  value="$(grep -E "^${key}=" "$ENV_FILE" | head -n 1 | cut -d '=' -f 2- || true)"

  if [[ -z "$value" ]]; then
    echo "Missing required production setting: ${key}"
    exit 1
  fi

  if [[ "$value" == *"replace-me"* || "$value" == *"your-domain.example"* ]]; then
    echo "Production setting ${key} still contains a placeholder value."
    exit 1
  fi
}

assert_env_value "STREAM_SIGNING_SECRET"
assert_env_value "POSTGRES_PASSWORD"
assert_env_value "PUBLIC_SITE_ADDRESS"
assert_env_value "API_CORS_ORIGINS"

echo "Stopping existing production containers (volumes are preserved)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans || true

echo "Removing app images so code changes rebuild from scratch..."
for image_name in "${APP_IMAGES[@]}"; do
  if docker image inspect "$image_name" >/dev/null 2>&1; then
    docker image rm "$image_name"
  else
    echo "  Skipping missing image: $image_name"
  fi
done

echo "Pruning dangling image layers..."
docker image prune -f >/dev/null

echo "Building and starting production stack..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo
echo "Production stack started."
echo "Public entrypoint: $(grep -E '^PUBLIC_SITE_ADDRESS=' "$ENV_FILE" | cut -d '=' -f 2-)"
echo "Check containers with:"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps"
echo
echo "Follow logs with:"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"