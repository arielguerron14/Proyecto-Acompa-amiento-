#!/bin/bash

###############################################################################
#                                                                             #
#  📋 VALIDACIÓN PREVIA - EC2-DB DEPLOYMENT                                #
#                                                                             #
#  Este script verifica que todo esté listo antes de desplegar              #
#                                                                             #
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  📋 VALIDACIÓN PRE-DEPLOYMENT"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

CHECKS_PASSED=0
CHECKS_TOTAL=0

# Función para validar
check() {
    local name="$1"
    local cmd="$2"
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if eval "$cmd" &>/dev/null; then
        echo -e "${GREEN}✅${NC} $name"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌${NC} $name"
    fi
}

# Validaciones
echo -e "${YELLOW}Verificando requisitos:${NC}\n"

check "Git instalado" "which git"
check "SSH cliente disponible" "which ssh"
check "Docker disponible (opcional)" "which docker"
check "Archivo de configuración" "test -f infrastructure-instances.config.js"
check "Script de deploy existe" "test -f deploy-step-1-db.sh"

echo ""
echo -e "${YELLOW}Verificando AWS EC2-DB:${NC}\n"

# Leer IPs del archivo de configuración
EC2_DB_PUBLIC="44.222.119.15"
EC2_DB_PRIVATE="172.31.79.193"

echo -e "${BLUE}📌 Información EC2-DB:${NC}"
echo "   IP Pública:  $EC2_DB_PUBLIC"
echo "   IP Privada:  $EC2_DB_PRIVATE"
echo ""

# Validar SSH key
SSH_KEY="${HOME}/.ssh/aws-key.pem"
if test -f "$SSH_KEY"; then
    echo -e "${GREEN}✅${NC} SSH Key encontrada: $SSH_KEY"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} SSH Key NO encontrada en $SSH_KEY"
    echo -e "${YELLOW}   ⚠️  Busca tu llave privada de AWS y cópiala a ~/.ssh/aws-key.pem${NC}"
fi
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

echo ""
echo -e "${YELLOW}Intentando conexión SSH (esto puede tardar 10 segundos):${NC}\n"

if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ec2-user@"$EC2_DB_PUBLIC" "echo 'SSH Connection OK'" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Conexión SSH exitosa a EC2-DB"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} No se puede conectar a EC2-DB vía SSH"
    echo -e "${YELLOW}   Verifica:${NC}"
    echo "   - La instancia EC2 está corriendo"
    echo "   - El Security Group permite SSH (puerto 22)"
    echo "   - La IP pública es correcta: $EC2_DB_PUBLIC"
    echo "   - La SSH key es correcta y tiene permisos 400"
fi
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "Validaciones: ${CHECKS_PASSED}/${CHECKS_TOTAL} ✅\n"

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo -e "${GREEN}✅ TODO LISTO PARA DESPLEGAR${NC}\n"
    echo -e "${BLUE}Próximo paso:${NC}"
    echo "  bash deploy-step-1-db.sh"
    echo ""
else
    echo -e "${RED}⚠️  FALTAN VERIFICACIONES${NC}\n"
    echo "Por favor verifica los puntos marcados con ❌ antes de continuar"
    echo ""
fi
