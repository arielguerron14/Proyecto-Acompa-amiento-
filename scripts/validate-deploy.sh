#!/usr/bin/env bash
set -euo pipefail

# Validate containers and services on the host where this script runs (EC2 target)
# Usage: sudo bash validate-deploy.sh
# Exits with 0 if all checks pass, non-zero otherwise.

echo "== Deployment validation script =="

# Services to check: (service_name:port:health_path)
services=(
  "api-gateway:8080:/health"
  "micro-auth:3001:/health"
  "micro-estudiantes:3002:/health"
  "micro-maestros:3003:/health"
  "micro-analytics:3010:/health"
  "micro-notificaciones:3006:/health"
  "micro-reportes-estudiantes:4003:/health"
  "micro-reportes-maestros:4002:/health"
  "micro-soap-bridge:5008:/health"
)

FAILED=0

function check_container_running() {
  local name="$1"
  if sudo docker ps --format '{{.Names}}' | grep -q "${name}"; then
    echo "[OK] Container ${name} is running"
    return 0
  else
    echo "[FAIL] Container ${name} is NOT running"
    FAILED=1
    return 1
  fi
}

function check_health_http() {
  local host="localhost"
  local port="$1"
  local path="$2"
  echo -n "Checking http://${host}:${port}${path} ... "
  if sudo docker run --rm --network host curlimages/curl:7.88.1 -sS -o /tmp/health.json -w "%{http_code}" "http://${host}:${port}${path}" | grep -E "2.." >/dev/null; then
    echo "OK"
    return 0
  else
    echo "FAIL"
    echo "  Response body:"; sudo cat /tmp/health.json || true
    FAILED=1
    return 1
  fi
}

# 1) Check containers
for svc in "${services[@]}"; do
  IFS=":" read -r svcName svcPort svcPath <<< "$svc"
  # name mapping used in workflows: <service>-container
  check_container_running "${svcName}-container" || true
done

# 2) Health endpoints
for svc in "${services[@]}"; do
  IFS=":" read -r svcName svcPort svcPath <<< "$svc"
  check_health_http "$svcPort" "$svcPath" || true
done

# 3) Frontend root
echo -n "Checking frontend root (/)... "
if sudo docker run --rm --network host curlimages/curl:7.88.1 -sSf http://localhost/ > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAIL"
  FAILED=1
fi

# 4) Basic smoke test: attempt registration via API Gateway
if [ -n "${API_GATEWAY_URL:-}" ]; then
  target="${API_GATEWAY_URL%/}"
else
  target="http://localhost"
fi

echo "Running registration smoke test against $target/auth/register"
TMPFILE=$(mktemp)
STATUS=$(sudo docker run --rm --network host curlimages/curl:7.88.1 -sS -o "$TMPFILE" -w "%{http_code}" -X POST "$target/auth/register" -H 'Content-Type: application/json' -d '{"name":"smoke","email":"smoke+ci@example.com","password":"p","role":"estudiante"}') || true
if echo "$STATUS" | grep -E "2.." >/dev/null; then
  echo "[OK] Registration returned 2xx"
else
  echo "[WARN] Registration did not return 2xx (status: $STATUS)"
  echo "  Body:"; cat "$TMPFILE" || true
  # Not automatically failing: registration can be 4xx if the user exists
fi
rm -f "$TMPFILE"

# 5) Check Mongo connectivity from a small diagnostic container if mongo host is remote
if sudo docker ps -a --format '{{.Names}}' | grep -q 'mongo'; then
  echo "Mongo container detected locally"
else
  echo "No local mongo container found (if services use external Mongo, ensure MONGO_URI is correct)"
fi

# 6) Show important envs for micro-auth container
if sudo docker ps --format '{{.Names}}' | grep -q "micro-auth-container"; then
  echo "micro-auth envs (partial):"
  sudo docker inspect --format '{{range $index, $value := .Config.Env}}{{println $value}}{{end}}' micro-auth-container | grep -E "MONGO|REDIS|PORT|NODE_ENV" || true
fi

# Final status
if [ "$FAILED" -ne 0 ]; then
  echo "\nRESULT: Some checks failed. Inspect above output and container logs (sudo docker logs <container>) for details."
  exit 1
else
  echo "\nRESULT: All checks passed (or returned expected non-fatal warnings)."
  exit 0
fi
