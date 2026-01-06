#!/bin/bash

# Diagnostic script for EC2-CORE microservices
echo "🔍 EC2-CORE Microservices Diagnostic"
echo "===================================="
echo ""

echo "📊 Container Status:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

echo ""
echo "📋 micro-auth logs (last 50 lines):"
docker logs --tail=50 micro-auth 2>&1 || echo "Container not found"

echo ""
echo "📋 micro-estudiantes logs (last 50 lines):"
docker logs --tail=50 micro-estudiantes 2>&1 || echo "Container not found"

echo ""
echo "📋 micro-maestros logs (last 50 lines):"
docker logs --tail=50 micro-maestros 2>&1 || echo "Container not found"

echo ""
echo "🔗 Testing database connectivity:"
echo "  Checking MongoDB: 172.31.79.193:27017"
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/172.31.79.193/27017' && echo "    ✓ MongoDB accessible" || echo "    ✗ MongoDB not accessible"

echo "  Checking PostgreSQL: 172.31.79.193:5432"
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/172.31.79.193/5432' && echo "    ✓ PostgreSQL accessible" || echo "    ✗ PostgreSQL not accessible"

echo "  Checking Redis: 172.31.79.193:6379"
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/172.31.79.193/6379' && echo "    ✓ Redis accessible" || echo "    ✗ Redis not accessible"

echo ""
echo "🔄 Attempting container restart..."
docker restart micro-auth micro-estudiantes micro-maestros 2>&1 || true

echo ""
echo "✅ Diagnostic complete"
