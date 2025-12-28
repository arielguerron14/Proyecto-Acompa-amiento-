#!/bin/bash
# Quick start script for messaging services

set -e

echo "🚀 Starting messaging services..."
cd "$(dirname "$0")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building custom images...${NC}"
docker-compose build

echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

echo ""
echo -e "${GREEN}✓ Messaging services started!${NC}"
echo ""
echo "Services:"
echo "  • Zookeeper:    localhost:2181"
echo "  • Kafka:        localhost:9092 (internal: kafka:29092)"
echo "  • RabbitMQ:     localhost:5672 / Management: localhost:15672"
echo "  • Kafka UI:     localhost:8081"
echo ""
echo "Run 'docker-compose ps' to see status"
echo "Run 'docker-compose logs -f' to see logs"
echo ""
