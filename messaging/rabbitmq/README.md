# RabbitMQ

Message broker AMQP con soporte para patrones de mensajería complejos y Management UI.

## Características

- Message broker AMQP 0.9.1
- Exchanges, Queues, Bindings
- Management UI en puerto 15672
- Persistent message delivery
- Clustering support
- Puerto: 5672 (AMQP), 15672 (Management)

## Variables de Entorno

- `RABBITMQ_DEFAULT_USER=guest` - Usuario por defecto
- `RABBITMQ_DEFAULT_PASS=guest` - Contraseña por defecto
- `RABBITMQ_DEFAULT_VHOST=/` - Virtual host por defecto
- `RABBITMQ_HEARTBEAT=60` - Heartbeat en segundos
- `RABBITMQ_MAX_CONNECTIONS=100` - Máximo de conexiones

## Volúmenes

- `/var/lib/rabbitmq` - Datos persistentes
- `/var/log/rabbitmq` - Logs

## Management UI

- **URL:** http://localhost:15672
- **Usuario:** guest
- **Contraseña:** guest

## Conexión

**URL:** `amqp://guest:guest@rabbitmq:5672`
