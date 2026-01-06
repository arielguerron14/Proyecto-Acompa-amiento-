#!/bin/bash
################################################################################
#                  EC2-CORE DEPLOYMENT - REMOTE EXECUTION                      #
#                                                                              #
# Este script se ejecuta REMOTAMENTE en EC2-CORE via SSH                      #
# y despliega todos los microservicios                                        #
################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       EC2-CORE MICROSERVICES DEPLOYMENT                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
EC2_CORE_PRIVATE_IP="172.31.78.183"
EC2_DB_PRIVATE_IP="172.31.79.193"
DEPLOY_DIR="/opt/microservices"
REPO_URL="https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git"

echo -e "${YELLOW}📝 Configuration:${NC}"
echo "  → Deployment directory: $DEPLOY_DIR"
echo "  → EC2-CORE: $EC2_CORE_PRIVATE_IP"
echo "  → EC2-DB: $EC2_DB_PRIVATE_IP"
echo "  → Repository: $REPO_URL"
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
docker rmi micro-auth:latest micro-estudiantes:latest micro-maestros:latest 2>/dev/null || true
echo -e "${GREEN}✅ Old deployments cleaned${NC}"
echo ""

# Step 3: Clone/Update repository
echo -e "${YELLOW}📥 Cloning/updating repository...${NC}"
if [ -d "Proyecto-Acompa-amiento-" ]; then
  cd Proyecto-Acompa-amiento-
  git pull origin main 2>/dev/null || git fetch origin main
else
  git clone $REPO_URL
  cd Proyecto-Acompa-amiento-
fi
echo -e "${GREEN}✅ Repository ready${NC}"
echo ""

# Step 4: Verify Dockerfiles
echo -e "${YELLOW}🔍 Verifying Dockerfiles...${NC}"
for service in micro-auth micro-estudiantes micro-maestros; do
  if [ -f "$service/Dockerfile" ]; then
    echo -e "${GREEN}✅ $service/Dockerfile found${NC}"
  else
    echo -e "${RED}❌ $service/Dockerfile NOT found${NC}"
    ls -la $service/ || true
    exit 1
  fi
done
echo ""

# Step 5: Build Docker images
echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
docker build -t micro-auth:latest ./micro-auth --quiet
echo -e "${GREEN}✅ micro-auth:latest built${NC}"

docker build -t micro-estudiantes:latest ./micro-estudiantes --quiet
echo -e "${GREEN}✅ micro-estudiantes:latest built${NC}"

docker build -t micro-maestros:latest ./micro-maestros --quiet
echo -e "${GREEN}✅ micro-maestros:latest built${NC}"
echo ""

# Step 6: Create docker-compose.yml
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
      POSTGRES_URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
      REDIS_URL: redis://:redis123@172.31.79.193:6379
    networks:
      - core-net
    restart: unless-stopped
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
    networks:
      - core-net
    restart: unless-stopped
    depends_on:
      - micro-auth
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
    networks:
      - core-net
    restart: unless-stopped
    depends_on:
      - micro-auth
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3002/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  core-net:
    driver: bridge

COMPOSE
echo -e "${GREEN}✅ docker-compose.yml created${NC}"
echo ""

# Step 7: Start services
echo -e "${YELLOW}🚀 Starting services with docker-compose...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Step 8: Wait for initialization
echo -e "${YELLOW}⏳ Waiting 45 seconds for services to initialize...${NC}"
sleep 45
echo -e "${GREEN}✅ Initialization complete${NC}"
echo ""

# Step 9: Validate deployment
echo -e "${YELLOW}✅ Validating deployment...${NC}"
echo ""

echo -e "${BLUE}Container Status:${NC}"
docker ps -a --filter "label!=docker-image" 2>/dev/null || docker ps -a | tail -4
echo ""

echo -e "${BLUE}Health Checks:${NC}"
for service in 3000 3001 3002; do
  if curl -s http://localhost:$service/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Service :$service is healthy${NC}"
  else
    echo -e "${RED}❌ Service :$service is NOT responding${NC}"
  fi
done
echo ""

echo -e "${BLUE}Docker Images:${NC}"
docker images | grep micro
echo ""

# Step 10: Display final status
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ✅ DEPLOYMENT COMPLETED SUCCESSFULLY!          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📊 Microservices Status:${NC}"
echo -e "${GREEN}✅ micro-auth${NC}       → http://localhost:3000"
echo -e "${GREEN}✅ micro-estudiantes${NC} → http://localhost:3001"
echo -e "${GREEN}✅ micro-maestros${NC}    → http://localhost:3002"
echo ""

echo -e "${YELLOW}📁 Configuration:${NC}"
echo "  → Deployment directory: $DEPLOY_DIR"
echo "  → docker-compose.yml: $DEPLOY_DIR/docker-compose.yml"
echo "  → Repository: $DEPLOY_DIR/Proyecto-Acompa-amiento-"
echo ""

echo -e "${YELLOW}🔗 Database Connections (Internal VPC):${NC}"
echo "  → MongoDB:   mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento"
echo "  → PostgreSQL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento"
echo "  → Redis:     redis://:redis123@172.31.79.193:6379"
echo ""

echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "  docker ps -a                          # View all containers"
echo "  docker-compose ps                     # View compose services"
echo "  docker logs micro-auth                # View service logs"
echo "  docker-compose restart                # Restart all services"
echo "  curl http://localhost:3000/health     # Test health endpoint"
echo ""

echo -e "${GREEN}✨ All services deployed and running! ✨${NC}"
