#!/bin/bash

# ============================================================
# SETUP SCRIPT PARA AWS EC2-DB
# ============================================================
# Instala Docker y prepara la instancia EC2-DB para despliegue
# de PostgreSQL, MongoDB y Redis como contenedores Docker
#
# Uso:
#   chmod +x setup-ec2-db.sh
#   ./setup-ec2-db.sh
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
# PASO 3: Iniciar servicio Docker
# ============================================================
log_info "Iniciando servicio Docker..."
sudo systemctl start docker
sudo systemctl enable docker
log_success "Docker iniciado y habilitado para iniciar automáticamente"

# ============================================================
# PASO 4: Configurar permisos para usuario actual
# ============================================================
log_info "Configurando permisos de Docker para usuario actual..."
CURRENT_USER=$(whoami)

if [ "$CURRENT_USER" != "root" ]; then
    sudo usermod -aG docker "$CURRENT_USER"
    log_success "Usuario $CURRENT_USER agregado al grupo docker"
    log_warning "Reinicia la sesión SSH para que los cambios tengan efecto"
    log_warning "O ejecuta: newgrp docker"
else
    log_success "Ejecutándose como root (sin cambios de grupo necesarios)"
fi

# ============================================================
# PASO 5: Instalar Docker Compose
# ============================================================
log_info "Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
log_success "Docker Compose instalado"

# ============================================================
# PASO 6: Crear directorios para volúmenes
# ============================================================
log_info "Creando directorios para volúmenes persistentes..."
mkdir -p /data/postgres /data/mongo /data/redis
sudo chmod 755 /data/postgres /data/mongo /data/redis
log_success "Directorios creados en /data"

# ============================================================
# PASO 7: Verificar instalación
# ============================================================
log_info "Verificando versiones instaladas..."
echo ""
docker --version
docker-compose --version
echo ""
log_success "Versiones verificadas"

# ============================================================
# PASO 8: Mostrar información de la instancia
# ============================================================
log_info "Información de la instancia..."
echo ""
log_info "IP Privada (importante para microservicios):"
PRIVATE_IP=$(ec2-metadata --local-ipv4 2>/dev/null | cut -d " " -f 2 || hostname -I | awk '{print $1}')
echo "${BLUE}$PRIVATE_IP${NC}"
echo ""

# ============================================================
# PASO 9: Mostrar próximos pasos
# ============================================================
log_success "Setup completado"
echo ""
echo -e "${GREEN}=== PRÓXIMOS PASOS ===${NC}"
echo ""
echo "1. Configura el Security Group de EC2-DB para permitir:"
echo "   - Puerto 5432 (PostgreSQL) desde EC2-Microservicios"
echo "   - Puerto 27017 (MongoDB) desde EC2-Microservicios"
echo "   - Puerto 6379 (Redis) desde EC2-Microservicios"
echo ""
echo "2. En GitHub, configura los Secrets:"
echo "   - AWS_EC2_DB_PRIVATE_IP: $PRIVATE_IP"
echo "   - AWS_EC2_DB_SSH_PRIVATE_KEY: (tu clave privada)"
echo "   - POSTGRES_PASSWORD_AWS: (contraseña segura)"
echo ""
echo "3. Ejecuta el workflow de GitHub Actions:"
echo "   - Actions -> Deploy Databases to AWS EC2-DB"
echo "   - Ingresa IP privada: $PRIVATE_IP"
echo "   - Selecciona ambiente (dev/staging/prod)"
echo ""
echo "4. Luego, en EC2-Microservicios:"
echo "   - Configura .env con:"
echo "     MONGO_URI=mongodb://$PRIVATE_IP:27017/acompanamiento"
echo "     POSTGRES_HOST=$PRIVATE_IP"
echo "     REDIS_URL=redis://$PRIVATE_IP:6379"
echo ""
echo "5. Despliega microservicios:"
echo "   docker-compose -f docker-compose.aws.yml up -d"
echo ""
echo -e "${GREEN}=========================================${NC}"
