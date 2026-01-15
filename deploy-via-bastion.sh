#!/bin/bash
# Quick deployment of all services using the Bastion host as a jump point

BASTION_IP="34.235.224.202"
SSH_KEY="${1:-labsuser.pem}"

echo "🔌 Connecting through Bastion: $BASTION_IP"
echo ""

# Array of instances
declare -a INSTANCES=(
    "ubuntu@44.220.126.89:docker-compose.frontend.yml"
    "ubuntu@52.7.168.4:docker-compose.api-gateway.yml"
    "ubuntu@13.222.63.75:docker-compose.core.yml"
    "ubuntu@100.31.104.252:docker-compose.infrastructure.yml"
    "ubuntu@98.93.37.132:docker-compose.messaging.yml"
    "ubuntu@3.236.139.55:docker-compose.notificaciones.yml"
    "ubuntu@52.200.32.56:docker-compose.notificaciones.yml"
    "ubuntu@98.88.93.98:docker-compose.prod.yml"
)

for instance in "${INSTANCES[@]}"; do
    IFS=':' read -r host compose_file <<< "$instance"
    service_name=$(echo $host | cut -d'@' -f2)
    
    echo "🚀 Deploying to $service_name..."
    ssh -i "$SSH_KEY" -J ubuntu@$BASTION_IP -o StrictHostKeyChecking=no "$host" << EOF
cd /home/ubuntu/Proyecto-Acompa-amiento-
git pull origin main
docker-compose -f "$compose_file" up -d
docker ps
EOF
    echo "✅ Done with $service_name"
    echo ""
done

echo "════════════════════════════════════════════════"
echo "✅ ALL SERVICES DEPLOYED"
echo "════════════════════════════════════════════════"
