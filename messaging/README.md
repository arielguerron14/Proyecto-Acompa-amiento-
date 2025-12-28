# Messaging Services

Servicios de mensajería centralizados para el Proyecto Acompañamiento.

## Servicios Incluidos

1. **Zookeeper** - Coordinador para Kafka (Puerto 2181)
2. **Kafka** - Event streaming distribuido (Puertos 9092/29092)
3. **RabbitMQ** - Message broker AMQP (Puertos 5672/15672)
4. **Kafka UI** - UI para gestionar Kafka (Puerto 8081)

## Estructura

```
messaging/
├── zookeeper/
│   ├── Dockerfile
│   └── README.md
├── kafka/
│   ├── Dockerfile
│   └── README.md
├── rabbitmq/
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml
└── README.md (este archivo)
```

## Inicio Rápido

### Iniciar todos los servicios

```bash
cd messaging
docker-compose up -d
```

### Verificar estado

```bash
docker-compose ps
```

### Ver logs

```bash
# Todos
docker-compose logs -f

# Específico
docker-compose logs -f kafka
docker-compose logs -f rabbitmq
docker-compose logs -f zookeeper
```

### Detener servicios

```bash
docker-compose down
```

### Eliminar datos persistentes

```bash
docker-compose down -v
```

## Acceso a Servicios

### Kafka
- **Bootstrap Server (interno):** kafka:29092
- **Bootstrap Server (externo):** localhost:9092
- **Tópicos:** Creados automáticamente

### RabbitMQ
- **AMQP (interno):** amqp://guest:guest@rabbitmq:5672
- **Management UI:** http://localhost:15672
- **Usuario:** guest / Contraseña: guest

### Kafka UI
- **URL:** http://localhost:8081
- **Clusters:** local (Zookeeper)

### Zookeeper
- **Host:** localhost:2181
- **Puerto:** 2181

## Volúmenes Creados

- `zookeeper-data` - Datos de Zookeeper
- `zookeeper-logs` - Logs de Zookeeper
- `kafka-data` - Datos de Kafka
- `rabbitmq-data` - Datos de RabbitMQ
- `rabbitmq-logs` - Logs de RabbitMQ

## Red

Todos los servicios están conectados en la red `messaging-network` (bridge).

## Healthchecks

Todos los servicios incluyen healthchecks configurados:

```
Zookeeper:  30s interval, 10s timeout, 40s start_period
Kafka:      30s interval, 10s timeout, 40s start_period
RabbitMQ:   30s interval, 10s timeout, 40s start_period
```

## Integración con Proyecto Principal

Los servicios de messaging pueden ser utilizados desde el docker-compose principal:

```yaml
depends_on:
  kafka:
    condition: service_healthy
  rabbitmq:
    condition: service_healthy
networks:
  - messaging-network
```

## Troubleshooting

### Kafka no inicia
- Verificar que Zookeeper está healthy: `docker-compose ps`
- Ver logs: `docker-compose logs kafka`

### RabbitMQ no accesible
- Verificar que está corriendo: `docker-compose ps rabbitmq`
- Reset: `docker-compose restart rabbitmq`

### Limpiar todo
```bash
docker-compose down -v
docker system prune -f
```
