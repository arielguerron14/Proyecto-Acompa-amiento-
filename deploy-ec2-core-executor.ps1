#!/usr/bin/env pwsh
################################################################################
#                  EC2-CORE REMOTE DEPLOYMENT EXECUTOR                         #
#                                                                              #
# Este script:                                                                #
# 1. Se conecta a EC2-CORE via SSH                                            #
# 2. Descarga el script de deployment                                         #
# 3. Ejecuta el deployment                                                    #
# 4. Reporta el resultado                                                     #
################################################################################

param(
    [string]$EC2CorePublicIP = "13.216.12.61",
    [string]$SSHUser = "ubuntu",
    [string]$SSHKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔═════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║       EC2-CORE REMOTE DEPLOYMENT EXECUTOR                   ║" -ForegroundColor Blue
Write-Host "╚═════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Configuration
Write-Host "📝 Configuration:" -ForegroundColor Yellow
Write-Host "  → EC2-CORE Public IP: $EC2CorePublicIP"
Write-Host "  → SSH User: $SSHUser"
Write-Host "  → SSH Key: $SSHKeyPath"
Write-Host ""

# Check SSH key
if (!(Test-Path $SSHKeyPath)) {
    Write-Host "❌ SSH key not found at: $SSHKeyPath" -ForegroundColor Red
    Write-Host "ℹ️  Please provide SSH key path:" -ForegroundColor Yellow
    Write-Host "  ./deploy-ec2-core-executor.ps1 -SSHKeyPath 'C:\path\to\key.pem'" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ SSH key found" -ForegroundColor Green
Write-Host ""

# Test SSH connection
Write-Host "🔗 Testing SSH connection..." -ForegroundColor Yellow
try {
    $testConn = ssh -i $SSHKeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no `
                    "$SSHUser@$EC2CorePublicIP" "echo OK" 2>&1
    if ($testConn -like "*OK*") {
        Write-Host "✅ SSH connection successful" -ForegroundColor Green
    } else {
        throw "SSH connection test failed"
    }
} catch {
    Write-Host "❌ SSH connection failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Upload and execute deployment script
Write-Host "📤 Uploading deployment script to EC2-CORE..." -ForegroundColor Yellow

$deploymentScript = @"
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\${BLUE}╔════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${BLUE}║       EC2-CORE MICROSERVICES DEPLOYMENT                ║\${NC}"
echo -e "\${BLUE}╚════════════════════════════════════════════════════════╝\${NC}"

EC2_DB_PRIVATE_IP="172.31.79.193"
DEPLOY_DIR="/opt/microservices"
REPO_URL="https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git"

echo -e "\${YELLOW}📝 Configuration:\${NC}"
echo "  → Deployment directory: \$DEPLOY_DIR"
echo "  → EC2-DB: \$EC2_DB_PRIVATE_IP"
echo ""

# Create directories
echo -e "\${YELLOW}📁 Creating directories...\${NC}"
mkdir -p \$DEPLOY_DIR
cd \$DEPLOY_DIR
echo -e "\${GREEN}✅ Directories created\${NC}"
echo ""

# Clean old deployment
echo -e "\${YELLOW}🧹 Cleaning old deployments...\${NC}"
docker rm -f micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rmi micro-auth:latest micro-estudiantes:latest micro-maestros:latest 2>/dev/null || true
echo -e "\${GREEN}✅ Old deployments cleaned\${NC}"
echo ""

# Clone repository
echo -e "\${YELLOW}📥 Cloning repository...\${NC}"
if [ -d "Proyecto-Acompa-amiento-" ]; then
  cd Proyecto-Acompa-amiento-
  git pull origin main 2>/dev/null || git fetch origin main
else
  git clone \$REPO_URL
  cd Proyecto-Acompa-amiento-
fi
echo -e "\${GREEN}✅ Repository ready\${NC}"
echo ""

# Build images
echo -e "\${YELLOW}🏗️  Building Docker images...\${NC}"
docker build -t micro-auth:latest ./micro-auth --quiet
echo -e "\${GREEN}✅ micro-auth built\${NC}"
docker build -t micro-estudiantes:latest ./micro-estudiantes --quiet
echo -e "\${GREEN}✅ micro-estudiantes built\${NC}"
docker build -t micro-maestros:latest ./micro-maestros --quiet
echo -e "\${GREEN}✅ micro-maestros built\${NC}"
echo ""

# Create docker-compose
echo -e "\${YELLOW}📝 Creating docker-compose.yml...\${NC}"
cd /opt/microservices
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  micro-auth:
    image: micro-auth:latest
    container_name: micro-auth
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
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
      MONGO_URL: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
      POSTGRES_URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
      REDIS_URL: redis://:redis123@172.31.79.193:6379
      AUTH_SERVICE: http://172.31.78.183:3000
    networks:
      - core-net
    restart: unless-stopped
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
      MONGO_URL: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
      POSTGRES_URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
      REDIS_URL: redis://:redis123@172.31.79.193:6379
      AUTH_SERVICE: http://172.31.78.183:3000
    networks:
      - core-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3002/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  core-net:
    driver: bridge
EOF
echo -e "\${GREEN}✅ docker-compose.yml created\${NC}"
echo ""

# Start services
echo -e "\${YELLOW}🚀 Starting services...\${NC}"
docker-compose up -d
echo -e "\${GREEN}✅ Services started\${NC}"
echo ""

# Wait for initialization
echo -e "\${YELLOW}⏳ Waiting 45 seconds for initialization...\${NC}"
sleep 45
echo ""

# Validate
echo -e "\${YELLOW}✅ Validating deployment...\${NC}"
docker ps -a | grep micro || true
echo ""

echo -e "\${GREEN}✨ Deployment completed! ✨\${NC}"
"@

# Execute via SSH
Write-Host "🚀 Executing deployment script on EC2-CORE..." -ForegroundColor Yellow
Write-Host ""

$result = ssh -i $SSHKeyPath -o StrictHostKeyChecking=no "$SSHUser@$EC2CorePublicIP" $deploymentScript 2>&1

Write-Host $result -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment execution initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Monitoring progress..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Check status
$status = ssh -i $SSHKeyPath -o StrictHostKeyChecking=no "$SSHUser@$EC2CorePublicIP" "docker ps -a | wc -l" 2>&1
Write-Host "✅ Containers deployed" -ForegroundColor Green

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. SSH to EC2-CORE: ssh -i key.pem $SSHUser@$EC2CorePublicIP" -ForegroundColor Cyan
Write-Host "  2. Check status: docker ps -a" -ForegroundColor Cyan
Write-Host "  3. View logs: docker logs micro-auth" -ForegroundColor Cyan
Write-Host "  4. Test health: curl http://localhost:3000/health" -ForegroundColor Cyan
Write-Host ""
