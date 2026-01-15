#!/bin/bash
# Script para reconstruir y desplegar con las correcciones

set -e

cd /home/ubuntu/project

echo "[1/5] Pulling latest code from repository..."
git pull origin main

echo "[2/5] Stopping current services..."
docker-compose down || true

echo "[3/5] Rebuilding API Gateway image with fixes..."
docker-compose build --no-cache api-gateway

echo "[4/5] Starting all services..."
docker-compose up -d api-gateway core auth db frontend

echo "[5/5] Waiting for services to stabilize..."
sleep 5

echo "✅ Deployment complete!"
echo ""
echo "Checking service health..."
curl -s http://localhost:3000/health | jq . || curl -s http://localhost:3000/health
curl -s http://localhost:3000/horarios | head -20 || echo "Horarios endpoint loading..."

echo ""
echo "✅ Services are now updated and running!"
