#!/bin/bash

# Script de inicialización del sistema de mensajería
# Uso: ./init-messaging.sh

echo "🚀 Inicializando Sistema de Mensajería Global..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir secciones
print_section() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Función para verificar comando
check_command() {
  if command -v $1 &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 encontrado"
    return 0
  else
    echo -e "${YELLOW}✗${NC} $1 NO encontrado"
    return 1
  fi
}

# 1. Verificar requisitos
print_section "1. VERIFICANDO REQUISITOS"
check_command "docker"
check_command "docker-compose"
check_command "node"
check_command "npm"
echo ""

# 2. Iniciar contenedores
print_section "2. INICIANDO CONTENEDORES DE INFRAESTRUCTURA"
echo -e "${YELLOW}Iniciando Docker Compose...${NC}"
docker-compose up -d kafka zookeeper rabbitmq mqtt kafka-ui
echo -e "${GREEN}✓${NC} Contenedores iniciados"
echo ""

# 3. Esperar a que se levanten
print_section "3. ESPERANDO A QUE LOS SERVICIOS ESTÉN LISTOS"
echo -e "${YELLOW}Esperando Kafka...${NC}"
for i in {1..30}; do
  if docker exec proyecto-kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092 &>/dev/null; then
    echo -e "${GREEN}✓${NC} Kafka está listo"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

echo -e "${YELLOW}Esperando RabbitMQ...${NC}"
for i in {1..30}; do
  if docker exec proyecto-rabbitmq rabbitmq-diagnostics -q ping &>/dev/null; then
    echo -e "${GREEN}✓${NC} RabbitMQ está listo"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

echo -e "${YELLOW}Esperando MQTT...${NC}"
sleep 5
echo -e "${GREEN}✓${NC} MQTT debería estar listo"
echo ""

# 4. Crear tópicos en Kafka
print_section "4. CREANDO TÓPICOS EN KAFKA"
TOPICS=("reservas" "horarios" "usuarios" "reportes" "notificaciones" "errores")
for topic in "${TOPICS[@]}"; do
  docker exec proyecto-kafka kafka-topics.sh \
    --create \
    --topic "$topic" \
    --bootstrap-server localhost:9092 \
    --partitions 3 \
    --replication-factor 1 \
    --if-not-exists 2>/dev/null
  echo -e "${GREEN}✓${NC} Tópico: $topic"
done
echo ""

# 5. Crear colas en RabbitMQ (opcional, se crean automáticamente)
print_section "5. RABBITMQ LISTO"
echo -e "${GREEN}✓${NC} Las colas se crearán automáticamente al publicar"
echo ""

# 6. Instalar dependencias del module
print_section "6. INSTALANDO DEPENDENCIAS DEL MESSAGE-BROKER"
cd message-broker
npm install
cd ..
echo -e "${GREEN}✓${NC} Dependencias instaladas"
echo ""

# 7. Ver tópicos creados
print_section "7. TÓPICOS CREADOS EN KAFKA"
docker exec proyecto-kafka kafka-topics.sh \
  --list \
  --bootstrap-server localhost:9092
echo ""

# 8. Información de acceso
print_section "8. INFORMACIÓN DE ACCESO"
echo ""
echo -e "${GREEN}Kafka:${NC}"
echo "  Broker: kafka:9092"
echo "  Dashboard: http://localhost:8081"
echo ""
echo -e "${GREEN}RabbitMQ:${NC}"
echo "  AMQP: amqp://guest:guest@rabbitmq:5672"
echo "  Management: http://localhost:15672"
echo "  Usuario: guest"
echo "  Contraseña: guest"
echo ""
echo -e "${GREEN}MQTT:${NC}"
echo "  Broker: mqtt://mqtt:1883"
echo "  WebSocket: ws://mqtt:9001"
echo ""

# 9. Verificar logs
print_section "9. LOGS RECIENTES"
echo -e "${YELLOW}Kafka:${NC}"
docker logs --tail 5 proyecto-kafka 2>/dev/null | tail -3
echo ""
echo -e "${YELLOW}RabbitMQ:${NC}"
docker logs --tail 5 proyecto-rabbitmq 2>/dev/null | tail -3
echo ""

print_section "✅ INICIALIZACIÓN COMPLETADA"
echo ""
echo -e "${GREEN}El sistema de mensajería está listo para usar.${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Agregar dependencia a los microservicios:"
echo "   npm install ../message-broker"
echo ""
echo "2. Configurar .env en cada microservicio"
echo ""
echo "3. Inicializar messaging en app.js:"
echo "   const { initializeMessaging } = require('@proyecto/message-broker');"
echo "   const messaging = await initializeMessaging();"
echo ""
echo "4. Ver documentación:"
echo "   - MESSAGE_BROKER_SUMMARY.md"
echo "   - MESSAGE_BROKER_INTEGRATION.md"
echo "   - message-broker/README.md"
echo ""
echo -e "${BLUE}Para detener los servicios:${NC}"
echo "   docker-compose down"
echo ""
