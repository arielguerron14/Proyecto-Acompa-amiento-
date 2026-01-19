#!/bin/bash

# Script de Validación de Despliegue
# Verifica que todos los microservicios estén corriendo en sus instancias EC2

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
declare -A INSTANCES=(
    [CORE]="3.236.99.88"
    [API_GATEWAY]="98.86.94.92"
    [MESSAGING]="35.172.111.207"
    [DB]="13.217.220.8"
    [NOTIFICATIONS]="98.92.17.165"
    [MONITORING]="54.205.158.101"
    [FRONTEND]="52.72.57.10"
)

declare -A PORTS=(
    [api_gateway]="8080"
    [auth]="5005"
    [estudiantes]="5002"
    [maestros]="5001"
    [notificaciones]="5006"
    [reportes_estudiantes]="5003"
    [reportes_maestros]="5004"
    [analytics]="5007"
    [monitoring]="5009"
)

declare -A SERVICE_INSTANCES=(
    [api_gateway]="API_GATEWAY"
    [auth]="CORE"
    [estudiantes]="CORE"
    [maestros]="CORE"
    [notificaciones]="NOTIFICATIONS"
    [reportes_estudiantes]="CORE"
    [reportes_maestros]="CORE"
    [analytics]="CORE"
)

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SSH_KEY="${HOME}/.ssh/id_rsa"
SSH_USER="ubuntu"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 VALIDACIÓN DE DESPLIEGUE - PROYECTO ACOMPAÑAMIENTO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

# Función para verificar conectividad SSH
check_ssh_connectivity() {
    local instance=$1
    local ip=$2
    
    echo -n "  🔌 SSH connectivity to $instance ($ip)..."
    if timeout 5 ssh -i "$SSH_KEY" -o ConnectTimeout=3 -o StrictHostKeyChecking=no "$SSH_USER@$ip" "echo 'SSH OK'" &>/dev/null; then
        echo -e " ${GREEN}✅${NC}"
        return 0
    else
        echo -e " ${RED}❌${NC}"
        return 1
    fi
}

# Función para verificar puerto abierto
check_port_open() {
    local service=$1
    local ip=$2
    local port=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  🌐 Port $port ($service) on $ip..."
    
    if timeout 5 bash -c "echo >/dev/tcp/$ip/$port" 2>/dev/null; then
        echo -e " ${GREEN}✅${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e " ${RED}❌${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Función para verificar health endpoint
check_health_endpoint() {
    local service=$1
    local ip=$2
    local port=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  💚 Health endpoint $service ($ip:$port)..."
    
    response=$(curl -s -w "\n%{http_code}" "http://$ip:$port/health" 2>/dev/null | tail -1)
    if [ "$response" = "200" ]; then
        echo -e " ${GREEN}✅${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e " ${RED}❌ (HTTP $response)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Función para verificar contenedores Docker
check_docker_containers() {
    local instance=$1
    local ip=$2
    
    echo "  🐳 Docker containers on $instance:"
    
    # SSH y obtener lista de contenedores
    containers=$(ssh -i "$SSH_KEY" -o ConnectTimeout=3 -o StrictHostKeyChecking=no "$SSH_USER@$ip" \
        "docker ps --format '{{.Names}}: {{.Status}}'" 2>/dev/null || echo "")
    
    if [ -z "$containers" ]; then
        echo -e "    ${RED}❌ No containers running${NC}"
        return 1
    fi
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            echo "    $(echo $line | grep -q 'Up' && echo -e '${GREEN}✅${NC}' || echo -e '${RED}❌${NC}') $line"
        fi
    done <<< "$containers"
}

# Función para obtener logs de un contenedor
get_container_logs() {
    local instance=$1
    local ip=$2
    local container=$3
    local lines=${4:-5}
    
    echo "  📋 Logs from $container:"
    logs=$(ssh -i "$SSH_KEY" -o ConnectTimeout=3 -o StrictHostKeyChecking=no "$SSH_USER@$ip" \
        "docker logs --tail $lines $container 2>&1" 2>/dev/null || echo "")
    
    if [ -n "$logs" ]; then
        echo "$logs" | sed 's/^/    /'
    else
        echo "    (no logs available)"
    fi
}

# Función para verificar volúmenes
check_volumes() {
    local instance=$1
    local ip=$2
    
    echo "  📦 Volumes on $instance:"
    
    volumes=$(ssh -i "$SSH_KEY" -o ConnectTimeout=3 -o StrictHostKeyChecking=no "$SSH_USER@$ip" \
        "docker volume ls --format 'table {{.Name}}\t{{.Driver}}'" 2>/dev/null || echo "")
    
    if [ -n "$volumes" ]; then
        echo "$volumes" | sed 's/^/    /'
    else
        echo "    (no volumes)"
    fi
}

# Función para verificar redes
check_networks() {
    local instance=$1
    local ip=$2
    
    echo "  🔗 Networks on $instance:"
    
    networks=$(ssh -i "$SSH_KEY" -o ConnectTimeout=3 -o StrictHostKeyChecking=no "$SSH_USER@$ip" \
        "docker network ls --format 'table {{.Name}}\t{{.Driver}}'" 2>/dev/null || echo "")
    
    if [ -n "$networks" ]; then
        echo "$networks" | sed 's/^/    /'
    else
        echo "    (no networks)"
    fi
}

# ========== EJECUTAR VALIDACIONES ==========

echo -e "${YELLOW}FASE 1: Conectividad SSH${NC}"
declare -A ssh_status
for instance in "${!INSTANCES[@]}"; do
    if check_ssh_connectivity "$instance" "${INSTANCES[$instance]}"; then
        ssh_status[$instance]=1
    else
        ssh_status[$instance]=0
    fi
done

echo -e "\n${YELLOW}FASE 2: Verificación de Puertos${NC}"
for service in "${!SERVICE_INSTANCES[@]}"; do
    instance_name="${SERVICE_INSTANCES[$service]}"
    ip="${INSTANCES[$instance_name]}"
    port="${PORTS[$service]}"
    
    if [ ${ssh_status[$instance_name]:-0} -eq 1 ]; then
        check_port_open "$service" "$ip" "$port"
    fi
done

echo -e "\n${YELLOW}FASE 3: Health Endpoints${NC}"
for service in "${!SERVICE_INSTANCES[@]}"; do
    instance_name="${SERVICE_INSTANCES[$service]}"
    ip="${INSTANCES[$instance_name]}"
    port="${PORTS[$service]}"
    
    if [ ${ssh_status[$instance_name]:-0} -eq 1 ]; then
        check_health_endpoint "$service" "$ip" "$port"
    fi
done

echo -e "\n${YELLOW}FASE 4: Inspección de Contenedores Docker${NC}"
for instance in "${!INSTANCES[@]}"; do
    if [ ${ssh_status[$instance]:-0} -eq 1 ]; then
        echo -e "\n${BLUE}Instance: $instance (${INSTANCES[$instance]})${NC}"
        check_docker_containers "$instance" "${INSTANCES[$instance]}"
    fi
done

echo -e "\n${YELLOW}FASE 5: Volúmenes${NC}"
for instance in "${!INSTANCES[@]}"; do
    if [ ${ssh_status[$instance]:-0} -eq 1 ]; then
        echo -e "\n${BLUE}Instance: $instance${NC}"
        check_volumes "$instance" "${INSTANCES[$instance]}"
    fi
done

echo -e "\n${YELLOW}FASE 6: Redes Docker${NC}"
for instance in "${!INSTANCES[@]}"; do
    if [ ${ssh_status[$instance]:-0} -eq 1 ]; then
        echo -e "\n${BLUE}Instance: $instance${NC}"
        check_networks "$instance" "${INSTANCES[$instance]}"
    fi
done

# ========== RESUMEN ==========
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 RESUMEN DE VALIDACIÓN${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

echo -e "✅ Pruebas pasadas: ${GREEN}$PASSED_TESTS${NC}"
echo -e "❌ Pruebas fallidas: ${RED}$FAILED_TESTS${NC}"
echo -e "📊 Total de pruebas: $TOTAL_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ ¡TODAS LAS PRUEBAS PASARON! Sistema operacional.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Algunas pruebas fallaron. Revisar logs anteriores.${NC}"
    exit 1
fi
