/**
 * ============================================================================
 * API-GATEWAY - HARDCODED CONFIGURATION
 * ============================================================================
 * 
 * All IPs and connections are HARDCODED.
 * Located in: EC2-API-Gateway (172.31.76.105:8080)
 * 
 * ============================================================================
 */

const config = {
  APP_NAME: 'api-gateway',
  NODE_ENV: 'production',
  PORT: 8080,
  HOST: '0.0.0.0',
  
  // ========== GATEWAY CONFIG ==========
  GATEWAY: {
    TIMEOUT: 30000,
    RATE_LIMIT: {
      ENABLED: true,
      WINDOW_MS: 15 * 60 * 1000,
      MAX_REQUESTS: 100
    }
  },
  
  // ========== MICROSERVICES ROUTES (HARDCODED PRIVATE IPs) ==========
  SERVICES: {
    AUTH: {
      URL: 'http://172.31.78.183:3000',
      ROUTE: '/auth',
      TIMEOUT: 30000
    },
    
    ESTUDIANTES: {
      URL: 'http://172.31.78.183:3001',
      ROUTE: '/estudiantes',
      TIMEOUT: 30000
    },
    
    MAESTROS: {
      URL: 'http://172.31.78.183:3002',
      ROUTE: '/maestros',
      TIMEOUT: 30000
    },
    
    REPORTES_ESTUDIANTES: {
      URL: 'http://micro-reportes-estudiantes:5003',
      ROUTE: '/reportes/estudiantes',
      TIMEOUT: 30000
    },
    
    REPORTES_MAESTROS: {
      URL: 'http://micro-reportes-maestros:5004',
      ROUTE: '/reportes/maestros',
      TIMEOUT: 30000
    },
    
    NOTIFICACIONES: {
      URL: 'http://172.31.65.57:5006',
      ROUTE: '/notificaciones',
      TIMEOUT: 30000
    }
  },
  
  // ========== DATABASES (HARDCODED) ==========
  DATABASES: {
    MONGODB: 'mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin',
    POSTGRES: 'postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento',
    REDIS: 'redis://:redis123@172.31.79.193:6379'
  },
  
  // ========== MESSAGING (HARDCODED) ==========
  MESSAGING: {
    KAFKA_BOOTSTRAP: '172.31.73.6:9092',
    RABBITMQ: 'amqp://guest:guest@172.31.73.6:5672'
  },
  
  // ========== CORS ==========
  CORS: {
    ORIGIN: [
      'http://107.21.124.81',
      'http://172.31.69.203',
      'http://localhost',
      'http://localhost:8080'
    ]
  },
  
  // ========== LOGGING ==========
  LOG_LEVEL: 'info'
};

module.exports = config;
