# Stream Movies App

Open-source-first foundation for a private video-on-demand platform with a React web app, FastAPI backend, Celery worker, and Docker-based local infrastructure.

## Services

- `web`: React + Vite user interface
- `api`: FastAPI auth, catalog, and playback grant service
- `worker`: Celery worker scaffold for ingest and transcoding jobs
- `postgres`: metadata store
- `redis`: cache, rate limiting, and job broker
- `minio`: S3-compatible object storage for source and delivery assets

## Local Video Testing

Drop MP4 files into [movie_uploads](d:/work/web_apps/stream_movies_app/movie_uploads). The service imports them into the catalog and, when `ffmpeg` is available, packages them into HLS on the first playback request. Generated manifests and segments are written to `generated_media/hls`.

## Environment Files

Yes. The project now has dedicated environment files and dedicated Compose files for each mode.

- Local environment: [/.env.local](d:/work/web_apps/stream_movies_app/.env.local)
- Production environment: [/.env.production](d:/work/web_apps/stream_movies_app/.env.production)
- Local Compose: [/docker-compose.local.yml](d:/work/web_apps/stream_movies_app/docker-compose.local.yml)
- Production Compose: [/docker-compose.production.yml](d:/work/web_apps/stream_movies_app/docker-compose.production.yml)

Important detail:

- Before this change, [/.env.example](d:/work/web_apps/stream_movies_app/.env.example) was only a reference template.
- The new Compose files explicitly load the matching env file for the target environment.

## Quick Start

### 0. Prepare a Linux VM for Docker

For a fresh Ubuntu or Debian-style VM, the repository now includes [setup.sh](d:/work/web_apps/stream_movies_app/setup.sh) to install the host dependencies required to run the app in Docker containers locally on that VM.

```bash
sudo bash ./setup.sh
```

If you want the script to clone the repo onto the VM first, provide a repo URL and target directory:

```bash
sudo REPO_URL=https://github.com/htudu/zenkaitv.git INSTALL_DIR=/opt/zenkaitv bash ./setup.sh
```

The script installs:

- Docker Engine
- Docker Compose plugin
- Docker Buildx plugin
- `ffmpeg`
- `git`, `curl`, `ca-certificates`, and `gnupg`

If `.env.local` is missing and `.env.example` exists, the setup script also creates a starter local env file.

After it finishes, log out and back in if you want to run Docker without `sudo`.

For a one-command local startup on the VM, use [run-local.sh](d:/work/web_apps/stream_movies_app/run-local.sh):

```bash
./run-local.sh
```

That helper:

- creates `.env.local` from `.env.example` when needed
- builds the local images the first time
- starts the local Docker stack

For a one-command production deployment on the VM, use [run-production.sh](d:/work/web_apps/stream_movies_app/run-production.sh):

```bash
./run-production.sh
```

That helper:

- checks that `.env.production` exists
- rejects obvious placeholder production values
- builds the production images
- starts the production compose stack

Production traffic now assumes a reverse proxy front door:

- only ports `80` and `443` should be public on the VM
- the proxy serves the frontend
- `/api/*` is proxied privately to the FastAPI container
- `api`, `minio`, and other backend services are no longer exposed directly to the internet

Without a custom domain yet, set [/.env.production](d:/work/web_apps/stream_movies_app/.env.production) like this:

```dotenv
PUBLIC_SITE_ADDRESS=http://<vm-public-ip>
API_CORS_ORIGINS=http://<vm-public-ip>
VITE_API_BASE_URL=
```

Later, when you have a real domain, switch to:

```dotenv
PUBLIC_SITE_ADDRESS=your-domain.example
API_CORS_ORIGINS=https://your-domain.example
VITE_API_BASE_URL=
```

With a real domain, the bundled Caddy proxy can obtain HTTPS certificates automatically on ports `80/443`.

### 1. Start everything with Docker Compose

```powershell
docker compose -f docker-compose.local.yml --env-file .env.local up -d
```

This is now the recommended local startup command.

For the very first run only, build the app images once:

```powershell
docker compose -f docker-compose.local.yml --env-file .env.local build api worker web
```

After that, the local stack uses bind mounts for the project files, so normal code edits do not require a rebuild. The API also runs with `--reload`, so Python changes are picked up automatically.

This starts:

- API on `http://localhost:8000`
- web app on `http://localhost:5173`
- worker
- PostgreSQL
- Redis
- MinIO

To stop the stack:

```powershell
docker compose -f docker-compose.local.yml down
```

If you want the fastest restart without recreating containers, use:

```powershell
docker compose -f docker-compose.local.yml start
```

### 1a. Production-style Compose run

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production up --build -d
```

Equivalent helper script:

```bash
./run-production.sh
```

This uses:

- Caddy reverse proxy on public `80/443`
- nginx-served production frontend image behind the proxy
- API container
- worker container
- Redis
- MinIO
- persistent named volumes for app data, generated media, and Caddy state

Stop it with:

```powershell
docker compose -f docker-compose.production.yml down
```

### 2. Alternative: start only infrastructure

```powershell
docker compose -f docker-compose.local.yml --env-file .env.local up -d postgres redis minio
```

### 3. Alternative: run the API manually

```powershell
cd api
python -m venv .venv
.\.venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

The API seeds a local database on first run. By default it uses `sqlite:///./stream_movies.db`, but you can point `DATABASE_URL` to PostgreSQL later.

### 4. Alternative: run the web app manually

```powershell
cd web
npm install
npm run dev
```

### 4a. Verify local playback

1. Put MP4 files in [movie_uploads](d:/work/web_apps/stream_movies_app/movie_uploads)
2. Start the API and web app
3. Log in with `demo / demo123` or `curator / curator123`
4. Request playback for one of the imported local titles
5. The first request packages the file into HLS and the player loads the generated manifest

Demo accounts:

- `demo` / `demo123`
- `curator` / `curator123`

Admin access:

- sign in as `curator / curator123`
- use the `Admin` switch in the top navigation to open the curator workspace

### 5. Alternative: run the worker manually

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\activate
pip install -e .
celery -A app.worker_app worker --loglevel=info
```

## Documentation

- [docs/project-overview.md](docs/project-overview.md)
- [docs/implementation-plan.md](docs/implementation-plan.md)
- [docs/adr/0001-initial-architecture.md](docs/adr/0001-initial-architecture.md)
- [.azure/cli_commands.md](.azure/cli_commands.md)


## Production Blob Playback

Production playback now supports Azure Blob-backed HLS for non-local titles when the API has these variables configured:

- `AZURE_STORAGE_ACCOUNT_URL`
- `AZURE_STORAGE_CONTAINER`
- optional `AZURE_STORAGE_CONNECTION_STRING`
- optional `AZURE_STORAGE_HLS_PREFIX` defaulting to `hls`

The API looks for HLS assets in this blob naming pattern:

```text
<AZURE_STORAGE_HLS_PREFIX>/<movie_id>/master.m3u8
<AZURE_STORAGE_HLS_PREFIX>/<movie_id>/segment_000.ts
```

Local imported videos still use the local `movie_uploads` and generated HLS path for development. Non-local movies can now switch to authenticated Blob-backed HLS if the manifest exists in the configured container.

Curator accounts also now have a production Blob upload form in the web UI. It uploads a selected file to the configured Azure Blob container using the blob path you provide, for example:

```text
hls/movie-id/master.m3u8
hls/movie-id/segment_000.ts
uploads/trailer.mp4
```

This is an admin convenience for production storage management. It does not yet package a source MP4 into HLS automatically; it uploads the file exactly to the blob path you specify.

The admin UI also now supports a source-video upload flow for production packaging. That flow:

1. uploads the source file into Blob under `source/<movie_id>/...`
2. creates or updates the movie record in the catalog
3. queues a Celery worker job
4. packages the source into HLS with `ffmpeg`
5. uploads the generated HLS files into `hls/<movie_id>/...`

The worker image now requires `ffmpeg`, and the API and worker both require Azure Blob access in the production environment.

## Current Scope

This repository currently provides the implementation foundation:

- project documentation and architecture decisions
- a starter API with sample catalog and playback grant endpoint
- seeded demo users, entitlements, and login flow
- automatic import of local MP4 files from `movie_uploads` for local browser playback tests
- docker-compose startup for the full local stack
- a starter frontend wired to the API
- a worker scaffold for future transcoding tasks
- local development infrastructure with PostgreSQL, Redis, and MinIO

The actual ingest pipeline, FFmpeg-based HLS packaging, object-storage wiring, and signed CDN delivery are the next milestones.
