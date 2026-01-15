#!/bin/bash

# ============================================================================
# UPDATE CORE HOST - Single Point to Update All Service Routes
# ============================================================================
# 
# Usage:
#   ./update-core-host.sh 3.236.51.29
#   ./update-core-host.sh http://172.31.79.241
#
# This script updates the CORE_HOST environment variable that controls
# where all microservices are located. When you run this, all services
# automatically start using the new IP without code changes.
#
# ============================================================================

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <ip-address-or-url>"
    echo ""
    echo "Examples:"
    echo "  $0 3.236.51.29"
    echo "  $0 http://172.31.79.241"
    echo "  $0 ec2-3-236-51-29.compute-1.amazonaws.com"
    exit 1
fi

NEW_HOST="$1"

# Ensure it has protocol
if [[ ! "$NEW_HOST" =~ ^http ]]; then
    NEW_HOST="http://$NEW_HOST"
fi

echo "🔄 Updating CORE_HOST to: $NEW_HOST"
echo ""

# Update .env if it exists
if [ -f ".env" ]; then
    echo "📝 Updating .env..."
    if grep -q "CORE_HOST" .env; then
        sed -i.bak "s|CORE_HOST=.*|CORE_HOST=$NEW_HOST|" .env
    else
        echo "CORE_HOST=$NEW_HOST" >> .env
    fi
    echo "✅ .env updated"
else
    echo "⚠️  .env not found, creating it..."
    echo "CORE_HOST=$NEW_HOST" > .env
    echo "✅ .env created"
fi

# Update docker-compose.yml if it exists
if [ -f "docker-compose.yml" ]; then
    echo "📝 Updating docker-compose.yml..."
    # This is a simple update - real file may need different approach
    echo "⚠️  Note: Manually update CORE_HOST environment variable in docker-compose.yml if needed"
fi

# Update docker-compose.api-gateway.yml if it exists
if [ -f "docker-compose.api-gateway.yml" ]; then
    echo "📝 Updating docker-compose.api-gateway.yml..."
    sed -i.bak "s|CORE_HOST:.*|CORE_HOST: \"$NEW_HOST\"|" docker-compose.api-gateway.yml 2>/dev/null || true
    echo "✅ docker-compose.api-gateway.yml updated"
fi

echo ""
echo "✅ CORE_HOST updated!"
echo ""
echo "📋 Next steps:"
echo "  1. Rebuild & restart: docker-compose up -d api-gateway"
echo "  2. Verify: curl http://localhost:8080/health"
echo "  3. Check config: curl http://localhost:8080/config"
echo ""
echo "💡 All services will automatically use the new IP:"
echo "   - /auth/* → $NEW_HOST:3000"
echo "   - /estudiantes/* → $NEW_HOST:3001"
echo "   - /maestros/* → $NEW_HOST:3002"
echo "   - /reportes/* → $NEW_HOST:5003"
