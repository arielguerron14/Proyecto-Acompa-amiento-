#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building and starting stack (docker compose up -d --build)"
# Ensure .env exists to avoid failing docker compose when env_file entries are used
if [ ! -f .env ]; then
	if [ -f .env.example ]; then
		cp .env.example .env
		echo "Copied .env.example to .env"
	else
		echo "No .env or .env.example found; creating minimal .env"
		cat > .env <<'EOF'
NODE_ENV=production
TAG=latest
EOF
	fi
fi
docker compose up -d --build

echo "Waiting for services to become healthy (default timeout 180s)"
./scripts/wait-for-health.sh 180

echo "Stack started"
