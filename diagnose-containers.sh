#!/bin/bash
# Diagnóstico de contenedores en EC2-CORE
# Ejecutar: bash diagnose-containers.sh

echo "=========================================="
echo "DIAGNÓSTICO DE CONTENEDORES EC2-CORE"
echo "=========================================="

echo ""
echo "=== CONTENEDORES ACTUALES ==="
docker ps -a

echo ""
echo "=== LOGS MICRO-AUTH ==="
docker logs --tail 50 micro-auth 2>&1

echo ""
echo "=== LOGS MICRO-ESTUDIANTES ==="
docker logs --tail 50 micro-estudiantes 2>&1

echo ""
echo "=== LOGS MICRO-MAESTROS ==="
docker logs --tail 50 micro-maestros 2>&1

echo ""
echo "=== REDES DISPONIBLES ==="
docker network ls

echo ""
echo "=== INSPECCIONANDO NETWORK core-net ==="
docker network inspect core-net 2>&1 || echo "Network no existe"

echo ""
echo "=== CONECTIVIDAD A MONGODB ==="
# Obtener IP de DB desde config
DB_IP=$(grep -o '"PrivateIpAddress": "[^"]*"' config/instance_ips.json | grep -A1 'EC2-DB' | tail -1 | cut -d'"' -f4)
echo "DB IP: $DB_IP"
docker run --rm -it node:18-alpine sh -c "node -e \"require('mongodb').MongoClient.connect('mongodb://root:example@$DB_IP:27017/test?authSource=admin', {serverSelectionTimeoutMS: 5000}, (err, client) => { if(err) console.log('❌ ERROR:', err.message); else { console.log('✅ Connected to MongoDB'); client.close(); } })\" 2>&1" || echo "Error testing MongoDB"

echo ""
echo "=== VARIABLES DE ENTORNO DE CONTENEDORES ==="
docker inspect micro-auth --format='{{json .Config.Env}}' 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Container no existe"

echo ""
echo "=== VERIFICAR DIRECTORIOS Y ARCHIVOS ==="
echo "Contenidos de /usr/src/app en micro-auth:"
docker run --rm -it caguerronp/micro-auth:latest sh -c "ls -la /usr/src/app/" 2>&1 || echo "Error"

echo ""
echo "=== INTENTAR INICIAR MANUALMENTE ==="
echo "Limpiando contenedores viejos..."
docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

echo ""
echo "Verificando network..."
docker network create core-net 2>/dev/null || echo "Network already exists"

echo ""
echo "Iniciando micro-auth en foreground para ver errores..."
DB_IP=$(grep -o '"PrivateIpAddress": "[^"]*"' config/instance_ips.json | grep -A1 'EC2-DB' | tail -1 | cut -d'"' -f4)
echo "Usando DB IP: $DB_IP"

docker run --rm \
  --name micro-auth \
  --network core-net \
  -p 3000:3000 \
  -e MONGODB_URI="mongodb://root:example@$DB_IP:27017/auth?authSource=admin" \
  -e DEBUG="*" \
  caguerronp/micro-auth:latest
