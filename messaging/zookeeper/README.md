# Zookeeper

Coordenador distribuido para Kafka. Maneja la coordinación de brokers y metadatos.

## Características

- Coordinación de brokers Kafka
- Almacenamiento de metadatos
- Sincronización distribuida
- Puerto: 2181

## Variables de Entorno

- `ZOOKEEPER_CLIENT_PORT=2181` - Puerto de cliente
- `ZOOKEEPER_TICK_TIME=2000` - Tick time en ms
- `ZOOKEEPER_SYNC_LIMIT=5` - Límite de sincronización
- `ZOOKEEPER_INIT_LIMIT=10` - Límite de inicialización

## Volúmenes

- `/var/lib/zookeeper/data` - Datos persistentes
- `/var/lib/zookeeper/log` - Logs
