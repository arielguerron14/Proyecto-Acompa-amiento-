#!/bin/bash
# Health Check Script - Verifica el estado de todos los servicios
# Uso: ./health-check.sh

set -e

AWS_REGION="us-east-1"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Mapeo de instancias
declare -A INSTANCES=(
    [EC2-Bastion]="bastion-host:22"
    [EC2-API-Gateway]="api-gateway:8080"
    [EC2-CORE]="micro-auth:3001,micro-estudiantes:3002,micro-maestros:3003,micro-core:3004"
    [EC2-Reportes]="micro-reportes-estudiantes:4001,micro-reportes-maestros:4002"
    [EC2-Notificaciones]="micro-notificaciones:5000"
    [EC2-Messaging]="zookeeper:2181,kafka:9092,rabbitmq:5672"
    [EC2-DB]="mongo:27017,postgres:5432,redis:6379"
    [EC2-Analytics]="micro-analytics:6000"
    [EC2-Monitoring]="prometheus:9090,grafana:3000"
    [EC2-Frontend]="frontend-web:80"
)

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     🏥 HEALTH CHECK - TODAS LAS INSTANCIAS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

total=0
healthy=0
unhealthy=0
unknown=0

for instance_tag in "${!INSTANCES[@]}"; do
    echo -e "${YELLOW}📍 Verificando: $instance_tag${NC}"
    
    # Obtener ID de instancia
    instance_id=$(aws ec2 describe-instances \
        --region "$AWS_REGION" \
        --filters "Name=tag:Name,Values=$instance_tag" "Name=instance-state-name,Values=running" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text 2>/dev/null)
    
    if [ -z "$instance_id" ] || [ "$instance_id" = "None" ]; then
        echo -e "   ${RED}✗ Instancia no encontrada o no está corriendo${NC}"
        ((unhealthy++))
        ((total++))
        continue
    fi
    
    echo -e "   ${GREEN}✓ Instancia: $instance_id${NC}"
    
    # Obtener IP privada
    private_ip=$(aws ec2 describe-instances \
        --region "$AWS_REGION" \
        --instance-ids "$instance_id" \
        --query 'Reservations[0].Instances[0].PrivateIpAddress' \
        --output text)
    
    echo -e "   ${GREEN}✓ IP privada: $private_ip${NC}"
    
    # Verificar servicios/contenedores
    services="${INSTANCES[$instance_tag]}"
    
    # Enviar comando para verificar contenedores
    command_id=$(aws ssm send-command \
        --region "$AWS_REGION" \
        --document-name "AWS-RunShellScript" \
        --instance-ids "$instance_id" \
        --parameters "commands=['docker ps --format \"{{.Names}},{{.Status}}\"']" \
        --query 'Command.CommandId' \
        --output text)
    
    # Esperar un poco para que se ejecute
    sleep 3
    
    # Obtener resultado
    output=$(aws ssm get-command-invocation \
        --region "$AWS_REGION" \
        --command-id "$command_id" \
        --instance-id "$instance_id" \
        --query 'StandardOutputContent' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$output" ]; then
        echo -e "   ${YELLOW}⚠ No se pudo verificar estado de servicios${NC}"
        ((unknown++))
    else
        echo -e "   ${GREEN}✓ Servicios activos:${NC}"
        echo "$output" | while read -r line; do
            if [ -n "$line" ]; then
                container_name=$(echo "$line" | cut -d',' -f1)
                container_status=$(echo "$line" | cut -d',' -f2)
                if [[ "$container_status" == *"Up"* ]]; then
                    echo -e "      ${GREEN}✓ $container_name: UP${NC}"
                    ((healthy++))
                else
                    echo -e "      ${RED}✗ $container_name: $container_status${NC}"
                    ((unhealthy++))
                fi
            fi
        done
    fi
    
    echo ""
    ((total++))
done

# Resumen
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     📊 RESUMEN${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "   ${GREEN}✓ Saludables: $healthy${NC}"
echo -e "   ${RED}✗ No saludables: $unhealthy${NC}"
echo -e "   ${YELLOW}⚠ Desconocidos: $unknown${NC}"
echo -e "   Total verificados: $total"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

if [ $unhealthy -gt 0 ]; then
    echo -e "${RED}⚠️  Hay servicios que necesitan atención${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Todos los servicios están saludables${NC}"
    exit 0
fi
