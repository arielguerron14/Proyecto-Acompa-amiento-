#!/bin/bash
# generate-env-files.sh
# Genera archivos .env.prod para cada instancia EC2

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 Generando archivos .env para despliegue en AWS..."

# ============= EC2-DB =============
echo "📝 Generando .env para EC2-DB (MongoDB, PostgreSQL)..."
cat > "$PROJECT_ROOT/.env.prod.db" << 'EOF'
# EC2-DB: 44.192.114.31 (pública), 172.31.79.193 (privada)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=MyMongoProd123!
POSTGRES_USER=admin
POSTGRES_PASSWORD=MyPostgresProd123!
POSTGRES_DB=acompaamiento
EOF

# ============= EC2-CORE =============
echo "📝 Generando .env para EC2-CORE (api-gateway, micro-auth, micro-estudiantes, micro-maestros)..."
cat > "$PROJECT_ROOT/.env.prod.core" << 'EOF'
# EC2-CORE: 13.216.12.61 (pública), 172.31.78.183 (privada)

NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Servicios internos (localhost dentro de EC2-CORE)
AUTH_SERVICE=http://localhost:3000
MAESTROS_SERVICE=http://localhost:3002
ESTUDIANTES_SERVICE=http://localhost:3001

# Servicios externos (IPs privadas de otras instancias)
REPORTES_EST_SERVICE=http://172.31.69.133:5003
REPORTES_MAEST_SERVICE=http://172.31.69.133:5004
NOTIFICACIONES_SERVICE=http://172.31.65.57:5005
MESSAGING_BROKER=mqtt://172.31.73.6:1883

# Bases de datos en EC2-DB
MONGO_URL=mongodb://admin:MyMongoProd123!@172.31.79.193:27017/acompaamiento?authSource=admin
POSTGRES_URL=postgresql://admin:MyPostgresProd123!@172.31.79.193:5432/acompaamiento

# JWT & Security
JWT_SECRET=prod-jwt-secret-key-minimum-32-chars-change-this
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://107.21.124.81,http://172.31.69.203:5500,http://localhost:5500

# Rate limiting
RATELIMIT_WINDOW_MS=900000
RATELIMIT_MAX_REQUESTS=100
EOF

# ============= EC2-Reportes =============
echo "📝 Generando .env para EC2-Reportes (micro-reportes-estudiantes, micro-reportes-maestros)..."
cat > "$PROJECT_ROOT/.env.prod.reportes" << 'EOF'
# EC2-Reportes: 54.175.62.79 (pública), 172.31.69.133 (privada)

NODE_ENV=production

# Micro-reportes-estudiantes
PORT_EST=5003
# Micro-reportes-maestros
PORT_MAEST=5004

# Bases de datos en EC2-DB
MONGO_URL=mongodb://admin:MyMongoProd123!@172.31.79.193:27017/reportes?authSource=admin
POSTGRES_URL=postgresql://admin:MyPostgresProd123!@172.31.79.193:5432/acompaamiento

LOG_LEVEL=info
EOF

# ============= EC2-Notificaciones =============
echo "📝 Generando .env para EC2-Notificaciones (micro-notificaciones)..."
cat > "$PROJECT_ROOT/.env.prod.notificaciones" << 'EOF'
# EC2-Notificaciones: 44.192.74.171 (pública), 172.31.65.57 (privada)

NODE_ENV=production
PORT=5005

# MQTT / Messaging
MESSAGING_BROKER=mqtt://172.31.73.6:1883
MESSAGING_TOPICS=notifications,tutoria,events

# Email (si es necesario)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=

LOG_LEVEL=info
EOF

# ============= EC2-Messaging =============
echo "📝 Generando .env para EC2-Messaging (MQTT Broker)..."
cat > "$PROJECT_ROOT/.env.prod.messaging" << 'EOF'
# EC2-Messaging: 18.205.26.214 (pública), 172.31.73.6 (privada)
# Mosquitto MQTT Broker configurado en docker-compose

MOSQUITTO_PORT=1883
MOSQUITTO_WEBSOCKET_PORT=9001
LOG_LEVEL=info
EOF

# ============= EC2-API-Gateway (Replica) =============
echo "📝 Generando .env para EC2-API-Gateway (replica)..."
cat > "$PROJECT_ROOT/.env.prod.api-gateway-replica" << 'EOF'
# EC2-API-Gateway: 52.71.188.181 (pública), 172.31.76.105 (privada)
# Esta es una réplica del API Gateway que proxea a EC2-CORE

NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Proxea a EC2-CORE (IP privada para menos latencia)
CORE_SERVICE=http://172.31.78.183:8080
AUTH_SERVICE=http://172.31.78.183:3000
MAESTROS_SERVICE=http://172.31.78.183:3002
ESTUDIANTES_SERVICE=http://172.31.78.183:3001

# Otros servicios
REPORTES_EST_SERVICE=http://172.31.69.133:5003
REPORTES_MAEST_SERVICE=http://172.31.69.133:5004
NOTIFICACIONES_SERVICE=http://172.31.65.57:5005

CORS_ORIGIN=http://107.21.124.81,http://172.31.69.203:5500

JWT_SECRET=prod-jwt-secret-key-minimum-32-chars-change-this
EOF

# ============= EC2-Frontend =============
echo "📝 Generando .env para EC2-Frontend (frontend-web, nginx)..."
cat > "$PROJECT_ROOT/.env.prod.frontend" << 'EOF'
# EC2-Frontend: 107.21.124.81 (pública), 172.31.69.203 (privada)

NODE_ENV=production
PORT=5500

# API Gateway (usar IP elástica para acceso desde frontend)
API_BASE_URL=http://52.71.188.181:8080
# O usar IP privada si frontend y gateway están en VPC privada
# API_BASE_URL=http://172.31.76.105:8080

ANALYTICS_ENABLED=true
LOG_LEVEL=info
EOF

# ============= EC2-Monitoring =============
echo "📝 Generando .env para EC2-Monitoring (Prometheus, Grafana)..."
cat > "$PROJECT_ROOT/.env.prod.monitoring" << 'EOF'
# EC2-Monitoring: 54.198.235.28 (pública), 172.31.71.151 (privada)

# Prometheus
PROMETHEUS_RETENTION=30d
PROMETHEUS_SCRAPE_INTERVAL=15s

# Grafana
GRAFANA_ADMIN_PASSWORD=AdminGrafana123!
GRAFANA_USERS_ALLOW_SIGN_UP=false

# Targets para scraping (IPs privadas)
PROMETHEUS_TARGETS=172.31.78.183:8080,172.31.78.183:3000,172.31.78.183:3001,172.31.78.183:3002,172.31.69.133:5003,172.31.69.133:5004,172.31.65.57:5005

LOG_LEVEL=info
EOF

echo ""
echo "✅ Archivos .env generados:"
ls -lh "$PROJECT_ROOT/.env.prod.*"
echo ""
echo "📝 Próximos pasos:"
echo "1. Revisar y personalizar archivos .env.prod.*"
echo "2. Hacer commit de AWS_DEPLOYMENT.md"
echo "3. Crear GitHub Actions workflows para deploy automático"
echo "4. Ejecutar workflows para desplegar en cada instancia"
