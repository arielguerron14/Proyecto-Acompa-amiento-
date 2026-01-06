# Deploy EC2-CORE using GitHub Secrets
# This script retrieves the SSH key from GitHub and executes deployment

$repo = "arielguerron14/Proyecto-Acompa-amiento-"
$secretName = "AWS_EC2_DB_SSH_PRIVATE_KEY"
$ec2IP = "13.216.12.61"
$sshUser = "ubuntu"

Write-Host "🚀 EC2-CORE Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Get the SSH key from GitHub Secrets API
Write-Host "📥 Retrieving SSH key from GitHub Secrets..." -ForegroundColor Yellow
$secretResponse = gh api repos/$repo/actions/secrets/$secretName
$secretValue = $secretResponse | ConvertFrom-Json | Select-Object -ExpandProperty value

if (-not $secretValue) {
    Write-Host "❌ Could not retrieve SSH key from GitHub Secrets" -ForegroundColor Red
    exit 1
}

# Save the key to a temporary file
$keyPath = Join-Path $env:TEMP "ec2-key-$([guid]::NewGuid()).pem"
$secretValue | Out-File -FilePath $keyPath -Encoding ASCII -NoNewline

Write-Host "✅ SSH key retrieved and saved temporarily" -ForegroundColor Green
Write-Host ""

# Set proper permissions (Windows)
icacls $keyPath /inheritance:r /grant:r "$env:USERNAME`:F" | Out-Null

Write-Host "🔗 Connecting to EC2-CORE at $ec2IP..." -ForegroundColor Yellow
Write-Host ""

# Execute deployment
$deployScript = @"
set -e

mkdir -p /opt/microservices
cd /opt/microservices

echo "🧹 Cleaning old deployments..."
docker rm -f micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rmi micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

echo "📥 Cloning repository..."
if [ -d "proyecto" ]; then
  cd proyecto
  git pull origin main
  cd ..
else
  git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git proyecto
fi

echo "🏗️ Building Docker images..."
cd proyecto
docker build -f micro-auth/Dockerfile -t micro-auth:latest . --quiet
docker build -f micro-estudiantes/Dockerfile -t micro-estudiantes:latest . --quiet
docker build -f micro-maestros/Dockerfile -t micro-maestros:latest . --quiet

cd /opt/microservices

echo "📝 Creating docker-compose.yml..."
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

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting 45 seconds for services to initialize..."
sleep 45

echo ""
echo "📊 Service Status:"
docker ps -a

echo ""
echo "✅ EC2-CORE DEPLOYMENT COMPLETE!"
echo ""
echo "🔗 Service URLs (VPC):"
echo "  • Auth: http://172.31.78.183:3000"
echo "  • Estudiantes: http://172.31.78.183:3001"
echo "  • Maestros: http://172.31.78.183:3002"
"@

# Run deployment via SSH
try {
    $output = ssh -i $keyPath -o StrictHostKeyChecking=no "$sshUser@$ec2IP" $deployScript 2>&1
    Write-Host $output
    Write-Host ""
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temp key file
    if (Test-Path $keyPath) {
        Remove-Item $keyPath -Force
        Write-Host "🧹 Temporary key file cleaned up" -ForegroundColor Gray
    }
}
