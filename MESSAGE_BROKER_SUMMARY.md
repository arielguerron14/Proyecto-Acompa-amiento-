# Sistema de Mensajería Global - Resumen Ejecutivo

## 🎯 Objetivo

Implementar una infraestructura de mensajería escalable y confiable que permita comunicación asincrónica entre los 10 microservicios del proyecto.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│               MICROSERVICIOS (10 total)                     │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │ maestros   │ estudiantes│ reportes   │ auth       │ ...  │
│  └────────────┴────────────┴────────────┴────────────┘     │
│                          │                                   │
│                   /message-broker                            │
│              (shared module - DRY)                           │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         │                │                │                 │
│    ┌────▼──────┐  ┌──────▼────┐  ┌──────▼──────┐            │
│    │   KAFKA   │  │ RABBITMQ  │  │    MQTT    │            │
│    │ EventBus  │  │ MessageQ  │  │ Telemetry  │            │
│    │  (Pub/Sub)│  │   (Queue) │  │  (Real-time)│           │
│    └────┬──────┘  └──────┬────┘  └──────┬──────┘            │
└────────┼──────────────────┼──────────────┼──────────────────┘
         │                  │              │
         │                  │              │
    ┌────▼──────┐      ┌───▼──────┐  ┌──▼───────┐
    │  Tópicos  │      │  Colas   │  │ Tópicos  │
    │ Eventos   │      │ Tareas   │  │ Métricas │
    └───────────┘      └──────────┘  └──────────┘
```

## 📦 Componentes Implementados

### 1. **EventBus (Kafka)**
- **Función**: Pub/Sub de eventos globales
- **Casos de uso**: 
  - Sincronización entre servicios
  - Disparadores de procesos
  - Auditoría de cambios
- **Tópicos predefinidos**:
  - `reservas` - Eventos de reservas
  - `horarios` - Eventos de horarios
  - `usuarios` - Eventos de usuarios
  - `reportes` - Eventos de reportes
  - `notificaciones` - Eventos de notificaciones
  - `errores` - Eventos de errores

**Archivo**: `message-broker/src/kafka/eventBus.js`

```javascript
// Publicar evento
const event = createEvent('reserva.creada', reservaData, 'micro-estudiantes');
await eventBus.publishEvent('reservas', event);

// Suscribirse
await eventBus.subscribe('reservas', 'consumer-group', (event) => {
  console.log('Evento recibido:', event);
});
```

### 2. **MessageQueue (RabbitMQ)**
- **Función**: Colas de tareas confiables
- **Casos de uso**:
  - Envío de emails/SMS
  - Procesamiento de reportes
  - Tareas pesadas asincrónicas
  - Reintentos automáticos
- **Colas predefinidas**:
  - `email` - Tareas de email
  - `sms` - Tareas de SMS
  - `reportes` - Generación de reportes
  - `tareas` - Tareas genéricas

**Archivo**: `message-broker/src/rabbitmq/messageQueue.js`

```javascript
// Publicar tarea
const task = createTask('task.enviar-email', { to: 'user@example.com' }, 'high');
await messageQueue.publishMessage('email', task);

// Consumir
await messageQueue.subscribe('email', async (task) => {
  await sendEmail(task);
});
```

### 3. **TelemetryService (MQTT)**
- **Función**: Telemetría en tiempo real
- **Casos de uso**:
  - Health checks de servicios
  - Métricas de rendimiento API
  - Logs de errores
  - Actividad de usuarios
- **Tópicos predefinidos**:
  - `servicios/health/+` - Estado de servicios
  - `rendimiento/api/+` - Métricas de rendimiento
  - `errores/logs/+` - Logs de errores
  - `usuarios/actividad` - Actividad de usuarios

**Archivo**: `message-broker/src/mqtt/telemetryService.js`

```javascript
// Publicar métrica
await telemetry.publishHealthCheck('micro-estudiantes', 'healthy');

// Suscribirse
await telemetry.subscribe('servicios/health/+', (metric) => {
  console.log('Health check:', metric);
});
```

## 📁 Estructura de Ficheros

```
message-broker/
├── src/
│   ├── kafka/
│   │   └── eventBus.js              ✅ EventBus con Kafka
│   ├── rabbitmq/
│   │   └── messageQueue.js          ✅ MessageQueue con RabbitMQ
│   ├── mqtt/
│   │   └── telemetryService.js      ✅ TelemetryService con MQTT
│   ├── utils/
│   │   ├── constants.js             ✅ EventTypes, TaskTypes, etc.
│   │   ├── logger.js                ✅ Logger centralizado
│   │   └── retry.js                 ✅ Retry, timeout, circuit breaker
│   └── index.js                     ✅ Exportaciones principales
├── package.json                     ✅ Dependencias
└── README.md                        ✅ Documentación
```

## 🐳 Infraestructura Docker

Se agregaron 4 servicios al `docker-compose.yml`:

```yaml
# Kafka + Zookeeper
- kafka:9092 (broker)
- zookeeper:2181 (coordinador)
- kafka-ui:8081 (interfaz visual)

# RabbitMQ
- rabbitmq:5672 (AMQP)
- rabbitmq:15672 (management UI)

# MQTT
- mqtt:1883 (broker)
- mqtt:9001 (websockets)
```

**Volúmenes agregados**:
- `rabbitmq-data` - Persistencia de RabbitMQ
- `mqtt-data` - Persistencia de MQTT
- `mqtt-logs` - Logs de MQTT

**Archivo configuración**: `mqtt-config.conf`

## 🔌 Integración con Microservicios

### Paso 1: Agregar dependencia

```json
{
  "dependencies": {
    "@proyecto/message-broker": "file:../message-broker"
  }
}
```

### Paso 2: Configurar entorno

```env
KAFKA_BROKERS=kafka:9092
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
MQTT_BROKER_URL=mqtt://mqtt:1883
```

### Paso 3: Inicializar en app

```javascript
const { initializeMessaging } = require('@proyecto/message-broker');

const messaging = await initializeMessaging();
```

### Paso 4: Usar en rutas

```javascript
// Publicar evento
await req.messaging.eventBus.publishEvent('reservas', event);

// Publicar tarea
await req.messaging.messageQueue.publishMessage('email', task);

// Publicar métrica
await req.messaging.telemetry.publishApiMetric(...);
```

## 📚 Documentación Incluida

| Archivo | Descripción |
|---------|-------------|
| `message-broker/README.md` | Guía de uso del módulo |
| `MESSAGE_BROKER_INTEGRATION.md` | Guía de integración con microservicios |
| `mqtt-config.conf` | Configuración de MQTT |

## 🎬 Características Implementadas

### EventBus (Kafka)
✅ Publicación de eventos globales
✅ Suscripción con consumer groups
✅ Persistencia de eventos
✅ Compresión GZIP
✅ Idempotencia de mensajes
✅ Información del cluster

### MessageQueue (RabbitMQ)
✅ Colas durables
✅ Mensajes persistentes
✅ TTL de mensajes
✅ Prefetch (1 mensaje por vez)
✅ ACK/NACK automático
✅ Reintentos (sin requeue en error)
✅ Exchanges y routing

### TelemetryService (MQTT)
✅ QoS 1 (al menos una vez)
✅ Buffer de métricas (últimas 100)
✅ Soporte de wildcards
✅ Health checks
✅ Métricas de API
✅ Logs de errores
✅ Actividad de usuarios

### Utilidades
✅ Logger centralizado
✅ Retry con backoff exponencial
✅ Timeout de promesas
✅ Circuit breaker
✅ Constantes estandarizadas

## 🚀 Próximas Acciones

1. **Integrar con microservicios existentes** (10 servicios)
   - Agregar `@proyecto/message-broker` a dependencies
   - Configurar variables de entorno
   - Inicializar messaging en app.js
   - Implementar event listeners relevantes

2. **Crear eventos personalizados** por servicio
   - micro-maestros: HORARIO_CREADO, etc.
   - micro-estudiantes: RESERVA_CREADA, etc.
   - micro-notificaciones: NOTIFICACION_ENVIADA, etc.

3. **Crear tareas específicas** por dominio
   - Envíos de email/SMS
   - Generación de reportes
   - Procesamiento de imágenes

4. **Configurar monitoreo**
   - Dashboard de Kafka (Kafka UI en :8081)
   - Dashboard de RabbitMQ (Management en :15672)
   - Alertas de health checks

5. **Pruebas e2e**
   - Verificar flujos completos evento→notificación
   - Validar persistencia de mensajes
   - Confirmar reintentos automáticos

## 📊 Dashboards Disponibles

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Kafka UI | `http://localhost:8081` | N/A |
| RabbitMQ | `http://localhost:15672` | guest/guest |
| MQTT | `mqtt://localhost:1883` | anonymous |

## 🔐 Notas de Seguridad

Desarrollo:
- MQTT permite conexiones anónimas
- RabbitMQ usa guest/guest
- Kafka sin autenticación

**⚠️ Cambiar en producción**:
- Habilitar autenticación MQTT
- Cambiar credenciales RabbitMQ
- Agregar SASL/SSL a Kafka
- Usar roles y permisos específicos

## 📈 Escalabilidad

- **Kafka**: Escalable horizontalmente, múltiples brokers
- **RabbitMQ**: Escalable con clustering
- **MQTT**: Lightweight, bajo consumo de recursos
- Todos soportan alta concurrencia

## ✨ Beneficios de la Arquitectura

1. **Desacoplamiento**: Servicios no necesitan conocerse
2. **Resiliencia**: Reintentos automáticos, durabilidad
3. **Escalabilidad**: Manejo de miles de mensajes/segundo
4. **Observabilidad**: Telemetría en tiempo real
5. **Confiabilidad**: ACK de mensajes, persistencia
6. **DRY**: Módulo centralizado reutilizable

## 📝 Ejemplo de Flujo Completo

```
1. Cliente POST /reservas
   ↓
2. micro-estudiantes:
   - Crea reserva en BD
   - Publica evento "RESERVA_CREADA" → Kafka
   - Publica métrica "API respuesta 120ms" → MQTT
   ↓
3. Otros servicios reciben evento:
   - micro-notificaciones: Publica tarea "ENVIAR_EMAIL" → RabbitMQ
   - micro-reportes-estudiantes: Actualiza estadísticas
   - Dashboard: Actualiza UI
   ↓
4. micro-notificaciones (worker):
   - Consume tarea de email
   - Envía email
   - Publica evento "NOTIFICACION_ENVIADA" → Kafka
   ↓
5. Monitoreo:
   - Recibe health check de micro-estudiantes
   - Recibe métricas de API
   - Visualiza en dashboard
```

## 🎓 Recursos

- **Kafka**: https://kafka.apache.org/
- **RabbitMQ**: https://www.rabbitmq.com/
- **MQTT**: https://mqtt.org/
- **kafkajs**: https://kafka.js.org/
- **amqplib**: https://www.npmjs.com/package/amqplib
- **mqtt.js**: https://www.npmjs.com/package/mqtt

---

**Estado**: ✅ Completo - Listo para integrar con microservicios

**Última actualización**: 2024
