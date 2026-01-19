#!/bin/bash

# Script para desplegar todos los contenedores Docker en las instancias EC2
# Automatiza el deployment de toda la arquitectura de microservicios

set -e

API_GATEWAY="100.49.160.199:8080"
EC2_CORE="100.49.160.199"
EC2_DB="3.235.120.8"
EC2_MESSAGING="35.174.19.29"
EC2_NOTIFICACIONES="3.226.74.67"
EC2_FRONTEND="52.72.57.10"
EC2_REPORTES="23.22.116.142"
EC2_MONITORING="54.205.158.101"
BASTION="52.6.170.44"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 DEPLOYMENT DE MICROSERVICIOS - TODAS LAS INSTANCIAS        ║"
echo "║  Fecha: $(date '+%Y-%m-%d %H:%M:%S')                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# EC2-CORE - Contenedores de autenticación y analytics
# ============================================================================
echo "📋 1️⃣  Desplegando EC2-CORE (100.49.160.199)..."
echo "   Contenedores: micro-auth, micro-estudiantes, micro-maestros, micro-core, micro-analytics"

ssh -i ~/.ssh/id_rsa ec2-user@$EC2_CORE << 'EOF'
set -e
echo "🔧 Limpiando contenedores previos..."
docker stop micro-auth micro-estudiantes micro-maestros micro-core micro-analytics 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros micro-core micro-analytics 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull $DOCKER_USERNAME/micro-auth:latest
docker pull $DOCKER_USERNAME/micro-estudiantes:latest
docker pull $DOCKER_USERNAME/micro-maestros:latest
docker pull $DOCKER_USERNAME/micro-core:latest
docker pull $DOCKER_USERNAME/micro-analytics:latest

echo "🐳 Iniciando contenedores..."
docker run -d --name micro-auth -p 3000:3000 \
  -e DB_HOST=172.31.67.130 \
  -e DB_PORT=27017 \
  $DOCKER_USERNAME/micro-auth:latest

docker run -d --name micro-estudiantes -p 3001:3001 \
  -e DB_HOST=172.31.67.130 \
  -e DB_PORT=27017 \
  $DOCKER_USERNAME/micro-estudiantes:latest

docker run -d --name micro-maestros -p 3002:3002 \
  -e DB_HOST=172.31.67.130 \
  -e DB_PORT=27017 \
  $DOCKER_USERNAME/micro-maestros:latest

docker run -d --name micro-core -p 3003:3003 \
  -e DB_HOST=172.31.67.130 \
  -e DB_PORT=27017 \
  $DOCKER_USERNAME/micro-core:latest

docker run -d --name micro-analytics -p 3004:3004 \
  -e DB_HOST=172.31.67.130 \
  $DOCKER_USERNAME/micro-analytics:latest

echo "✅ EC2-CORE desplegado:"
docker ps | grep micro-
EOF

echo "✅ EC2-CORE completado"
echo ""

# ============================================================================
# EC2-API-Gateway
# ============================================================================
echo "📋 2️⃣  Desplegando EC2-API-Gateway (98.86.94.92)..."

ssh -i ~/.ssh/id_rsa ec2-user@98.86.94.92 << 'EOF'
set -e
echo "🔧 Limpiando previos..."
docker stop api-gateway 2>/dev/null || true
docker rm api-gateway 2>/dev/null || true

echo "📥 Descargando imagen..."
docker pull $DOCKER_USERNAME/api-gateway:latest

echo "🐳 Iniciando contenedor..."
docker run -d --name api-gateway -p 8080:8080 \
  -e CORE_HOST=172.31.64.170 \
  -e CORE_PORT=3000 \
  $DOCKER_USERNAME/api-gateway:latest

echo "✅ API-Gateway desplegado"
docker ps | grep api-gateway
EOF

echo "✅ EC2-API-Gateway completado"
echo ""

# ============================================================================
# EC2-DB - Bases de datos
# ============================================================================
echo "📋 3️⃣  Desplegando EC2-DB (3.235.120.8)..."

ssh -i ~/.ssh/id_rsa ec2-user@$EC2_DB << 'EOF'
set -e
echo "🔧 Limpiando previos..."
docker stop mongo postgres redis 2>/dev/null || true
docker rm mongo postgres redis 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull mongo:latest
docker pull postgres:latest
docker pull redis:latest

echo "🐳 Iniciando MongoDB..."
docker run -d --name mongo -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  mongo:latest

echo "🐳 Iniciando PostgreSQL..."
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=example \
  postgres:latest

echo "🐳 Iniciando Redis..."
docker run -d --name redis -p 6379:6379 redis:latest

echo "✅ EC2-DB desplegado"
docker ps | grep -E "mongo|postgres|redis"
EOF

echo "✅ EC2-DB completado"
echo ""

# ============================================================================
# EC2-Messaging - Message queues
# ============================================================================
echo "📋 4️⃣  Desplegando EC2-Messaging (35.174.19.29)..."

ssh -i ~/.ssh/id_rsa ec2-user@$EC2_MESSAGING << 'EOF'
set -e
echo "🔧 Limpiando previos..."
docker stop zookeeper kafka rabbitmq 2>/dev/null || true
docker rm zookeeper kafka rabbitmq 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull $DOCKER_USERNAME/proyecto-zookeeper:1.0
docker pull $DOCKER_USERNAME/proyecto-kafka:1.0
docker pull $DOCKER_USERNAME/proyecto-rabbitmq:1.0

echo "🐳 Iniciando Zookeeper..."
docker run -d --name zookeeper -p 2181:2181 \
  $DOCKER_USERNAME/proyecto-zookeeper:1.0

echo "🐳 Iniciando Kafka..."
docker run -d --name kafka -p 9092:9092 \
  -e ZOOKEEPER_HOST=172.31.75.187 \
  $DOCKER_USERNAME/proyecto-kafka:1.0

echo "🐳 Iniciando RabbitMQ..."
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 \
  $DOCKER_USERNAME/proyecto-rabbitmq:1.0

echo "✅ EC2-Messaging desplegado"
docker ps | grep -E "zookeeper|kafka|rabbitmq"
EOF

echo "✅ EC2-Messaging completado"
echo ""

# ============================================================================
# EC2-Notificaciones
# ============================================================================
echo "📋 5️⃣  Desplegando EC2-Notificaciones (3.226.74.67)..."

ssh -i ~/.ssh/id_rsa ec2-user@$EC2_NOTIFICACIONES << 'EOF'
set -e
echo "🔧 Limpiando previos..."
docker stop micro-notificaciones 2>/dev/null || true
docker rm micro-notificaciones 2>/dev/null || true

echo "📥 Descargando imagen..."
docker pull $DOCKER_USERNAME/micro-notificaciones:latest

echo "🐳 Iniciando contenedor..."
docker run -d --name micro-notificaciones -p 3007:3007 \
  -e KAFKA_HOST=172.31.75.187 \
  -e DB_HOST=172.31.67.130 \
  $DOCKER_USERNAME/micro-notificaciones:latest

echo "✅ EC2-Notificaciones desplegado"
docker ps | grep micro-notificaciones
EOF

echo "✅ EC2-Notificaciones completado"
echo ""

# ============================================================================
# EC2-Reportes
# ============================================================================
echo "📋 6️⃣  Desplegando EC2-Reportes (23.22.116.142)..."

ssh -i ~/.ssh/id_rsa ec2-user@$EC2_REPORTES << 'EOF'
set -e
echo "🔧 Limpiando previos..."
docker stop micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true
docker rm micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull $DOCKER_USERNAME/micro-reportes-estudiantes:latest
docker pull $DOCKER_USERNAME/micro-reportes-maestros:latest

echo "🐳 Iniciando micro-reportes-estudiantes..."
docker run -d --name micro-reportes-estudiantes -p 3005:3005 \
  -e DB_HOST=172.31.67.130 \
  $DOCKER_USERNAME/micro-reportes-estudiantes:latest

echo "🐳 Iniciando micro-reportes-maestros..."
docker run -d --name micro-reportes-maestros -p 3006:3006 \
  -e DB_HOST=172.31.67.130 \
  $DOCKER_USERNAME/micro-reportes-maestros:latest

echo "✅ EC2-Reportes desplegado"
docker ps | grep micro-reportes
EOF

echo "✅ EC2-Reportes completado"
echo ""

# ============================================================================
# EC2-Monitoring
# ============================================================================
echo "📋 7️⃣  Desplegando EC2-Monitoring (54.205.158.101)..."

ssh -i ~/.ssh/id_rsa ec2-user@$EC2_MONITORING << 'EOF'
set -e
echo "🔧 Limpiando previos..."
docker stop prometheus grafana 2>/dev/null || true
docker rm prometheus grafana 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull $DOCKER_USERNAME/proyecto-prometheus:1.0
docker pull $DOCKER_USERNAME/proyecto-grafana:1.0

echo "🐳 Iniciando Prometheus..."
docker run -d --name prometheus -p 9090:9090 \
  $DOCKER_USERNAME/proyecto-prometheus:1.0

echo "🐳 Iniciando Grafana..."
docker run -d --name grafana -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  $DOCKER_USERNAME/proyecto-grafana:1.0

echo "✅ EC2-Monitoring desplegado"
docker ps | grep -E "prometheus|grafana"
EOF

echo "✅ EC2-Monitoring completado"
echo ""

# ============================================================================
# EC2-Frontend
# ============================================================================
echo "📋 8️⃣  Desplegando EC2-Frontend (52.72.57.10)..."

ssh -i ~/.ssh/id_rsa ec2-user@$EC2_FRONTEND << 'EOF'
set -e
echo "🔧 Limpiando previos..."
docker stop frontend-web 2>/dev/null || true
docker rm frontend-web 2>/dev/null || true

echo "📥 Descargando imagen..."
docker pull $DOCKER_USERNAME/frontend-web:latest

echo "🐳 Iniciando contenedor..."
docker run -d --name frontend-web -p 80:3000 \
  -e API_GATEWAY_URL=http://100.49.160.199:8080 \
  $DOCKER_USERNAME/frontend-web:latest

echo "✅ EC2-Frontend desplegado"
docker ps | grep frontend-web
EOF

echo "✅ EC2-Frontend completado"
echo ""

# ============================================================================
# EC-Bastion
# ============================================================================
echo "📋 9️⃣  Desplegando EC-Bastion (52.6.170.44)..."

ssh -i ~/.ssh/id_rsa ec2-user@$BASTION << 'EOF'
set -e
echo "🔧 Limpiando previos..."
docker stop bastion-host 2>/dev/null || true
docker rm bastion-host 2>/dev/null || true

echo "📥 Descargando imagen..."
docker pull $DOCKER_USERNAME/bastion-host:latest

echo "🐳 Iniciando Bastion..."
docker run -d --name bastion-host -p 80:80 \
  $DOCKER_USERNAME/bastion-host:latest

echo "✅ EC-Bastion desplegado"
docker ps | grep bastion-host
EOF

echo "✅ EC-Bastion completado"
echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETADO                                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Resumen de Servicios Desplegados:"
echo ""
echo "EC2-CORE (100.49.160.199)"
echo "  ✅ micro-auth:3000"
echo "  ✅ micro-estudiantes:3001"
echo "  ✅ micro-maestros:3002"
echo "  ✅ micro-core:3003"
echo "  ✅ micro-analytics:3004"
echo ""
echo "EC2-API-Gateway (98.86.94.92)"
echo "  ✅ api-gateway:8080"
echo ""
echo "EC2-DB (3.235.120.8)"
echo "  ✅ mongo:27017"
echo "  ✅ postgres:5432"
echo "  ✅ redis:6379"
echo ""
echo "EC2-Messaging (35.174.19.29)"
echo "  ✅ zookeeper:2181"
echo "  ✅ kafka:9092"
echo "  ✅ rabbitmq:5672"
echo ""
echo "EC2-Notificaciones (3.226.74.67)"
echo "  ✅ micro-notificaciones:3007"
echo ""
echo "EC2-Reportes (23.22.116.142)"
echo "  ✅ micro-reportes-estudiantes:3005"
echo "  ✅ micro-reportes-maestros:3006"
echo ""
echo "EC2-Monitoring (54.205.158.101)"
echo "  ✅ prometheus:9090"
echo "  ✅ grafana:3000"
echo ""
echo "EC2-Frontend (52.72.57.10)"
echo "  ✅ frontend-web:80"
echo ""
echo "EC-Bastion (52.6.170.44)"
echo "  ✅ bastion-host:80"
echo ""
echo "🌐 API Gateway disponible en: http://100.49.160.199:8080"
echo "🖥️  Frontend disponible en: http://52.72.57.10"
echo ""
echo "✅ ¡TODOS LOS SERVICIOS ESTÁN DESPLEGADOS Y CORRIENDO!"
echo ""
