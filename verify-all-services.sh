#!/bin/bash

# 🚀 Script de Verificación Rápida del Despliegue
# Uso: ./verify-all-services.sh

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      🔍 VERIFICADOR DE SERVICIOS DESPLEGADOS                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Array de servicios
declare -a services=(
    "Frontend|44.220.126.89|80"
    "API Gateway|52.7.168.4|8080"
    "Core Services|98.80.149.136|3000"
    "Notificaciones|100.31.135.46|8000"
    "Reportes|52.200.32.56|8080"
    "Monitoring|98.88.93.98|3000"
)

# Array de bases de datos
declare -a databases=(
    "Database|100.31.92.150|5432"
    "Messaging|13.217.211.183|5672"
)

# Función para probar conectividad
test_connectivity() {
    local name=$1
    local ip=$2
    local port=$3
    
    echo -n "Probando $name ($ip:$port)... "
    
    if timeout 3 bash -c "cat < /dev/null > /dev/tcp/$ip/$port" 2>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FALLO${NC}"
        return 1
    fi
}

# Función para probar HTTP
test_http() {
    local name=$1
    local url=$2
    
    echo -n "Probando HTTP: $name ($url)... "
    
    if curl -s -f --connect-timeout 3 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FALLO${NC}"
        return 1
    fi
}

echo "🌐 SERVICIOS HTTP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

passed=0
failed=0

for service in "${services[@]}"; do
    IFS='|' read -r name ip port <<< "$service"
    if test_connectivity "$name" "$ip" "$port"; then
        ((passed++))
    else
        ((failed++))
    fi
done

echo ""
echo "🗄️  BASES DE DATOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for service in "${databases[@]}"; do
    IFS='|' read -r name ip port <<< "$service"
    if test_connectivity "$name" "$ip" "$port"; then
        ((passed++))
    else
        ((failed++))
    fi
done

echo ""
echo "🔗 VERIFICACIÓN SSH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Probar SSH a Bastion
echo -n "Bastion SSH (34.235.224.202:22)... "
if timeout 3 bash -c "cat < /dev/null > /dev/tcp/34.235.224.202/22" 2>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
    ((passed++))
else
    echo -e "${RED}❌ FALLO${NC}"
    ((failed++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📊 RESULTADOS: ${GREEN}$passed PASADOS${NC} | ${RED}$failed FALLIDOS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ Todos los servicios están operativos!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Algunos servicios no responden. Revisa logs.${NC}"
    exit 1
fi
