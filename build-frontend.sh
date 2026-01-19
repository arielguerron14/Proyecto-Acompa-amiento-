#!/bin/bash

echo "🚀 Frontend - Build & Deploy Script"
echo "===================================="
echo ""

# Variables
REPO_URL="https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git"
PROJECT_DIR="/tmp/proyecto-frontend-build"
FRONTEND_DIR="$PROJECT_DIR/frontend-web"

echo "📋 Step 1: Cloning repository..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
git clone "$REPO_URL" --depth 1 . 2>&1 | tail -5

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Failed to clone repository"
    exit 1
fi

echo "✅ Repository cloned"
echo ""

echo "📋 Step 2: Checking Dockerfile..."
if [ ! -f "$FRONTEND_DIR/Dockerfile" ]; then
    echo "❌ Dockerfile not found in $FRONTEND_DIR"
    exit 1
fi

echo "✅ Dockerfile found"
echo ""
echo "Dockerfile content:"
cat "$FRONTEND_DIR/Dockerfile"
echo ""
echo "---"
echo ""

echo "📋 Step 3: Building Docker image (this may take 5-10 minutes)..."
cd "$FRONTEND_DIR"
docker build -t frontend-web:latest . 2>&1 | tail -20

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo ""
echo "✅ Image built successfully"
echo ""

echo "📋 Step 4: Verifying image..."
docker images | grep frontend-web

echo ""
echo "📋 Step 5: Deploying container..."
cd /tmp

# Stop any old containers
docker stop frontend 2>/dev/null || true
docker rm frontend 2>/dev/null || true

# Download fresh docker-compose
curl -s https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/docker-compose.ec2-frontend.yml > docker-compose.ec2-frontend.yml

# Deploy
docker-compose -f docker-compose.ec2-frontend.yml up -d --no-build

echo ""
echo "⏳ Waiting for container to start..."
sleep 5

echo ""
echo "📋 Step 6: Verifying deployment..."
docker ps | grep frontend
docker logs frontend 2>&1 | tail -10

echo ""
echo "✅ Frontend deployment complete!"
echo "🌐 Access: http://localhost:3000 (from instance)"
echo "🌐 External: http://52.72.57.10:3000"
