#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_URL="${REPO_URL:-}"
INSTALL_DIR="${INSTALL_DIR:-$SCRIPT_DIR}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root or with sudo."
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This setup script currently supports Debian/Ubuntu-based VMs only."
  exit 1
fi

TARGET_USER="${SUDO_USER:-${USER:-}}"

echo "Installing Docker host dependencies..."

apt-get update
apt-get install -y ca-certificates curl ffmpeg git gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings

if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

. /etc/os-release

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

if [[ -n "${TARGET_USER}" && "${TARGET_USER}" != "root" ]]; then
  usermod -aG docker "${TARGET_USER}" || true
fi

if [[ ! -d "${INSTALL_DIR}/.git" && -n "${REPO_URL}" ]]; then
  echo "Cloning repository into ${INSTALL_DIR}..."
  rm -rf "${INSTALL_DIR}"
  git clone "${REPO_URL}" "${INSTALL_DIR}"
fi

if [[ -f "${INSTALL_DIR}/.env.example" && ! -f "${INSTALL_DIR}/.env.local" ]]; then
  echo "Creating ${INSTALL_DIR}/.env.local from .env.example..."
  cp "${INSTALL_DIR}/.env.example" "${INSTALL_DIR}/.env.local"
fi

echo
echo "Docker setup complete."
echo
echo "Installed components:"
echo "- Docker Engine"
echo "- Docker Compose plugin"
echo "- Buildx plugin"
echo "- ffmpeg"
echo "- git, curl, ca-certificates, gnupg"
echo
echo "Verification commands:"
echo "  docker --version"
echo "  docker compose version"
echo "  ffmpeg -version"
echo
if [[ -n "${TARGET_USER}" && "${TARGET_USER}" != "root" ]]; then
  echo "${TARGET_USER} was added to the docker group."
  echo "Log out and back in before running Docker without sudo."
fi
echo
if [[ -d "${INSTALL_DIR}" ]]; then
  echo "Next steps inside the repo:"
  echo "  cd ${INSTALL_DIR}"
  echo "  ./run-local.sh"
fi