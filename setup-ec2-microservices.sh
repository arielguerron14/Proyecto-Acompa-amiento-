#!/bin/bash

# ============================================================
# SETUP SCRIPT PARA AWS EC2-MICROSERVICIOS
# ============================================================
# Instala Docker y prepara la instancia EC2-Microservicios
# para desplegar los microservicios
#
# Uso:
#   chmod +x setup-ec2-microservices.sh
#   ./setup-ec2-microservices.sh <IP_PRIVADA_EC2_DB>
# ============================================================

set -e  # Salir ante cualquier error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Validar argumentos
if [ $# -eq 0 ]; then
    log_error "Debes proporcionar la IP privada de EC2-DB como argumento"
    echo "Uso: ./setup-ec2-microservices.sh 172.31.79.193"
    exit 1
fi

EC2_DB_PRIVATE_IP=$1

# ============================================================
# PASO 1: Actualizar sistema
# ============================================================
log_info "Actualizando sistema..."
sudo yum update -y
log_success "Sistema actualizado"

# ============================================================
# PASO 2: Instalar Docker
# ============================================================
log_info "Instalando Docker..."
sudo yum install -y docker
log_success "Docker instalado"

# ============================================================
# PASO 3: Instalar Git
# ============================================================
log_info "Instalando Git..."
sudo yum install -y git
log_success "Git instalado"

# ============================================================
# PASO 4: Iniciar servicio Docker
# ============================================================
log_info "Iniciando servicio Docker..."
sudo systemctl start docker
sudo systemctl enable docker
log_success "Docker iniciado y habilitado para iniciar automáticamente"

# ============================================================
# PASO 5: Configurar permisos para usuario actual
# ============================================================
log_info "Configurando permisos de Docker para usuario actual..."
CURRENT_USER=$(whoami)

if [ "$CURRENT_USER" != "root" ]; then
    sudo usermod -aG docker "$CURRENT_USER"
    log_success "Usuario $CURRENT_USER agregado al grupo docker"
    log_warning "Reinicia la sesión SSH para que los cambios tengan efecto"
else
    log_success "Ejecutándose como root (sin cambios de grupo necesarios)"
fi

# ============================================================
# PASO 6: Instalar Docker Compose
# ============================================================
log_info "Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
log_success "Docker Compose instalado"

# ============================================================
# PASO 7: Clonar repositorio del proyecto
# ============================================================
log_info "Clonando repositorio del proyecto..."
if [ ! -d "Proyecto-Acompa-amiento" ]; then
    git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
    cd Proyecto-Acompa-amiento-
else
    cd Proyecto-Acompa-amiento-
    git pull origin main || git pull origin ci/no-auto-deploy || true
fi
log_success "Repositorio clonado/actualizado"

# ============================================================
# PASO 8: Crear archivo .env con IPs de EC2-DB
# ============================================================
log_info "Creando archivo .env con configuración de EC2-DB..."

# Verificar conectividad a EC2-DB
log_info "Verificando conectividad a EC2-DB ($EC2_DB_PRIVATE_IP)..."
if timeout 5 bash -c "echo > /dev/tcp/$EC2_DB_PRIVATE_IP/27017" 2>/dev/null; then
    log_success "MongoDB accesible en $EC2_DB_PRIVATE_IP:27017"
else
    log_warning "No se pudo alcanzar MongoDB en $EC2_DB_PRIVATE_IP:27017"
    log_warning "Verifica que EC2-DB está corriendo y el Security Group permite el tráfico"
fi

# Crear .env basado en .env.aws
cat > .env << EOF
# ============================================================
# CONFIGURACIÓN DE AWS EC2
# ============================================================
NODE_ENV=production
SERVICE_VERSION=1.0.0

# ============================================================
# BASES DE DATOS (EC2-DB)
# ============================================================
DB_HOST=$EC2_DB_PRIVATE_IP
MONGO_URL=mongodb://$EC2_DB_PRIVATE_IP:27017/acompanamiento
MONGO_URI=mongodb://$EC2_DB_PRIVATE_IP:27017/estudiantesdb
POSTGRES_HOST=$EC2_DB_PRIVATE_IP
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=acompanamiento
REDIS_HOST=$EC2_DB_PRIVATE_IP
REDIS_PORT=6379
REDIS_URL=redis://$EC2_DB_PRIVATE_IP:6379

# ============================================================
# CONFIGURACIÓN DE PUERTOS
# ============================================================
MICRO_AUTH_PORT=5005
MICRO_MAESTROS_PORT=5001
MICRO_ESTUDIANTES_PORT=5002
MICRO_REPORTES_ESTUDIANTES_PORT=5003
MICRO_REPORTES_MAESTROS_PORT=5004
MICRO_NOTIFICACIONES_PORT=5006
MICRO_ANALYTICS_PORT=5007
MICRO_SOAP_BRIDGE_PORT=5008
API_GATEWAY_PORT=8080
FRONTEND_PORT=5500

# ============================================================
# CONFIGURACIÓN DE MESSAGERÍA
# ============================================================
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=micro-aws
KAFKA_LOG_LEVEL=2
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_MAX_CONNECTIONS=100
RABBITMQ_HEARTBEAT=60
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=micro-aws-telemetry
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_RECONNECT_PERIOD=1000
MQTT_CONNECT_TIMEOUT=10000

# ============================================================
# AUTENTICACIÓN Y SEGURIDAD
# ============================================================
JWT_SECRET=CAMBIAR_EN_PRODUCCION
JWT_EXPIRY=24h
REFRESH_SECRET=CAMBIAR_EN_PRODUCCION
ACCESS_TOKEN_EXPIRES_IN=900
REFRESH_TOKEN_EXPIRES_IN=604800

# ============================================================
# LOGGING
# ============================================================
LOG_LEVEL=info
DEBUG=false

# ============================================================
# CARACTERÍSTICAS
# ============================================================
EVENTBUS_ENABLED=true
MESSAGEQUEUE_ENABLED=true
TELEMETRY_ENABLED=true

# ============================================================
# DOCKER HUB
# ============================================================
DOCKERHUB_ACCOUNT=your-dockerhub-username
REPO_PREFIX=acompanamiento
TAG=latest
EOF

log_success ".env creado con configuración de EC2-DB"

# ============================================================
# PASO 9: Mostrar información
# ============================================================
log_success "Setup completado"
echo ""
echo -e "${GREEN}=== INFORMACIÓN DE EC2-MICROSERVICIOS ===${NC}"
echo ""
log_info "IP Privada EC2-DB configurada: $EC2_DB_PRIVATE_IP"
echo ""

# Obtener IP privada de esta instancia
MICROSERVICES_PRIVATE_IP=$(ec2-metadata --local-ipv4 2>/dev/null | cut -d " " -f 2 || hostname -I | awk '{print $1}')
log_info "IP Privada EC2-Microservicios: $MICROSERVICES_PRIVATE_IP"
echo ""

# ============================================================
# PASO 10: Mostrar próximos pasos
# ============================================================
echo -e "${GREEN}=== PRÓXIMOS PASOS ===${NC}"
echo ""
echo "1. Reinicia la sesión SSH para que los permisos de Docker tengan efecto:"
echo "   exit"
echo "   ssh -i tu-clave.pem ec2-user@$MICROSERVICES_PRIVATE_IP"
echo ""
echo "2. Verifica la conectividad a las bases de datos:"
echo "   nc -zv $EC2_DB_PRIVATE_IP 27017  # MongoDB"
echo "   nc -zv $EC2_DB_PRIVATE_IP 5432   # PostgreSQL"
echo "   nc -zv $EC2_DB_PRIVATE_IP 6379   # Redis"
echo ""
echo "3. Despliega los microservicios:"
echo "   cd Proyecto-Acompa-amiento-"
echo "   docker-compose -f docker-compose.aws.yml up -d"
echo ""
echo "4. Verifica que los servicios estén corriendo:"
echo "   docker-compose -f docker-compose.aws.yml ps"
echo ""
echo "5. Revisa los logs:"
echo "   docker-compose -f docker-compose.aws.yml logs -f api-gateway"
echo ""
echo "6. Accede a la aplicación:"
echo "   http://$MICROSERVICES_PRIVATE_IP:8080 (API Gateway)"
echo "   http://$MICROSERVICES_PRIVATE_IP:5500 (Frontend)"
echo ""
echo -e "${GREEN}=========================================${NC}"
