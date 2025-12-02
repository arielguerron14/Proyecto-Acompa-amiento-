const amqp = require('amqplib');

/**
 * MessageQueue Global con RabbitMQ
 * 
 * Proporciona un sistema de colas de mensajes confiable
 * para procesamiento asincrónico de tareas.
 * 
 * Colas estándar:
 * - email: Envío de emails
 * - sms: Envío de SMS
 * - reportes: Generación de reportes
 * - tareas: Tareas de procesamiento
 * - notificaciones: Notificaciones push
 */

class MessageQueue {
  constructor(url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672') {
    this.url = url;
    this.connection = null;
    this.channel = null;
    this.consumers = new Map();
  }

  /**
   * Conecta a RabbitMQ
   */
  async connect() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      // Prefetch de 1 mensaje por vez
      await this.channel.prefetch(1);

      console.log('[MessageQueue] Conectado a RabbitMQ');

      // Manejar desconexiones
      this.connection.on('error', (err) => {
        console.error('[MessageQueue] Error de conexión:', err);
        this._reconnect();
      });

      this.connection.on('close', () => {
        console.log('[MessageQueue] Conexión cerrada');
        this._reconnect();
      });
    } catch (error) {
      console.error('[MessageQueue] Error conectando a RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Publica un mensaje en una cola
   */
  async publishMessage(queue, message, options = {}) {
    try {
      if (!this.channel) {
        throw new Error('MessageQueue no está conectado. Llama a connect() primero.');
      }

      // Asegurar que la cola existe
      await this.channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-message-ttl': options.ttl || 86400000, // 24 horas por defecto
        },
      });

      const content = Buffer.from(
        JSON.stringify({
          ...message,
          timestamp: message.timestamp || new Date().toISOString(),
          source: message.source || 'unknown',
        })
      );

      await this.channel.sendToQueue(queue, content, {
        persistent: true,
        contentType: 'application/json',
      });

      console.log(`[MessageQueue] Mensaje publicado en cola ${queue}`);
    } catch (error) {
      console.error('[MessageQueue] Error publicando mensaje:', error);
      throw error;
    }
  }

  /**
   * Se suscribe a mensajes de una cola
   */
  async subscribe(queue, callback, options = {}) {
    try {
      if (!this.channel) {
        throw new Error('MessageQueue no está conectado. Llama a connect() primero.');
      }

      // Asegurar que la cola existe
      await this.channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-message-ttl': options.ttl || 86400000,
        },
      });

      if (this.consumers.has(queue)) {
        console.log(`[MessageQueue] Consumidor ya existe para cola ${queue}`);
        return;
      }

      await this.channel.consume(queue, async (msg) => {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`[MessageQueue] Mensaje recibido de ${queue}:`, content.type);

          await callback(content);

          // Acknowledge del mensaje
          this.channel.ack(msg);
        } catch (error) {
          console.error('[MessageQueue] Error procesando mensaje:', error);
          // Nack sin requeue si hay error
          this.channel.nack(msg, false, false);
        }
      });

      this.consumers.set(queue, true);
      console.log(`[MessageQueue] Consumidor registrado para cola ${queue}`);
    } catch (error) {
      console.error('[MessageQueue] Error suscribiéndose:', error);
      throw error;
    }
  }

  /**
   * Declara un exchange para routing avanzado
   */
  async declareExchange(exchange, type = 'direct') {
    try {
      if (!this.channel) {
        throw new Error('MessageQueue no está conectado.');
      }

      await this.channel.assertExchange(exchange, type, { durable: true });
      console.log(`[MessageQueue] Exchange declarado: ${exchange} (${type})`);
    } catch (error) {
      console.error('[MessageQueue] Error declarando exchange:', error);
      throw error;
    }
  }

  /**
   * Vincula una cola a un exchange
   */
  async bindQueueToExchange(queue, exchange, routingKey) {
    try {
      if (!this.channel) {
        throw new Error('MessageQueue no está conectado.');
      }

      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, routingKey);
      console.log(`[MessageQueue] Cola ${queue} vinculada a ${exchange}`);
    } catch (error) {
      console.error('[MessageQueue] Error vinculando cola:', error);
      throw error;
    }
  }

  /**
   * Publica un mensaje con routing
   */
  async publishWithRouting(exchange, routingKey, message) {
    try {
      if (!this.channel) {
        throw new Error('MessageQueue no está conectado.');
      }

      const content = Buffer.from(
        JSON.stringify({
          ...message,
          timestamp: message.timestamp || new Date().toISOString(),
        })
      );

      this.channel.publish(exchange, routingKey, content, {
        persistent: true,
        contentType: 'application/json',
      });

      console.log(`[MessageQueue] Mensaje publicado en ${exchange}/${routingKey}`);
    } catch (error) {
      console.error('[MessageQueue] Error publicando con routing:', error);
      throw error;
    }
  }

  /**
   * Desconecta de RabbitMQ
   */
  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('[MessageQueue] Desconectado de RabbitMQ');
    } catch (error) {
      console.error('[MessageQueue] Error desconectando:', error);
    }
  }

  /**
   * Reintentar conexión
   */
  async _reconnect() {
    console.log('[MessageQueue] Intentando reconectar en 5 segundos...');
    setTimeout(() => {
      this.connect().catch((err) => {
        console.error('[MessageQueue] Fallo al reconectar:', err);
      });
    }, 5000);
  }

  /**
   * Obtiene estadísticas de la cola
   */
  async getQueueStats(queue) {
    try {
      if (!this.channel) {
        throw new Error('MessageQueue no está conectado.');
      }

      const result = await this.channel.checkQueue(queue);
      return result;
    } catch (error) {
      console.error('[MessageQueue] Error obteniendo stats:', error);
      throw error;
    }
  }

  /**
   * Verifica si está conectado
   */
  isConnected() {
    return this.connection !== null && this.channel !== null;
  }
}

// Singleton global
let messageQueueInstance = null;

/**
 * Obtiene o crea la instancia global del MessageQueue
 */
function getMessageQueue(url) {
  if (!messageQueueInstance) {
    messageQueueInstance = new MessageQueue(url);
  }
  return messageQueueInstance;
}

module.exports = {
  MessageQueue,
  getMessageQueue,
};
