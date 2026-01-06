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
    // API Gateway - IP pública para acceso desde frontend
    API_GATEWAY_IP: process.env.API_GATEWAY_IP || '100.48.66.29',
    API_GATEWAY_PORT: process.env.API_GATEWAY_PORT || 8080,
    API_GATEWAY_URL: function() {
      return `http://${this.API_GATEWAY_IP}:${this.API_GATEWAY_PORT}`;
    },

    // Frontend - IP pública para acceso desde navegador
    FRONTEND_IP: process.env.FRONTEND_IP || '44.210.134.93',
    FRONTEND_PORT: process.env.FRONTEND_PORT || 80,
    FRONTEND_URL: function() {
      return `http://${this.FRONTEND_IP}:${this.FRONTEND_PORT}`;
    },

    // Notificaciones - IP pública
    NOTIFICACIONES_IP: process.env.NOTIFICACIONES_IP || '100.28.217.159',
    NOTIFICACIONES_PORT: process.env.NOTIFICACIONES_PORT || 5006,
    NOTIFICACIONES_URL: function() {
      return `http://${this.NOTIFICACIONES_IP}:${this.NOTIFICACIONES_PORT}`;
    },

    // Messaging - IP pública
    MESSAGING_IP: process.env.MESSAGING_IP || '100.28.217.159',
    MESSAGING_PORT: process.env.MESSAGING_PORT || 5007,
    MESSAGING_URL: function() {
      return `http://${this.MESSAGING_IP}:${this.MESSAGING_PORT}`;
    },

    // Reportes - IP pública
    REPORTES_IP: process.env.REPORTES_IP || '100.28.217.159',
    REPORTES_ESTUDIANTES_PORT: process.env.REPORTES_ESTUDIANTES_PORT || 5003,
    REPORTES_MAESTROS_PORT: process.env.REPORTES_MAESTROS_PORT || 5004,
    REPORTES_ESTUDIANTES_URL: function() {
      return `http://${this.REPORTES_IP}:${this.REPORTES_ESTUDIANTES_PORT}`;
    },
    REPORTES_MAESTROS_URL: function() {
      return `http://${this.REPORTES_IP}:${this.REPORTES_MAESTROS_PORT}`;
    },
  },

  // ============================================
  // IPs PRIVADAS (para comunicación interna EC2)
  // ============================================
  PRIVATE: {
    // Core Microservices - IP privada dentro de EC2
    CORE_IP: process.env.CORE_IP || '13.223.196.229',
    AUTH_PORT: process.env.AUTH_PORT || 3000,
    ESTUDIANTES_PORT: process.env.ESTUDIANTES_PORT || 3001,
    MAESTROS_PORT: process.env.MAESTROS_PORT || 3002,

    AUTH_URL: function() {
      return `http://${this.CORE_IP}:${this.AUTH_PORT}`;
    },
    ESTUDIANTES_URL: function() {
      return `http://${this.CORE_IP}:${this.ESTUDIANTES_PORT}`;
    },
    MAESTROS_URL: function() {
      return `http://${this.CORE_IP}:${this.MAESTROS_PORT}`;
    },

    // Database - IP privada (EC2-DB private IP within VPC)
    DB_IP: process.env.DB_IP || '172.31.79.193',
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
    REDIS_HOST: function() {
      return this.DB_IP;
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

      // Private IPs
      CORE_IP: this.PRIVATE.CORE_IP,
      AUTH_PORT: this.PRIVATE.AUTH_PORT,
      ESTUDIANTES_PORT: this.PRIVATE.ESTUDIANTES_PORT,
      MAESTROS_PORT: this.PRIVATE.MAESTROS_PORT,
      DB_IP: this.PRIVATE.DB_IP,
      MONGO_PORT: this.PRIVATE.MONGO_PORT,
      POSTGRES_PORT: this.PRIVATE.POSTGRES_PORT,
      REDIS_PORT: this.PRIVATE.REDIS_PORT,

      // Credentials
      DB_POSTGRES_USER: this.CREDENTIALS.DB_POSTGRES_USER,
      DB_POSTGRES_PASSWORD: this.CREDENTIALS.DB_POSTGRES_PASSWORD,
      DB_POSTGRES_DB: this.CREDENTIALS.DB_POSTGRES_DB,

      // URLs
      MONGO_URI: this.PRIVATE.MONGO_URL(),
      AUTH_SERVICE: this.PRIVATE.AUTH_URL(),
      ESTUDIANTES_SERVICE: this.PRIVATE.ESTUDIANTES_URL(),
      MAESTROS_SERVICE: this.PRIVATE.MAESTROS_URL(),
      API_GATEWAY_URL: this.PUBLIC.API_GATEWAY_URL(),
      FRONTEND_URL: this.PUBLIC.FRONTEND_URL(),
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
