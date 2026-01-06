#!/bin/bash

###############################################################################
#                                                                             #
#  🚀 SCRIPT MAESTRO DE DEPLOYMENT AUTOMATIZADO                            #
#                                                                             #
#  Deployea automáticamente todos los servicios en sus instancias EC2       #
#  Orden: DB → Messaging → Monitoring → CORE → API-GW → Frontend →         #
#         Reportes → Notificaciones                                          #
#                                                                             #
###############################################################################

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
KEY_FILE="${KEY_FILE:-~/.ssh/aws-key.pem}"
USER="${USER:-ec2-user}"
REGION="us-east-1"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# IPs de instancias
declare -A INSTANCES=(
  ["DB"]="44.222.119.15"
  ["MESSAGING"]="3.235.24.36"
  ["MONITORING"]="54.198.235.28"
  ["CORE"]="13.216.12.61"
  ["API_GATEWAY"]="52.71.188.181"
  ["FRONTEND"]="107.21.124.81"
  ["REPORTES"]="54.175.62.79"
  ["NOTIFICACIONES"]="100.31.143.213"
)

###############################################################################
# FUNCIONES AUXILIARES
###############################################################################

log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
  echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

header() {
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}" | tee -a "$LOG_FILE"
  echo -e "${BLUE}║${NC} $1" | tee -a "$LOG_FILE"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n" | tee -a "$LOG_FILE"
}

# Verificar si un archivo existe
check_file() {
  if [[ ! -f "$1" ]]; then
    error "Archivo no encontrado: $1"
    return 1
  fi
  return 0
}

# SSH helper function
ssh_exec() {
  local instance=$1
  local ip=$2
  local commands=$3
  
  log "Ejecutando en $instance ($ip)..."
  ssh -i "$KEY_FILE" -o ConnectTimeout=10 "$USER@$ip" "$commands" 2>&1 | tee -a "$LOG_FILE"
}

# SCP helper function
scp_files() {
  local source=$1
  local ip=$2
  local dest=$3
  
  log "Copiando $source a $ip:$dest..."
  scp -i "$KEY_FILE" -r "$source" "$USER@$ip:$dest" 2>&1 | tee -a "$LOG_FILE"
}

# Verificar conectividad SSH
test_ssh_connection() {
  local ip=$1
  local instance=$2
  
  log "Probando conexión SSH a $instance ($ip)..."
  if ssh -i "$KEY_FILE" -o ConnectTimeout=5 "$USER@$ip" "echo 'OK'" &>/dev/null; then
    success "Conexión SSH a $instance OK"
    return 0
  else
    error "Conexión SSH a $instance FALLÓ"
    return 1
  fi
}

# Preparar instancia
prepare_instance() {
  local ip=$1
  local instance=$2
  
  header "PREPARANDO INSTANCIA: $instance ($ip)"
  
  ssh_exec "$instance" "$ip" << 'PREPARE_SCRIPT'
    set -e
    
    echo "Actualizando sistema..."
    sudo yum update -y > /dev/null 2>&1
    
    echo "Instalando Docker..."
    sudo yum install -y docker > /dev/null 2>&1
    
    echo "Iniciando Docker..."
    sudo systemctl start docker
    sudo systemctl enable docker
    
    echo "Agregando usuario al grupo docker..."
    sudo usermod -aG docker ec2-user
    
    echo "Instalando Docker Compose..."
    sudo curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "Instalando herramientas..."
    sudo yum install -y git curl wget nc > /dev/null 2>&1
    
    docker --version
    docker-compose --version
PREPARE_SCRIPT
  
  success "Instancia $instance preparada"
}

###############################################################################
# FUNCIONES DE DEPLOYMENT POR SERVICIO
###############################################################################

deploy_db() {
  local ip="${INSTANCES[DB]}"
  header "DEPLOYMENT: EC2-DB ($ip)"
  
  test_ssh_connection "$ip" "EC2-DB" || return 1
  prepare_instance "$ip" "EC2-DB"
  
  log "Copiando archivos de configuración..."
  scp_files "docker-compose.databases.yml" "$ip" "/tmp/"
  scp_files "databases/docker-compose.yml" "$ip" "/tmp/" 2>/dev/null || warning "archivo databases no encontrado"
  
  log "Iniciando servicios de BD..."
  ssh_exec "EC2-DB" "$ip" << 'DEPLOY_DB'
    cd /tmp
    docker-compose -f docker-compose.databases.yml up -d
    sleep 30
    docker ps | grep -E "mongo|postgres|redis"
DEPLOY_DB
  
  success "EC2-DB deployment completado"
}

deploy_messaging() {
  local ip="${INSTANCES[MESSAGING]}"
  header "DEPLOYMENT: EC2-MESSAGING ($ip)"
  
  test_ssh_connection "$ip" "EC2-Messaging" || return 1
  prepare_instance "$ip" "EC2-Messaging"
  
  log "Copiando archivos..."
  scp_files "docker-compose.messaging.yml" "$ip" "/tmp/"
  
  log "Iniciando Kafka, RabbitMQ y Zookeeper..."
  ssh_exec "EC2-Messaging" "$ip" << 'DEPLOY_MESSAGING'
    cd /tmp
    docker-compose -f docker-compose.messaging.yml up -d
    sleep 20
    docker ps | grep -E "kafka|zookeeper|rabbitmq"
DEPLOY_MESSAGING
  
  success "EC2-Messaging deployment completado"
}

deploy_monitoring() {
  local ip="${INSTANCES[MONITORING]}"
  header "DEPLOYMENT: EC2-MONITORING ($ip)"
  
  test_ssh_connection "$ip" "EC2-Monitoring" || return 1
  prepare_instance "$ip" "EC2-Monitoring"
  
  log "Copiando archivos..."
  scp_files "docker-compose.monitoring.yml" "$ip" "/tmp/"
  
  log "Iniciando Prometheus y Grafana..."
  ssh_exec "EC2-Monitoring" "$ip" << 'DEPLOY_MONITORING'
    cd /tmp
    docker-compose -f docker-compose.monitoring.yml up -d
    sleep 15
    docker ps | grep -E "prometheus|grafana"
DEPLOY_MONITORING
  
  success "EC2-Monitoring deployment completado"
  log "Prometheus: http://$ip:9090"
  log "Grafana: http://$ip:3001"
}

deploy_core() {
  local ip="${INSTANCES[CORE]}"
  header "DEPLOYMENT: EC2-CORE ($ip)"
  
  test_ssh_connection "$ip" "EC2-CORE" || return 1
  prepare_instance "$ip" "EC2-CORE"
  
  log "Clonando repositorio..."
  ssh_exec "EC2-CORE" "$ip" << 'CLONE'
    cd /tmp
    git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git 2>/dev/null || cd Proyecto-Acompa-amiento-
CLONE
  
  log "Copiando archivos..."
  scp_files "docker-compose.core.yml" "$ip" "/tmp/"
  scp_files ".env" "$ip" "/tmp/" 2>/dev/null || warning ".env no encontrado, usar valores por defecto"
  
  log "Iniciando microservicios..."
  ssh_exec "EC2-CORE" "$ip" << 'DEPLOY_CORE'
    cd /tmp
    docker-compose -f docker-compose.core.yml up -d
    sleep 25
    docker ps | grep -E "micro-auth|micro-estudiantes|micro-maestros"
DEPLOY_CORE
  
  success "EC2-CORE deployment completado"
  log "micro-auth: http://$ip:3000"
  log "micro-estudiantes: http://$ip:3001"
  log "micro-maestros: http://$ip:3002"
}

deploy_api_gateway() {
  local ip="${INSTANCES[API_GATEWAY]}"
  header "DEPLOYMENT: EC2-API-GATEWAY ($ip)"
  
  test_ssh_connection "$ip" "EC2-API-Gateway" || return 1
  prepare_instance "$ip" "EC2-API-Gateway"
  
  log "Copiando archivos..."
  scp_files "docker-compose.api-gateway.yml" "$ip" "/tmp/"
  scp_files ".env" "$ip" "/tmp/" 2>/dev/null || warning ".env no encontrado"
  
  log "Iniciando API Gateway..."
  ssh_exec "EC2-API-Gateway" "$ip" << 'DEPLOY_GATEWAY'
    cd /tmp
    docker-compose -f docker-compose.api-gateway.yml up -d
    sleep 15
    docker ps | grep api-gateway
DEPLOY_GATEWAY
  
  success "EC2-API-Gateway deployment completado"
  log "API Gateway: http://$ip:8080"
}

deploy_frontend() {
  local ip="${INSTANCES[FRONTEND]}"
  header "DEPLOYMENT: EC2-FRONTEND ($ip)"
  
  test_ssh_connection "$ip" "EC2-Frontend" || return 1
  prepare_instance "$ip" "EC2-Frontend"
  
  log "Copiando archivos..."
  scp_files "docker-compose.frontend.yml" "$ip" "/tmp/"
  scp_files "frontend-web/" "$ip" "/tmp/" 2>/dev/null || warning "frontend-web no encontrado"
  
  log "Iniciando Frontend..."
  ssh_exec "EC2-Frontend" "$ip" << 'DEPLOY_FRONTEND'
    cd /tmp
    docker-compose -f docker-compose.frontend.yml up -d
    sleep 15
    docker ps | grep frontend
DEPLOY_FRONTEND
  
  success "EC2-Frontend deployment completado"
  log "Frontend: http://$ip"
}

deploy_reportes() {
  local ip="${INSTANCES[REPORTES]}"
  header "DEPLOYMENT: EC2-REPORTES ($ip)"
  
  test_ssh_connection "$ip" "EC2-Reportes" || return 1
  prepare_instance "$ip" "EC2-Reportes"
  
  log "Copiando archivos..."
  scp_files "docker-compose.reportes.yml" "$ip" "/tmp/"
  scp_files ".env" "$ip" "/tmp/" 2>/dev/null || warning ".env no encontrado"
  
  log "Iniciando Reportes..."
  ssh_exec "EC2-Reportes" "$ip" << 'DEPLOY_REPORTES'
    cd /tmp
    docker-compose -f docker-compose.reportes.yml up -d
    sleep 15
    docker ps | grep reportes
DEPLOY_REPORTES
  
  success "EC2-Reportes deployment completado"
  log "Reportes: http://$ip:5003, http://$ip:5004"
}

deploy_notificaciones() {
  local ip="${INSTANCES[NOTIFICACIONES]}"
  header "DEPLOYMENT: EC2-NOTIFICACIONES ($ip)"
  
  test_ssh_connection "$ip" "EC2-Notificaciones" || return 1
  prepare_instance "$ip" "EC2-Notificaciones"
  
  log "Copiando archivos..."
  scp_files "docker-compose.notificaciones.yml" "$ip" "/tmp/"
  scp_files ".env" "$ip" "/tmp/" 2>/dev/null || warning ".env no encontrado"
  
  log "Iniciando Notificaciones..."
  ssh_exec "EC2-Notificaciones" "$ip" << 'DEPLOY_NOTIF'
    cd /tmp
    docker-compose -f docker-compose.notificaciones.yml up -d
    sleep 15
    docker ps | grep notificaciones
DEPLOY_NOTIF
  
  success "EC2-Notificaciones deployment completado"
  log "Notificaciones: http://$ip:5006"
}

###############################################################################
# VALIDACIÓN POST-DEPLOYMENT
###############################################################################

validate_deployment() {
  header "VALIDACIÓN POST-DEPLOYMENT"
  
  local failed=0
  
  # Validar BD
  log "Validando EC2-DB..."
  if ssh -i "$KEY_FILE" "$USER@${INSTANCES[DB]}" "docker ps | grep -q postgres" 2>/dev/null; then
    success "EC2-DB: OK"
  else
    error "EC2-DB: FALLÓ"
    ((failed++))
  fi
  
  # Validar servicios
  for service in CORE API_GATEWAY FRONTEND REPORTES NOTIFICACIONES; do
    log "Validando EC2-$service..."
    if ssh -i "$KEY_FILE" "$USER@${INSTANCES[$service]}" "docker ps | grep -q 'Up'" 2>/dev/null; then
      success "EC2-$service: OK"
    else
      error "EC2-$service: FALLÓ"
      ((failed++))
    fi
  done
  
  if [[ $failed -eq 0 ]]; then
    success "TODAS LAS INSTANCIAS VALIDADAS EXITOSAMENTE"
    return 0
  else
    error "$failed instancias presentan problemas"
    return 1
  fi
}

###############################################################################
# MENÚ PRINCIPAL
###############################################################################

show_menu() {
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}    🚀 DEPLOYMENT AUTOMATIZADO - SELECCIONA OPCIÓN"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
  
  echo "1. Deploy TODO (orden recomendado)"
  echo "2. Deploy solo bases de datos"
  echo "3. Deploy solo mensajería"
  echo "4. Deploy solo microservicios"
  echo "5. Deploy solo frontend"
  echo "6. Validar deployment"
  echo "7. Ver logs"
  echo "0. Salir"
  echo ""
}

main() {
  header "🚀 DEPLOYMENT AUTOMATIZADO - PROYECTO ACOMPAÑAMIENTO"
  
  # Verificar archivos necesarios
  log "Verificando archivos necesarios..."
  check_file "docker-compose.core.yml" || exit 1
  check_file "docker-compose.api-gateway.yml" || exit 1
  
  while true; do
    show_menu
    read -p "Selecciona opción (0-7): " choice
    
    case $choice in
      1)
        deploy_db && \
        deploy_messaging && \
        deploy_monitoring && \
        deploy_core && \
        deploy_api_gateway && \
        deploy_frontend && \
        deploy_reportes && \
        deploy_notificaciones && \
        validate_deployment
        ;;
      2) deploy_db ;;
      3) deploy_messaging ;;
      4) deploy_core && deploy_api_gateway ;;
      5) deploy_frontend ;;
      6) validate_deployment ;;
      7) tail -f "$LOG_FILE" ;;
      0) 
        log "¡Adiós!"
        exit 0
        ;;
      *)
        error "Opción inválida"
        ;;
    esac
  done
}

# Ejecutar si no se pasan argumentos
if [[ $# -eq 0 ]]; then
  main
else
  # Permitir ejecución de funciones individuales
  "$@"
fi
