#!/bin/bash

# =============================================================================
# 🔍 AWS Deployment Pre-Flight Checker
# =============================================================================
# Script para verificar que todo está configurado correctamente antes de desplegar en AWS
# Uso: ./pre-flight-check.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_file_exists() {
    local file=$1
    local name=$2
    
    if [ -f "$file" ]; then
        check_pass "$name existe"
        return 0
    else
        check_fail "$name NO existe: $file"
        return 1
    fi
}

check_directory_exists() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        check_pass "$name existe"
        return 0
    else
        check_fail "$name NO existe: $dir"
        return 1
    fi
}

# =============================================================================
# CHECKS START
# =============================================================================

print_header "AWS Deployment Pre-Flight Checker"

# =============================================================================
print_header "1. VERIFICACIÓN DE ARCHIVOS NECESARIOS"
# =============================================================================

check_file_exists ".env.aws" "Template .env.aws"
check_file_exists "docker-compose.aws.yml" "docker-compose.aws.yml"
check_file_exists "setup-ec2-db.sh" "Setup script EC2-DB"
check_file_exists "setup-ec2-microservices.sh" "Setup script EC2-Microservicios"
check_file_exists ".github/workflows/deploy-databases-aws.yml" "GitHub Actions workflow"
check_file_exists "AWS_DEPLOYMENT_GUIDE.md" "Guía de despliegue"
check_file_exists "AWS_SETUP_README.md" "README rápido"

# =============================================================================
print_header "2. VERIFICACIÓN DE ESTRUCTURA DE DIRECTORIOS"
# =============================================================================

check_directory_exists "api-gateway" "Microservicio: api-gateway"
check_directory_exists "micro-auth" "Microservicio: micro-auth"
check_directory_exists "micro-maestros" "Microservicio: micro-maestros"
check_directory_exists "micro-estudiantes" "Microservicio: micro-estudiantes"
check_directory_exists "micro-reportes-estudiantes" "Microservicio: micro-reportes-estudiantes"
check_directory_exists "micro-reportes-maestros" "Microservicio: micro-reportes-maestros"
check_directory_exists "micro-notificaciones" "Microservicio: micro-notificaciones"
check_directory_exists "frontend-web" "Frontend"

# =============================================================================
print_header "3. VALIDACIÓN DE CONTENIDO DE ARCHIVOS"
# =============================================================================

# Validar .env.aws
if grep -q "IP_PRIVADA_EC2_DB" .env.aws; then
    check_pass ".env.aws contiene placeholder IP_PRIVADA_EC2_DB"
else
    check_fail ".env.aws no contiene placeholder IP_PRIVADA_EC2_DB"
fi

if grep -q "mongodb://" .env.aws; then
    check_pass ".env.aws contiene configuración MongoDB"
else
    check_fail ".env.aws no contiene configuración MongoDB"
fi

if grep -q "POSTGRES" .env.aws; then
    check_pass ".env.aws contiene configuración PostgreSQL"
else
    check_fail ".env.aws no contiene configuración PostgreSQL"
fi

# Validar docker-compose.aws.yml
if grep -q "api-gateway" docker-compose.aws.yml; then
    check_pass "docker-compose.aws.yml contiene api-gateway"
else
    check_fail "docker-compose.aws.yml no contiene api-gateway"
fi

if grep -q "mongo" docker-compose.aws.yml && grep -q "172.31" docker-compose.aws.yml; then
    check_fail "docker-compose.aws.yml contiene referencias a mongo (NO debería) - eliminar servicios de BD"
else
    check_pass "docker-compose.aws.yml no contiene servicios de BD"
fi

if grep -q "health" docker-compose.aws.yml; then
    check_pass "docker-compose.aws.yml contiene healthchecks"
else
    check_warn "docker-compose.aws.yml no contiene healthchecks"
fi

# Validar scripts son ejecutables
if [ -x "setup-ec2-db.sh" ]; then
    check_pass "setup-ec2-db.sh es ejecutable"
else
    check_warn "setup-ec2-db.sh no es ejecutable (chmod +x setup-ec2-db.sh)"
fi

if [ -x "setup-ec2-microservices.sh" ]; then
    check_pass "setup-ec2-microservices.sh es ejecutable"
else
    check_warn "setup-ec2-microservices.sh no es ejecutable (chmod +x setup-ec2-microservices.sh)"
fi

# =============================================================================
print_header "4. VERIFICACIÓN DE VARIABLES CRÍTICAS"
# =============================================================================

# Check .env variables
if [ -f ".env" ]; then
    if grep -q "MONGO_URI\|MONGODB" .env; then
        check_pass ".env contiene configuración de MongoDB"
    else
        check_warn ".env podría necesitar actualización de variables Mongo"
    fi
    
    if grep -q "POSTGRES" .env; then
        check_pass ".env contiene configuración de PostgreSQL"
    else
        check_warn ".env podría necesitar actualización de variables Postgres"
    fi
else
    check_warn ".env no existe (se creará durante setup en EC2)"
fi

# =============================================================================
print_header "5. VERIFICACIÓN DE CONFIGURACIÓN LOCAL (OPCIONAL)"
# =============================================================================

if command -v docker &> /dev/null; then
    check_pass "Docker está instalado localmente"
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
    echo -e "  Docker versión: $DOCKER_VERSION"
else
    check_warn "Docker no está instalado (no es crítico para AWS deployment)"
fi

if command -v docker-compose &> /dev/null; then
    check_pass "Docker Compose está instalado localmente"
    DC_VERSION=$(docker-compose --version | awk '{print $3}' | tr -d ',')
    echo -e "  Docker Compose versión: $DC_VERSION"
else
    check_warn "Docker Compose no está instalado (no es crítico para AWS deployment)"
fi

if command -v git &> /dev/null; then
    check_pass "Git está instalado"
    GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "No configurado")
    echo -e "  Remote: $GIT_REMOTE"
else
    check_fail "Git no está instalado (CRÍTICO para despliegue en EC2)"
fi

# =============================================================================
print_header "6. CHECKLIST PREVIO A DESPLIEGUE"
# =============================================================================

echo "Antes de desplegar en AWS, asegúrate que:"
echo ""
echo "📋 Instancias EC2:"
echo "  [ ] EC2-DB creada (t2.medium recomendado)"
echo "  [ ] EC2-Microservicios creada (t2.medium recomendado)"
echo "  [ ] Ambas instancias en el mismo VPC"
echo ""
echo "🔐 GitHub Secrets configurados:"
echo "  [ ] AWS_EC2_DB_PRIVATE_IP"
echo "  [ ] AWS_EC2_DB_SSH_PRIVATE_KEY"
echo "  [ ] POSTGRES_PASSWORD_AWS"
echo ""
echo "🔧 Security Groups:"
echo "  [ ] EC2-DB permite entrada en puertos 5432, 27017, 6379 desde EC2-Microservicios"
echo "  [ ] EC2-DB permite SSH desde tu IP"
echo "  [ ] EC2-Microservicios permite entrada en puertos 8080, 5500 desde 0.0.0.0/0"
echo "  [ ] EC2-Microservicios permite SSH desde tu IP"
echo ""
echo "📁 Repository:"
echo "  [ ] Todos los archivos AWS están committed a git"
echo "  [ ] .env.aws NO contiene secretos reales (solo placeholders)"
echo "  [ ] .github/workflows tiene permisos correctos"
echo ""

# =============================================================================
print_header "7. RESUMEN FINAL"
# =============================================================================

TOTAL=$((PASSED + FAILED + WARNINGS))

echo "Verificaciones realizadas: $TOTAL"
echo -e "${GREEN}Pasadas: $PASSED${NC}"
echo -e "${RED}Fallidas: $FAILED${NC}"
echo -e "${YELLOW}Advertencias: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ LISTO PARA DESPLEGAR${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Crear instancias EC2"
    echo "  2. Configurar GitHub Secrets"
    echo "  3. Ejecutar setup-ec2-db.sh en EC2-DB"
    echo "  4. Ejecutar workflow de GitHub Actions"
    echo "  5. Ejecutar setup-ec2-microservices.sh en EC2-Microservicios"
    echo ""
    exit 0
else
    echo -e "${RED}✗ EXISTEN PROBLEMAS A RESOLVER${NC}"
    echo ""
    echo "Por favor, resuelve los items marcados con ✗ antes de desplegar."
    echo ""
    exit 1
fi
