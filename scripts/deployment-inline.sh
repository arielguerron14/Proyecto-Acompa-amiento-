#!/bin/bash
# Direct deployment - copies the deployment logic inline
# This runs the same deployment commands but formatted for direct execution

cat << 'DEPLOYMENT_CODE'
#!/bin/bash
set -e

echo "=== EC2-DB Deployment Started ==="
echo "Hostname: $(hostname)"
echo "IP Address: $(hostname -I)"

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -qq || true

# Install Docker if needed
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y docker.io git curl jq
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ubuntu
else
    echo "✅ Docker already installed"
fi

# Setup docker-compose - handle both v1 and v2
echo "🐳 Setting up Docker Compose..."

# Try docker compose v2 first
if docker compose version &> /dev/null 2>&1; then
    DC="docker compose"
elif command -v docker-compose &> /dev/null; then
    DC="docker-compose"
else
    # Install docker-compose v2 via plugin
    echo "Installing docker-compose-plugin..."
    sudo apt-get install -y docker-compose-plugin || {
        # Fallback: install standalone
        echo "Installing standalone docker-compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        DC="docker-compose"
    }
fi

if [ -z "$DC" ]; then
    DC="docker compose"
fi

echo "✅ Using Docker Compose: $DC"

# Clone repository
echo "📂 Cloning repository..."
cd $HOME
if [ ! -d projeto-acompanamiento ]; then
    git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git projeto-acompanimiento
fi
cd projeto-acompanimiento

# Verify docker-compose.yml
if [ ! -f docker-compose.yml ]; then
    echo "❌ docker-compose.yml not found!"
    pwd
    ls -la
    exit 1
fi

# Create .env
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

# Pull latest images
echo "📥 Pulling latest images..."
$DC pull mongo postgres redis 2>&1 | grep -E "Pulling|Digest" || true

# Stop existing
echo "🛑 Stopping existing services..."
$DC down -v 2>&1 | tail -2 || echo "ℹ️  No existing services"

# Start services
echo "🚀 Starting database services..."
$DC up -d mongo postgres redis

echo "⏳ Waiting 30 seconds for initialization..."
sleep 30

# Show status
echo "📊 Service Status:"
$DC ps

# Health checks
echo "🔍 Health Checks:"

# MongoDB
echo "  → MongoDB:"
for i in {1..5}; do
    if $DC exec -T mongo mongosh --eval "db.adminCommand('ping')" 2>/dev/null | grep -q "ok"; then
        echo "    ✅ OK"
        break
    fi
    echo "    ⏳ Initializing ($i/5)..."
    sleep 2
done

# PostgreSQL
echo "  → PostgreSQL:"
for i in {1..5}; do
    if $DC exec -T postgres pg_isready -U postgres 2>/dev/null | grep -q "accepting"; then
        echo "    ✅ OK"
        break
    fi
    echo "    ⏳ Initializing ($i/5)..."
    sleep 2
done

# Redis
echo "  → Redis:"
for i in {1..5}; do
    if $DC exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo "    ✅ OK"
        break
    fi
    echo "    ⏳ Initializing ($i/5)..."
    sleep 2
done

echo ""
echo "=== ✅ EC2-DB Deployment Complete ==="
DEPLOYMENT_CODE
