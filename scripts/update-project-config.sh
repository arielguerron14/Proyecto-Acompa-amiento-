#!/bin/bash
# Script to update project configuration with discovered EC2 instance IPs
# Usage: ./update-project-config.sh <instances-json>

INSTANCES_JSON=${1:-"{}"}

echo "Updating project configuration with instance IPs..."
echo "Instance data: $INSTANCES_JSON"

# Parse instances and create configuration
echo "$INSTANCES_JSON" | jq -r 'to_entries[] | 
  "Instance: \(.key) - Private: \(.value.private_ip) - Public: \(.value.public_ip)"'

# Update .env files
echo "Updating environment files..."

# Create a discovery output file for other scripts to use
cat > discovered-instances.json << EOF
$INSTANCES_JSON
EOF

echo "Discovery output saved to discovered-instances.json"

# Update infrastructure-instances.config.js with actual IPs
cat > infrastructure-instances.config.js << 'EOFCONFIG'
module.exports = {
  instances: INSTANCES_PLACEHOLDER,
  deployment: {
    timeout: 300,
    retries: 3,
    environment: process.env.ENVIRONMENT || 'production',
    skipVerification: process.env.SKIP_VERIFICATION === 'true'
  },
  serviceMap: {
    'EC2-Frontend': { port: 3000, health: '/health' },
    'EC2-API-Gateway': { port: 8080, health: '/api/health' },
    'EC2-DB': { port: 5432, health: null },
    'EC2-CORE': { port: 8081, health: '/api/status' },
    'EC2-Messaging': { port: 5672, health: null },
    'EC2-Notificaciones': { port: 8082, health: '/notifications/health' },
    'EC2-Reportes': { port: 8083, health: '/reports/health' },
    'EC2-Monitoring': { port: 9090, health: '/-/healthy' }
  },
  bastionConfig: {
    enabled: true,
    host: BASTION_PLACEHOLDER,
    timeout: 30
  }
};
EOFCONFIG

# Replace placeholders
INSTANCES_JSON_ESCAPED=$(echo "$INSTANCES_JSON" | sed 's/"/\\"/g')
sed -i "s|INSTANCES_PLACEHOLDER|$INSTANCES_JSON_ESCAPED|g" infrastructure-instances.config.js
BASTION_IP=$(echo "$INSTANCES_JSON" | jq -r '.["EC-Bastion"].public_ip // "null"')
sed -i "s|BASTION_PLACEHOLDER|\"$BASTION_IP\"|g" infrastructure-instances.config.js

echo "✓ Configuration updated successfully"
cat infrastructure-instances.config.js | head -20

echo ""
echo "Summary:"
echo "  - Infrastructure config file: infrastructure-instances.config.js"
echo "  - Discovery output: discovered-instances.json"
echo "  - Ready for deployment"
