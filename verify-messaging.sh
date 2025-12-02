#!/bin/bash

# Script de verificación post-instalación del sistema de mensajería
# Uso: ./verify-messaging.sh

echo "🔍 Verificando Sistema de Mensajería Global..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

pass=0
fail=0

check_service() {
  echo -n "Verificando $1... "
  if [ $2 -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
    ((pass++))
  else
    echo -e "${RED}✗${NC}"
    ((fail++))
  fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}VERIFICACIÓN DE INFRAESTRUCTURA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar Kafka
docker exec proyecto-kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092 &>/dev/null
check_service "Kafka" $?

# Verificar RabbitMQ
docker exec proyecto-rabbitmq rabbitmq-diagnostics -q ping &>/dev/null
check_service "RabbitMQ" $?

# Verificar MQTT
docker exec proyecto-mqtt mosquitto -v &>/dev/null 2>&1 | grep -q "mosquitto"
check_service "MQTT" $?

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}VERIFICACIÓN DE TÓPICOS/COLAS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Tópicos en Kafka:"
docker exec proyecto-kafka kafka-topics.sh --list --bootstrap-server localhost:9092 | head -10
echo ""

echo "Colas en RabbitMQ:"
docker exec proyecto-rabbitmq rabbitmqctl list_queues 2>/dev/null | grep -v "^Listing" | head -5
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}INFORMACIÓN DE CONEXIÓN${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}Kafka:${NC}"
echo "  Broker: kafka:9092"
echo "  Dashboard: http://localhost:8081"
echo ""

echo -e "${GREEN}RabbitMQ:${NC}"
echo "  AMQP: amqp://guest:guest@rabbitmq:5672"
echo "  Dashboard: http://localhost:15672"
echo ""

echo -e "${GREEN}MQTT:${NC}"
echo "  Broker: mqtt://mqtt:1883"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}RESUMEN${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "Servicios correctos: ${GREEN}$pass${NC}"
echo -e "Servicios con error: ${RED}$fail${NC}"

if [ $fail -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Todos los servicios están funcionando correctamente${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}⚠️ Hay servicios que no están funcionando correctamente${NC}"
  exit 1
fi
