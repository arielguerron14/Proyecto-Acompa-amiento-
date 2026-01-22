#!/bin/bash
###############################################################################
# EC2-DB Deployment Script - Direct SSH Execution
# Handles docker-compose v1 vs docker compose v2 compatibility
# Usage: ./deploy-ec2-db-fixed.sh <instance_ip>
###############################################################################

set -e

INSTANCE_IP=${1:-"3.94.200.24"}
INSTANCE_USER="ubuntu"
REPO_URL="https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git"

echo "🚀 Deploying EC2-DB services to $INSTANCE_IP..."

ssh -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP << 'DEPLOY_SCRIPT'
set -e

echo "=== EC2-DB Deployment Started ==="
echo "Hostname: $(hostname)"
echo "IP Address: $(hostname -I)"

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -qq || true

# Install Docker if needed
echo "🐳 Installing Docker components..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y docker.io git curl jq
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ubuntu
else
    echo "✅ Docker already installed"
fi

# Install docker-compose if needed
echo "🐳 Setting up Docker Compose..."
if ! docker compose version &> /dev/null 2>&1 && ! docker-compose --version &> /dev/null 2>&1; then
    echo "Installing docker-compose-plugin..."
    sudo apt-get install -y docker-compose-plugin 2>/dev/null || {
        echo "Downloading docker-compose standalone..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
          -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    }
fi

# Detect which compose command to use
if docker compose version &> /dev/null 2>&1; then
    DC="docker compose"
else
    DC="docker-compose"
fi
echo "✅ Using: $DC"

# Clone or update repository
echo "📂 Preparing repository..."
REPO_DIR="$HOME/projeto-acompanamiento"
if [ ! -d "$REPO_DIR" ]; then
    cd $HOME
    git clone $REPO_URL projeto-acompanamiento
else
    cd "$REPO_DIR"
    git pull origin main 2>/dev/null || true
fi

cd "$REPO_DIR"

# Verify docker-compose.yml exists
if [ ! -f docker-compose.yml ]; then
    echo "❌ docker-compose.yml not found at $(pwd)"
    ls -la
    exit 1
fi

echo "✅ Repository ready at $REPO_DIR"

# Create environment configuration
echo "⚙️ Configuring environment..."
cat > .env << 'ENVEOF'
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=example
POSTGRES_USER=postgres
POSTGRES_PASSWORD=example
POSTGRES_DB=acompanamiento
REDIS_PASSWORD=
COMPOSE_PROJECT_NAME=db-services
ENVEOF

# Stop existing services
echo "🛑 Stopping existing services..."
$DC down -v 2>&1 | tail -3 || echo "ℹ️  No existing services to stop"
sleep 3

# Build database services
echo "🔨 Building database services..."
for service in mongo postgres redis; do
    echo "  → Building $service..."
    $DC build $service 2>&1 | grep -E "Step|Successfully|ERROR" | tail -3 || echo "  ✓ $service ready"
done

# Start database services
echo "🚀 Starting database services..."
$DC up -d mongo postgres redis

echo "⏳ Waiting 30 seconds for services to initialize..."
sleep 30

# Check service status
echo "📊 Service Status:"
$DC ps

# Quick health checks
echo "🔍 Performing health checks..."

# MongoDB
echo "  → Testing MongoDB..."
for i in {1..5}; do
    if $DC exec -T mongo mongosh --eval "db.adminCommand('ping')" 2>/dev/null | grep -q "ok"; then
        echo "  ✅ MongoDB: OK"
        break
    fi
    echo "  ⏳ MongoDB initializing... ($i/5)"
    sleep 2
done

# PostgreSQL  
echo "  → Testing PostgreSQL..."
for i in {1..5}; do
    if $DC exec -T postgres pg_isready -U postgres 2>/dev/null | grep -q "accepting"; then
        echo "  ✅ PostgreSQL: OK"
        break
    fi
    echo "  ⏳ PostgreSQL initializing... ($i/5)"
    sleep 2
done

# Redis
echo "  → Testing Redis..."
for i in {1..5}; do
    if $DC exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo "  ✅ Redis: OK"
        break
    fi
    echo "  ⏳ Redis initializing... ($i/5)"
    sleep 2
done

echo ""
echo "=== 🎉 EC2-DB Deployment Completed Successfully ==="
echo ""
echo "Services running:"
$DC ps --format "table {{.Names}}\t{{.Status}}"
echo ""

DEPLOY_SCRIPT

echo "✅ Deployment complete!"
