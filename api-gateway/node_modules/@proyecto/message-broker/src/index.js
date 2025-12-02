/**
 * Archivo de exportación centralizado del módulo message-broker
 * 
 * Expone todos los clientes y utilities para uso en microservicios
 */

// EventBus (Kafka)
const { EventBus, getEventBus } = require('./kafka/eventBus');

// MessageQueue (RabbitMQ)
const { MessageQueue, getMessageQueue } = require('./rabbitmq/messageQueue');

// TelemetryService (MQTT)
const { TelemetryService, getTelemetryService } = require('./mqtt/telemetryService');

// Constants
const {
  EventTypes,
  TaskTypes,
  ProcessingStatus,
  SeverityLevels,
  createEvent,
  createTask,
  createMetric,
} = require('./utils/constants');

// Logger
const Logger = require('./utils/logger');

// Utilities
const { retryWithBackoff, withTimeout, CircuitBreaker } = require('./utils/retry');

/**
 * Inicializa todos los servicios de mensajería
 */
async function initializeMessaging(config = {}) {
  const {
    kafkaBrokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  } = config;

  try {
    const eventBus = getEventBus(kafkaBrokers);
    const messageQueue = getMessageQueue(rabbitmqUrl);
    const telemetry = getTelemetryService(mqttBrokerUrl);

    // Conectar servicios
    await eventBus.connect();
    await messageQueue.connect();
    await telemetry.connect();

    console.log('✅ Servicios de mensajería inicializados correctamente');

    return {
      eventBus,
      messageQueue,
      telemetry,
    };
  } catch (error) {
    console.error('❌ Error inicializando servicios de mensajería:', error);
    throw error;
  }
}

/**
 * Desconecta todos los servicios
 */
async function disconnectMessaging(services) {
  try {
    if (services.eventBus) await services.eventBus.disconnect();
    if (services.messageQueue) await services.messageQueue.disconnect();
    if (services.telemetry) await services.telemetry.disconnect();

    console.log('✅ Servicios de mensajería desconectados');
  } catch (error) {
    console.error('❌ Error desconectando servicios:', error);
  }
}

// Exportaciones
module.exports = {
  // Clientes
  EventBus,
  getEventBus,
  MessageQueue,
  getMessageQueue,
  TelemetryService,
  getTelemetryService,

  // Constants
  EventTypes,
  TaskTypes,
  ProcessingStatus,
  SeverityLevels,
  createEvent,
  createTask,
  createMetric,

  // Logger
  Logger,

  // Utilities
  retryWithBackoff,
  withTimeout,
  CircuitBreaker,

  // Inicialización
  initializeMessaging,
  disconnectMessaging,
};
