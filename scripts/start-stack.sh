#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building and starting stack (docker compose up -d --build)"
docker compose up -d --build

echo "Waiting for services to become healthy (default timeout 180s)"
./scripts/wait-for-health.sh 180

echo "Stack started"
