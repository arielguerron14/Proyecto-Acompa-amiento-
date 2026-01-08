/**
 * CONFIGURACIÓN CENTRALIZADA DE INFRAESTRUCTURA
 * 
 * Este archivo es el ÚNICO punto donde se deben mantener todas las IPs del proyecto.
 * Cualquier cambio aquí se refleja automáticamente en todos los servicios.
 * 
 * ⚠️ IMPORTANTE: Al cambiar las IPs, se debe ejecutar: npm run build:all
 */

module.exports = {
  // ============================================
  // AMBIENTE ACTUAL (production | development)
  // ============================================
  ENVIRONMENT: process.env.ENVIRONMENT || 'production',

  // ============================================
  // IPs PÚBLICAS (para acceso externo)
  // ============================================
  PUBLIC: {
    // EC2-DB - IP pública
    DB_IP: process.env.DB_PUBLIC_IP || '44.192.114.31',
    
    // EC2-CORE - IP pública
    CORE_IP: process.env.CORE_PUBLIC_IP || '13.216.12.61',

    // API Gateway - IP pública para acceso desde frontend
    API_GATEWAY_IP: process.env.API_GATEWAY_IP || '52.71.188.181',
    API_GATEWAY_PORT: process.env.API_GATEWAY_PORT || 8080,
    API_GATEWAY_URL: function() {
      return `http://${this.API_GATEWAY_IP}:${this.API_GATEWAY_PORT}`;
    },

    // Frontend - IP pública para acceso desde navegador
    FRONTEND_IP: process.env.FRONTEND_IP || '107.21.124.81',
    FRONTEND_PORT: process.env.FRONTEND_PORT || 5500,
    FRONTEND_URL: function() {
      return `http://${this.FRONTEND_IP}:${this.FRONTEND_PORT}`;
    },

    // Notificaciones - IP pública
    NOTIFICACIONES_IP: process.env.NOTIFICACIONES_IP || '44.192.74.171',
    NOTIFICACIONES_PORT: process.env.NOTIFICACIONES_PORT || 5005,
    NOTIFICACIONES_URL: function() {
      return `http://${this.NOTIFICACIONES_IP}:${this.NOTIFICACIONES_PORT}`;
    },

    // Messaging - IP pública
    MESSAGING_IP: process.env.MESSAGING_IP || '18.205.26.214',
    MESSAGING_PORT: process.env.MESSAGING_PORT || 1883,
    MESSAGING_URL: function() {
      return `mqtt://${this.MESSAGING_IP}:${this.MESSAGING_PORT}`;
    },

    // Reportes - IP pública
    REPORTES_IP: process.env.REPORTES_IP || '54.175.62.79',
    REPORTES_ESTUDIANTES_PORT: process.env.REPORTES_ESTUDIANTES_PORT || 5003,
    REPORTES_MAESTROS_PORT: process.env.REPORTES_MAESTROS_PORT || 5004,
    REPORTES_ESTUDIANTES_URL: function() {
      return `http://${this.REPORTES_IP}:${this.REPORTES_ESTUDIANTES_PORT}`;
    },
    REPORTES_MAESTROS_URL: function() {
      return `http://${this.REPORTES_IP}:${this.REPORTES_MAESTROS_PORT}`;
    },

    // Monitoring - IP pública
    MONITORING_IP: process.env.MONITORING_IP || '54.198.235.28',
    PROMETHEUS_PORT: process.env.PROMETHEUS_PORT || 9090,
    GRAFANA_PORT: process.env.GRAFANA_PORT || 3000,

    // Kafka - IP pública
    KAFKA_IP: process.env.KAFKA_IP || '52.86.104.42',
    KAFKA_PORT: process.env.KAFKA_PORT || 9092,
    KAFKA_URL: function() {
      return `kafka://${this.KAFKA_IP}:${this.KAFKA_PORT}`;
    },

    // Prometheus - IP pública
    PROMETHEUS_PUBLIC_IP: process.env.PROMETHEUS_PUBLIC_IP || '54.198.235.28',
    PROMETHEUS_PUBLIC_PORT: process.env.PROMETHEUS_PORT || 9090,
    PROMETHEUS_PUBLIC_URL: function() {
      return `http://${this.PROMETHEUS_PUBLIC_IP}:${this.PROMETHEUS_PUBLIC_PORT}`;
    },

    // Grafana - IP pública
    GRAFANA_PUBLIC_IP: process.env.GRAFANA_PUBLIC_IP || '54.198.235.28',
    GRAFANA_PUBLIC_PORT: process.env.GRAFANA_PORT || 3000,
    GRAFANA_PUBLIC_URL: function() {
      return `http://${this.GRAFANA_PUBLIC_IP}:${this.GRAFANA_PUBLIC_PORT}`;
    },

    // RabbitMQ - IP pública
    RABBITMQ_IP: process.env.RABBITMQ_IP || '44.202.235.19',
    RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
    RABBITMQ_MANAGEMENT_PORT: process.env.RABBITMQ_MANAGEMENT_PORT || 15672,
    RABBITMQ_URL: function() {
      return `amqp://${this.RABBITMQ_IP}:${this.RABBITMQ_PORT}`;
    },
    RABBITMQ_MANAGEMENT_URL: function() {
      return `http://${this.RABBITMQ_IP}:${this.RABBITMQ_MANAGEMENT_PORT}`;
    },
  },

  // ============================================
  // IPs PRIVADAS (para comunicación interna VPC)
  // ============================================
  PRIVATE: {
    // EC2-DB - IP privada dentro de VPC
    DB_IP: process.env.DB_PRIVATE_IP || '172.31.79.193',
    MONGO_PORT: process.env.MONGO_PORT || 27017,
    POSTGRES_PORT: process.env.POSTGRES_PORT || 5432,
    REDIS_PORT: process.env.REDIS_PORT || 6379,

    MONGO_HOST: function() {
      return this.DB_IP;
    },
    MONGO_URL: function() {
      return `mongodb://${this.DB_IP}:${this.MONGO_PORT}`;
    },
    POSTGRES_HOST: function() {
      return this.DB_IP;
    },
    POSTGRES_URL: function() {
      return `postgresql://${this.DB_IP}:${this.POSTGRES_PORT}`;
    },
    REDIS_HOST: function() {
      return this.DB_IP;
    },

    // EC2-CORE - IP privada dentro de VPC
    CORE_IP: process.env.CORE_PRIVATE_IP || '172.31.78.183',
    AUTH_PORT: process.env.AUTH_PORT || 3000,
    ESTUDIANTES_PORT: process.env.ESTUDIANTES_PORT || 3001,
    MAESTROS_PORT: process.env.MAESTROS_PORT || 3002,
    GATEWAY_PORT: process.env.GATEWAY_PORT || 8080,

    AUTH_URL: function() {
      return `http://${this.CORE_IP}:${this.AUTH_PORT}`;
    },
    ESTUDIANTES_URL: function() {
      return `http://${this.CORE_IP}:${this.ESTUDIANTES_PORT}`;
    },
    MAESTROS_URL: function() {
      return `http://${this.CORE_IP}:${this.MAESTROS_PORT}`;
    },
    GATEWAY_URL: function() {
      return `http://${this.CORE_IP}:${this.GATEWAY_PORT}`;
    },

    // EC2-Reportes - IP privada dentro de VPC
    REPORTES_IP: process.env.REPORTES_PRIVATE_IP || '172.31.69.133',
    REPORTES_ESTUDIANTES_PORT: process.env.REPORTES_ESTUDIANTES_PORT || 5003,
    REPORTES_MAESTROS_PORT: process.env.REPORTES_MAESTROS_PORT || 5004,
    REPORTES_EST_URL: function() {
      return `http://${this.REPORTES_IP}:${this.REPORTES_ESTUDIANTES_PORT}`;
    },
    REPORTES_MAEST_URL: function() {
      return `http://${this.REPORTES_IP}:${this.REPORTES_MAESTROS_PORT}`;
    },

    // EC2-Notificaciones - IP privada dentro de VPC
    NOTIFICACIONES_IP: process.env.NOTIFICACIONES_PRIVATE_IP || '172.31.65.57',
    NOTIFICACIONES_PORT: process.env.NOTIFICACIONES_PORT || 5005,
    NOTIFICACIONES_URL: function() {
      return `http://${this.NOTIFICACIONES_IP}:${this.NOTIFICACIONES_PORT}`;
    },

    // EC2-Messaging - IP privada dentro de VPC
    MESSAGING_IP: process.env.MESSAGING_PRIVATE_IP || '172.31.73.6',
    MESSAGING_PORT: process.env.MESSAGING_PORT || 1883,
    MESSAGING_URL: function() {
      return `mqtt://${this.MESSAGING_IP}:${this.MESSAGING_PORT}`;
    },

    // EC2-API-Gateway Replica - IP privada dentro de VPC
    API_GATEWAY_REPLICA_IP: process.env.API_GATEWAY_REPLICA_PRIVATE_IP || '172.31.76.105',
    API_GATEWAY_REPLICA_PORT: process.env.API_GATEWAY_REPLICA_PORT || 8080,
    API_GATEWAY_REPLICA_URL: function() {
      return `http://${this.API_GATEWAY_REPLICA_IP}:${this.API_GATEWAY_REPLICA_PORT}`;
    },

    // EC2-Frontend - IP privada dentro de VPC
    FRONTEND_PRIVATE_IP: process.env.FRONTEND_PRIVATE_IP || '172.31.69.203',
    FRONTEND_PRIVATE_PORT: process.env.FRONTEND_PRIVATE_PORT || 5500,
    FRONTEND_PRIVATE_URL: function() {
      return `http://${this.FRONTEND_PRIVATE_IP}:${this.FRONTEND_PRIVATE_PORT}`;
    },

    // EC2-Monitoring - IP privada dentro de VPC
    MONITORING_IP: process.env.MONITORING_PRIVATE_IP || '172.31.71.151',
    PROMETHEUS_PORT: process.env.PROMETHEUS_PORT || 9090,
    GRAFANA_PORT: process.env.GRAFANA_PORT || 3000,
    PROMETHEUS_URL: function() {
      return `http://${this.MONITORING_IP}:${this.PROMETHEUS_PORT}`;
    },
    GRAFANA_URL: function() {
      return `http://${this.MONITORING_IP}:${this.GRAFANA_PORT}`;
    },

    // EC2-Kafka - IP privada dentro de VPC
    KAFKA_IP: process.env.KAFKA_PRIVATE_IP || '172.31.80.45',
    KAFKA_PORT: process.env.KAFKA_PORT || 9092,
    KAFKA_ZOOKEEPER_PORT: process.env.KAFKA_ZOOKEEPER_PORT || 2181,
    KAFKA_URL: function() {
      return `kafka://${this.KAFKA_IP}:${this.KAFKA_PORT}`;
    },
    KAFKA_ZOOKEEPER_URL: function() {
      return `${this.KAFKA_IP}:${this.KAFKA_ZOOKEEPER_PORT}`;
    },

    // EC2-Prometheus - IP privada dentro de VPC (puede estar en MONITORING)
    PROMETHEUS_PRIVATE_IP: process.env.PROMETHEUS_PRIVATE_IP || '172.31.71.151',
    PROMETHEUS_PRIVATE_PORT: process.env.PROMETHEUS_PORT || 9090,
    PROMETHEUS_PRIVATE_URL: function() {
      return `http://${this.PROMETHEUS_PRIVATE_IP}:${this.PROMETHEUS_PRIVATE_PORT}`;
    },

    // EC2-Grafana - IP privada dentro de VPC (puede estar en MONITORING)
    GRAFANA_PRIVATE_IP: process.env.GRAFANA_PRIVATE_IP || '172.31.71.151',
    GRAFANA_PRIVATE_PORT: process.env.GRAFANA_PORT || 3000,
    GRAFANA_PRIVATE_URL: function() {
      return `http://${this.GRAFANA_PRIVATE_IP}:${this.GRAFANA_PRIVATE_PORT}`;
    },

    // EC2-RabbitMQ - IP privada dentro de VPC
    RABBITMQ_IP: process.env.RABBITMQ_PRIVATE_IP || '172.31.72.88',
    RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
    RABBITMQ_MANAGEMENT_PORT: process.env.RABBITMQ_MANAGEMENT_PORT || 15672,
    RABBITMQ_URL: function() {
      return `amqp://${this.RABBITMQ_IP}:${this.RABBITMQ_PORT}`;
    },
    RABBITMQ_MANAGEMENT_URL: function() {
      return `http://${this.RABBITMQ_IP}:${this.RABBITMQ_MANAGEMENT_PORT}`;
    },
  },

  // ============================================
  // CREDENCIALES (mantener hardcodeadas)
  // ============================================
  CREDENTIALS: {
    DB_POSTGRES_USER: process.env.DB_POSTGRES_USER || 'postgres',
    DB_POSTGRES_PASSWORD: process.env.DB_POSTGRES_PASSWORD || 'password',
    DB_POSTGRES_DB: process.env.DB_POSTGRES_DB || 'acompanamiento',
    
    // Mongo sin autenticación (según especificación)
    MONGO_NO_AUTH: true,
  },

  // ============================================
  // HELPER: Obtener config por ambiente
  // ============================================
  isProduction() {
    return this.ENVIRONMENT === 'production';
  },

  isDevelopment() {
    return this.ENVIRONMENT === 'development';
  },

  // ============================================
  // HELPER: Exportar como variables de entorno
  // ============================================
  toEnvVars() {
    return {
      // Public IPs
      DB_PUBLIC_IP: this.PUBLIC.DB_IP,
      CORE_PUBLIC_IP: this.PUBLIC.CORE_IP,
      API_GATEWAY_IP: this.PUBLIC.API_GATEWAY_IP,
      API_GATEWAY_PORT: this.PUBLIC.API_GATEWAY_PORT,
      FRONTEND_IP: this.PUBLIC.FRONTEND_IP,
      FRONTEND_PORT: this.PUBLIC.FRONTEND_PORT,
      NOTIFICACIONES_IP: this.PUBLIC.NOTIFICACIONES_IP,
      NOTIFICACIONES_PORT: this.PUBLIC.NOTIFICACIONES_PORT,
      MESSAGING_IP: this.PUBLIC.MESSAGING_IP,
      MESSAGING_PORT: this.PUBLIC.MESSAGING_PORT,
      REPORTES_IP: this.PUBLIC.REPORTES_IP,
      REPORTES_ESTUDIANTES_PORT: this.PUBLIC.REPORTES_ESTUDIANTES_PORT,
      REPORTES_MAESTROS_PORT: this.PUBLIC.REPORTES_MAESTROS_PORT,
      MONITORING_IP: this.PUBLIC.MONITORING_IP,
      PROMETHEUS_PORT: this.PUBLIC.PROMETHEUS_PORT,
      GRAFANA_PORT: this.PUBLIC.GRAFANA_PORT,
      KAFKA_IP: this.PUBLIC.KAFKA_IP,
      KAFKA_PORT: this.PUBLIC.KAFKA_PORT,
      PROMETHEUS_PUBLIC_IP: this.PUBLIC.PROMETHEUS_PUBLIC_IP,
      GRAFANA_PUBLIC_IP: this.PUBLIC.GRAFANA_PUBLIC_IP,
      RABBITMQ_IP: this.PUBLIC.RABBITMQ_IP,
      RABBITMQ_PORT: this.PUBLIC.RABBITMQ_PORT,
      RABBITMQ_MANAGEMENT_PORT: this.PUBLIC.RABBITMQ_MANAGEMENT_PORT,

      // Private IPs
      DB_PRIVATE_IP: this.PRIVATE.DB_IP,
      CORE_PRIVATE_IP: this.PRIVATE.CORE_IP,
      REPORTES_PRIVATE_IP: this.PRIVATE.REPORTES_IP,
      NOTIFICACIONES_PRIVATE_IP: this.PRIVATE.NOTIFICACIONES_IP,
      MESSAGING_PRIVATE_IP: this.PRIVATE.MESSAGING_IP,
      API_GATEWAY_REPLICA_PRIVATE_IP: this.PRIVATE.API_GATEWAY_REPLICA_IP,
      FRONTEND_PRIVATE_IP: this.PRIVATE.FRONTEND_PRIVATE_IP,
      MONITORING_PRIVATE_IP: this.PRIVATE.MONITORING_IP,
      KAFKA_PRIVATE_IP: this.PRIVATE.KAFKA_IP,
      KAFKA_PORT: this.PRIVATE.KAFKA_PORT,
      KAFKA_ZOOKEEPER_PORT: this.PRIVATE.KAFKA_ZOOKEEPER_PORT,
      PROMETHEUS_PRIVATE_IP: this.PRIVATE.PROMETHEUS_PRIVATE_IP,
      PROMETHEUS_PRIVATE_PORT: this.PRIVATE.PROMETHEUS_PRIVATE_PORT,
      GRAFANA_PRIVATE_IP: this.PRIVATE.GRAFANA_PRIVATE_IP,
      GRAFANA_PRIVATE_PORT: this.PRIVATE.GRAFANA_PRIVATE_PORT,
      RABBITMQ_PRIVATE_IP: this.PRIVATE.RABBITMQ_IP,
      RABBITMQ_PORT: this.PRIVATE.RABBITMQ_PORT,
      RABBITMQ_MANAGEMENT_PORT: this.PRIVATE.RABBITMQ_MANAGEMENT_PORT,

      // Ports
      AUTH_PORT: this.PRIVATE.AUTH_PORT,
      ESTUDIANTES_PORT: this.PRIVATE.ESTUDIANTES_PORT,
      MAESTROS_PORT: this.PRIVATE.MAESTROS_PORT,
      GATEWAY_PORT: this.PRIVATE.GATEWAY_PORT,
      MONGO_PORT: this.PRIVATE.MONGO_PORT,
      POSTGRES_PORT: this.PRIVATE.POSTGRES_PORT,
      REDIS_PORT: this.PRIVATE.REDIS_PORT,

      // Credentials
      DB_POSTGRES_USER: this.CREDENTIALS.DB_POSTGRES_USER,
      DB_POSTGRES_PASSWORD: this.CREDENTIALS.DB_POSTGRES_PASSWORD,
      DB_POSTGRES_DB: this.CREDENTIALS.DB_POSTGRES_DB,

      // URLs (Private - for inter-service communication)
      MONGO_URL: this.PRIVATE.MONGO_URL(),
      POSTGRES_URL: this.PRIVATE.POSTGRES_URL(),
      AUTH_SERVICE: this.PRIVATE.AUTH_URL(),
      ESTUDIANTES_SERVICE: this.PRIVATE.ESTUDIANTES_URL(),
      MAESTROS_SERVICE: this.PRIVATE.MAESTROS_URL(),
      GATEWAY_URL: this.PRIVATE.GATEWAY_URL(),
      REPORTES_EST_URL: this.PRIVATE.REPORTES_EST_URL(),
      REPORTES_MAEST_URL: this.PRIVATE.REPORTES_MAEST_URL(),
      NOTIFICACIONES_URL: this.PRIVATE.NOTIFICACIONES_URL(),
      MESSAGING_URL: this.PRIVATE.MESSAGING_URL(),
      KAFKA_URL: this.PRIVATE.KAFKA_URL(),
      KAFKA_ZOOKEEPER_URL: this.PRIVATE.KAFKA_ZOOKEEPER_URL(),
      PROMETHEUS_URL: this.PRIVATE.PROMETHEUS_PRIVATE_URL(),
      GRAFANA_URL: this.PRIVATE.GRAFANA_PRIVATE_URL(),
      RABBITMQ_URL: this.PRIVATE.RABBITMQ_URL(),
      RABBITMQ_MANAGEMENT_URL: this.PRIVATE.RABBITMQ_MANAGEMENT_URL(),

      // URLs (Public - for external access)
      API_GATEWAY_PUBLIC_URL: this.PUBLIC.API_GATEWAY_URL(),
      FRONTEND_PUBLIC_URL: this.PUBLIC.FRONTEND_URL(),
      REPORTING_PUBLIC_URL: this.PUBLIC.REPORTES_ESTUDIANTES_URL(),
      KAFKA_PUBLIC_URL: this.PUBLIC.KAFKA_URL(),
      PROMETHEUS_PUBLIC_URL: this.PUBLIC.PROMETHEUS_PUBLIC_URL(),
      GRAFANA_PUBLIC_URL: this.PUBLIC.GRAFANA_PUBLIC_URL(),
      RABBITMQ_PUBLIC_URL: this.PUBLIC.RABBITMQ_URL(),
      RABBITMQ_MANAGEMENT_PUBLIC_URL: this.PUBLIC.RABBITMQ_MANAGEMENT_URL(),
    };
  },

  // ============================================
  // VALIDACIÓN
  // ============================================
  validate() {
    const errors = [];
    
    if (!this.PUBLIC.API_GATEWAY_IP) errors.push('API_GATEWAY_IP no configurada');
    if (!this.PUBLIC.FRONTEND_IP) errors.push('FRONTEND_IP no configurada');
    if (!this.PRIVATE.CORE_IP) errors.push('CORE_IP no configurada');
    if (!this.PRIVATE.DB_IP) errors.push('DB_IP no configurada');

    if (errors.length > 0) {
      console.error('❌ Errores de configuración:');
      errors.forEach(e => console.error(`  - ${e}`));
      throw new Error('Configuración de infraestructura inválida');
    }

    console.log('✅ Configuración de infraestructura validada correctamente');
    return true;
  },
};
