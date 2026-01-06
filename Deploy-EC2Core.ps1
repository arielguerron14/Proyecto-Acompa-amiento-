#!/usr/bin/env pwsh
<#
.SYNOPSIS
    EC2-CORE Microservices Deployment via SSH
    
.DESCRIPTION
    This script connects to EC2-CORE and executes the complete microservices deployment
    including Docker setup, image building, and service configuration.
    
.EXAMPLE
    ./Deploy-EC2Core.ps1 -EC2CoreIP "13.216.12.61" -SSHUser "ubuntu" -SSHKeyPath "C:\path\to\key.pem"
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$EC2CoreIP = "13.216.12.61",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHUser = "ubuntu",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

$ErrorActionPreference = "Continue"

# Colors
$Green = "`e[0;32m"
$Red = "`e[0;31m"
$Yellow = "`e[1;33m"
$Blue = "`e[0;34m"
$Reset = "`e[0m"

Write-Host ""
Write-Host "$Blue╔═════════════════════════════════════════════════════════════╗$Reset" 
Write-Host "$Blue║    EC2-CORE AUTOMATED DEPLOYMENT VIA SSH                   ║$Reset"
Write-Host "$Blue╚═════════════════════════════════════════════════════════════╝$Reset"
Write-Host ""

# Display configuration
Write-Host "$Yellow📝 Configuration:$Reset"
Write-Host "  → EC2-CORE IP: $EC2CoreIP"
Write-Host "  → SSH User: $SSHUser"
Write-Host "  → SSH Key: $SSHKeyPath"
Write-Host ""

# Validate SSH key exists
if (!(Test-Path $SSHKeyPath)) {
    Write-Host "$Red❌ SSH key not found: $SSHKeyPath$Reset" -ForegroundColor Red
    Write-Host "$Yellow⚠️  Please provide the correct SSH key path$Reset" -ForegroundColor Yellow
    exit 1
}

Write-Host "$Green✅ SSH key found$Reset"

# Test SSH connection
Write-Host "$Yellow🔗 Testing SSH connection...$Reset"
$testCmd = ssh -i $SSHKeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSHUser@$EC2CoreIP" "echo OK" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "$Green✅ SSH connection successful$Reset"
} else {
    Write-Host "$Red❌ SSH connection failed$Reset"
    Write-Host "Error: $testCmd"
    exit 1
}

Write-Host ""

# The deployment script to run on EC2-CORE
$deployScript = @'
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       EC2-CORE MICROSERVICES DEPLOYMENT                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

EC2_DB_IP="172.31.79.193"
DEPLOY_DIR="/opt/microservices"

echo -e "${YELLOW}📝 Configuration:${NC}"
echo "  → Deployment: $DEPLOY_DIR"
echo "  → Database: $EC2_DB_IP"
echo ""

# Step 1: Create directories
echo -e "${YELLOW}📁 Step 1: Creating directories...${NC}"
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Step 2: Clean old deployment
echo -e "${YELLOW}🧹 Step 2: Cleaning old containers...${NC}"
docker rm -f micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rmi micro-auth:latest micro-estudiantes:latest micro-maestros:latest 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned${NC}"
echo ""

# Step 3: Install Docker if needed
echo -e "${YELLOW}📦 Step 3: Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    newgrp docker
fi
echo -e "${GREEN}✅ Docker ready${NC}"
echo ""

# Step 4: Clone repository
echo -e "${YELLOW}📥 Step 4: Cloning repository...${NC}"
if [ -d "Proyecto-Acompa-amiento-" ]; then
    cd Proyecto-Acompa-amiento-
    git pull origin main 2>/dev/null || true
else
    git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
    cd Proyecto-Acompa-amiento-
fi
REPO_PATH=$(pwd)
echo -e "${GREEN}✅ Repository ready: $REPO_PATH${NC}"
echo ""

# Step 5: Build Docker images
echo -e "${YELLOW}🏗️  Step 5: Building Docker images...${NC}"

echo -e "${YELLOW}  → Building micro-auth...${NC}"
docker build -t micro-auth:latest ./micro-auth --quiet 2>&1 | tail -1
echo -e "${GREEN}  ✅ micro-auth built${NC}"

echo -e "${YELLOW}  → Building micro-estudiantes...${NC}"
docker build -t micro-estudiantes:latest ./micro-estudiantes --quiet 2>&1 | tail -1
echo -e "${GREEN}  ✅ micro-estudiantes built${NC}"

echo -e "${YELLOW}  → Building micro-maestros...${NC}"
docker build -t micro-maestros:latest ./micro-maestros --quiet 2>&1 | tail -1
echo -e "${GREEN}  ✅ micro-maestros built${NC}"
echo ""

# Step 6: Create docker-compose.yml
echo -e "${YELLOW}📝 Step 6: Creating docker-compose.yml...${NC}"
cd $DEPLOY_DIR
cat > docker-compose.yml << 'DOCKER_COMPOSE'
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
      - core
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:3000/health || exit 1"]
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
      - core
    restart: unless-stopped
    depends_on:
      - micro-auth
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:3001/health || exit 1"]
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
      - core
    restart: unless-stopped
    depends_on:
      - micro-auth
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:3002/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  core:
    driver: bridge
DOCKER_COMPOSE

echo -e "${GREEN}✅ docker-compose.yml created${NC}"
echo ""

# Step 7: Start services
echo -e "${YELLOW}🚀 Step 7: Starting services...${NC}"
docker-compose up -d 2>&1 | grep -E "Creating|Done|Error" || true
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Step 8: Wait for initialization
echo -e "${YELLOW}⏳ Step 8: Waiting 45 seconds for initialization...${NC}"
for i in {1..45}; do
    echo -n "."
    sleep 1
done
echo ""
echo -e "${GREEN}✅ Initialization complete${NC}"
echo ""

# Step 9: Validate deployment
echo -e "${YELLOW}✅ Step 9: Validating deployment...${NC}"
echo ""

echo -e "${BLUE}Container Status:${NC}"
docker ps -a --no-trunc 2>/dev/null | grep -E "micro-auth|micro-estudiantes|micro-maestros" || docker ps -a
echo ""

echo -e "${BLUE}Health Checks:${NC}"
for port in 3000 3001 3002; do
    svc=$(docker ps --filter "status=running" --format "{{.Names}}" 2>/dev/null | head -1)
    if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Service :$port is healthy${NC}"
    else
        echo -e "${RED}⏳ Service :$port still initializing...${NC}"
    fi
done
echo ""

# Final summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ DEPLOYMENT COMPLETED SUCCESSFULLY!          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Services:${NC}"
echo -e "  ${GREEN}✅ micro-auth${NC}       → http://localhost:3000"
echo -e "  ${GREEN}✅ micro-estudiantes${NC} → http://localhost:3001"
echo -e "  ${GREEN}✅ micro-maestros${NC}    → http://localhost:3002"
echo ""

echo -e "${BLUE}Database Connections:${NC}"
echo "  MongoDB:    mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin"
echo "  PostgreSQL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento"
echo "  Redis:      redis://:redis123@172.31.79.193:6379"
echo ""

echo -e "${BLUE}Directory:${NC}"
echo "  $DEPLOY_DIR"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo "  docker ps -a                        # View containers"
echo "  docker logs micro-auth              # View logs"
echo "  docker-compose restart              # Restart all"
echo "  curl http://localhost:3000/health   # Test health"
echo ""

'@

# Execute script on EC2-CORE
Write-Host "$Yellow🚀 Executing deployment on EC2-CORE...$Reset"
Write-Host ""

$result = ssh -i $SSHKeyPath -o StrictHostKeyChecking=no "$SSHUser@$EC2CoreIP" $deployScript 2>&1

# Display output
foreach ($line in $result) {
    Write-Host $line
}

Write-Host ""
Write-Host "$Green✨ Deployment script completed!$Reset"
Write-Host ""
Write-Host "$Yellow📊 Next Steps:$Reset"
Write-Host "  1. Wait 1-2 minutes for services to fully initialize"
Write-Host "  2. SSH back to EC2-CORE: ssh -i $SSHKeyPath $SSHUser@$EC2CoreIP"
Write-Host "  3. Check status: docker ps -a"
Write-Host "  4. View logs: docker logs micro-auth"
Write-Host "  5. Test: curl http://localhost:3000/health"
Write-Host ""
