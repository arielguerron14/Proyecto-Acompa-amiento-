#!/bin/bash
# Frontend Fix via Bastion SSH

set -e

# Configuration
BASTION_IP="52.6.170.44"
BASTION_USER="ec2-user"
FRONTEND_IP="172.31.65.89"  # Private IP
FRONTEND_USER="ec2-user"
SSH_KEY="/home/user/.ssh/deployment.pem"  # Adjust path as needed

echo "🔧 Conectando a EC2-Frontend via Bastion..."
echo ""

# SSH via Bastion
ssh -i "$SSH_KEY" \
    -o ProxyCommand="ssh -i $SSH_KEY -W %h:%p $BASTION_USER@$BASTION_IP" \
    "$FRONTEND_USER@$FRONTEND_IP" << 'REMOTE_COMMANDS'

    echo "🚀 Ejecutando en EC2-Frontend..."
    
    # Stop and remove old container
    docker stop frontend 2>/dev/null || true
    docker rm frontend 2>/dev/null || true
    
    # Clean old image
    docker rmi frontend-web:latest 2>/dev/null || true
    
    # Get corrected docker-compose
    cd /tmp
    curl -s https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/docker-compose.ec2-frontend.yml > docker-compose.yml
    
    echo "✅ Configuration:"
    grep -A2 'ports:' docker-compose.yml
    
    # Deploy
    echo ""
    echo "📊 Levantando contenedor..."
    docker-compose up -d --no-build
    
    echo ""
    echo "⏳ Esperando inicialización..."
    sleep 3
    
    echo ""
    echo "🔍 Verificando..."
    docker ps | grep frontend
    
    echo ""
    echo "📋 Logs:"
    docker logs frontend 2>&1 | tail -10
    
    echo ""
    echo "✅ ¡Frontend redeploy completado!"

REMOTE_COMMANDS

echo ""
echo "✅ Process completed"
echo "🌐 Frontend disponible en: http://52.72.57.10:3000"
