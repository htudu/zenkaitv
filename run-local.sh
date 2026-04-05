#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f ".env.local" ]]; then
  if [[ -f ".env.example" ]]; then
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
  else
    echo "Missing .env.local and .env.example."
    exit 1
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not available. Start Docker or fix permissions first."
  exit 1
fi

if [[ -z "$(docker compose -f docker-compose.local.yml --env-file .env.local images -q api 2>/dev/null)" ]] \
  || [[ -z "$(docker compose -f docker-compose.local.yml --env-file .env.local images -q worker 2>/dev/null)" ]] \
  || [[ -z "$(docker compose -f docker-compose.local.yml --env-file .env.local images -q web 2>/dev/null)" ]]; then
  echo "Building local images..."
  docker compose -f docker-compose.local.yml --env-file .env.local build api worker web
fi

echo "Starting local stack..."
docker compose -f docker-compose.local.yml --env-file .env.local up -d

echo
echo "Local services should now be available:"
echo "- Web: http://localhost:5173"
echo "- API: http://localhost:8000"