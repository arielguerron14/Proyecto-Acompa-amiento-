const mqtt = require('mqtt');

/**
 * Servicio de Telemetría en Tiempo Real con MQTT
 * 
 * Proporciona un sistema de telemetría para monitoreo
 * en tiempo real de métricas y eventos del sistema.
 * 
 * Tópicos estándar:
 * - sistema/metricas: Métricas del sistema
 * - servicios/health: Health checks de servicios
 * - usuarios/actividad: Actividad de usuarios
 * - rendimiento/api: Métricas de rendimiento de API
 * - errores/logs: Logs de errores
 */

class TelemetryService {
  constructor(brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883') {
    this.brokerUrl = brokerUrl;
    this.client = null;
    this.subscriptions = new Map();
    this.metricsBuffer = [];
    this.bufferSize = 100;
  }

  /**
   * Conecta al broker MQTT
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, {
          clientId: process.env.MQTT_CLIENT_ID || `telemetry-${Date.now()}`,
          reconnectPeriod: 1000,
          connectTimeout: 10000,
          clean: true,
        });

        this.client.on('connect', () => {
          console.log('[Telemetry] Conectado al broker MQTT');
          resolve();
        });

        this.client.on('error', (error) => {
          console.error('[Telemetry] Error MQTT:', error);
          reject(error);
        });

        this.client.on('disconnect', () => {
          console.log('[Telemetry] Desconectado del broker MQTT');
        });

        this.client.on('message', (topic, message) => {
          this._handleMessage(topic, message);
        });
      } catch (error) {
        console.error('[Telemetry] Error conectando:', error);
        reject(error);
      }
    });
  }

  /**
   * Publica una métrica o evento de telemetría
   */
  async publishMetric(topic, metric) {
    try {
      if (!this.client || !this.client.connected) {
        throw new Error('Telemetry no está conectado. Llama a connect() primero.');
      }

      const payload = JSON.stringify({
        ...metric,
        timestamp: metric.timestamp || new Date().toISOString(),
        source: metric.source || 'unknown',
      });

      this.client.publish(topic, payload, { qos: 1, retain: false });

      // Almacenar en buffer
      this.metricsBuffer.push({
        topic,
        metric,
        timestamp: new Date(),
      });

      // Mantener tamaño del buffer
      if (this.metricsBuffer.length > this.bufferSize) {
        this.metricsBuffer.shift();
      }

      console.log(`[Telemetry] Métrica publicada en ${topic}`);
    } catch (error) {
      console.error('[Telemetry] Error publicando métrica:', error);
      throw error;
    }
  }

  /**
   * Se suscribe a un tópico de telemetría
   */
  async subscribe(topic, callback) {
    try {
      if (!this.client) {
        throw new Error('Telemetry no está conectado.');
      }

      if (this.subscriptions.has(topic)) {
        console.log(`[Telemetry] Ya suscrito a ${topic}`);
        return;
      }

      this.client.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          console.error(`[Telemetry] Error suscribiéndose a ${topic}:`, error);
        } else {
          console.log(`[Telemetry] Suscrito a ${topic}`);
          this.subscriptions.set(topic, callback);
        }
      });
    } catch (error) {
      console.error('[Telemetry] Error suscribiéndose:', error);
      throw error;
    }
  }

  /**
   * Publica health check de un servicio
   */
  async publishHealthCheck(serviceName, status) {
    const topic = `servicios/health/${serviceName}`;
    const metric = {
      service: serviceName,
      status, // 'healthy', 'degraded', 'unhealthy'
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    await this.publishMetric(topic, metric);
  }

  /**
   * Publica métrica de rendimiento de API
   */
  async publishApiMetric(serviceName, endpoint, duration, statusCode) {
    const topic = `rendimiento/api/${serviceName}`;
    const metric = {
      endpoint,
      duration, // ms
      statusCode,
      timestamp: new Date().toISOString(),
    };

    await this.publishMetric(topic, metric);
  }

  /**
   * Publica error de sistema
   */
  async publishError(serviceName, error) {
    const topic = `errores/logs/${serviceName}`;
    const metric = {
      message: error.message,
      stack: error.stack,
      level: 'error',
      timestamp: new Date().toISOString(),
    };

    await this.publishMetric(topic, metric);
  }

  /**
   * Publica métrica de actividad de usuario
   */
  async publishUserActivity(userId, action, metadata = {}) {
    const topic = `usuarios/actividad`;
    const metric = {
      userId,
      action,
      metadata,
      timestamp: new Date().toISOString(),
    };

    await this.publishMetric(topic, metric);
  }

  /**
   * Maneja mensajes recibidos
   */
  _handleMessage(topic, message) {
    try {
      const callback = this.subscriptions.get(topic);
      if (callback) {
        const payload = JSON.parse(message.toString());
        callback(payload);
      }
    } catch (error) {
      console.error('[Telemetry] Error manejando mensaje:', error);
    }
  }

  /**
   * Obtiene métricas del buffer
   */
  getMetricsBuffer() {
    return [...this.metricsBuffer];
  }

  /**
   * Limpia el buffer de métricas
   */
  clearMetricsBuffer() {
    this.metricsBuffer = [];
  }

  /**
   * Se desuscribe de un tópico
   */
  async unsubscribe(topic) {
    try {
      if (this.client && this.client.connected) {
        this.client.unsubscribe(topic);
        this.subscriptions.delete(topic);
        console.log(`[Telemetry] Desuscrito de ${topic}`);
      }
    } catch (error) {
      console.error('[Telemetry] Error desuscribiéndose:', error);
    }
  }

  /**
   * Desconecta del broker MQTT
   */
  async disconnect() {
    try {
      if (this.client) {
        await new Promise((resolve) => {
          this.client.end(() => {
            console.log('[Telemetry] Desconectado del broker MQTT');
            resolve();
          });
        });
      }
    } catch (error) {
      console.error('[Telemetry] Error desconectando:', error);
    }
  }

  /**
   * Verifica si está conectado
   */
  isConnected() {
    return this.client && this.client.connected;
  }

  /**
   * Obtiene estado de la conexión
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      clientId: this.client?.options?.clientId,
      brokerUrl: this.brokerUrl,
      subscriptions: Array.from(this.subscriptions.keys()),
      metricsBuffered: this.metricsBuffer.length,
    };
  }
}

// Singleton global
let telemetryInstance = null;

/**
 * Obtiene o crea la instancia global del TelemetryService
 */
function getTelemetryService(brokerUrl) {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryService(brokerUrl);
  }
  return telemetryInstance;
}

module.exports = {
  TelemetryService,
  getTelemetryService,
};
