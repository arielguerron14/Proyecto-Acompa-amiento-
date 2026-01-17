#!/bin/bash
# Run on EC2-CORE to debug port binding

echo "=== 1. Docker Containers Status ==="
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ""
echo "=== 2. Ports Listening on Host (netstat) ==="
netstat -tlnp 2>/dev/null | grep -E ':(3000|3001|3002)' || echo "No ports 3000-3002 listening"

echo ""
echo "=== 3. Ports Listening on Host (ss) ==="
ss -tlnp 2>/dev/null | grep -E ':(3000|3001|3002)' || echo "No ports 3000-3002 listening"

echo ""
echo "=== 4. Docker Inspect micro-auth Port Bindings ==="
docker inspect micro-auth --format='{{.HostConfig.PortBindings}}' 2>/dev/null || echo "micro-auth not found"

echo ""
echo "=== 5. Test Connection from Localhost ==="
curl -s -m 2 http://127.0.0.1:3000/health 2>&1 | head -3 || echo "Failed to connect to localhost:3000"

echo ""
echo "=== 6. Test Connection from Private IP (172.31.65.0) ==="
curl -s -m 2 http://172.31.65.0:3000/health 2>&1 | head -3 || echo "Failed to connect to 172.31.65.0:3000"

echo ""
echo "=== 7. Network interfaces ==="
ip addr show 2>/dev/null | grep -E 'inet ' | grep -v '127.0.0.1'

echo ""
echo "=== 8. micro-auth Container Logs (last 20 lines) ==="
docker logs --tail 20 micro-auth 2>&1 | tail -20 || echo "No logs"

echo ""
echo "=== 9. Docker Network inspect core-net ==="
docker network inspect core-net 2>/dev/null | grep -A 30 Containers || echo "core-net not found"

echo ""
echo "=== 10. Check if containers are actually running ==="
docker exec micro-auth ps aux 2>/dev/null | grep node || echo "Node process not found in micro-auth"
