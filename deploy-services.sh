#!/bin/bash
# Deploy services via SSH to all EC2 instances

set -e

# Configuration
SSH_KEY="${SSH_KEY:-vockey.pem}"
SSH_USER="ubuntu"

# Instance mapping
declare -A INSTANCES=(
    ["frontend"]="44.220.126.89"
    ["api-gateway"]="52.7.168.4"
    ["core"]="13.222.63.75"
    ["db"]="100.31.104.252"
    ["messaging"]="98.93.37.132"
    ["notificaciones"]="3.236.139.55"
    ["reportes"]="52.200.32.56"
    ["monitoring"]="98.88.93.98"
)

# Docker compose files mapping
declare -A COMPOSE_FILES=(
    ["frontend"]="docker-compose.frontend.yml"
    ["api-gateway"]="docker-compose.api-gateway.yml"
    ["core"]="docker-compose.core.yml"
    ["db"]="docker-compose.infrastructure.yml"
    ["messaging"]="docker-compose.messaging.yml"
    ["notificaciones"]="docker-compose.notificaciones.yml"
    ["reportes"]="docker-compose.notificaciones.yml"
    ["monitoring"]="docker-compose.prod.yml"
)

# Function to deploy to a single instance
deploy_instance() {
    local service=$1
    local ip=${INSTANCES[$service]}
    local compose_file=${COMPOSE_FILES[$service]}
    
    if [ -z "$ip" ]; then
        echo "❌ Unknown service: $service"
        return 1
    fi
    
    echo ""
    echo "════════════════════════════════════════════════"
    echo "🚀 Deploying $service to $ip"
    echo "════════════════════════════════════════════════"
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SSH_USER@$ip" << EOF
set -e
echo "📦 Preparing deployment..."
cd /home/ubuntu

# Clone or pull repo
if [ -d "Proyecto-Acompa-amiento-" ]; then
    echo "📂 Updating repository..."
    cd Proyecto-Acompa-amiento-
    git pull origin main
else
    echo "📂 Cloning repository..."
    git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
    cd Proyecto-Acompa-amiento-
fi

# Start services
echo "🐳 Starting Docker services with $compose_file..."
docker-compose -f "$compose_file" up -d

# Show running containers
echo "✅ Containers running:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "✅ $service deployment complete!"
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully deployed $service"
    else
        echo "❌ Failed to deploy $service"
        return 1
    fi
}

# Main execution
if [ $# -eq 0 ]; then
    echo "Usage: $0 <service1> [service2] ... or 'all'"
    echo ""
    echo "Available services:"
    for service in "${!INSTANCES[@]}"; do
        echo "  - $service (${INSTANCES[$service]})"
    done
    exit 1
fi

if [ "$1" = "all" ]; then
    for service in "${!INSTANCES[@]}"; do
        deploy_instance "$service"
    done
else
    for service in "$@"; do
        deploy_instance "$service"
    done
fi

echo ""
echo "════════════════════════════════════════════════"
echo "✅ ALL DEPLOYMENTS COMPLETE"
echo "════════════════════════════════════════════════"
echo ""
echo "Services available at:"
echo "🌐 Frontend:        http://44.220.126.89"
echo "🔌 API Gateway:     http://52.7.168.4:8080"
echo "🔐 Core Services:   http://13.222.63.75:3000"
echo "💾 Database:        postgresql://100.31.104.252:5432"
echo "📢 Messaging:       98.93.37.132:5672"
echo "📧 Notificaciones:  http://3.236.139.55:5006"
echo "📊 Reportes:        http://52.200.32.56:5003"
echo "📈 Monitoring:      http://98.88.93.98:9090"
