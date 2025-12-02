const { Kafka, logLevel } = require('kafkajs');

/**
 * EventBus Global con Kafka
 * 
 * Proporciona un sistema de eventos pub/sub escalable
 * para publicar y consumir eventos en tiempo real.
 * 
 * Tópicos estándar:
 * - reservas: Eventos de reservas de estudiantes
 * - horarios: Eventos de horarios de maestros
 * - reportes: Eventos de generación de reportes
 * - usuarios: Eventos de usuarios (creación, actualización)
 * - notificaciones: Eventos de notificaciones
 * - analytics: Eventos de analytics
 */

class EventBus {
  constructor(brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092']) {
    this.brokers = brokers;
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'evento-client',
      brokers: this.brokers,
      logLevel: logLevel.INFO,
      logCreator: this._createCustomLogCreator(),
    });

    this.producer = null;
    this.consumers = new Map();
  }

  /**
   * Inicializa el EventBus
   */
  async connect() {
    try {
      this.producer = this.kafka.producer({
        idempotent: true,
        maxInFlightRequests: 5,
        compression: 1, // GZIP
      });

      await this.producer.connect();
      console.log('[EventBus] Producer conectado a Kafka');
    } catch (error) {
      console.error('[EventBus] Error conectando producer:', error);
      throw error;
    }
  }

  /**
   * Publica un evento en un tópico
   */
  async publishEvent(topic, event) {
    try {
      if (!this.producer) {
        throw new Error('EventBus no está conectado. Llama a connect() primero.');
      }

      const message = {
        key: event.id || null,
        value: JSON.stringify({
          ...event,
          timestamp: event.timestamp || new Date().toISOString(),
          source: event.source || 'unknown',
        }),
        headers: {
          'event-type': event.type || 'event',
          'service': event.source || 'unknown',
        },
      };

      await this.producer.send({
        topic,
        messages: [message],
        timeout: 10000,
      });

      console.log(`[EventBus] Evento publicado en ${topic}:`, event.type);
    } catch (error) {
      console.error('[EventBus] Error publicando evento:', error);
      throw error;
    }
  }

  /**
   * Se suscribe a eventos de un tópico
   */
  async subscribe(topic, groupId, callback) {
    try {
      const consumerKey = `${topic}-${groupId}`;

      if (this.consumers.has(consumerKey)) {
        console.log(`[EventBus] Consumidor ya existe para ${topic}/${groupId}`);
        return;
      }

      const consumer = this.kafka.consumer({ groupId });
      await consumer.connect();
      await consumer.subscribe({ topic });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            console.log(`[EventBus] Evento recibido de ${topic}:`, event.type);
            await callback(event);
          } catch (error) {
            console.error(`[EventBus] Error procesando evento:`, error);
          }
        },
      });

      this.consumers.set(consumerKey, consumer);
      console.log(`[EventBus] Suscriptor registrado para ${topic}/${groupId}`);
    } catch (error) {
      console.error('[EventBus] Error suscribiéndose:', error);
      throw error;
    }
  }

  /**
   * Desconecta todos los consumers
   */
  async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
      }

      for (const [key, consumer] of this.consumers) {
        await consumer.disconnect();
      }

      console.log('[EventBus] Desconectado de Kafka');
    } catch (error) {
      console.error('[EventBus] Error desconectando:', error);
    }
  }

  /**
   * Log personalizado para Kafka
   */
  _createCustomLogCreator() {
    return () => ({ namespace, level, label, log }) => {
      const { timestamp, message, ...extra } = log;
      console.log(`[${label}] [${level}] ${message}`, extra);
    };
  }

  /**
   * Verifica si el producer está conectado
   */
  isConnected() {
    return this.producer !== null;
  }

  /**
   * Obtiene información del cluster
   */
  async getClusterInfo() {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const cluster = await admin.describeCluster();
      await admin.disconnect();

      return cluster;
    } catch (error) {
      console.error('[EventBus] Error obteniendo info del cluster:', error);
      throw error;
    }
  }
}

// Singleton global
let eventBusInstance = null;

/**
 * Obtiene o crea la instancia global del EventBus
 */
function getEventBus(brokers) {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(brokers);
  }
  return eventBusInstance;
}

module.exports = {
  EventBus,
  getEventBus,
};
