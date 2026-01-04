#!/usr/bin/env bash
set -euo pipefail

TIMEOUT=${1:-120}
SLEEP=3
START=$(date +%s)

check() {
  local url="$1"
  if curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
    echo "OK: $url"
    return 0
  else
    echo "FAIL: $url"
    return 1
  fi
}

echo "Waiting up to ${TIMEOUT}s for service health endpoints"

END=$((START + TIMEOUT))

ENDPOINTS=(
  "http://localhost:5001/health"
  "http://localhost:8080/health"
  "http://localhost:5003/health"
  "http://localhost:5004/health"
  "http://localhost:5005/health"
  "http://localhost:5006/health"
  "http://localhost:5008/health"
  "http://localhost:8080/"
)

while [ $(date +%s) -le ${END} ]; do
  OK=true
  for e in "${ENDPOINTS[@]}"; do
    if ! check "$e"; then
      OK=false
    fi
  done
  if [ "$OK" = true ]; then
    echo "All endpoints healthy"
    exit 0
  fi
  sleep $SLEEP
done

echo "Timeout reached: some endpoints are unhealthy"
exit 2
