#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f ".env.production" ]]; then
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

  value="$(grep -E "^${key}=" .env.production | head -n 1 | cut -d '=' -f 2- || true)"

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
assert_env_value "API_CORS_ORIGINS"
assert_env_value "VITE_API_BASE_URL"

echo "Building and starting production stack..."
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

echo
echo "Production stack started."
echo "Check containers with:"
echo "  docker compose -f docker-compose.production.yml --env-file .env.production ps"
echo
echo "Follow logs with:"
echo "  docker compose -f docker-compose.production.yml --env-file .env.production logs -f"