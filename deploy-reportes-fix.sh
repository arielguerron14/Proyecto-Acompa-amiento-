#!/bin/bash
# Manual deployment script for API Gateway and Reportes services

set -e

SSH_KEY_PATH="$HOME/.ssh/ariel_key.pem"  # Adjust path to your SSH key
API_GW_HOST="ubuntu@100.49.159.65"
DB_HOST="ubuntu@98.84.26.109"

echo "=================================================="
echo "Manual Deployment: API Gateway and Reportes Fix"
echo "=================================================="

# Deploy API Gateway
echo ""
echo "Step 1: Deploying API Gateway..."
ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=15 "$API_GW_HOST" << 'EOF'
set -e
cd /tmp
rm -rf Proyecto-Acompa-amiento-
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-

echo "Building API Gateway image..."
docker build -t api-gateway:latest -f api-gateway/Dockerfile .

echo "Stopping old container..."
docker stop api-gateway 2>/dev/null || true
docker kill api-gateway 2>/dev/null || true
sleep 1
docker rm -f api-gateway 2>/dev/null || true
sleep 2

echo "Pruning Docker..."
docker system prune -f 2>/dev/null || true
sleep 3

echo "Starting API Gateway..."
docker run -d --name api-gateway --restart unless-stopped \
  -p 8080:8080 \
  -e PORT=8080 \
  -e AUTH_SERVICE=http://100.24.118.233:3000 \
  -e MAESTROS_SERVICE=http://100.24.118.233:3002 \
  -e ESTUDIANTES_SERVICE=http://100.24.118.233:3001 \
  -e REPORTES_EST_SERVICE=http://98.84.26.109:5003 \
  -e REPORTES_MAEST_SERVICE=http://98.84.26.109:5004 \
  api-gateway:latest

sleep 5
docker ps | grep api-gateway
echo "✅ API Gateway deployed!"
EOF

# Deploy Reportes Services
echo ""
echo "Step 2: Deploying Reportes Services..."
ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=15 "$DB_HOST" << 'EOF'
set -e
cd /tmp
rm -rf Proyecto-Acompa-amiento-
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-

echo "Building Reportes images..."
docker build -t micro-reportes-estudiantes:latest -f micro-reportes-estudiantes/Dockerfile .
docker build -t micro-reportes-maestros:latest -f micro-reportes-maestros/Dockerfile .

echo "Stopping old containers..."
docker stop micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true
docker kill micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true
sleep 1
docker rm -f micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true
sleep 2

echo "Starting Reportes services..."
docker run -d --name micro-reportes-estudiantes --restart unless-stopped \
  -p 5003:5003 \
  -e PORT=5003 \
  -e MONGO_URI=mongodb://localhost:27017/micro-reportes-estudiantes \
  micro-reportes-estudiantes:latest

docker run -d --name micro-reportes-maestros --restart unless-stopped \
  -p 5004:5004 \
  -e PORT=5004 \
  -e MONGO_URI=mongodb://localhost:27017/micro-reportes-maestros \
  micro-reportes-maestros:latest

sleep 8
docker ps | grep micro-reportes
echo "✅ Reportes services deployed!"
EOF

echo ""
echo "=================================================="
echo "✅ All services deployed successfully!"
echo "=================================================="
echo ""
echo "Testing endpoints:"
echo "  API Gateway:     http://100.49.159.65:8080/health"
echo "  Reportes EST:    http://98.84.26.109:5003/health"
echo "  Reportes MAEST:  http://98.84.26.109:5004/health"
