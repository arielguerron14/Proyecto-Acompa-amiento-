#!/bin/bash
# Test script for messaging services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Testing Messaging Services${NC}"
echo "======================================"
echo ""

# Test Zookeeper
echo -n "Testing Zookeeper (2181)... "
if nc -zv localhost 2181 &>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Test Kafka
echo -n "Testing Kafka (9092)... "
if nc -zv localhost 9092 &>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    
    # Try broker API versions
    echo -n "  Testing Kafka API... "
    if docker exec proyecto-kafka kafka-broker-api-versions.sh --bootstrap-server localhost:29092 &>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
else
    echo -e "${RED}✗${NC}"
fi

# Test RabbitMQ
echo -n "Testing RabbitMQ (5672)... "
if nc -zv localhost 5672 &>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    
    # Try management API
    echo -n "  Testing RabbitMQ Management (15672)... "
    if curl -s -u guest:guest http://localhost:15672/api/overview &>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
else
    echo -e "${RED}✗${NC}"
fi

# Test Kafka UI
echo -n "Testing Kafka UI (8081)... "
if nc -zv localhost 8081 &>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""
echo "Container Status:"
docker-compose ps
