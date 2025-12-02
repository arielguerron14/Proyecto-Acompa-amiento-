# Message Broker Module

Módulo centralizado de mensajería que proporciona tres sistemas de comunicación asincrónica:

- **Kafka**: EventBus para eventos en tiempo real
- **RabbitMQ**: MessageQueue para colas de tareas
- **MQTT**: TelemetryService para telemetría en tiempo real

## Instalación

```bash
npm install
```

## Uso Rápido

### Inicializar todos los servicios

```javascript
const {
  initializeMessaging,
  disconnectMessaging,
  EventTypes,
  createEvent,
  TaskTypes,
  createTask,
} = require('@proyecto/message-broker');

// Inicializar
const { eventBus, messageQueue, telemetry } = await initializeMessaging({
  kafkaBrokers: ['localhost:9092'],
  rabbitmqUrl: 'amqp://guest:guest@localhost:5672',
  mqttBrokerUrl: 'mqtt://localhost:1883',
});

// Usar...

// Desconectar
await disconnectMessaging({ eventBus, messageQueue, telemetry });
```

## EventBus (Kafka)

Pub/Sub para eventos globales de la aplicación.

### Publicar evento

```javascript
const event = createEvent(
  EventTypes.RESERVA_CREADA,
  {
    reservaId: '123',
    estudianteId: '456',
    maestroId: '789',
  },
  'micro-estudiantes'
);

await eventBus.publishEvent('reservas', event);
```

### Suscribirse a eventos

```javascript
await eventBus.subscribe('reservas', 'reporte-consumer', async (event) => {
  console.log('Evento recibido:', event);
  // Procesar evento
});
```

## MessageQueue (RabbitMQ)

Colas de tareas confiables para procesamiento asincrónico.

### Publicar tarea

```javascript
const task = createTask(
  TaskTypes.ENVIAR_EMAIL,
  {
    to: 'user@example.com',
    subject: 'Confirmación de Reserva',
    body: 'Tu reserva fue confirmada',
  },
  'high'
);

await messageQueue.publishMessage('email', task);
```

### Consumir tareas

```javascript
await messageQueue.subscribe('email', async (task) => {
  console.log('Procesando tarea:', task);
  // Enviar email
});
```

## TelemetryService (MQTT)

Métrica en tiempo real para monitoreo del sistema.

### Publicar métrica

```javascript
await telemetry.publishHealthCheck('micro-estudiantes', 'healthy');

await telemetry.publishApiMetric(
  'micro-estudiantes',
  '/reservas',
  45, // ms
  200  // status code
);
```

### Suscribirse a métricas

```javascript
await telemetry.subscribe('servicios/health/+', (metric) => {
  console.log('Health check:', metric);
});
```

## Estructura de archivos

```
message-broker/
├── src/
│   ├── kafka/
│   │   └── eventBus.js         # EventBus con Kafka
│   ├── rabbitmq/
│   │   └── messageQueue.js     # MessageQueue con RabbitMQ
│   ├── mqtt/
│   │   └── telemetryService.js # TelemetryService con MQTT
│   ├── utils/
│   │   ├── constants.js        # EventTypes, TaskTypes, etc.
│   │   ├── logger.js           # Logger centralizado
│   │   └── retry.js            # Retry, timeout, circuit breaker
│   └── index.js                # Exportaciones principales
├── package.json
└── README.md
```

## Eventos Estándar (EventTypes)

```javascript
{
  // Reservas
  RESERVA_CREADA: 'reserva.creada',
  RESERVA_ACTUALIZADA: 'reserva.actualizada',
  RESERVA_CANCELADA: 'reserva.cancelada',
  RESERVA_CONFIRMADA: 'reserva.confirmada',

  // Horarios
  HORARIO_CREADO: 'horario.creado',
  HORARIO_ACTUALIZADO: 'horario.actualizado',
  HORARIO_ELIMINADO: 'horario.eliminado',

  // Usuarios
  USUARIO_REGISTRADO: 'usuario.registrado',
  USUARIO_ACTUALIZADO: 'usuario.actualizado',
  USUARIO_ELIMINADO: 'usuario.eliminado',

  // ... más tipos
}
```

## Tareas Estándar (TaskTypes)

```javascript
{
  ENVIAR_EMAIL: 'task.enviar-email',
  ENVIAR_SMS: 'task.enviar-sms',
  GENERAR_REPORTE: 'task.generar-reporte',
  PROCESAR_IMAGEN: 'task.procesar-imagen',
  LIMPIAR_DATOS: 'task.limpiar-datos',
  BACKUP: 'task.backup',
}
```

## Variables de Entorno

```env
# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=mi-servicio

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=telemetry-client

# Debug
DEBUG=false
```

## Ejemplos de Integración

### En un Microservicio

```javascript
// src/app.js
const express = require('express');
const { initializeMessaging, EventTypes, createEvent } = require('@proyecto/message-broker');

const app = express();
let messaging;

// Inicializar al arrancar
app.use(async (req, res, next) => {
  if (!messaging) {
    messaging = await initializeMessaging();
  }
  req.messaging = messaging;
  next();
});

// Usar en rutas
app.post('/reservas', async (req, res) => {
  // Crear reserva
  const reserva = { /* ... */ };

  // Publicar evento
  const event = createEvent(
    EventTypes.RESERVA_CREADA,
    reserva,
    'micro-estudiantes'
  );
  await messaging.eventBus.publishEvent('reservas', event);

  res.json(reserva);
});
```

## Monitoreo y Debugging

### Obtener información de conexión

```javascript
const status = telemetry.getConnectionStatus();
console.log(status);
// {
//   connected: true,
//   clientId: 'telemetry-...',
//   brokerUrl: 'mqtt://localhost:1883',
//   subscriptions: ['servicios/health/+'],
//   metricsBuffered: 5
// }
```

### Utilities de resilencia

```javascript
const { retryWithBackoff, CircuitBreaker } = require('@proyecto/message-broker');

// Reintentos automáticos
const result = await retryWithBackoff(
  () => telemetry.publishMetric('sistema/metricas', metric),
  3,    // max intentos
  1000  // delay inicial
);

// Circuit breaker
const breaker = new CircuitBreaker(eventBus.publishEvent, {
  threshold: 5,  // fallos antes de abrir
  timeout: 60000 // ms esperar antes de intentar
});

await breaker.call('reservas', event);
```

## Notas

- Todos los servicios son singletons por defecto
- Los reintentos automáticos se implementan con backoff exponencial
- Las métricas se almacenan en un buffer (últimas 100)
- Los tópicos de MQTT soportan wildcards: `+` (un nivel) y `#` (multi-nivel)

## Licencia

MIT
