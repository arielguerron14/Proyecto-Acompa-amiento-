#!/bin/bash
# Quick fix for microservices PORT configuration
# Run this directly on EC2-Core to restart with correct ports

set -e

echo "=== Quick Fix: Restarting Microservices with Correct PORT Variables ==="
echo ""

# Stop and remove old containers
echo "Stopping old containers..."
docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
sleep 2
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
sleep 2

# Rebuild images (to get latest code)
echo "Rebuilding microservice images..."
cd /tmp/Proyecto-Acompa-amiento- 2>/dev/null || {
  echo "Cloning repository..."
  cd /tmp
  rm -rf Proyecto-Acompa-amiento-
  git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
  cd Proyecto-Acompa-amiento-
}

docker build -t micro-auth:latest -f micro-auth/Dockerfile .
docker build -t micro-maestros:latest -f micro-maestros/Dockerfile .
docker build -t micro-estudiantes:latest -f micro-estudiantes/Dockerfile .

# Start with CORRECT port environment variables
echo "Starting microservices with correct PORT variables..."
docker run -d --name micro-auth --restart unless-stopped -p 3000:3000 -e PORT=3000 -e DB_HOST=44.222.116.0 micro-auth:latest
docker run -d --name micro-maestros --restart unless-stopped -p 3002:3002 -e PORT=3002 -e DB_HOST=44.222.116.0 micro-maestros:latest
docker run -d --name micro-estudiantes --restart unless-stopped -p 3001:3001 -e PORT=3001 -e DB_HOST=44.222.116.0 micro-estudiantes:latest

echo ""
echo "Waiting 5 seconds for containers to start..."
sleep 5

echo ""
echo "=== Container Status ==="
docker ps

echo ""
echo "=== Testing Auth Service ==="
curl -s http://localhost:3000/health || echo "Auth service not yet responding"

echo ""
echo "✅ Microservices restarted with correct PORT configuration!"
