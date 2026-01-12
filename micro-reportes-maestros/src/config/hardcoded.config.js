/**
 * ============================================================================
 * MICRO-REPORTES-MAESTROS - HARDCODED CONFIGURATION
 * ============================================================================
 * 
 * All IPs and connections are HARDCODED.
 * Located in: EC2-REPORTES (172.31.69.133:5004)
 * 
 * ============================================================================
 */

const config = {
  APP_NAME: 'micro-reportes-maestros',
  NODE_ENV: 'production',
  PORT: 5004,
  HOST: '0.0.0.0',
  
  // ========== DATABASES (HARDCODED) ==========
  MONGODB: {
    URL: 'mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin',
    HOST: '172.31.79.193',
    PORT: 27017
  },
  
  POSTGRES: {
    URL: 'postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento',
    HOST: '172.31.79.193',
    PORT: 5432
  },
  
  REDIS: {
    URL: 'redis://:redis123@172.31.79.193:6379',
    HOST: '172.31.79.193',
    PORT: 6379
  },
  
  // ========== SERVICE URLS (HARDCODED) ==========
  SERVICES: {
    AUTH: 'http://172.31.78.183:3000',
    MAESTROS: 'http://172.31.78.183:3002',
    API_GATEWAY: 'http://172.31.76.105:8080'
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
      'http://3.214.212.205:8080',
      'http://172.31.76.105:8080',
      'http://localhost'
    ]
  }
};

module.exports = config;
