#!/bin/bash
# EC2-CORE DEPLOYMENT - Simple and Fast
set -e

echo "🚀 DESPLEGANDO EC2-CORE"
echo "======================="

cd /tmp
rm -rf proyecto 2>/dev/null || true
git clone --depth 1 https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git proyecto
cd proyecto

echo "🏗️ Compilando microservicios..."
for SERVICE in micro-auth micro-estudiantes micro-maestros micro-core; do
  [ -f "./$SERVICE/Dockerfile" ] && docker build -t $SERVICE:latest -f ./$SERVICE/Dockerfile . 2>&1 | tail -3
done

echo "📋 Iniciando servicios..."
mkdir -p ~/app
cp docker-compose.ec2-core.yml ~/app/docker-compose.yml
cd ~/app

docker-compose down 2>/dev/null || true
sleep 2
docker-compose up -d
sleep 10

echo "✅ EC2-CORE DESPLEGADO"
echo ""
docker-compose ps
docker ps

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       EC2-CORE MICROSERVICES DEPLOYMENT                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
EC2_CORE_PRIVATE_IP="172.31.78.183"
EC2_DB_PRIVATE_IP="172.31.79.193"
DEPLOY_DIR="/opt/microservices"

echo -e "${YELLOW}📝 Configuration:${NC}"
echo "  → Deployment directory: $DEPLOY_DIR"
echo "  → EC2-CORE: $EC2_CORE_PRIVATE_IP"
echo "  → EC2-DB: $EC2_DB_PRIVATE_IP"
echo ""

# Step 1: Create directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Step 2: Clean old deployment
echo -e "${YELLOW}🧹 Cleaning old deployments...${NC}"
docker rm -f micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rmi micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
echo -e "${GREEN}✅ Old deployments cleaned${NC}"
echo ""

# Step 3: Clone/Update repository
echo -e "${YELLOW}📥 Setting up repository...${NC}"
if [ -d "proyecto" ]; then
  echo "  → Repository exists, pulling latest..."
  cd proyecto
  git pull origin main
  cd ..
else
  echo "  → Cloning repository..."
  git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git proyecto
fi
echo -e "${GREEN}✅ Repository ready${NC}"
echo ""

# Step 4: Build Docker images
echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
cd proyecto
echo "  → Building micro-auth..."
docker build -f micro-auth/Dockerfile -t micro-auth:latest . --quiet
echo "    ${GREEN}✅ micro-auth built${NC}"

echo "  → Building micro-estudiantes..."
docker build -f micro-estudiantes/Dockerfile -t micro-estudiantes:latest . --quiet
echo "    ${GREEN}✅ micro-estudiantes built${NC}"

echo "  → Building micro-maestros..."
docker build -f micro-maestros/Dockerfile -t micro-maestros:latest . --quiet
echo "    ${GREEN}✅ micro-maestros built${NC}"
cd ..
echo ""

# Step 5: Create docker-compose.yml
echo -e "${YELLOW}📝 Creating docker-compose.yml...${NC}"
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  micro-auth:
    image: micro-auth:latest
    container_name: micro-auth
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGO_URL: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
      POSTGRES_URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
      REDIS_URL: redis://:redis123@172.31.79.193:6379
    restart: unless-stopped
    networks:
      - core
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  micro-estudiantes:
    image: micro-estudiantes:latest
    container_name: micro-estudiantes
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGO_URL: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
      POSTGRES_URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
      REDIS_URL: redis://:redis123@172.31.79.193:6379
      AUTH_SERVICE: http://172.31.78.183:3000
    restart: unless-stopped
    networks:
      - core
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  micro-maestros:
    image: micro-maestros:latest
    container_name: micro-maestros
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      PORT: 3002
      MONGO_URL: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
      POSTGRES_URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
      REDIS_URL: redis://:redis123@172.31.79.193:6379
      AUTH_SERVICE: http://172.31.78.183:3000
    restart: unless-stopped
    networks:
      - core
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3002/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  core:
    driver: bridge
COMPOSE
echo -e "${GREEN}✅ docker-compose.yml created${NC}"
echo ""

# Step 6: Start services
echo -e "${YELLOW}🚀 Starting microservices...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Step 7: Wait for initialization
echo -e "${YELLOW}⏳ Waiting 45 seconds for services to initialize...${NC}"
sleep 45
echo ""

# Step 8: Display status
echo -e "${YELLOW}📊 Service Status:${NC}"
docker ps -a
echo ""

# Final Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ EC2-CORE DEPLOYMENT COMPLETED SUCCESSFULLY!        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📝 Service Information:${NC}"
echo "  • Auth Service: http://172.31.78.183:3000"
echo "  • Estudiantes Service: http://172.31.78.183:3001"
echo "  • Maestros Service: http://172.31.78.183:3002"
echo ""
echo -e "${GREEN}💾 Database Connections (EC2-DB):${NC}"
echo "  • MongoDB: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin"
echo "  • PostgreSQL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento"
echo "  • Redis: redis://:redis123@172.31.79.193:6379"
echo ""
echo -e "${GREEN}📁 Deployment Directory: $DEPLOY_DIR${NC}"
echo ""
echo -e "${YELLOW}🔧 Useful Commands:${NC}"
echo "  docker ps -a                                    # Check service status"
echo "  docker logs micro-auth                         # View auth service logs"
echo "  docker-compose down                            # Stop services"
echo "  docker-compose restart micro-auth              # Restart specific service"
echo ""
echo -e "${GREEN}✅ Ready for production!${NC}"
