# Kafka

Plataforma de streaming de eventos distribuida para comunicación en tiempo real entre microservicios.

## Características

- Event streaming distribuido
- Alta disponibilidad
- Persistencia de mensajes
- Tópicos configurables
- Replicación automática
- Puerto: 9092 (externo), 29092 (interno)

## Variables de Entorno

- `KAFKA_BROKER_ID=1` - ID único del broker
- `KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181` - Conexión a Zookeeper
- `KAFKA_ADVERTISED_LISTENERS` - Listeners anunciados
- `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1` - Factor de replicación
- `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true` - Crear tópicos automáticamente
- `KAFKA_LOG_RETENTION_HOURS=168` - Retención de logs (7 días)
- `KAFKA_NUM_PARTITIONS=3` - Particiones por defecto

## Volúmenes

- `/var/lib/kafka/data` - Datos de brokers

## Dependencias

- Zookeeper (debe estar healthy)

## Conexión

**Desde dentro del contenedor:** `kafka:29092`  
**Desde el host:** `localhost:9092`
