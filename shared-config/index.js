/**
 * CONFIGURACIÓN CENTRALIZADA COMPARTIDA
 * 
 * Este módulo debe ser importado en todos los servicios para usar IPs hardcodeadas
 * desde el infrastructure.config.js
 * 
 * Uso:
 *   const config = require('./shared-config');
 *   const mongoUrl = config.getMongoUrl();
 *   const authService = config.getAuthServiceUrl();
 */

const path = require('path');
let infraConfig = null;

/**
 * Cargar infraestructura centralizada
 */
function loadInfraConfig() {
  if (infraConfig) return infraConfig;

  try {
    const infraPath = path.join(__dirname, '../infrastructure.config.js');
    infraConfig = require(infraPath);
    
    // Validar configuración
    infraConfig.validate();
    
    console.log('✅ Configuración centralizada cargada desde infrastructure.config.js');
    return infraConfig;
  } catch (err) {
    console.error('❌ Error cargando infrastructure.config.js:', err.message);
    console.error('   Usando fallbacks locales (localhost)');
    return createFallbackConfig();
  }
}

/**
 * Configuración fallback para desarrollo local
 */
function createFallbackConfig() {
  return {
    PRIVATE: {
      DB_IP: 'localhost',
      CORE_IP: 'localhost',
      REPORTES_IP: 'localhost',
      NOTIFICACIONES_IP: 'localhost',
      MESSAGING_IP: 'localhost',
      API_GATEWAY_REPLICA_IP: 'localhost',
      MONITORING_IP: 'localhost',
      AUTH_PORT: 3000,
      ESTUDIANTES_PORT: 3001,
      MAESTROS_PORT: 3002,
      GATEWAY_PORT: 8080,
      MONGO_PORT: 27017,
      POSTGRES_PORT: 5432,
      REDIS_PORT: 6379,
      MONGO_URL: () => 'mongodb://localhost:27017',
      POSTGRES_URL: () => 'postgresql://localhost:5432',
      AUTH_URL: () => 'http://localhost:3000',
      ESTUDIANTES_URL: () => 'http://localhost:3001',
      MAESTROS_URL: () => 'http://localhost:3002',
      GATEWAY_URL: () => 'http://localhost:8080',
      REPORTES_EST_URL: () => 'http://localhost:5003',
      REPORTES_MAEST_URL: () => 'http://localhost:5004',
      NOTIFICACIONES_URL: () => 'http://localhost:5005',
      MESSAGING_URL: () => 'mqtt://localhost:1883',
    },
    PUBLIC: {
      API_GATEWAY_URL: () => 'http://localhost:8080',
      FRONTEND_URL: () => 'http://localhost:5500',
    },
    CREDENTIALS: {
      DB_POSTGRES_USER: 'postgres',
      DB_POSTGRES_PASSWORD: 'password',
      DB_POSTGRES_DB: 'acompanamiento',
      MONGO_NO_AUTH: true,
    },
  };
}

/**
 * API PÚBLICA - Funciones para acceder a configuración
 */
module.exports = {
  /**
   * Obtener URL de MongoDB
   */
  getMongoUrl() {
    const config = loadInfraConfig();
    const baseUrl = config.PRIVATE.MONGO_URL();
    const user = config.CREDENTIALS.DB_POSTGRES_USER;
    const pass = config.CREDENTIALS.DB_POSTGRES_PASSWORD;
    
    // Si no hay autenticación configurada, devolver URL simple
    if (config.CREDENTIALS.MONGO_NO_AUTH) {
      return baseUrl + '/acompaamiento';
    }
    
    // Incluir credenciales
    return baseUrl.replace(
      '://',
      `://${user}:${pass}@`
    ) + '/acompaamiento?authSource=admin';
  },

  /**
   * Obtener URL de PostgreSQL
   */
  getPostgresUrl() {
    const config = loadInfraConfig();
    const user = process.env.DB_POSTGRES_USER || config.CREDENTIALS.DB_POSTGRES_USER;
    const pass = process.env.DB_POSTGRES_PASSWORD || config.CREDENTIALS.DB_POSTGRES_PASSWORD;
    const db = process.env.DB_POSTGRES_DB || config.CREDENTIALS.DB_POSTGRES_DB;
    const host = config.PRIVATE.DB_IP;
    const port = config.PRIVATE.POSTGRES_PORT;
    
    return `postgresql://${user}:${pass}@${host}:${port}/${db}`;
  },

  /**
   * Obtener URL de servicio interno
   */
  getServiceUrl(serviceName) {
    const config = loadInfraConfig();
    const privateConfig = config.PRIVATE;
    
    const serviceMap = {
      'auth': privateConfig.AUTH_URL,
      'estudiantes': privateConfig.ESTUDIANTES_URL,
      'maestros': privateConfig.MAESTROS_URL,
      'gateway': privateConfig.GATEWAY_URL,
      'reportes-est': privateConfig.REPORTES_EST_URL,
      'reportes-maest': privateConfig.REPORTES_MAEST_URL,
      'notificaciones': privateConfig.NOTIFICACIONES_URL,
      'messaging': privateConfig.MESSAGING_URL,
    };

    if (!serviceMap[serviceName]) {
      console.warn(`⚠️  Servicio desconocido: ${serviceName}`);
      return null;
    }

    return serviceMap[serviceName]();
  },

  /**
   * Obtener IP privada de una instancia
   */
  getPrivateIp(instanceName) {
    const config = loadInfraConfig();
    const ipMap = {
      'db': config.PRIVATE.DB_IP,
      'core': config.PRIVATE.CORE_IP,
      'reportes': config.PRIVATE.REPORTES_IP,
      'notificaciones': config.PRIVATE.NOTIFICACIONES_IP,
      'messaging': config.PRIVATE.MESSAGING_IP,
      'api-gateway-replica': config.PRIVATE.API_GATEWAY_REPLICA_IP,
      'frontend': config.PRIVATE.FRONTEND_PRIVATE_IP,
      'monitoring': config.PRIVATE.MONITORING_IP,
    };

    return ipMap[instanceName] || null;
  },

  /**
   * Obtener IP pública de una instancia
   */
  getPublicIp(instanceName) {
    const config = loadInfraConfig();
    const ipMap = {
      'db': config.PUBLIC.DB_IP,
      'core': config.PUBLIC.CORE_IP,
      'api-gateway': config.PUBLIC.API_GATEWAY_IP,
      'frontend': config.PUBLIC.FRONTEND_IP,
      'notificaciones': config.PUBLIC.NOTIFICACIONES_IP,
      'messaging': config.PUBLIC.MESSAGING_IP,
      'reportes': config.PUBLIC.REPORTES_IP,
      'monitoring': config.PUBLIC.MONITORING_IP,
    };

    return ipMap[instanceName] || null;
  },

  /**
   * Obtener puerto de un servicio
   */
  getPort(serviceName) {
    const config = loadInfraConfig();
    const privateConfig = config.PRIVATE;
    const publicConfig = config.PUBLIC;
    
    const portMap = {
      'auth': privateConfig.AUTH_PORT,
      'estudiantes': privateConfig.ESTUDIANTES_PORT,
      'maestros': privateConfig.MAESTROS_PORT,
      'gateway': privateConfig.GATEWAY_PORT,
      'mongo': privateConfig.MONGO_PORT,
      'postgres': privateConfig.POSTGRES_PORT,
      'redis': privateConfig.REDIS_PORT,
      'reportes-est': privateConfig.REPORTES_ESTUDIANTES_PORT,
      'reportes-maest': privateConfig.REPORTES_MAESTROS_PORT,
      'notificaciones': privateConfig.NOTIFICACIONES_PORT,
      'messaging': privateConfig.MESSAGING_PORT,
      'prometheus': publicConfig.PROMETHEUS_PORT,
      'grafana': publicConfig.GRAFANA_PORT,
    };

    return portMap[serviceName] || null;
  },

  /**
   * Obtener objeto de configuración completo
   */
  getConfig() {
    return loadInfraConfig();
  },

  /**
   * Obtener todas las variables de entorno como objeto
   */
  getEnvVars() {
    const config = loadInfraConfig();
    return config.toEnvVars();
  },

  /**
   * Validar configuración
   */
  validate() {
    const config = loadInfraConfig();
    config.validate();
  },

  /**
   * Debug: mostrar toda la configuración (solo en desarrollo)
   */
  debug() {
    const config = loadInfraConfig();
    console.log('\n🔍 CONFIGURACIÓN CENTRALIZADA:');
    console.log('\n📍 IPs PRIVADAS:');
    console.log('  DB:', config.PRIVATE.DB_IP);
    console.log('  CORE:', config.PRIVATE.CORE_IP);
    console.log('  Reportes:', config.PRIVATE.REPORTES_IP);
    console.log('\n🌐 IPs PÚBLICAS:');
    console.log('  API Gateway:', config.PUBLIC.API_GATEWAY_IP);
    console.log('  Frontend:', config.PUBLIC.FRONTEND_IP);
    console.log('\n🔗 URLs:');
    console.log('  Mongo:', config.PRIVATE.MONGO_URL());
    console.log('  Auth:', config.PRIVATE.AUTH_URL());
    console.log('  Estudiantes:', config.PRIVATE.ESTUDIANTES_URL());
    console.log('\n');
  },
};
