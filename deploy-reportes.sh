#!/bin/bash

# Function to deploy to instance
deploy_to_instance() {
    local name=$1
    local ip=$2
    
    echo ""
    echo "============================================================"
    echo "🚀 Deploying to $name ($ip)"
    echo "============================================================"
    
    # Set correct SSH key permissions (required by SSH)
    chmod 600 "c:/Users/ariel/.ssh/vockey.pem"
    
    # Deploy via SSH
    ssh -i "c:/Users/ariel/.ssh/vockey.pem" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o ConnectTimeout=10 \
        ec2-user@$ip << 'DOCKER_COMMANDS'
docker pull micro-reportes-estudiantes:latest
docker pull micro-reportes-maestros:latest
docker stop micro-reportes-estudiantes || true
docker stop micro-reportes-maestros || true
docker rm micro-reportes-estudiantes || true
docker rm micro-reportes-maestros || true
docker run -d --name micro-reportes-estudiantes -p 4001:3000 micro-reportes-estudiantes:latest
docker run -d --name micro-reportes-maestros -p 4002:3000 micro-reportes-maestros:latest
DOCKER_COMMANDS
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment to $name successful!"
    else
        echo "⚠️ Error deploying to $name"
    fi
}

# Main
echo "🐳 Docker Deployment via SSH"
echo "============================================================"

# Deploy only to EC2-Reportes first
deploy_to_instance "EC2-Reportes" "52.200.32.56"

echo ""
echo "============================================================"
echo "✅ Deployment process complete!"
echo "============================================================"
