#!/bin/bash
# Force redeploy of microservices with correct port mapping

echo "🚀 Force Redeploy Microservices with 0.0.0.0 Port Mapping"

# Configuration
DB_IP="172.31.65.122"  # EC2-DB private IP
DOCKER_USER="caguerronp"

# 1. Create network if doesn't exist
echo "📋 Ensuring core-net exists..."
docker network create core-net 2>/dev/null || echo "  (network already exists)"

# 2. Kill ALL containers named micro-* aggressively
echo "🛑 Killing all micro-* containers..."
docker kill $(docker ps -q --filter "name=micro-") 2>/dev/null || true
sleep 1

# 3. Remove ALL containers named micro-*
echo "🗑️  Removing all micro-* containers..."
docker rm -f $(docker ps -aq --filter "name=micro-") 2>/dev/null || true
sleep 1

# 4. Verify they're gone
echo "✅ Verification:"
docker ps -a --filter "name=micro-"

# 5. Pull latest images
echo ""
echo "📥 Pulling latest images..."
docker pull $DOCKER_USER/micro-auth:latest
docker pull $DOCKER_USER/micro-estudiantes:latest
docker pull $DOCKER_USER/micro-maestros:latest

# 6. Deploy with CORRECT port mapping (0.0.0.0)
echo ""
echo "🚀 Deploying with 0.0.0.0 port mapping..."

echo "  → micro-auth (3000)..."
docker run -d \
  --name micro-auth \
  --network core-net \
  -p 0.0.0.0:3000:3000 \
  -e PORT=3000 \
  -e MONGODB_URI="mongodb://root:example@$DB_IP:27017/auth?authSource=admin" \
  -e NODE_ENV=production \
  $DOCKER_USER/micro-auth:latest

sleep 2

echo "  → micro-estudiantes (3001)..."
docker run -d \
  --name micro-estudiantes \
  --network core-net \
  -p 0.0.0.0:3001:3001 \
  -e PORT=3001 \
  -e MONGODB_URI="mongodb://root:example@$DB_IP:27017/estudiantes?authSource=admin" \
  -e NODE_ENV=production \
  $DOCKER_USER/micro-estudiantes:latest

sleep 2

echo "  → micro-maestros (3002)..."
docker run -d \
  --name micro-maestros \
  --network core-net \
  -p 0.0.0.0:3002:3002 \
  -e PORT=3002 \
  -e MONGODB_URI="mongodb://root:example@$DB_IP:27017/maestros?authSource=admin" \
  -e NODE_ENV=production \
  $DOCKER_USER/micro-maestros:latest

sleep 3

# 7. Verify deployment
echo ""
echo "📋 Deployment Status:"
docker ps --filter "name=micro-" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# 8. Check port binding
echo ""
echo "🔌 Port Binding Verification:"
netstat -tlnp 2>/dev/null | grep -E ':(3000|3001|3002)' || ss -tlnp 2>/dev/null | grep -E ':(3000|3001|3002)'

# 9. Health check
echo ""
echo "🏥 Health Checks:"
echo "  → micro-auth..."
curl -s -m 2 http://127.0.0.1:3000/health 2>&1 | head -1 || echo "     (no response)"

echo "  → micro-estudiantes..."
curl -s -m 2 http://127.0.0.1:3001/health 2>&1 | head -1 || echo "     (no response)"

echo "  → micro-maestros..."
curl -s -m 2 http://127.0.0.1:3002/health 2>&1 | head -1 || echo "     (no response)"

echo ""
echo "✅ Redeploy Complete!"
