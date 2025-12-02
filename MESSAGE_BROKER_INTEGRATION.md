# Guía de Integración del Message Broker

Este documento describe cómo integrar los sistemas de mensajería (Kafka, RabbitMQ, MQTT) en los microservicios existentes.

## Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [EventBus (Kafka)](#eventbus-kafka)
3. [MessageQueue (RabbitMQ)](#messagequeue-rabbitmq)
4. [TelemetryService (MQTT)](#telemetryservice-mqtt)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Monitoreo](#monitoreo)

## Configuración Inicial

### 1. Agregar dependencia al package.json del servicio

```bash
npm install @proyecto/message-broker
```

O manualmente en `package.json`:
```json
{
  "dependencies": {
    "@proyecto/message-broker": "file:../message-broker"
  }
}
```

### 2. Configurar variables de entorno

Crear `.env` en la raíz del microservicio:

```env
# Kafka (EventBus)
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=micro-estudiantes

# RabbitMQ (MessageQueue)
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# MQTT (Telemetry)
MQTT_BROKER_URL=mqtt://mqtt:1883
MQTT_CLIENT_ID=micro-estudiantes-telemetry

# JWT
JWT_SECRET=tu-secret-key-cambiar-en-produccion
```

### 3. Inicializar en el aplicación

```javascript
// src/app.js
const express = require('express');
const { initializeMessaging } = require('@proyecto/message-broker');

const app = express();
let messaging = null;

// Middleware para inicializar messaging
app.use(async (req, res, next) => {
  if (!messaging) {
    try {
      messaging = await initializeMessaging({
        kafkaBrokers: process.env.KAFKA_BROKERS?.split(','),
        rabbitmqUrl: process.env.RABBITMQ_URL,
        mqttBrokerUrl: process.env.MQTT_BROKER_URL,
      });
      console.log('✅ Servicios de mensajería inicializados');
    } catch (error) {
      console.error('❌ Error inicializando mensajería:', error);
      return res.status(500).json({ error: 'Error en servicios de mensajería' });
    }
  }
  req.messaging = messaging;
  next();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Cerrando servicios...');
  if (messaging) {
    await messaging.eventBus.disconnect();
    await messaging.messageQueue.disconnect();
    await messaging.telemetry.disconnect();
  }
  process.exit(0);
});

module.exports = app;
```

## EventBus (Kafka)

Sistema de eventos pub/sub para comunicación entre servicios.

### Publicar Evento

```javascript
const {
  EventTypes,
  createEvent,
} = require('@proyecto/message-broker');

// En una ruta de creación de reserva
router.post('/reservas', async (req, res) => {
  try {
    const reserva = { /* crear reserva en BD */ };

    // Publicar evento
    const event = createEvent(
      EventTypes.RESERVA_CREADA,
      {
        id: reserva._id,
        estudianteId: reserva.estudianteId,
        maestroId: reserva.maestroId,
        fecha: reserva.fecha,
      },
      'micro-estudiantes'
    );

    await req.messaging.eventBus.publishEvent('reservas', event);

    res.status(201).json(reserva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Consumir Eventos

```javascript
// En app.js o en un archivo de inicialización
async function setupEventListeners(eventBus) {
  // El servicio de reportes escucha eventos de reservas
  await eventBus.subscribe(
    'reservas',
    'micro-reportes-estudiantes-group',
    async (event) => {
      console.log('📬 Evento recibido:', event.type);

      switch (event.type) {
        case 'reserva.creada':
          console.log('Nueva reserva para estudiante:', event.data.estudianteId);
          // Actualizar estadísticas, enviar notificación, etc.
          break;

        case 'reserva.cancelada':
          console.log('Reserva cancelada:', event.data.id);
          break;

        default:
          console.log('Evento desconocido:', event.type);
      }
    }
  );

  // Otro servicio escucha horarios
  await eventBus.subscribe(
    'horarios',
    'micro-estudiantes-group',
    async (event) => {
      console.log('📬 Horario actualizado:', event.data.id);
      // Actualizar disponibilidad de horarios localmente
    }
  );
}
```

### Eventos Disponibles

```javascript
EventTypes = {
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

  // Reportes
  REPORTE_GENERADO: 'reporte.generado',
  REPORTE_EXPORTADO: 'reporte.exportado',

  // Notificaciones
  NOTIFICACION_ENVIADA: 'notificacion.enviada',
  NOTIFICACION_FALLIDA: 'notificacion.fallida',

  // Autenticación
  LOGIN_EXITOSO: 'login.exitoso',
  LOGIN_FALLIDO: 'login.fallido',
  TOKEN_REFRESCADO: 'token.refrescado',

  // Errores
  ERROR_GENERAL: 'error.general',
  ERROR_VALIDACION: 'error.validacion',
  ERROR_AUTENTICACION: 'error.autenticacion',
}
```

## MessageQueue (RabbitMQ)

Sistema de colas para tareas asincrónicas confiables.

### Publicar Tarea

```javascript
const {
  TaskTypes,
  createTask,
} = require('@proyecto/message-broker');

// En micro-notificaciones - Enviar email de confirmación
router.post('/enviar-confirmacion', async (req, res) => {
  try {
    const task = createTask(
      TaskTypes.ENVIAR_EMAIL,
      {
        to: req.body.email,
        subject: 'Confirmación de Reserva',
        template: 'confirmacion-reserva',
        data: {
          estudianteName: req.body.studentName,
          reservaId: req.body.reservaId,
          fecha: req.body.fecha,
        },
      },
      'high'  // prioridad
    );

    await req.messaging.messageQueue.publishMessage('email', task);

    res.json({ status: 'tarea encolada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Consumir Tareas

```javascript
// En micro-notificaciones - Procesador de emails
async function startEmailWorker(messageQueue) {
  await messageQueue.subscribe('email', async (task) => {
    console.log('📧 Procesando tarea de email:', task.type);

    try {
      // Enviar email usando nodemailer, SendGrid, etc.
      await sendEmailTask(task);

      console.log('✅ Email enviado:', task.id);
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      // La tarea será reintentatada automáticamente
      throw error;
    }
  });

  // Otro worker para SMS
  await messageQueue.subscribe('sms', async (task) => {
    console.log('📱 Procesando tarea de SMS:', task.type);
    try {
      await sendSMSTask(task);
      console.log('✅ SMS enviado:', task.id);
    } catch (error) {
      console.error('❌ Error enviando SMS:', error);
      throw error;
    }
  });

  // Worker para generar reportes
  await messageQueue.subscribe('reportes', async (task) => {
    console.log('📊 Generando reporte:', task.type);
    try {
      const reporte = await generateReport(task.payload);
      // Guardar reporte en BD
      await saveReport(reporte);
      console.log('✅ Reporte generado:', task.id);
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      throw error;
    }
  });
}
```

### Tipos de Tareas

```javascript
TaskTypes = {
  ENVIAR_EMAIL: 'task.enviar-email',
  ENVIAR_SMS: 'task.enviar-sms',
  GENERAR_REPORTE: 'task.generar-reporte',
  PROCESAR_IMAGEN: 'task.procesar-imagen',
  LIMPIAR_DATOS: 'task.limpiar-datos',
  BACKUP: 'task.backup',
}
```

## TelemetryService (MQTT)

Sistema de telemetría para monitoreo en tiempo real.

### Publicar Métricas

```javascript
const { createMetric } = require('@proyecto/message-broker');

// Middleware para recopilar métricas de API
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - startTime;

    await req.messaging.telemetry.publishApiMetric(
      'micro-estudiantes',
      req.path,
      duration,
      res.statusCode
    );
  });

  next();
};

app.use(metricsMiddleware);
```

### Publicar Health Check

```javascript
// Health check periódico
setInterval(async () => {
  if (messaging) {
    await messaging.telemetry.publishHealthCheck(
      'micro-estudiantes',
      'healthy'  // o 'degraded', 'unhealthy'
    );
  }
}, 30000); // Cada 30 segundos
```

### Suscribirse a Métricas

```javascript
// En servicio de monitoreo/dashboard
async function setupTelemetryListeners(telemetry) {
  // Escuchar todos los health checks
  await telemetry.subscribe('servicios/health/+', (metric) => {
    console.log('🏥 Health check:', metric.service, metric.status);
    // Actualizar dashboard, generar alertas, etc.
  });

  // Escuchar errores
  await telemetry.subscribe('errores/logs/+', (metric) => {
    console.error('⚠️ Error reportado:', metric.message);
    // Registrar en sistema de logging centralizado
  });

  // Escuchar métricas de rendimiento
  await telemetry.subscribe('rendimiento/api/+', (metric) => {
    console.log(
      `📊 API: ${metric.endpoint} - ${metric.duration}ms - ${metric.statusCode}`
    );
    // Analizar tendencias, generar alertas si es lento
  });

  // Escuchar actividad de usuarios
  await telemetry.subscribe('usuarios/actividad', (metric) => {
    console.log(`👤 Usuario ${metric.userId} - ${metric.action}`);
    // Actualizar analytics, auditoría
  });
}
```

## Ejemplos Prácticos

### Ejemplo 1: Flujo Completo de Reserva

```
1. Cliente crea reserva
2. micro-estudiantes:
   - Guarda en BD
   - Publica evento RESERVA_CREADA
   - Publica métrica de API
3. EventBus distribuye el evento
4. micro-notificaciones recibe evento
   - Publica tarea de email en MessageQueue
5. micro-notificaciones (worker)
   - Consume tarea de email
   - Envía confirmación
   - Publica métrica de envío exitoso
6. micro-reportes-estudiantes recibe evento
   - Actualiza estadísticas
   - Publica evento REPORTE_ACTUALIZADO
7. Dashboard recibe todas las métricas y eventos
   - Actualiza gráficos
   - Monitorea salud del sistema
```

### Ejemplo 2: Procesamiento de Reportes

```javascript
// En ruta de generación de reportes
router.post('/reportes/generar', async (req, res) => {
  try {
    // Guardar solicitud de reporte en BD
    const solicitud = await ReportRequest.create(req.body);

    // Encolar tarea de generación
    const task = createTask(
      TaskTypes.GENERAR_REPORTE,
      {
        reportId: solicitud._id,
        tipo: req.body.tipo,
        filtros: req.body.filtros,
        email: req.body.email,
      },
      'high'
    );

    await req.messaging.messageQueue.publishMessage('reportes', task);

    // Publicar evento
    const event = createEvent(
      EventTypes.REPORTE_GENERADO,
      { reportId: solicitud._id },
      'micro-reportes-estudiantes'
    );
    await req.messaging.eventBus.publishEvent('reportes', event);

    res.json({
      status: 'generando',
      reportId: solicitud._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Monitoreo

### Dashboard de Kafka

Acceder a: `http://localhost:8081`

Ver:
- Tópicos activos
- Mensajes por segundo
- Consumer groups
- Lag de consumers

### Dashboard de RabbitMQ

Acceder a: `http://localhost:15672`

Credenciales:
- Usuario: `guest`
- Contraseña: `guest`

Ver:
- Colas y sus longitudes
- Mensajes procesados
- Tasa de throughput
- Conexiones activas

### Monitoreo de MQTT

```javascript
// Verificar estado de MQTT
const status = req.messaging.telemetry.getConnectionStatus();
console.log(status);
// {
//   connected: true,
//   clientId: 'micro-estudiantes-telemetry',
//   brokerUrl: 'mqtt://mqtt:1883',
//   subscriptions: ['servicios/health/+', 'errores/logs/+'],
//   metricsBuffered: 23
// }
```

### Logs Centralizados

```javascript
const Logger = require('@proyecto/message-broker').Logger;

const logger = new Logger('micro-estudiantes');

logger.info('Reserva creada', { reservaId: '123' });
logger.warn('Conexión lenta a BD', { duration: 1500 });
logger.error('Error en proceso', error);
logger.success('Tarea completada', { taskId: '456' });
logger.debug('Variable de debug', { debug: true });
```

## Troubleshooting

### Kafka

```bash
# Verificar conexión
docker exec proyecto-kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# Ver tópicos
docker exec proyecto-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list

# Ver mensajes en un tópico
docker exec proyecto-kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic reservas \
  --from-beginning
```

### RabbitMQ

```bash
# Verificar conexión
docker exec proyecto-rabbitmq rabbitmq-diagnostics -q ping

# Ver estado de colas
docker exec proyecto-rabbitmq rabbitmqctl list_queues name messages consumers
```

### MQTT

```bash
# Suscribirse a todos los tópicos
mosquitto_sub -h localhost -t '#' -v

# Publicar test
mosquitto_pub -h localhost -t 'test/topic' -m 'Hello MQTT'
```

## Variables de Entorno Completas

```env
# === KAFKA ===
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=micro-estudiantes

# === RABBITMQ ===
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_MAX_CONNECTIONS=100
RABBITMQ_HEARTBEAT=60

# === MQTT ===
MQTT_BROKER_URL=mqtt://mqtt:1883
MQTT_CLIENT_ID=micro-estudiantes-telemetry
MQTT_USERNAME=
MQTT_PASSWORD=

# === LOGGING ===
LOG_LEVEL=info
DEBUG=false

# === SERVICIOS ===
SERVICE_NAME=micro-estudiantes
SERVICE_VERSION=1.0.0
NODE_ENV=production
```

## Próximos Pasos

1. Actualizar `package.json` de cada microservicio
2. Agregar variables de entorno en `.env`
3. Inicializar messaging en `src/app.js`
4. Implementar listeners de eventos/tareas relevantes
5. Publicar eventos y tareas desde rutas
6. Verificar logs en dashboards

¡Listo para comenzar! 🚀
