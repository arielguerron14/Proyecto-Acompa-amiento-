#!/usr/bin/env bash
set -euo pipefail

# Expects env vars: MONGO_B64, REDIS_HOST_B64, REDIS_PORT_B64, REDIS_PW_B64
# Writes: $HOME/micro-analytics.env, $HOME/micro-reportes-estudiantes.env, $HOME/micro-reportes-maestros.env

TMPDIR=${TMPDIR:-/tmp}

echo "Decoding base64 payloads"
echo "$MONGO_B64" > "$TMPDIR/mongo.b64" || true
base64 -d "$TMPDIR/mongo.b64" | tr -d '\r\n' > "$TMPDIR/mongo.dec" || true
MONGO_URI=$(cat "$TMPDIR/mongo.dec" 2>/dev/null || true)

echo "$REDIS_HOST_B64" > "$TMPDIR/redis_host.b64" || true
base64 -d "$TMPDIR/redis_host.b64" | tr -d '\r\n' > "$TMPDIR/redis_host.dec" || true
REDIS_HOST=$(cat "$TMPDIR/redis_host.dec" 2>/dev/null || true)

echo "$REDIS_PORT_B64" > "$TMPDIR/redis_port.b64" || true
base64 -d "$TMPDIR/redis_port.b64" | tr -d '\r\n' > "$TMPDIR/redis_port.dec" || true
REDIS_PORT=$(cat "$TMPDIR/redis_port.dec" 2>/dev/null || true)

echo "$REDIS_PW_B64" > "$TMPDIR/redis_pw.b64" || true
base64 -d "$TMPDIR/redis_pw.b64" | tr -d '\r\n' > "$TMPDIR/redis_pw.dec" || true
REDIS_PASSWORD=$(cat "$TMPDIR/redis_pw.dec" 2>/dev/null || true)

# Write env files using printf to guarantee single-line values
printf "MONGO_URI='%s'\nREDIS_HOST='%s'\nREDIS_PORT='%s'\nREDIS_PASSWORD='%s'\n" "$MONGO_URI" "$REDIS_HOST" "$REDIS_PORT" "$REDIS_PASSWORD" > "$HOME/micro-analytics.env"
printf "MONGO_URI='%s'\n" "$MONGO_URI" > "$HOME/micro-reportes-estudiantes.env"
printf "MONGO_URI='%s'\n" "$MONGO_URI" > "$HOME/micro-reportes-maestros.env"

# Python sanitizer to remove embedded CR/LF in quoted MONGO_URI
python3 - "$HOME/micro-analytics.env" "$HOME/micro-reportes-estudiantes.env" "$HOME/micro-reportes-maestros.env" <<'PY'
import sys, re
files = sys.argv[1:]
pat = re.compile(r"(MONGO_URI=')(.+?)(')", re.S)
for fname in files:
    try:
        text = open(fname, 'r', encoding='utf-8').read()
        def repl(m):
            inner = m.group(2).replace('\r','').replace('\n','')
            return m.group(1)+inner+m.group(3)
        text = pat.sub(repl, text)
        open(fname, 'w', encoding='utf-8').write(text)
    except FileNotFoundError:
        pass
PY

# Verify there are no LF (0x0a) bytes inside the decoded MONGO_URI after sanitization
if awk -F= '/^MONGO_URI/ {print $2}' "$HOME/micro-analytics.env" | sed "s/^'//; s/'$//" | od -An -t x1 -v | grep -qw '0a'; then
  echo "ERROR: MONGO_URI contains LF bytes after on-host sanitization"; exit 2
fi

# Emit debug artifacts to stdout
echo "--- DEBUG: micro-analytics.env MONGO_URI (raw) ---"
awk -F= '/^MONGO_URI/ {print $2}' "$HOME/micro-analytics.env" | sed "s/^'//; s/'$//" | sed -n 'l;p' || true

echo "--- DEBUG: micro-analytics.env MONGO_URI (hex bytes) ---"
awk -F= '/^MONGO_URI/ {print $2}' "$HOME/micro-analytics.env" | sed "s/^'//; s/'$//" | od -An -t x1 -v || true

exit 0
