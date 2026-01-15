#!/bin/bash
# Script simple para reiniciar servicios en EC2-Core

set -e

CORE_IP="172.31.71.182"
SSH_KEY="ssh-key-ec2.pem"

echo "🔄 Restarting Core Services..."
echo "Target: $CORE_IP"

# Comando simple sin heredoc
ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=15 ubuntu@$CORE_IP "
cd ~/Proyecto-Acompa-amiento-
echo 'Current containers:'
docker ps -a --format 'table {{.Names}}\t{{.Status}}' || true
echo ''
echo 'Stopping...'
sudo docker-compose -f docker-compose.core.yml down || true
sleep 5
echo 'Starting...'
sudo docker-compose -f docker-compose.core.yml up -d || true
sleep 15
echo ''
echo 'Final status:'
docker ps -a --format 'table {{.Names}}\t{{.Status}}'
"

echo ""
echo "✅ Done! Waiting for services to stabilize..."
sleep 10

echo ""
echo "Testing endpoints..."
curl -s http://52.7.168.4:8080/health | head -1
echo ""
echo "If you see service unavailable errors above, check:"
echo "docker logs micro-estudiantes"
echo "docker logs mongo"
