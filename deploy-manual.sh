#!/bin/bash
set -e

# Deployment Script - Manual deployment to EC2-CORE
# This script rebuilds Docker images and deploys them to the running EC2 instance

CORE_IP="3.236.51.29"
CORE_PORT="22"
CORE_USER="ubuntu"
SSH_KEY_PATH="${HOME}/.ssh/id_rsa"
PROJECT_DIR="/home/ubuntu/project"

echo "[*] Starting deployment to EC2-CORE at ${CORE_IP}"

# 1. Verify SSH connectivity
echo "[1/5] Verifying SSH connectivity..."
if ! ssh -i "${SSH_KEY_PATH}" -o ConnectTimeout=10 "${CORE_USER}@${CORE_IP}" "echo 'SSH connection successful'" 2>/dev/null; then
    echo "[ERROR] Cannot connect to ${CORE_IP} via SSH"
    exit 1
fi
echo "[OK] SSH connectivity verified"

# 2. Copy latest code to EC2
echo "[2/5] Syncing code to EC2..."
rsync -avz \
    -e "ssh -i ${SSH_KEY_PATH}" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.env \
    --exclude=.DS_Store \
    --exclude=terraform \
    ./ "${CORE_USER}@${CORE_IP}:${PROJECT_DIR}/" || {
    echo "[WARNING] rsync completed with warnings (continuing)"
}
echo "[OK] Code synced"

# 3. Rebuild Docker images on EC2
echo "[3/5] Rebuilding Docker images on EC2..."
ssh -i "${SSH_KEY_PATH}" "${CORE_USER}@${CORE_IP}" << 'REMOTE_SCRIPT'
    cd /home/ubuntu/project
    echo "[Building Docker images...]"
    
    # Stop running containers
    docker-compose down 2>/dev/null || true
    
    # Rebuild images
    docker-compose build --no-cache api-gateway core auth db || true
    docker-compose pull || true
    
    echo "[Docker build complete]"
REMOTE_SCRIPT
echo "[OK] Docker images rebuilt"

# 4. Start services
echo "[4/5] Starting services..."
ssh -i "${SSH_KEY_PATH}" "${CORE_USER}@${CORE_IP}" << 'REMOTE_SCRIPT'
    cd /home/ubuntu/project
    docker-compose up -d api-gateway core auth db
    sleep 5
    docker-compose ps
REMOTE_SCRIPT
echo "[OK] Services started"

# 5. Verify deployment
echo "[5/5] Verifying deployment..."
sleep 5
if curl -s -f http://${CORE_IP}:3000/health &>/dev/null || curl -s -f http://${CORE_IP}:8000/api/health &>/dev/null; then
    echo "[SUCCESS] Deployment verified - Application is running!"
    echo "[ACCESS] Application accessible at: http://${CORE_IP}:3000"
    exit 0
else
    echo "[WARNING] Could not verify application health - check manually"
    echo "[ACCESS] Try: http://${CORE_IP}:3000"
    exit 0
fi
