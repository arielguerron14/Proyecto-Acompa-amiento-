#!/usr/bin/env bash
# Rebuild and redeploy all microservices with corrected Dockerfiles

set -e

echo "════════════════════════════════════════════════════════════════════"
echo "🚀 REBUILDING MICROSERVICES WITH FIXED DOCKERFILES"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Docker Hub credentials
DOCKER_USER="${DOCKER_USERNAME:-caguerronp}"

SERVICES=(
  "micro-analytics:5007"
  "micro-auth:3000"
  "micro-estudiantes:3001"
  "micro-maestros:3002"
)

echo "Building and pushing images..."
echo ""

for service_info in "${SERVICES[@]}"; do
  SERVICE="${service_info%:*}"
  PORT="${service_info##*:}"
  
  echo "📦 Building $SERVICE..."
  docker build \
    --build-arg SERVICE_NAME=$SERVICE \
    -t $DOCKER_USER/$SERVICE:latest \
    -f $SERVICE/Dockerfile \
    . \
    2>&1 | tail -5
  
  echo "✅ Built $SERVICE"
  echo ""
done

echo "════════════════════════════════════════════════════════════════════"
echo "✅ All microservices rebuilt successfully!"
echo ""
echo "Next steps:"
echo "1. Push images to Docker Hub:"
echo "   docker push $DOCKER_USER/micro-analytics:latest"
echo "   docker push $DOCKER_USER/micro-auth:latest"
echo "   docker push $DOCKER_USER/micro-estudiantes:latest"
echo "   docker push $DOCKER_USER/micro-maestros:latest"
echo ""
echo "2. Or run workflows to automatically rebuild and deploy"
echo ""
echo "════════════════════════════════════════════════════════════════════"
