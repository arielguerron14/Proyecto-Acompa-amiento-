/**
 * ============================================================================
 * HARDCODED INFRASTRUCTURE CONFIGURATION
 * 8 Separate EC2 Instances - Production Deployment
 * ============================================================================
 * 
 * This file contains ALL hardcoded IPs and configuration for the entire system.
 * Use in all microservices to ensure consistency.
 * 
 * NO environment variables needed.
 * NO .env files needed.
 * Just import this file and use the exported CONFIG object.
 * 
 * Usage:
 *   const { CONFIG, getServiceUrl } = require('./infrastructure.hardcoded.config.js');
 *   const mongoUrl = CONFIG.MONGO_URL;
 *   const authService = getServiceUrl('AUTH');
 * 
 * ============================================================================
 */

// ============================================================================
// EC2 INSTANCE IPs
// ============================================================================
const EC2_INSTANCES = {
  // EC2-CORE: Auth + Estudiantes + Maestros microservices
  CORE: {
    PUBLIC_IP: '3.234.198.34',
    PRIVATE_IP: '172.31.78.183',
    REGION: 'ap-southeast-1',
    SERVICES: ['auth', 'estudiantes', 'maestros']
  },
  
  // EC2-API-GATEWAY: API Gateway (router/load balancer)
  API_GATEWAY: {
    PUBLIC_IP: '35.168.216.132',
    PRIVATE_IP: '172.31.76.105',
    REGION: 'us-east-1',
    SERVICES: ['api-gateway']
  },
  
  // EC2-FRONTEND: Frontend Web Application
  FRONTEND: {
    PUBLIC_IP: '107.21.124.81',
    PRIVATE_IP: '172.31.69.203',
    REGION: 'us-east-1',
    SERVICES: ['frontend-web']
  },
  
  // EC2-REPORTES: Reportes Estudiantes + Reportes Maestros
  REPORTES: {
    PUBLIC_IP: '54.175.62.79',
    PRIVATE_IP: '172.31.69.133',
    REGION: 'us-east-1',
    SERVICES: ['reportes-estudiantes', 'reportes-maestros']
  },
  
  // EC2-NOTIFICACIONES: Notifications service
  NOTIFICACIONES: {
    PUBLIC_IP: '100.31.143.213',
    PRIVATE_IP: '172.31.65.57',
    REGION: 'us-east-1',
    SERVICES: ['notificaciones']
  },
  
  // EC2-MESSAGING: Kafka + RabbitMQ + Zookeeper
  MESSAGING: {
    PUBLIC_IP: '3.235.24.36',
    PRIVATE_IP: '172.31.73.6',
    REGION: 'us-east-1',
    SERVICES: ['kafka', 'rabbitmq', 'zookeeper']
  },
  
  // EC2-MONITORING: Prometheus + Grafana
  MONITORING: {
    PUBLIC_IP: '54.198.235.28',
    PRIVATE_IP: '172.31.71.151',
    REGION: 'us-east-1',
    SERVICES: ['prometheus', 'grafana']
  },
  
  // EC2-DB: MongoDB + PostgreSQL + Redis
  DATABASE: {
    PUBLIC_IP: '44.222.119.15',
    PRIVATE_IP: '172.31.79.193',
    REGION: 'us-east-1',
    SERVICES: ['mongodb', 'postgresql', 'redis']
  }
};

// ============================================================================
// SERVICE PORTS (HARDCODED)
// ============================================================================
const SERVICE_PORTS = {
  // Core Microservices (EC2-CORE)
  AUTH: 3000,
  ESTUDIANTES: 3001,
  MAESTROS: 3002,
  
  // API Gateway (EC2-API-GATEWAY)
  API_GATEWAY: 8080,
  
  // Frontend (EC2-FRONTEND)
  FRONTEND: 80,
  FRONTEND_HTTPS: 443,
  
  // Reportes (EC2-REPORTES)
  REPORTES_ESTUDIANTES: 5003,
  REPORTES_MAESTROS: 5004,
  
  // Notificaciones (EC2-NOTIFICACIONES)
  NOTIFICACIONES: 5006,
  
  // Messaging (EC2-MESSAGING)
  KAFKA: 9092,
  KAFKA_ZOOKEEPER: 2181,
  RABBITMQ: 5672,
  RABBITMQ_MANAGEMENT: 15672,
  
  // Monitoring (EC2-MONITORING)
  PROMETHEUS: 9090,
  GRAFANA: 3000,
  
  // Databases (EC2-DATABASE)
  MONGODB: 27017,
  POSTGRES: 5432,
  REDIS: 6379
};

// ============================================================================
// DATABASE CREDENTIALS (HARDCODED - change for production!)
// ============================================================================
const DATABASE_CREDENTIALS = {
  MONGO: {
    USER: 'admin',
    PASSWORD: 'mongodb123',
    DATABASE: 'acompanamiento',
    AUTH_DB: 'admin'
  },
  POSTGRES: {
    USER: 'postgres',
    PASSWORD: 'postgres123',
    DATABASE: 'acompanamiento',
    HOST: EC2_INSTANCES.DATABASE.PRIVATE_IP
  },
  REDIS: {
    PASSWORD: 'redis123',
    DB: 0
  }
};

// ============================================================================
// COMPLETE URLs (HARDCODED)
// ============================================================================
const CONFIG = {
  // Environment
  ENVIRONMENT: 'production',
  
  // ========== PUBLIC URLs (for browser/external access) ==========
  
  // Frontend URL (public)
  FRONTEND_URL: `http://${EC2_INSTANCES.FRONTEND.PUBLIC_IP}`,
  
  // API Gateway URL (public)
  API_GATEWAY_URL: `http://${EC2_INSTANCES.API_GATEWAY.PUBLIC_IP}:${SERVICE_PORTS.API_GATEWAY}`,
  
  // Reportes URLs (public)
  REPORTES_ESTUDIANTES_URL: `http://${EC2_INSTANCES.REPORTES.PUBLIC_IP}:${SERVICE_PORTS.REPORTES_ESTUDIANTES}`,
  REPORTES_MAESTROS_URL: `http://${EC2_INSTANCES.REPORTES.PUBLIC_IP}:${SERVICE_PORTS.REPORTES_MAESTROS}`,
  
  // Notificaciones URL (public)
  NOTIFICACIONES_URL: `http://${EC2_INSTANCES.NOTIFICACIONES.PUBLIC_IP}:${SERVICE_PORTS.NOTIFICACIONES}`,
  
  // Messaging URLs (public)
  KAFKA_BOOTSTRAP: `${EC2_INSTANCES.MESSAGING.PUBLIC_IP}:${SERVICE_PORTS.KAFKA}`,
  RABBITMQ_URL: `amqp://guest:guest@${EC2_INSTANCES.MESSAGING.PUBLIC_IP}:${SERVICE_PORTS.RABBITMQ}`,
  RABBITMQ_MANAGEMENT_URL: `http://${EC2_INSTANCES.MESSAGING.PUBLIC_IP}:${SERVICE_PORTS.RABBITMQ_MANAGEMENT}`,
  
  // Monitoring URLs (public)
  PROMETHEUS_URL: `http://${EC2_INSTANCES.MONITORING.PUBLIC_IP}:${SERVICE_PORTS.PROMETHEUS}`,
  GRAFANA_URL: `http://${EC2_INSTANCES.MONITORING.PUBLIC_IP}:${SERVICE_PORTS.GRAFANA}`,
  
  // ========== PRIVATE URLs (internal VPC communication) ==========
  
  // Core Services (private - inside VPC)
  AUTH_URL: `http://${EC2_INSTANCES.CORE.PRIVATE_IP}:${SERVICE_PORTS.AUTH}`,
  ESTUDIANTES_URL: `http://${EC2_INSTANCES.CORE.PRIVATE_IP}:${SERVICE_PORTS.ESTUDIANTES}`,
  MAESTROS_URL: `http://${EC2_INSTANCES.CORE.PRIVATE_IP}:${SERVICE_PORTS.MAESTROS}`,
  
  // API Gateway (private - for service-to-service)
  API_GATEWAY_INTERNAL_URL: `http://${EC2_INSTANCES.API_GATEWAY.PRIVATE_IP}:${SERVICE_PORTS.API_GATEWAY}`,
  
  // Databases (private - inside VPC)
  MONGO_URL: `mongodb://${DATABASE_CREDENTIALS.MONGO.USER}:${DATABASE_CREDENTIALS.MONGO.PASSWORD}@${EC2_INSTANCES.DATABASE.PRIVATE_IP}:${SERVICE_PORTS.MONGODB}/${DATABASE_CREDENTIALS.MONGO.DATABASE}?authSource=${DATABASE_CREDENTIALS.MONGO.AUTH_DB}`,
  
  POSTGRES_URL: `postgresql://${DATABASE_CREDENTIALS.POSTGRES.USER}:${DATABASE_CREDENTIALS.POSTGRES.PASSWORD}@${EC2_INSTANCES.DATABASE.PRIVATE_IP}:${SERVICE_PORTS.POSTGRES}/${DATABASE_CREDENTIALS.POSTGRES.DATABASE}`,
  
  REDIS_URL: `redis://:${DATABASE_CREDENTIALS.REDIS.PASSWORD}@${EC2_INSTANCES.DATABASE.PRIVATE_IP}:${SERVICE_PORTS.REDIS}`,
  
  // Messaging (private - for internal use)
  KAFKA_BOOTSTRAP_INTERNAL: `${EC2_INSTANCES.MESSAGING.PRIVATE_IP}:${SERVICE_PORTS.KAFKA}`,
  RABBITMQ_INTERNAL_URL: `amqp://guest:guest@${EC2_INSTANCES.MESSAGING.PRIVATE_IP}:${SERVICE_PORTS.RABBITMQ}`,
  
  // ========== HEALTH CHECK ENDPOINTS ==========
  
  HEALTH_CHECKS: {
    AUTH: `${CONFIG.AUTH_URL}/health` || null,
    ESTUDIANTES: `${CONFIG.ESTUDIANTES_URL}/health` || null,
    MAESTROS: `${CONFIG.MAESTROS_URL}/health` || null,
    API_GATEWAY: `${CONFIG.API_GATEWAY_URL}/health` || null,
    FRONTEND: `${CONFIG.FRONTEND_URL}/health` || null,
    MONGODB: `mongodb://${DATABASE_CREDENTIALS.MONGO.USER}:${DATABASE_CREDENTIALS.MONGO.PASSWORD}@${EC2_INSTANCES.DATABASE.PRIVATE_IP}:${SERVICE_PORTS.MONGODB}` || null,
    POSTGRES: `${CONFIG.POSTGRES_URL}` || null,
    REDIS: `redis://:${DATABASE_CREDENTIALS.REDIS.PASSWORD}@${EC2_INSTANCES.DATABASE.PRIVATE_IP}:${SERVICE_PORTS.REDIS}` || null
  }
};

// Fix circular reference
CONFIG.HEALTH_CHECKS.AUTH = `${CONFIG.AUTH_URL}/health`;
CONFIG.HEALTH_CHECKS.ESTUDIANTES = `${CONFIG.ESTUDIANTES_URL}/health`;
CONFIG.HEALTH_CHECKS.MAESTROS = `${CONFIG.MAESTROS_URL}/health`;
CONFIG.HEALTH_CHECKS.API_GATEWAY = `${CONFIG.API_GATEWAY_URL}/health`;
CONFIG.HEALTH_CHECKS.FRONTEND = `${CONFIG.FRONTEND_URL}/health`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get service URL based on service name
 * @param {string} serviceName - Service name (AUTH, ESTUDIANTES, etc.)
 * @param {boolean} isPublic - Use public IP or private IP (default: false)
 * @returns {string} Service URL
 */
function getServiceUrl(serviceName, isPublic = false) {
  const upperName = serviceName.toUpperCase();
  
  // Return hardcoded URL
  if (isPublic) {
    // Public URLs
    switch(upperName) {
      case 'FRONTEND': return CONFIG.FRONTEND_URL;
      case 'API_GATEWAY': return CONFIG.API_GATEWAY_URL;
      case 'REPORTES_ESTUDIANTES': return CONFIG.REPORTES_ESTUDIANTES_URL;
      case 'REPORTES_MAESTROS': return CONFIG.REPORTES_MAESTROS_URL;
      case 'NOTIFICACIONES': return CONFIG.NOTIFICACIONES_URL;
      case 'KAFKA': return CONFIG.KAFKA_BOOTSTRAP;
      case 'RABBITMQ': return CONFIG.RABBITMQ_URL;
      case 'PROMETHEUS': return CONFIG.PROMETHEUS_URL;
      case 'GRAFANA': return CONFIG.GRAFANA_URL;
      default: return null;
    }
  } else {
    // Private URLs (internal VPC)
    switch(upperName) {
      case 'AUTH': return CONFIG.AUTH_URL;
      case 'ESTUDIANTES': return CONFIG.ESTUDIANTES_URL;
      case 'MAESTROS': return CONFIG.MAESTROS_URL;
      case 'API_GATEWAY': return CONFIG.API_GATEWAY_INTERNAL_URL;
      case 'MONGODB': return CONFIG.MONGO_URL;
      case 'POSTGRES': return CONFIG.POSTGRES_URL;
      case 'REDIS': return CONFIG.REDIS_URL;
      case 'KAFKA': return CONFIG.KAFKA_BOOTSTRAP_INTERNAL;
      case 'RABBITMQ': return CONFIG.RABBITMQ_INTERNAL_URL;
      default: return null;
    }
  }
}

/**
 * Get EC2 instance information
 * @param {string} instanceName - Instance name (CORE, API_GATEWAY, etc.)
 * @returns {object} Instance information
 */
function getEC2Instance(instanceName) {
  const upperName = instanceName.toUpperCase();
  return EC2_INSTANCES[upperName] || null;
}

/**
 * Get service port
 * @param {string} serviceName - Service name
 * @returns {number} Port number
 */
function getServicePort(serviceName) {
  const upperName = serviceName.toUpperCase();
  return SERVICE_PORTS[upperName] || null;
}

/**
 * Get database connection string
 * @param {string} dbType - Database type (MONGO, POSTGRES, REDIS)
 * @returns {string} Connection string
 */
function getDatabaseUrl(dbType) {
  const upperType = dbType.toUpperCase();
  switch(upperType) {
    case 'MONGO':
    case 'MONGODB':
      return CONFIG.MONGO_URL;
    case 'POSTGRES':
    case 'POSTGRESQL':
      return CONFIG.POSTGRES_URL;
    case 'REDIS':
      return CONFIG.REDIS_URL;
    default:
      return null;
  }
}

// ============================================================================
// EXPORTS (for Node.js)
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    EC2_INSTANCES,
    SERVICE_PORTS,
    DATABASE_CREDENTIALS,
    
    // Helper functions
    getServiceUrl,
    getEC2Instance,
    getServicePort,
    getDatabaseUrl
  };
}

// ============================================================================
// EXPORT FOR BROWSER
// ============================================================================

if (typeof window !== 'undefined') {
  window.HARDCODED_CONFIG = {
    CONFIG,
    EC2_INSTANCES,
    SERVICE_PORTS,
    DATABASE_CREDENTIALS,
    getServiceUrl,
    getEC2Instance,
    getServicePort,
    getDatabaseUrl
  };
}
