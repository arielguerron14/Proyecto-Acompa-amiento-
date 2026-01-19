#!/bin/bash
# Quick deployment script - run this locally or in GitHub Actions
# Deploys all 10 EC2 services and shows which ones succeeded

set -e

echo "🚀 Quick Deployment to All EC2 Services"
echo "========================================"

# Load instance IPs
if [ ! -f "config/instance_ips.json" ]; then
    echo "❌ config/instance_ips.json not found!"
    exit 1
fi

# Get IPs
CORE_IP=$(jq -r '.["EC2-CORE"]["PublicIpAddress"]' config/instance_ips.json)
API_GW_IP=$(jq -r '.["EC2-API-Gateway"]["PublicIpAddress"]' config/instance_ips.json)
DB_IP=$(jq -r '.["EC2-DB"]["PublicIpAddress"]' config/instance_ips.json)
MSG_IP=$(jq -r '.["EC2-Messaging"]["PublicIpAddress"]' config/instance_ips.json)
REP_IP=$(jq -r '.["EC2-Reportes"]["PublicIpAddress"]' config/instance_ips.json)
NOT_IP=$(jq -r '.["EC2-Notificaciones"]["PublicIpAddress"]' config/instance_ips.json)
ANA_IP=$(jq -r '.["EC2-Analytics"]["PublicIpAddress"]' config/instance_ips.json)
MON_IP=$(jq -r '.["EC2-Monitoring"]["PublicIpAddress"]' config/instance_ips.json)
FE_IP=$(jq -r '.["EC2-Frontend"]["PublicIpAddress"]' config/instance_ips.json)
BASTION_IP=$(jq -r '.["EC-Bastion"]["PublicIpAddress"]' config/instance_ips.json)

echo "✅ Instance IPs loaded:"
echo "  EC2-CORE: $CORE_IP"
echo "  EC2-API-Gateway: $API_GW_IP"
echo "  EC2-DB: $DB_IP"
echo "  EC2-Reportes: $REP_IP"
echo ""

# Setup SSH key
mkdir -p ~/.ssh
if [ ! -z "$SSH_KEY_B64" ]; then
    echo "$SSH_KEY_B64" | base64 -d > ~/.ssh/id_rsa
else
    # Assuming SSH key exists
    chmod 600 ~/.ssh/id_rsa 2>/dev/null || true
fi

# Quiet SSH settings
SSH_OPTS="-o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# Function to deploy
deploy_service() {
    local name=$1
    local ip=$2
    local compose_file=$3
    
    echo -n "🚀 Deploying $name ($ip)... "
    
    if timeout 20 ssh $SSH_OPTS -i ~/.ssh/id_rsa ubuntu@$ip << DEPLOY &>/dev/null; then
        cd /tmp || cd ~
        docker-compose -f $compose_file down 2>/dev/null || true
        docker-compose -f $compose_file up -d --no-build 2>&1 | grep -E "Creating|running|ERROR" | head -3 || echo "done"
        echo "✅"
        return 0
    else
        echo "⏳ (timeout or SSH error)"
        return 1
    fi
    DEPLOY
}

# Deploy all services  
SUCCESSES=0
FAILURES=0

deploy_service "EC2-CORE" "$CORE_IP" "docker-compose.ec2-core.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC2-API-Gateway" "$API_GW_IP" "docker-compose.api-gateway.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC2-DB" "$DB_IP" "docker-compose.ec2-db.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC2-Messaging" "$MSG_IP" "docker-compose.messaging.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC2-Reportes" "$REP_IP" "docker-compose.ec2-reportes.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC2-Notificaciones" "$NOT_IP" "docker-compose.ec2-notificaciones.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC2-Analytics" "$ANA_IP" "docker-compose.ec2-analytics.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC2-Monitoring" "$MON_IP" "docker-compose.ec2-monitoring.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC2-Frontend" "$FE_IP" "docker-compose.ec2-frontend.yml" && ((SUCCESSES++)) || ((FAILURES++))
deploy_service "EC-Bastion" "$BASTION_IP" "docker-compose.bastion.yml" && ((SUCCESSES++)) || ((FAILURES++))

echo ""
echo "========================================="
echo "📊 Deployment Summary:"
echo "✅ Successful: $SUCCESSES"
echo "⏳ Failed/Timeout: $FAILURES"
echo "========================================="
