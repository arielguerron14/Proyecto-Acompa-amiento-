#!/bin/bash

# bastion-connect.sh - Script para conectar al Bastion Host y otras instancias
# Uso: ./bastion-connect.sh [target] [command]

set -e

# Configuración
BASTION_IP="${BASTION_IP:-54.172.74.210}"
BASTION_USER="${BASTION_USER:-ec2-user}"
BASTION_KEY="${BASTION_KEY:-./ssh-key-bastion.pem}"

# Instancias conocidas
declare -A INSTANCES=(
    ["bastion"]="54.172.74.210"
    ["core"]="3.234.198.34"
    ["db"]="3.237.32.106"
    ["frontend"]="54.85.92.175"
    ["api-gateway"]="35.168.216.132"
    ["messaging"]="34.207.206.13"
    ["monitoring"]="34.203.175.72"
    ["notificaciones"]="35.175.200.15"
    ["reportes"]="3.94.74.223"
)

# IPs privadas (para acceso a través del Bastion)
declare -A PRIVATE_IPS=(
    ["core"]="172.31.66.255"
    ["db"]="172.31.78.151"
    ["frontend"]="172.31.70.190"
)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}=== Bastion Host Connection Tool ===${NC}"
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos disponibles:"
    echo "  connect [instancia]     - Conectar a una instancia via Bastion"
    echo "  list                    - Listar instancias disponibles"
    echo "  tunnel [servicio]       - Crear túnel SSH para un servicio"
    echo "  status                  - Verificar estado del Bastion"
    echo "  exec [instancia] [cmd]  - Ejecutar comando en instancia"
    echo "  help                    - Mostrar esta ayuda"
    echo ""
    echo "Instancias disponibles:"
    for inst in "${!INSTANCES[@]}"; do
        echo "  - $inst (${INSTANCES[$inst]})"
    done
    echo ""
    echo "Servicios para túneles:"
    echo "  - mongodb (27017)"
    echo "  - api-gateway (8080)"
    echo "  - grafana (3000)"
    echo "  - prometheus (9090)"
    echo "  - rabbitmq (5672)"
    echo ""
}

# Validar que la clave existe
if [ ! -f "$BASTION_KEY" ]; then
    echo -e "${RED}❌ Error: Archivo de clave no encontrado: $BASTION_KEY${NC}"
    exit 1
fi

chmod 600 "$BASTION_KEY"

# Comando: conectar
cmd_connect() {
    local target="${1:-bastion}"
    
    if [ -z "${INSTANCES[$target]}" ]; then
        echo -e "${RED}❌ Instancia desconocida: $target${NC}"
        exit 1
    fi
    
    local target_ip="${INSTANCES[$target]}"
    
    if [ "$target" = "bastion" ]; then
        echo -e "${GREEN}🔗 Conectando al Bastion Host...${NC}"
        ssh -i "$BASTION_KEY" "${BASTION_USER}@${BASTION_IP}"
    else
        echo -e "${GREEN}🔗 Conectando a $target ($target_ip) via Bastion...${NC}"
        
        # Intentar con IP pública primero, luego con privada
        ssh -i "$BASTION_KEY" \
            -o StrictHostKeyChecking=no \
            -o ConnectTimeout=10 \
            -J "${BASTION_USER}@${BASTION_IP}" \
            "ubuntu@${target_ip}" 2>/dev/null || \
        ssh -i "$BASTION_KEY" \
            -o StrictHostKeyChecking=no \
            -J "${BASTION_USER}@${BASTION_IP}" \
            "ubuntu@${PRIVATE_IPS[$target]}"
    fi
}

# Comando: listar
cmd_list() {
    echo -e "${BLUE}=== Instancias Disponibles ===${NC}"
    echo ""
    printf "%-20s %-20s %-15s\n" "NOMBRE" "IP PÚBLICA" "IP PRIVADA"
    printf "%-20s %-20s %-15s\n" "------" "----------" "---------"
    
    for inst in "${!INSTANCES[@]}"; do
        local pub_ip="${INSTANCES[$inst]}"
        local priv_ip="${PRIVATE_IPS[$inst]:-N/A}"
        printf "%-20s %-20s %-15s\n" "$inst" "$pub_ip" "$priv_ip"
    done
}

# Comando: túnel
cmd_tunnel() {
    local service="${1:-api-gateway}"
    local local_port
    local remote_ip
    local remote_port
    
    case "$service" in
        mongodb)
            local_port=27017
            remote_ip="${INSTANCES[db]}"
            remote_port=27017
            echo -e "${GREEN}🔗 Creando túnel a MongoDB...${NC}"
            ;;
        api-gateway)
            local_port=8080
            remote_ip="${INSTANCES[api-gateway]}"
            remote_port=8080
            echo -e "${GREEN}🔗 Creando túnel a API Gateway...${NC}"
            ;;
        grafana)
            local_port=3000
            remote_ip="${INSTANCES[monitoring]}"
            remote_port=3000
            echo -e "${GREEN}🔗 Creando túnel a Grafana...${NC}"
            ;;
        prometheus)
            local_port=9090
            remote_ip="${INSTANCES[monitoring]}"
            remote_port=9090
            echo -e "${GREEN}🔗 Creando túnel a Prometheus...${NC}"
            ;;
        rabbitmq)
            local_port=5672
            remote_ip="${INSTANCES[messaging]}"
            remote_port=5672
            echo -e "${GREEN}🔗 Creando túnel a RabbitMQ...${NC}"
            ;;
        *)
            echo -e "${RED}❌ Servicio desconocido: $service${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${YELLOW}📡 Túnel: localhost:$local_port -> $remote_ip:$remote_port${NC}"
    echo -e "${YELLOW}⏸️  Presiona Ctrl+C para cerrar el túnel${NC}"
    echo ""
    
    ssh -i "$BASTION_KEY" \
        -L "${local_port}:${remote_ip}:${remote_port}" \
        "${BASTION_USER}@${BASTION_IP}" \
        "echo 'Túnel SSH abierto. Presiona Ctrl+C para cerrar.' && sleep infinity"
}

# Comando: estado
cmd_status() {
    echo -e "${BLUE}=== Estado del Bastion Host ===${NC}"
    echo ""
    
    if ssh -i "$BASTION_KEY" -o ConnectTimeout=5 "${BASTION_USER}@${BASTION_IP}" "exit" 2>/dev/null; then
        echo -e "${GREEN}✅ Bastion Host está accesible${NC}"
        echo ""
        
        echo -e "${BLUE}Sistema Operativo:${NC}"
        ssh -i "$BASTION_KEY" "${BASTION_USER}@${BASTION_IP}" "cat /etc/os-release | grep PRETTY_NAME"
        
        echo ""
        echo -e "${BLUE}Usuarios conectados:${NC}"
        ssh -i "$BASTION_KEY" "${BASTION_USER}@${BASTION_IP}" "who"
        
        echo ""
        echo -e "${BLUE}Últimas conexiones SSH:${NC}"
        ssh -i "$BASTION_KEY" "${BASTION_USER}@${BASTION_IP}" "last -5"
        
    else
        echo -e "${RED}❌ No se puede conectar al Bastion Host${NC}"
        exit 1
    fi
}

# Comando: ejecutar
cmd_exec() {
    local target="$1"
    local command="$2"
    
    if [ -z "$target" ] || [ -z "$command" ]; then
        echo -e "${RED}❌ Uso: $0 exec [instancia] [comando]${NC}"
        exit 1
    fi
    
    if [ -z "${INSTANCES[$target]}" ]; then
        echo -e "${RED}❌ Instancia desconocida: $target${NC}"
        exit 1
    fi
    
    local target_ip="${INSTANCES[$target]}"
    
    echo -e "${GREEN}⚙️  Ejecutando en $target: $command${NC}"
    echo ""
    
    ssh -i "$BASTION_KEY" \
        -o StrictHostKeyChecking=no \
        -J "${BASTION_USER}@${BASTION_IP}" \
        "ubuntu@${target_ip}" \
        "$command"
}

# Main
case "${1:-help}" in
    connect)
        cmd_connect "$2"
        ;;
    list)
        cmd_list
        ;;
    tunnel)
        cmd_tunnel "$2"
        ;;
    status)
        cmd_status
        ;;
    exec)
        cmd_exec "$2" "$3"
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando desconocido: $1${NC}"
        show_help
        exit 1
        ;;
esac
