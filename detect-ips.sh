#!/bin/bash
# Detectar IPs de instancias EC2

echo "=== Detectando IPs de instancias EC2 ==="
echo ""

# Bastion
echo "📍 Bastion (34.235.224.202):"
ssh -i ~/.ssh/bastion.pem -o ConnectTimeout=5 -o StrictHostKeyChecking=no ec2-user@34.235.224.202 "
  echo 'Public IP:' && curl -s http://169.254.169.254/latest/meta-data/public-ipv4
  echo 'Private IP:' && curl -s http://169.254.169.254/latest/meta-data/local-ipv4
" 2>/dev/null || echo "  ❌ No accesible"

echo ""

# Frontend
echo "📍 Frontend (44.220.126.89):"
ssh -i ~/.ssh/frontend.pem -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@44.220.126.89 "
  echo 'Public IP:' && curl -s http://169.254.169.254/latest/meta-data/public-ipv4
  echo 'Private IP:' && curl -s http://169.254.169.254/latest/meta-data/local-ipv4
" 2>/dev/null || echo "  ❌ No accesible"

echo ""

# API Gateway
echo "📍 API Gateway (52.7.168.4):"
ssh -i ~/.ssh/api.pem -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@52.7.168.4 "
  echo 'Public IP:' && curl -s http://169.254.169.254/latest/meta-data/public-ipv4
  echo 'Private IP:' && curl -s http://169.254.169.254/latest/meta-data/local-ipv4
" 2>/dev/null || echo "  ❌ No accesible"

echo ""

# EC2-Core via Bastion
echo "📍 EC2-Core (via Bastion):"
ssh -i ~/.ssh/bastion.pem -o ConnectTimeout=5 -o StrictHostKeyChecking=no ec2-user@34.235.224.202 "
  ssh -i /home/ec2-user/.ssh/core.pem ubuntu@172.31.79.241 '
    echo \"Private IP:\" && curl -s http://169.254.169.254/latest/meta-data/local-ipv4
  '
" 2>/dev/null || echo "  ❌ No accesible vía Bastion"

echo ""
echo "=== Fin de detección ==="
