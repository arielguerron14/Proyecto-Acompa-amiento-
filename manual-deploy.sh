#!/bin/bash

# Manual deployment script for EC2 infrastructure services
# Usage: bash manual-deploy.sh <instance-ip> <instance-type> [rebuild]

set -e

INSTANCE_IP=$1
INSTANCE_TYPE=$2
REBUILD=${3:-true}

if [ -z "$INSTANCE_IP" ]; then
  echo "Usage: bash manual-deploy.sh <instance-ip> <instance-type> [rebuild=true]"
  echo ""
  echo "Examples:"
  echo "  bash manual-deploy.sh 44.221.50.177 messaging true"
  echo "  bash manual-deploy.sh 54.198.235.28 monitoring false"
  exit 1
fi

echo "========================================"
echo "EC2 Manual Deployment Script"
echo "========================================"
echo "Instance IP: $INSTANCE_IP"
echo "Instance Type: $INSTANCE_TYPE"
echo "Rebuild: $REBUILD"
echo ""

# Determine docker-compose file
case "$INSTANCE_TYPE" in
  messaging)
    COMPOSE_FILE="messaging/docker-compose.yml"
    CONTEXT="Kafka, Zookeeper, RabbitMQ"
    ;;
  monitoring)
    COMPOSE_FILE="monitoring/docker-compose.yml"
    CONTEXT="Prometheus, Grafana"
    ;;
  *)
    echo "Unknown instance type: $INSTANCE_TYPE"
    exit 1
    ;;
esac

echo "Context: $CONTEXT"
echo "Compose file: $COMPOSE_FILE"
echo ""

# Test SSH connection
echo "[1/5] Testing SSH connection..."
if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$INSTANCE_IP "echo 'SSH OK'" &>/dev/null; then
  echo "✓ SSH connection successful"
else
  echo "✗ SSH connection failed"
  exit 1
fi

# Create app directory
echo "[2/5] Creating app directory..."
ssh -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP "mkdir -p ~/app && rm -rf ~/app/* && df -h ~/app" || true

# Transfer docker-compose file
echo "[3/5] Transferring docker-compose.yml..."
scp -o StrictHostKeyChecking=no "$COMPOSE_FILE" ubuntu@$INSTANCE_IP:~/app/docker-compose.yml || {
  echo "✗ Failed to transfer docker-compose.yml"
  exit 1
}

# Deploy with docker-compose
echo "[4/5] Deploying services (rebuild=$REBUILD)..."
ssh -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP << ENDSSH
set -e

# Stop and remove old containers
echo "Stopping old containers..."
docker-compose -f ~/app/docker-compose.yml down 2>/dev/null || true

# Remove old images if rebuild=true
if [ "$REBUILD" = "true" ]; then
  echo "Removing old images..."
  docker image prune -f || true
fi

# Start services
echo "Starting services..."
cd ~/app
docker-compose up -d

# Wait for services to start
sleep 5

# Check status
echo "Service status:"
docker-compose ps
echo ""
echo "Recent logs:"
docker-compose logs --tail=20

ENDSSH

# Verify services
echo "[5/5] Verifying services..."
case "$INSTANCE_TYPE" in
  messaging)
    echo "Checking Kafka on port 9092..."
    if nc -z -w 5 $INSTANCE_IP 9092; then
      echo "✓ Kafka responding"
    else
      echo "✗ Kafka not responding"
    fi
    ;;
  monitoring)
    echo "Checking Prometheus on port 9090..."
    if nc -z -w 5 $INSTANCE_IP 9090; then
      echo "✓ Prometheus responding"
    else
      echo "✗ Prometheus not responding"
    fi
    ;;
esac

echo ""
echo "========================================"
echo "Deployment complete!"
echo "========================================"
