#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🔧 REPARANDO POSTGRESQL EN EC2-DB                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd /opt/databases

# 1. LIMPIAR COMPLETAMENTE
echo "1️⃣  Limpiando contenedores y volúmenes existentes..."
docker-compose down -v --remove-orphans 2>/dev/null || true
docker rm -f postgresql mongodb redis 2>/dev/null || true
docker volume rm -f $(docker volume ls -q --filter name=databases) 2>/dev/null || echo "   No hay volúmenes que limpiar"
echo "   ✅ Limpieza completada"
echo ""

# 2. ACTUALIZAR DOCKER-COMPOSE.YML
echo "2️⃣  Actualizando docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
services:
  mongodb:
    image: mongo:6.0
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: mongodb123
    volumes:
      - mongodb_data:/data/db
    networks:
      - databases
    restart: unless-stopped
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 3

  postgresql:
    image: postgres:15
    container_name: postgresql
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: acompanamiento
      PGDATA: /var/lib/postgresql/data/pgdata
      LANG: en_US.utf8
      LC_ALL: en_US.utf8
      POSTGRES_INITDB_ARGS: "-c shared_buffers=128MB"
    volumes:
      - postgresql_data:/var/lib/postgresql/data
    networks:
      - databases
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redis123
    volumes:
      - redis_data:/data
    networks:
      - databases
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  mongodb_data:
  postgresql_data:
  redis_data:

networks:
  databases:
    driver: bridge
EOF
echo "   ✅ docker-compose.yml actualizado"
echo ""

# 3. INICIAR CONTENEDORES
echo "3️⃣  Iniciando contenedores..."
docker-compose up -d
echo "   ✅ Contenedores iniciados"
echo ""

# 4. ESPERAR INICIALIZACIÓN
echo "4️⃣  Esperando 45 segundos para que PostgreSQL se inicialice..."
sleep 45
echo "   ✅ Tiempo de espera completado"
echo ""

# 5. VERIFICAR ESTADO
echo "5️⃣  VERIFICANDO ESTADO DE CONTENEDORES"
echo "─────────────────────────────────────────────────────────────"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 6. VERIFICAR MONGODB
echo "6️⃣  VERIFICANDO MONGODB"
echo "─────────────────────────────────────────────────────────────"
if docker exec mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo "   ✅ MongoDB está respondiendo"
else
    echo "   ❌ MongoDB NO está respondiendo"
    docker logs mongodb | tail -10
fi
echo ""

# 7. VERIFICAR REDIS
echo "7️⃣  VERIFICANDO REDIS"
echo "─────────────────────────────────────────────────────────────"
if docker exec redis redis-cli -a redis123 ping > /dev/null 2>&1; then
    echo "   ✅ Redis está respondiendo"
else
    echo "   ❌ Redis NO está respondiendo"
    docker logs redis | tail -10
fi
echo ""

# 8. VERIFICAR POSTGRESQL - CRÍTICO
echo "8️⃣  VERIFICANDO POSTGRESQL (CRÍTICO)"
echo "─────────────────────────────────────────────────────────────"
if docker exec postgresql pg_isready -U postgres > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL está respondiendo"
    
    # Intentar conectarse a la base de datos
    if docker exec postgresql psql -U postgres -d acompanamiento -c "SELECT version();" > /dev/null 2>&1; then
        echo "   ✅ Base de datos 'acompanamiento' es accesible"
        echo ""
        echo "   📋 Versión de PostgreSQL:"
        docker exec postgresql psql -U postgres -d acompanamiento -c "SELECT version();" | grep "PostgreSQL"
    else
        echo "   ❌ Base de datos 'acompanamiento' NO es accesible"
        echo ""
        echo "   📋 Logs de PostgreSQL:"
        docker logs postgresql | tail -20
    fi
else
    echo "   ❌ PostgreSQL NO está respondiendo"
    echo ""
    echo "   📋 Logs de PostgreSQL (últimas 30 líneas):"
    docker logs postgresql | tail -30
fi
echo ""

# 9. RESUMEN FINAL
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ REPARACIÓN COMPLETADA                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Estado de servicios:"
docker ps -a --format "table {{.Names}}\t{{.Status}}"
echo ""
echo "💾 Volúmenes creados:"
docker volume ls --filter name=databases
echo ""
echo "✅ Script ejecutado exitosamente"
