#!/bin/bash

# Diagnose deployment issues on EC2 instances
# Run locally with: bash diagnose-deployment.sh

INSTANCES=(
  "ec2-messaging:44.221.50.177"
  "ec2-monitoring:54.198.235.28"
)

echo "=================================================="
echo "EC2 DEPLOYMENT DIAGNOSTICS"
echo "=================================================="

for ENTRY in "${INSTANCES[@]}"; do
  IFS=':' read -r INSTANCE_NAME IP <<< "$ENTRY"
  
  echo ""
  echo "┌─ $INSTANCE_NAME ($IP)"
  echo "│"
  
  # Check if SSH reachable
  if timeout 5 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 ubuntu@$IP "echo OK" &>/dev/null; then
    echo "✅ SSH reachable"
    
    # Check if Docker is running
    echo "│ Checking Docker status..."
    ssh -o StrictHostKeyChecking=no ubuntu@$IP "docker ps" 2>/dev/null | head -3 || echo "❌ Docker not accessible"
    
    # Check docker-compose file exists
    echo "│ Checking docker-compose.yml..."
    ssh -o StrictHostKeyChecking=no ubuntu@$IP "ls -la ~/app/docker-compose.yml" || echo "❌ docker-compose.yml not found"
    
    # Check Docker images
    echo "│ Docker images present:"
    ssh -o StrictHostKeyChecking=no ubuntu@$IP "docker images | grep proyecto" || echo "❌ No proyecto images found"
    
    # Check container logs
    echo "│ Recent container logs:"
    if [[ "$INSTANCE_NAME" == "ec2-messaging" ]]; then
      ssh -o StrictHostKeyChecking=no ubuntu@$IP "docker logs proyecto-kafka 2>&1 | tail -5" 2>/dev/null || echo "❌ No kafka logs"
    elif [[ "$INSTANCE_NAME" == "ec2-monitoring" ]]; then
      ssh -o StrictHostKeyChecking=no ubuntu@$IP "docker logs proyecto-prometheus 2>&1 | tail -5" 2>/dev/null || echo "❌ No prometheus logs"
    fi
    
  else
    echo "❌ SSH NOT REACHABLE"
  fi
  echo "└─"
done

echo ""
echo "=================================================="
