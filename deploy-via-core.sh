#!/bin/bash
# Deploy services through EC2-CORE jump host
# This script connects to EC2-CORE and deploys to other instances via private IPs

set -e

CORE_IP="13.216.12.61"  # EC2-CORE public IP
API_GW_PRIVATE="172.31.76.105"  # EC2-API-Gateway private IP
FRONTEND_PRIVATE="172.31.76.106"  # EC2-Frontend private IP (placeholder)
NOTIF_PRIVATE="172.31.76.107"  # EC2-Notificaciones private IP (placeholder)
SSH_KEY="$HOME/.ssh/key.pem"

echo "🔄 Setting up SSH connection to EC2-CORE..."

# Deploy API Gateway via jump host
echo "🚀 Deploying API Gateway via EC2-CORE..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" ubuntu@$CORE_IP "
  ssh -o StrictHostKeyChecking=no ubuntu@$API_GW_PRIVATE <<'API_DEPLOY'
  set -e
  echo '🔄 Cleaning up old deployments...'
  docker stop api-gateway 2>/dev/null || true
  docker rm api-gateway 2>/dev/null || true
  
  echo '📥 Cloning repository...'
  cd /tmp && rm -rf Proyecto-Acompa-amiento- 2>/dev/null || true
  git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
  cd Proyecto-Acompa-amiento-
  
  echo '🏗️ Building Docker image...'
  docker build -t api-gateway:latest -f api-gateway/Dockerfile .
  
  echo '🚀 Starting API Gateway...'
  docker run -d --name api-gateway --restart unless-stopped -p 8080:8080 \
    -e NODE_ENV=production -e PORT=8080 \
    -e MICRO_AUTH_URL=http://172.31.78.183:3000 \
    -e MICRO_ESTUDIANTES_URL=http://172.31.78.183:3001 \
    -e MICRO_MAESTROS_URL=http://172.31.78.183:3002 \
    api-gateway:latest
  
  sleep 30
  docker ps -a | grep api-gateway
API_DEPLOY
"

echo "✅ API Gateway deployment complete!"
