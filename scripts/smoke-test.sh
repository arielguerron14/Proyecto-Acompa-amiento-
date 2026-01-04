#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

OUTDIR="artifacts/smoke"
mkdir -p "$OUTDIR"

echo "Running smoke tests against local stack"

declare -A URLS
URLS[maestros]="http://localhost:5001/health"
URLS[estudiantes]="http://localhost:5002/health"
URLS[reportes-estudiantes]="http://localhost:5003/health"
URLS[reportes-maestros]="http://localhost:5004/health"
URLS[auth]="http://localhost:5005/health"
URLS[notificaciones]="http://localhost:5006/health"
URLS[soap]="http://localhost:5008/health"
URLS[apigateway]="http://localhost:8080/"

FAILED=0
for name in "${!URLS[@]}"; do
  url=${URLS[$name]}
  echo "Checking $name -> $url"
  if curl -fsS --max-time 5 "$url" -o "$OUTDIR/$name.json"; then
    echo "OK: $name"
  else
    echo "FAIL: $name (see $OUTDIR/$name.json)"
    FAILED=1
  fi
done

docker compose logs --no-color > "$OUTDIR/compose.log" || true

if [ $FAILED -ne 0 ]; then
  echo "Smoke tests failed"
  exit 2
fi

echo "Smoke tests passed"
