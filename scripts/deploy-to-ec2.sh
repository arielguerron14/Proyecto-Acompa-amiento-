#!/bin/bash

# Deploy Services to EC2 Instances
# This script deploys docker-compose services to EC2 instances via Bastion

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       DEPLOYING SERVICES TO EC2 INSTANCES                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load configuration
if [ ! -f "infrastructure-instances.config.js" ]; then
    echo -e "${RED}❌ Error: infrastructure-instances.config.js not found${NC}"
    exit 1
fi

# Extract Bastion IP using Node.js
BASTION_IP=$(node -e "
const config = require('./infrastructure-instances.config.js');
const instances = config.instances || config.module.exports;
// Find Bastion instance
for (const [key, instance] of Object.entries(instances)) {
    if (instance.name === 'EC-Bastion' || key.includes('Bastion')) {
        console.log(instance.public_ip || instance.public?.ip);
        break;
    }
}
" 2>/dev/null || echo "")

if [ -z "$BASTION_IP" ]; then
    echo -e "${RED}❌ Cannot find Bastion IP in configuration${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Bastion IP found: $BASTION_IP${NC}"
echo ""

# Prepare SSH configuration
SSH_KEY="${HOME}/.ssh/bastion_key.pem"

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ Error: SSH key not found at $SSH_KEY${NC}"
    echo "Please ensure AWS_BASTION_KEY is configured in GitHub Secrets"
    exit 1
fi

chmod 600 "$SSH_KEY"

# Test SSH connectivity
echo -e "${YELLOW}Testing SSH connectivity to Bastion...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$BASTION_IP" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection to Bastion successful${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Cannot reach Bastion via SSH${NC}"
    echo "This may be a security group or network issue"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Available Services:${NC}"
echo ""

# Deploy each service
SERVICES=(
    "core:docker-compose.core.yml:EC2-CORE:172.31.78.183"
    "api-gateway:docker-compose.api-gateway.yml:EC2-API-Gateway:172.31.76.105"
    "frontend:docker-compose.frontend.yml:EC2-Frontend:172.31.69.203"
    "db:docker-compose.infrastructure.yml:EC2-DB:172.31.69.133"
    "messaging:docker-compose.messaging.yml:EC2-Messaging:172.31.65.57"
)

for service_config in "${SERVICES[@]}"; do
    IFS=':' read -r service_name compose_file instance_name instance_ip <<< "$service_config"
    
    if [ -f "$compose_file" ]; then
        echo -e "${GREEN}✓${NC} $service_name (${instance_name})"
    else
        echo -e "${RED}✗${NC} $service_name - ${compose_file} not found"
    fi
done

echo ""
echo -e "${YELLOW}Deployment Status:${NC}"
echo ""

# For now, just display the deployment plan
# Full deployment would require additional SSH configuration
echo -e "${BLUE}Deployment via GitHub Actions Workflow:${NC}"
echo ""
echo "To deploy services, run:"
echo "  ${YELLOW}gh workflow run deploy-services.yml${NC}"
echo ""
echo -e "${BLUE}Manual Deployment Steps:${NC}"
echo ""
echo "1. SSH to Bastion:"
echo "   ${YELLOW}ssh -i ~/.ssh/bastion_key.pem ubuntu@${BASTION_IP}${NC}"
echo ""
echo "2. From Bastion, SSH to EC2 instance:"
echo "   ${YELLOW}ssh -i ~/.ssh/key.pem ubuntu@172.31.78.183${NC}"
echo ""
echo "3. Deploy service:"
echo "   ${YELLOW}cd /home/ubuntu/Proyecto-Acompa-amiento-${NC}"
echo "   ${YELLOW}docker-compose -f docker-compose.core.yml up -d${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Deployment configuration ready${NC}"
echo ""
