#!/usr/bin/env bash
set -euo pipefail

# Run a pair of smoke tests against the API Gateway:
# 1) POST /auth/register (allow 201 or 409)
# 2) POST /auth/login (expect token in response)

API_BASE=${API_GATEWAY_URL:-http://localhost}

echo "Running smoke tests against $API_BASE"

TIMESTAMP=$(date +%s)
EMAIL="smoke+${TIMESTAMP}@example.com"
PASS="p"
NAME="smoke-${TIMESTAMP}"

echo "1) Registering test user: $EMAIL"
HTTP=$(curl -sS -o /tmp/reg.json -w "%{http_code}" -X POST "$API_BASE/auth/register" -H 'Content-Type: application/json' -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"role\":\"estudiante\"}") || true
if echo "$HTTP" | grep -E "2.." >/dev/null; then
  echo "  [OK] registration returned 2xx"
else
  if [ "$HTTP" = "409" ]; then
    echo "  [WARN] registration returned 409 (already exists)"
  else
    echo "  [FAIL] registration returned $HTTP"
    cat /tmp/reg.json || true
    exit 1
  fi
fi

# 2) Login
echo "2) Attempting login"
HTTP=$(curl -sS -o /tmp/login.json -w "%{http_code}" -X POST "$API_BASE/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}") || true
if echo "$HTTP" | grep -E "2.." >/dev/null; then
  echo "  [OK] login returned 2xx"
  if grep -q '"token"' /tmp/login.json; then
    echo "  [OK] token present in login response"
  else
    echo "  [WARN] login response did not include token (response body):"
    cat /tmp/login.json || true
    exit 1
  fi
else
  echo "  [FAIL] login returned $HTTP"
  cat /tmp/login.json || true
  exit 1
fi

echo "Smoke tests passed"

# cleanup
rm -f /tmp/reg.json /tmp/login.json
