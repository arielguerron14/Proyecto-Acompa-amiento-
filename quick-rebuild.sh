#!/bin/bash
# Actualizar microservicios en EC2

cd /home/ubuntu/project

echo "=== ACTUALIZANDO PROYECTO ==="
echo ""

# 1. Obtener última versión del código
echo "[1/4] Descargando últimos cambios..."
git pull origin main

# 2. Parar servicios
echo "[2/4] Deteniendo servicios..."
docker-compose down || true

# 3. Reconstruir API Gateway con configuración corregida
echo "[3/4] Reconstruyendo API Gateway..."
export CORE_HOST=http://localhost
docker-compose build --no-cache api-gateway

# 4. Iniciar servicios
echo "[4/4] Iniciando servicios..."
docker-compose up -d api-gateway core auth db frontend maestros estudiantes

sleep 5

echo ""
echo "=== VERIFICANDO SERVICIOS ==="
docker-compose ps

echo ""
echo "=== TEST DE ENDPOINTS ==="
echo ""
echo "Health Check:"
curl -s http://localhost:3000/health | jq . || echo "JSON no disponible"

echo ""
echo "Test /horarios:"
curl -s http://localhost:3000/horarios | head -c 100 || echo "Endpoint probando..."

echo ""
echo "✅ Actualización completada!"
echo ""
echo "Para ver logs:"
echo "  docker-compose logs -f api-gateway"
