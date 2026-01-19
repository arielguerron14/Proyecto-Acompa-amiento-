#!/bin/bash

# Test SSH connectivity to all instances

SSH_KEY_PATH="$1"
if [ -z "$SSH_KEY_PATH" ]; then
    echo "Usage: $0 <path-to-ssh-key>"
    exit 1
fi

SSH_OPTS="-o ConnectTimeout=10 -o StrictHostKeyChecking=no -i $SSH_KEY_PATH"

# Array of instances
declare -a INSTANCES=(
    "EC2-CORE:3.236.99.88"
    "EC2-API-Gateway:98.86.94.92"
    "EC2-DB:13.217.220.8"
    "EC2-Messaging:35.172.111.207"
    "EC2-Reportes:23.22.116.142"
    "EC2-Notificaciones:98.92.17.165"
    "EC2-Analytics:3.87.33.92"
    "EC2-Monitoring:54.205.158.101"
    "EC2-Frontend:52.72.57.10"
    "EC-Bastion:52.6.170.44"
)

echo "🔍 Testing SSH connectivity to all instances..."
echo ""

ACCESSIBLE=0
INACCESSIBLE=0

for instance in "${INSTANCES[@]}"; do
    IFS=':' read -r name ip <<< "$instance"
    
    if timeout 10 ssh $SSH_OPTS ubuntu@$ip "echo 'OK'" >/dev/null 2>&1; then
        echo "✅ $name ($ip): SSH accessible"
        ((ACCESSIBLE++))
    else
        echo "❌ $name ($ip): SSH timeout"
        ((INACCESSIBLE++))
    fi
done

echo ""
echo "Summary: $ACCESSIBLE accessible, $INACCESSIBLE inaccessible"
