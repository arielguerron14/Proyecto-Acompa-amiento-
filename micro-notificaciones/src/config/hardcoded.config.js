/**
 * ============================================================================
 * MICRO-NOTIFICACIONES - HARDCODED CONFIGURATION
 * ============================================================================
 * 
 * All IPs and connections are HARDCODED.
 * Located in: EC2-NOTIFICACIONES (172.31.65.57:5006)
 * 
 * ============================================================================
 */

const config = {
  APP_NAME: 'micro-notificaciones',
  NODE_ENV: 'production',
  PORT: 5006,
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
    ESTUDIANTES: 'http://172.31.78.183:3001',
    API_GATEWAY: 'http://172.31.76.105:8080'
  },
  
  // ========== MESSAGING (HARDCODED) ==========
  MESSAGING: {
    KAFKA_BOOTSTRAP: '172.31.73.6:9092',
    KAFKA_TOPICS: {
      ESTUDIANTES: 'estudiantes-events',
      MAESTROS: 'maestros-events',
      NOTIFICACIONES: 'notifications'
    },
    RABBITMQ: 'amqp://guest:guest@172.31.73.6:5672',
    RABBITMQ_QUEUES: {
      NOTIFICATIONS: 'notifications-queue',
      EMAILS: 'emails-queue'
    }
  },
  
  // ========== EMAIL CONFIG ==========
  EMAIL: {
    ENABLED: true,
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_USER: 'your-email@gmail.com',
    SMTP_PASSWORD: 'your-app-password',
    FROM_ADDRESS: 'noreply@acompanamiento.com'
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
