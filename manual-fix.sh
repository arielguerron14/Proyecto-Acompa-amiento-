#!/bin/bash
# This script should be run on EC2-DB via SSH or EC2 Instance Connect
echo "=============================================================="
echo "🔧 MONGODB AND SERVICES FIX"
echo "=============================================================="

echo ""
echo "📦 Step 1: Fix MongoDB on EC2-DB"
docker stop mongo 2>/dev/null || true
docker rm mongo 2>/dev/null || true
docker volume create mongo_data 2>/dev/null || true

docker run -d --name mongo \
  -p 0.0.0.0:27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  -v mongo_data:/data/db \
  mongo:6.0 \
  --auth --bind_ip_all

echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Test MongoDB
echo ""
echo "✅ Testing MongoDB"
docker exec mongo mongosh mongodb://root:example@localhost:27017/admin --authenticationDatabase admin --eval "db.adminCommand('ping')" 2>&1 | head -5

echo ""
echo "📦 Step 2: Fix Microservices on EC2-CORE"
docker network create core-net 2>/dev/null || true

# Stop old services
docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

# Start micro-auth with MongoDB URI
docker run -d --name micro-auth \
  --network core-net \
  -p 3000:3000 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/auth?authSource=admin' \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=debug \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-auth:latest

# Start micro-estudiantes
docker run -d --name micro-estudiantes \
  --network core-net \
  -p 3001:3001 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/estudiantes?authSource=admin' \
  -e AUTH_SERVICE_URL='http://micro-auth:3000' \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=debug \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-estudiantes:latest

# Start micro-maestros
docker run -d --name micro-maestros \
  --network core-net \
  -p 3002:3002 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/maestros?authSource=admin' \
  -e AUTH_SERVICE_URL='http://micro-auth:3000' \
  -e PORT=3002 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=debug \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-maestros:latest

echo "⏳ Waiting for microservices to be ready..."
sleep 10

echo ""
echo "✅ Microservices status:"
docker ps --filter "name=micro" --format "table {.Names}\t{.Status}\t{.Ports}"

echo ""
echo "=============================================================="
echo "✅ INFRASTRUCTURE FIX COMPLETE"
echo "=============================================================="
