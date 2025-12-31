#!/usr/bin/env bash
set -euo pipefail

# fix-deploy.sh
# Safe repair script to run on EC2 host. Intended to be executed via SSH from CI or run locally on the host.
# Behavior:
# - Inspect containers
# - For containers in Restarting/Exited state: gather logs, env, attempt pull/recreate with existing image and env-file
# - Check /health after restart and report status
# - Print diagnostics for manual troubleshooting

RETRY_ATTEMPTS=${RETRY_ATTEMPTS:-12}
RETRY_SLEEP=${RETRY_SLEEP:-5}

LOG_TAIL=${LOG_TAIL:-2000}

services=(
  "micro-auth-container"
  "micro-estudiantes-container"
  "micro-maestros-container"
  "micro-analytics-container"
  "micro-notificaciones-container"
  "micro-reportes-estudiantes-container"
  "micro-reportes-maestros-container"
  "micro-soap-bridge-container"
  "frontend-web-container"
  "api-gateway-container"
)

echo "== Running fix-deploy.sh on $(hostname) at $(date) =="

function inspect_container() {
  local name="$1"
  if ! sudo docker ps -a --format '{{.Names}}' | grep -q "^${name}$"; then
    echo "[INFO] Container ${name} not present"
    return 1
  fi

  echo "\n--- Inspecting ${name} ---"
  sudo docker inspect --format 'Name: {{.Name}}\nImage: {{.Config.Image}}\nStatus: {{.State.Status}}\nRestartCount: {{.RestartCount}}\nExitCode: {{.State.ExitCode}}' "$name" || true
  echo "\n[ENV FILE - host] (if exists):"
  SERVICE_SHORT=$(echo "$name" | sed 's/-container$//')
  ENV_FILE="$HOME/${SERVICE_SHORT}.env"
  if [ -f "$ENV_FILE" ]; then
    echo "-- $ENV_FILE --"
    sed -n '1,200p' "$ENV_FILE" || true
    # Emit raw and hex views of MONGO_URI for debug (if present) and detect embedded newlines
    if perl -0777 -ne "if (/MONGO_URI='(.*?)'/s){ print \$1 }" "$ENV_FILE" > /tmp/.mongo_val.$$ 2>/dev/null; then
      echo "  MONGO_URI (visible):"
      sed -n '1,5p' /tmp/.mongo_val.$$ | sed -n 'l;p' || true
      echo "  MONGO_URI (hex bytes):"
      od -An -t x1 -v /tmp/.mongo_val.$$ || true
      if od -An -t x1 -v /tmp/.mongo_val.$$ | grep -q '0a'; then
        echo "  [WARNING] MONGO_URI contains LF (0x0a) bytes — this will break single-line env files"
      fi
      rm -f /tmp/.mongo_val.$$ || true
    else
      echo "  (MONGO_URI not found in $ENV_FILE)"
    fi
  else
    echo "  (no env file at $ENV_FILE)"
  fi

  echo "\n[LOG] Last ${LOG_TAIL} lines of logs for ${name}:"
  sudo docker logs --tail ${LOG_TAIL} --timestamps "$name" || true
}

function try_recreate() {
  local name="$1"
  echo "\n--> Attempting to repair ${name}"

  # Extract image name
  IMAGE=$(sudo docker inspect --format '{{.Config.Image}}' "$name" 2>/dev/null || true)
  if [ -z "$IMAGE" ]; then
    echo "  [WARN] Could not detect image for ${name}; skipping recreate"
    return 1
  fi
  echo "  Image detected: $IMAGE"

  # Determine env file
  SERVICE_SHORT=$(echo "$name" | sed 's/-container$//')
  ENV_FILE="$HOME/${SERVICE_SHORT}.env"
  if [ -f "$ENV_FILE" ]; then
    echo "  Using env file: $ENV_FILE"
  else
    echo "  [WARN] Env file $ENV_FILE not found; proceeding but service may fail without envs"
  fi

  # Stop and remove existing container
  sudo docker rm -f "$name" || true

  # Pull image if available
  if sudo docker pull "$IMAGE"; then
    echo "  Pulled $IMAGE"
  else
    echo "  Could not pull $IMAGE (it may be local); will attempt run with current image name"
  fi

  # Determine ports mapping from image (best-effort defaults)
  # We try to reuse the published Ports from image history, but if none, skip port mapping and expect --env-file
  # NOTE: the project uses fixed ports in workflows, we will map common ports per service
  declare -A portmap
  portmap[micro-auth-container]="3001:3001"
  portmap[micro-estudiantes-container]="3002:3002"
  portmap[micro-maestros-container]="3003:3003"
  portmap[micro-analytics-container]="3010:3010"
  portmap[micro-notificaciones-container]="3006:3006"
  portmap[micro-reportes-estudiantes-container]="4003:4003"
  portmap[micro-reportes-maestros-container]="4002:4002"
  portmap[micro-soap-bridge-container]="5008:5008"
  portmap[frontend-web-container]="80:80"
  portmap[api-gateway-container]="80:8080"

  PORT_ARG=""
  if [ -n "${portmap[$name]:-}" ]; then
    PORT_ARG="-p ${portmap[$name]}"
    echo "  Using port mapping ${portmap[$name]}"
  else
    echo "  No known port mapping for ${name}; running without explicit -p"
  fi

  echo "  Running container $name from $IMAGE"
  if [ -f "$ENV_FILE" ]; then
    # Make a defensive sanitized copy of env file removing embedded newlines inside single-quoted values
    SANITIZED_ENV="$ENV_FILE.sanitized"
    perl -0777 -pe "s/(^MONGO_URI=')(.+?)(')/\$1.(\$2=~s/[\r\n]+//gr).\$3/egms" "$ENV_FILE" > "$SANITIZED_ENV" || cp "$ENV_FILE" "$SANITIZED_ENV"
    # If sanitization changed the file, warn and use the sanitized copy
    if ! cmp -s "$ENV_FILE" "$SANITIZED_ENV" 2>/dev/null; then
      echo "  [NOTICE] Env file contained embedded newlines; using sanitized copy $SANITIZED_ENV"
      ENV_TO_USE="$SANITIZED_ENV"
    else
      ENV_TO_USE="$ENV_FILE"
    fi
    sudo docker run -d --restart unless-stopped --env-file "$ENV_TO_USE" $PORT_ARG --name "$name" "$IMAGE" || { echo "  Failed to run $name"; return 1; }
  else
    sudo docker run -d --restart unless-stopped $PORT_ARG --name "$name" "$IMAGE" || { echo "  Failed to run $name"; return 1; }
  fi

  # Wait for /health
  echo "  Waiting for /health (if available)"
  local hostPort
  hostPort=$(echo ${portmap[$name]:-} | cut -d: -f1 || true)
  if [ -n "$hostPort" ]; then
    for i in $(seq 1 $RETRY_ATTEMPTS); do
      if sudo docker run --rm --network host curlimages/curl:7.88.1 -sSf "http://localhost:${hostPort}/health" >/dev/null 2>&1; then
        echo "  ${name} /health OK"
        return 0
      else
        echo "  ${name} not ready yet (attempt $i/$RETRY_ATTEMPTS), sleeping $RETRY_SLEEP..."
        sleep $RETRY_SLEEP
      fi
    done
    echo "  ${name} failed /health after retries"
    # capture additional diagnostics from the newly started container
    echo "  Capturing post-recreate logs for ${name} (last ${LOG_TAIL} lines):"
    sudo docker logs --tail ${LOG_TAIL} --timestamps "$name" || true
    echo "  Inspecting ${name} for details:" 
    sudo docker inspect --format 'State: {{.State.Status}}; ExitCode: {{.State.ExitCode}}; StartedAt: {{.State.StartedAt}}; Error: {{.State.Error}}' "$name" || true
    echo "  Container environment (from inspect):"
    sudo docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$name" || true
    echo "  Listing docker ps -a (matching name):"
    sudo docker ps -a --filter "name=${name}" --format 'table {{.Names}}	{{.Status}}	{{.Image}}' || true
    echo "  Host env file contents (if present):"
    if [ -f "$ENV_FILE" ]; then
      echo "-- $ENV_FILE --"
      sed -n '1,500p' "$ENV_FILE" || true
    fi
    return 1
  else
    echo "  No port to check /health for ${name}, inspect logs to confirm"
    return 0
  fi
}

# Main loop
overall_failed=0
for svc in "${services[@]}"; do
  # If the container exists
  if sudo docker ps -a --format '{{.Names}}' | grep -q "^${svc}$"; then
    status=$(sudo docker inspect --format '{{.State.Status}}' "$svc" 2>/dev/null || echo 'missing')
    restartCount=$(sudo docker inspect --format '{{.RestartCount}}' "$svc" 2>/dev/null || echo 0)
    echo "\n== Service: $svc => status=$status restarts=$restartCount =="
    if [[ "$status" == "running" ]]; then
      echo "  Running OK"
      # Optionally still check /health
      try_recreate "$svc" >/dev/null 2>&1 || true
    else
      inspect_container "$svc"
      if try_recreate "$svc"; then
        echo "  Recreate succeeded for $svc"
      else
        echo "  Recreate failed for $svc"
        overall_failed=1
      fi
    fi
  else
    echo "\n== Service: $svc not found on this host; skipping =="
  fi
done

if [ "$overall_failed" -ne 0 ]; then
  echo "\nRESULT: Some services could not be repaired automatically. Please inspect outputs above and examine container logs."
  exit 2
else
  echo "\nRESULT: Repair attempts completed (all services that needed it were re-created and reported healthy or require manual inspection)."
  exit 0
fi
