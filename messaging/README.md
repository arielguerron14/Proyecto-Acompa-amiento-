# Messaging Services

Configuración centralizada de servicios de mensajería para el proyecto.

## Servicios Incluidos

### 1. **Kafka** (Port 9092, 29092 internal)
- Message broker distribuido
- Usado para streaming de datos y eventos
- Zookeeper required para coordinación

### 2. **RabbitMQ** (Port 5672, UI 15672)
- Message broker con soporte AMQP
- Management UI en `http://localhost:15672`
- Credenciales por defecto: `guest:guest`

### 3. **Zookeeper** (Port 2181)
- Coordinador para Kafka
- Gestión de configuración distribuida

### 4. **Mosquitto** (Port 1883, WebSocket 9001)
- MQTT broker lightweight
- Ideal para IoT y dispositivos móviles
- WebSocket support

## Instalación

```bash
cd messaging
docker-compose up -d
```

## Verificar Servicios

```bash
# Kafka
docker exec messaging-kafka-1 kafka-topics --list --bootstrap-server localhost:9092

# RabbitMQ Management
# Acceder a: http://localhost:15672 (guest:guest)

# Mosquitto
docker exec messaging-mosquitto-1 mosquitto_sub -t '$SYS/#' -u guest -P guest

# Estado general
docker-compose ps
```

## Puertos Expuestos

| Servicio | Puerto | Protocolo | Descripción |
|----------|--------|-----------|-------------|
| Zookeeper | 2181 | TCP | Coordinación Kafka |
| Kafka | 9092 | PLAINTEXT | Broker Kafka |
| RabbitMQ | 5672 | AMQP | Message Broker |
| RabbitMQ | 15672 | HTTP | Management UI |
| Mosquitto | 1883 | MQTT | MQTT Broker |
| Mosquitto | 9001 | WebSocket | MQTT WebSocket |

## Persistencia

- **RabbitMQ**: Datos persistidos en volumen `rabbitmq_data`
- **Mosquitto**: Datos en `mosquitto_data`, logs en `mosquitto_logs`
- **Kafka**: Logs manejados internamente

## Detener Servicios

```bash
docker-compose down
```

## Limpiar Volúmenes

```bash
docker-compose down -v
```

## Integración con Microservicios

Los microservicios pueden conectar a estos servicios usando:

- **Kafka**: `kafka:9092`
- **RabbitMQ**: `rabbitmq:5672`
- **Mosquitto**: `mosquitto:1883`

(Todos en la red Docker `messaging-network`)
