#!/bin/bash

# =============================================================================
# 🧪 Post-Deployment Connectivity Tester
# =============================================================================
# Script para verificar que todo está funcionando después del despliegue en AWS
# Uso: ./post-deployment-test.sh <EC2_MICROSERVICIOS_IP> <EC2_DB_PRIVATE_IP>
# Ejemplo: ./post-deployment-test.sh 54.123.45.67 172.31.79.193
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# =============================================================================
# VALIDAR PARÁMETROS
# =============================================================================

if [ $# -lt 2 ]; then
    echo -e "${RED}❌ USO: $0 <EC2_MICROSERVICIOS_IP> <EC2_DB_PRIVATE_IP>${NC}"
    echo ""
    echo "Parámetros:"
    echo "  EC2_MICROSERVICIOS_IP: IP pública de EC2-Microservicios (ej: 54.123.45.67)"
    echo "  EC2_DB_PRIVATE_IP: IP privada de EC2-DB (ej: 172.31.79.193)"
    echo ""
    echo "Ejemplo:"
    echo "  ./post-deployment-test.sh 54.123.45.67 172.31.79.193"
    exit 1
fi

EC2_MICRO_IP="$1"
EC2_DB_IP="$2"

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Test HTTP endpoint
test_http_endpoint() {
    local url=$1
    local name=$2
    local timeout=5
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        test_pass "$name respondiendo"
        return 0
    else
        test_fail "$name NO respondiendo"
        return 1
    fi
}

# Test port connectivity
test_port_connectivity() {
    local ip=$1
    local port=$2
    local service=$3
    local timeout=3
    
    if nc -z -w $timeout "$ip" "$port" 2>/dev/null; then
        test_pass "$service ($ip:$port) accesible"
        return 0
    else
        test_fail "$service ($ip:$port) NO accesible"
        return 1
    fi
}

# =============================================================================
# TESTS START
# =============================================================================

print_header "🧪 Post-Deployment Connectivity Tests"

echo "Configuración detectada:"
echo "  EC2-Microservicios (público): $EC2_MICRO_IP"
echo "  EC2-DB (privado): $EC2_DB_IP"
echo ""

# =============================================================================
print_header "1. VERIFICACIÓN DE CONECTIVIDAD LOCAL"
# =============================================================================

if command -v curl &> /dev/null; then
    test_pass "curl disponible"
else
    test_fail "curl no disponible (instalar: yum install curl)"
fi

if command -v nc &> /dev/null; then
    test_pass "netcat disponible"
else
    test_warn "netcat no disponible (instalar: yum install nc para tests locales)"
fi

# =============================================================================
print_header "2. VERIFICACIÓN DE SERVICIOS EN EC2-MICROSERVICIOS"
# =============================================================================

echo "Testing servicios en http://$EC2_MICRO_IP:..."
echo ""

# API Gateway
test_http_endpoint "http://$EC2_MICRO_IP:8080/health" "API Gateway health" || true

# Frontend Web
test_http_endpoint "http://$EC2_MICRO_IP:5500" "Frontend Web" || true

# Micro-auth
test_http_endpoint "http://$EC2_MICRO_IP:5005/health" "Micro-Auth health" || true

# Micro-maestros
test_http_endpoint "http://$EC2_MICRO_IP:5001/health" "Micro-Maestros health" || true

# Micro-estudiantes
test_http_endpoint "http://$EC2_MICRO_IP:5002/health" "Micro-Estudiantes health" || true

# Micro-reportes-estudiantes
test_http_endpoint "http://$EC2_MICRO_IP:5003/health" "Micro-Reportes-Estudiantes health" || true

# Micro-reportes-maestros
test_http_endpoint "http://$EC2_MICRO_IP:5004/health" "Micro-Reportes-Maestros health" || true

# Micro-notificaciones
test_http_endpoint "http://$EC2_MICRO_IP:5006/health" "Micro-Notificaciones health" || true

# Micro-soap-bridge
test_http_endpoint "http://$EC2_MICRO_IP:5008/health" "Micro-SOAP-Bridge health" || true

# =============================================================================
print_header "3. VERIFICACIÓN DE BASES DE DATOS EN EC2-DB"
# =============================================================================

echo "Testing conectividad a bases de datos en $EC2_DB_IP..."
echo ""

test_port_connectivity "$EC2_DB_IP" 5432 "PostgreSQL"
test_port_connectivity "$EC2_DB_IP" 27017 "MongoDB"
test_port_connectivity "$EC2_DB_IP" 6379 "Redis"

# =============================================================================
print_header "4. VERIFICACIÓN DE DOCKER"
# =============================================================================

echo "Microservicios en EC2-Microservicios:"
echo ""

# Intentar obtener lista de servicios via SSH (si tenemos key)
if [ -n "$AWS_EC2_SSH_KEY" ]; then
    echo "Nota: Para ver estado de contenedores, ejecutar en EC2-Microservicios:"
    echo "  docker ps"
    echo "  docker-compose -f docker-compose.aws.yml ps"
fi

# =============================================================================
print_header "5. VERIFICACIÓN DE LOGS"
# =============================================================================

echo "Para verificar logs de servicios:"
echo ""
echo "En EC2-Microservicios:"
echo "  # Ver logs de un servicio específico"
echo "  docker-compose -f docker-compose.aws.yml logs api-gateway"
echo ""
echo "  # Ver logs en tiempo real"
echo "  docker-compose -f docker-compose.aws.yml logs -f api-gateway"
echo ""
echo "  # Ver logs de todos los servicios"
echo "  docker-compose -f docker-compose.aws.yml logs"
echo ""

# =============================================================================
print_header "6. TESTS DE FUNCIONALIDAD (OPCIONAL)"
# =============================================================================

echo "Ejemplos de pruebas adicionales:"
echo ""

echo "1️⃣  Test de Login:"
echo "  curl -X POST http://$EC2_MICRO_IP:8080/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"test\",\"password\":\"test\"}'"
echo ""

echo "2️⃣  Test de Listar Estudiantes:"
echo "  curl http://$EC2_MICRO_IP:8080/estudiantes \\"
echo "    -H 'Authorization: Bearer <JWT_TOKEN>'"
echo ""

echo "3️⃣  Test de Listar Maestros:"
echo "  curl http://$EC2_MICRO_IP:8080/maestros \\"
echo "    -H 'Authorization: Bearer <JWT_TOKEN>'"
echo ""

echo "4️⃣  Test de Reportes:"
echo "  curl http://$EC2_MICRO_IP:8080/reportes \\"
echo "    -H 'Authorization: Bearer <JWT_TOKEN>'"
echo ""

# =============================================================================
print_header "7. TROUBLESHOOTING"
# =============================================================================

echo "Si encuentras problemas:"
echo ""

echo "🔴 Servicios no responden en EC2-Microservicios:"
echo "  → SSH a EC2-Microservicios"
echo "  → docker ps (verificar que contenedores estén corriendo)"
echo "  → docker-compose -f docker-compose.aws.yml logs (ver errores)"
echo "  → Verificar Security Group permite puertos"
echo ""

echo "🔴 No hay conectividad a BD en EC2-DB:"
echo "  → SSH a EC2-DB"
echo "  → docker ps (verificar que contenedores de BD estén corriendo)"
echo "  → Verificar Security Group de EC2-DB permite tráfico desde EC2-Microservicios"
echo "  → Verificar que IPs privadas son correctas en .env"
echo ""

echo "🔴 Error de autenticación en microservicios:"
echo "  → Verificar que JWT_SECRET está configurado en .env"
echo "  → Verificar que variables de ambiente están cargadas"
echo "  → docker-compose -f docker-compose.aws.yml config (ver configuración)"
echo ""

echo "🔴 Contenedores se reinician constantemente:"
echo "  → docker inspect <container_id> (ver exit code)"
echo "  → docker logs <container_id> (ver errores)"
echo "  → Verificar variables de ambiente en docker-compose.aws.yml"
echo ""

# =============================================================================
print_header "8. RESUMEN"
# =============================================================================

TOTAL=$((PASSED + FAILED + WARNINGS))

echo "Tests realizados: $TOTAL"
echo -e "${GREEN}Exitosos: $PASSED${NC}"
echo -e "${RED}Fallidos: $FAILED${NC}"
echo -e "${YELLOW}Advertencias: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ TODOS LOS TESTS PASARON${NC}"
    echo ""
    echo "El despliegue parece estar funcionando correctamente."
    echo "Próximos pasos:"
    echo "  1. Acceder a http://$EC2_MICRO_IP:5500 (Frontend)"
    echo "  2. Probar login y funcionalidades"
    echo "  3. Monitorear logs con: docker-compose -f docker-compose.aws.yml logs -f"
    exit 0
else
    echo -e "${RED}✗ ALGUNOS TESTS FALLARON${NC}"
    echo ""
    echo "Revisa los items marcados con ✗ arriba."
    echo "Asegúrate que:"
    echo "  • Los contenedores estén corriendo (docker ps)"
    echo "  • Los Security Groups permitan tráfico"
    echo "  • Las variables de ambiente sean correctas"
    echo "  • Los logs no muestren errores (docker logs <container>)"
    exit 1
fi
