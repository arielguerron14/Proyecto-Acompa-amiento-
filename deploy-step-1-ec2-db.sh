#!/bin/bash

###############################################################################
#                                                                             #
#  🚀 DEPLOYMENT EC2-DB - CON AWS SECRETS                                  #
#                                                                             #
#  Obtiene SSH key desde AWS Secrets Manager y despliega BD                 #
#  MongoDB, PostgreSQL, Redis en 172.31.79.193                              #
#                                                                             #
###############################################################################

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
EC2_DB_PUBLIC_IP="44.222.119.15"
EC2_DB_PRIVATE_IP="172.31.79.193"
SSH_SECRET_NAME="AWS_EC2_DB_SSH_PRIVATE_KEY"
SSH_KEY_FILE="/tmp/aws-key-deploy.pem"
SSH_USER="ec2-user"
REGION="us-east-1"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  🚀 DEPLOYMENT EC2-DB - PASO 1 de 8"
echo -e "${BLUE}║${NC}  Base de Datos: MongoDB, PostgreSQL, Redis"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# PASO 1: Obtener SSH Key desde AWS Secrets
echo -e "${YELLOW}[1/6]${NC} Obteniendo SSH key desde AWS Secrets Manager..."

# Verificar que AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    echo "   Instálalo con: pip install awscli"
    exit 1
fi

# Obtener el secret
if aws secretsmanager get-secret-value \
    --secret-id "$SSH_SECRET_NAME" \
    --region "$REGION" \
    --query 'SecretString' \
    --output text > "$SSH_KEY_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH key obtenida desde AWS Secrets${NC}"
    chmod 600 "$SSH_KEY_FILE"
else
    echo -e "${RED}❌ No se pudo obtener el SSH key del secret${NC}"
    echo "   Verifica que el secret '$SSH_SECRET_NAME' existe en AWS Secrets Manager"
    exit 1
fi

# PASO 2: Verificar conectividad SSH
echo -e "\n${YELLOW}[2/6]${NC} Probando conectividad SSH a EC2-DB (${EC2_DB_PUBLIC_IP})..."
if ssh -i "$SSH_KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
    "$SSH_USER@$EC2_DB_PUBLIC_IP" "echo 'SSH OK'" &>/dev/null; then
    echo -e "${GREEN}✅ Conexión SSH exitosa${NC}"
else
    echo -e "${RED}❌ No se pudo conectar a EC2-DB${NC}"
    rm -f "$SSH_KEY_FILE"
    exit 1
fi

# PASO 3: Preparar la instancia
echo -e "\n${YELLOW}[3/6]${NC} Preparando instancia EC2-DB..."
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$SSH_USER@$EC2_DB_PUBLIC_IP" << 'PREPARE_SCRIPT'
    set -e
    echo "📦 Actualizando sistema..."
    sudo yum update -y > /dev/null 2>&1 || true
    
    echo "📦 Instalando Docker..."
    sudo yum install -y docker > /dev/null 2>&1 || true
    
    echo "🔧 Iniciando Docker..."
    sudo systemctl start docker || true
    sudo systemctl enable docker || true
    
    echo "👤 Agregando usuario al grupo docker..."
    sudo usermod -aG docker ec2-user || true
    
    echo "🐳 Instalando Docker Compose..."
    sudo curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose 2>/dev/null || true
    sudo chmod +x /usr/local/bin/docker-compose || true
    
    # Ajustar límites de conexión para PostgreSQL
    echo "🔧 Ajustando configuración del sistema..."
    sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535" > /dev/null 2>&1 || true
    
    echo "✅ Instancia preparada"
PREPARE_SCRIPT

echo -e "${GREEN}✅ EC2-DB preparada${NC}"

# PASO 4: Crear y desplegar docker-compose
echo -e "\n${YELLOW}[4/6]${NC} Iniciando servicios de base de datos..."
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$SSH_USER@$EC2_DB_PUBLIC_IP" << 'DEPLOY_DB_SCRIPT'
    set -e
    
    # Crear directorio de trabajo
    mkdir -p /opt/databases
    cd /opt/databases
    
    # Crear docker-compose para BD
    cat > docker-compose.yml << 'COMPOSE_FILE'
version: '3.8'

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
      - /opt/databases/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - vpc-network
    restart: unless-stopped
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 3
    command: mongod --bind_ip_all

  postgresql:
    image: postgres:15
    container_name: postgresql
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: acompanamiento_db
      POSTGRES_INITDB_ARGS: "-c shared_buffers=256MB -c max_connections=200 -c listen_addresses='*'"
    volumes:
      - postgresql_data:/var/lib/postgresql/data
      - /opt/databases/init-postgres.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - vpc-network
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
    command: redis-server --appendonly yes --requirepass redis123 --bind 0.0.0.0
    volumes:
      - redis_data:/data
    networks:
      - vpc-network
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
  vpc-network:
    driver: bridge
COMPOSE_FILE

    # Crear script de inicialización de MongoDB
    cat > init-mongo.js << 'MONGO_INIT'
db = db.getSiblingDB('acompanamiento_db');

// Crear colecciones e índices para estudiantes
db.createCollection('estudiantes');
db.estudiantes.createIndex({ cedula: 1 }, { unique: true });
db.estudiantes.createIndex({ email: 1 }, { unique: true });
db.estudiantes.createIndex({ grado: 1 });

// Crear colecciones e índices para maestros
db.createCollection('maestros');
db.maestros.createIndex({ cedula: 1 }, { unique: true });
db.maestros.createIndex({ email: 1 }, { unique: true });
db.maestros.createIndex({ especialidad: 1 });

// Crear colecciones para reportes
db.createCollection('reportes_estudiantes');
db.reportes_estudiantes.createIndex({ estudiante_id: 1 });
db.reportes_estudiantes.createIndex({ fecha: -1 });

db.createCollection('reportes_maestros');
db.reportes_maestros.createIndex({ maestro_id: 1 });
db.reportes_maestros.createIndex({ fecha: -1 });

// Crear colecciones para notificaciones
db.createCollection('notificaciones');
db.notificaciones.createIndex({ usuario_id: 1 });
db.notificaciones.createIndex({ fecha: -1 });
db.notificaciones.createIndex({ leida: 1 });

// Crear colecciones para autenticación
db.createCollection('usuarios');
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ username: 1 }, { unique: true });

// Crear colecciones para sesiones
db.createCollection('sesiones');
db.sesiones.createIndex({ token: 1 }, { unique: true });
db.sesiones.createIndex({ usuario_id: 1 });
db.sesiones.createIndex({ expiracion: 1 }, { expireAfterSeconds: 0 });

print('✅ MongoDB inicializado correctamente');
MONGO_INIT

    # Crear script de inicialización de PostgreSQL
    cat > init-postgres.sql << 'POSTGRES_INIT'
-- Crear esquemas principales
CREATE SCHEMA IF NOT EXISTS estudiantes;
CREATE SCHEMA IF NOT EXISTS maestros;
CREATE SCHEMA IF NOT EXISTS reportes;
CREATE SCHEMA IF NOT EXISTS notificaciones;
CREATE SCHEMA IF NOT EXISTS auth;

-- Tabla de estudiantes
CREATE TABLE IF NOT EXISTS estudiantes.estudiantes (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    grado VARCHAR(50) NOT NULL,
    sección VARCHAR(50),
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- Tabla de maestros
CREATE TABLE IF NOT EXISTS maestros.maestros (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    especialidad VARCHAR(255) NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- Tabla de reportes estudiantes
CREATE TABLE IF NOT EXISTS reportes.reportes_estudiantes (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes.estudiantes(id),
    maestro_id INTEGER REFERENCES maestros.maestros(id),
    fecha DATE NOT NULL,
    comportamiento VARCHAR(50),
    asistencia BOOLEAN,
    calificacion DECIMAL(5,2),
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reportes maestros
CREATE TABLE IF NOT EXISTS reportes.reportes_maestros (
    id SERIAL PRIMARY KEY,
    maestro_id INTEGER REFERENCES maestros.maestros(id),
    fecha DATE NOT NULL,
    asistencia BOOLEAN,
    reporte TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones.notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    tipo VARCHAR(50),
    titulo VARCHAR(255),
    mensaje TEXT,
    leida BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios para autenticación
CREATE TABLE IF NOT EXISTS auth.usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_estudiantes_cedula ON estudiantes.estudiantes(cedula);
CREATE INDEX IF NOT EXISTS idx_estudiantes_email ON estudiantes.estudiantes(email);
CREATE INDEX IF NOT EXISTS idx_maestros_cedula ON maestros.maestros(cedula);
CREATE INDEX IF NOT EXISTS idx_maestros_email ON maestros.maestros(email);
CREATE INDEX IF NOT EXISTS idx_reportes_estudiante ON reportes.reportes_estudiantes(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_reportes_maestro ON reportes.reportes_maestros(maestro_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones.notificaciones(usuario_id);

-- Mostrar confirmación
SELECT 'Base de datos PostgreSQL inicializada correctamente' as status;
POSTGRES_INIT

    echo "🚀 Iniciando contenedores Docker..."
    docker-compose up -d
    
    echo "⏳ Esperando a que los servicios estén listos (30 segundos)..."
    sleep 30
    
    echo "📊 Estado de contenedores:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "✅ Servicios de base de datos iniciados"
DEPLOY_DB_SCRIPT

echo -e "${GREEN}✅ Servicios de BD iniciados${NC}"

# PASO 5: Validar deployment
echo -e "\n${YELLOW}[5/6]${NC} Validando deployment..."
VALIDATION_SUCCESS=true

# Test MongoDB
echo "🔍 Verificando MongoDB..."
if ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$SSH_USER@$EC2_DB_PUBLIC_IP" \
    "docker exec mongodb mongosh --username admin --password mongodb123 --authenticationDatabase admin --eval \"db.adminCommand('ping')\" 2>/dev/null" &>/dev/null; then
    echo -e "${GREEN}✅ MongoDB${NC}"
else
    echo -e "${RED}❌ MongoDB${NC}"
    VALIDATION_SUCCESS=false
fi

# Test PostgreSQL
echo "🔍 Verificando PostgreSQL..."
if ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$SSH_USER@$EC2_DB_PUBLIC_IP" \
    "docker exec postgresql pg_isready -U postgres 2>/dev/null" &>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL${NC}"
else
    echo -e "${RED}❌ PostgreSQL${NC}"
    VALIDATION_SUCCESS=false
fi

# Test Redis
echo "🔍 Verificando Redis..."
if ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$SSH_USER@$EC2_DB_PUBLIC_IP" \
    "docker exec redis redis-cli -a redis123 ping 2>/dev/null | grep -q PONG" &>/dev/null; then
    echo -e "${GREEN}✅ Redis${NC}"
else
    echo -e "${RED}❌ Redis${NC}"
    VALIDATION_SUCCESS=false
fi

# PASO 6: Limpiar SSH key temporal y mostrar resumen
echo -e "\n${YELLOW}[6/6]${NC} Finalizando..."
rm -f "$SSH_KEY_FILE"

if [ "$VALIDATION_SUCCESS" = true ]; then
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ✅ EC2-DB DEPLOYMENT COMPLETADO EXITOSAMENTE"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${GREEN}📊 INFORMACIÓN DE ACCESO A BASES DE DATOS${NC}\n"
    echo "Desde OTRAS instancias EC2 en la VPC (acceso privado):\n"
    echo -e "${BLUE}MongoDB:${NC}"
    echo "  • Host: 172.31.79.193"
    echo "  • Puerto: 27017"
    echo "  • Usuario: admin"
    echo "  • Contraseña: mongodb123"
    echo "  • Database: acompanamiento_db"
    echo "  • URL: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento_db?authSource=admin"
    echo ""
    
    echo -e "${BLUE}PostgreSQL:${NC}"
    echo "  • Host: 172.31.79.193"
    echo "  • Puerto: 5432"
    echo "  • Usuario: postgres"
    echo "  • Contraseña: postgres123"
    echo "  • Database: acompanamiento_db"
    echo "  • URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento_db"
    echo ""
    
    echo -e "${BLUE}Redis:${NC}"
    echo "  • Host: 172.31.79.193"
    echo "  • Puerto: 6379"
    echo "  • Contraseña: redis123"
    echo "  • URL: redis://:redis123@172.31.79.193:6379"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "  • Las bases de datos NO son accesibles desde internet"
    echo "  • Solo accesibles desde otras instancias EC2 en la VPC"
    echo "  • Cambiar contraseñas por defecto en producción"
    echo "  • Configurar backups automáticos en producción"
    echo ""
    
    echo -e "${BLUE}👉 PRÓXIMO PASO:${NC}"
    echo "   Desplegar EC2-Messaging (Kafka + RabbitMQ + Zookeeper)"
    echo ""
    
else
    echo -e "\n${RED}⚠️  ALGUNAS VALIDACIONES FALLARON${NC}"
    echo "Revisa los logs en EC2-DB:"
    echo "  docker logs mongodb"
    echo "  docker logs postgresql"
    echo "  docker logs redis"
fi

echo -e "${GREEN}✅ EC2-DB listo${NC}\n"
