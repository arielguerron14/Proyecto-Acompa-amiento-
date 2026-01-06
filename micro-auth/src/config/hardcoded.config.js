/**
 * ============================================================================
 * MICRO-AUTH - HARDCODED CONFIGURATION
 * ============================================================================
 * 
 * All IPs and connections are HARDCODED.
 * NO environment variables needed.
 * 
 * Located in: EC2-CORE (172.31.78.183:3000)
 * Database: MongoDB & PostgreSQL on EC2-DB (172.31.79.193)
 * 
 * ============================================================================
 */

// ============================================================================
// HARDCODED CONFIGURATION
// ============================================================================

const config = {
  // Application
  APP_NAME: 'micro-auth',
  NODE_ENV: 'production',
  PORT: 3000,
  HOST: '0.0.0.0',
  
  // ========== DATABASES (HARDCODED) ==========
  
  // MongoDB
  MONGODB: {
    URL: 'mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin',
    HOST: '172.31.79.193',
    PORT: 27017,
    DATABASE: 'acompanamiento',
    USER: 'admin',
    PASSWORD: 'mongodb123',
    AUTH_SOURCE: 'admin'
  },
  
  // PostgreSQL
  POSTGRES: {
    URL: 'postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento',
    HOST: '172.31.79.193',
    PORT: 5432,
    DATABASE: 'acompanamiento',
    USER: 'postgres',
    PASSWORD: 'postgres123'
  },
  
  // Redis
  REDIS: {
    URL: 'redis://:redis123@172.31.79.193:6379',
    HOST: '172.31.79.193',
    PORT: 6379,
    PASSWORD: 'redis123',
    DB: 0
  },
  
  // ========== SERVICE URLS (HARDCODED) ==========
  
  // EC2-CORE Services (internal VPC)
  SERVICES: {
    AUTH: 'http://172.31.78.183:3000',
    ESTUDIANTES: 'http://172.31.78.183:3001',
    MAESTROS: 'http://172.31.78.183:3002'
  },
  
  // EC2-API-Gateway (internal VPC)
  API_GATEWAY: {
    URL: 'http://172.31.76.105:8080',
    PRIVATE_IP: '172.31.76.105',
    PORT: 8080
  },
  
  // EC2-Messaging (internal VPC)
  MESSAGING: {
    KAFKA_BOOTSTRAP: '172.31.73.6:9092',
    RABBITMQ: 'amqp://guest:guest@172.31.73.6:5672',
    KAFKA_PRIVATE_IP: '172.31.73.6',
    RABBITMQ_PRIVATE_IP: '172.31.73.6'
  },
  
  // ========== JWT/AUTH CONFIG ==========
  JWT: {
    SECRET: 'your-secret-key-change-this-in-production',
    EXPIRY: '24h',
    ALGORITHM: 'HS256'
  },
  
  // ========== LOGGING ==========
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'combined',
  
  // ========== CORS ==========
  CORS: {
    ORIGIN: [
      'http://107.21.124.81',           // EC2-Frontend public
      'http://172.31.69.203',            // EC2-Frontend private
      'http://52.71.188.181:8080',       // EC2-API-Gateway public
      'http://172.31.76.105:8080',       // EC2-API-Gateway private
      'http://localhost',
      'http://localhost:80',
      'http://localhost:3000',
      'http://localhost:8080'
    ],
    CREDENTIALS: true,
    METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization']
  },
  
  // ========== RATE LIMITING ==========
  RATE_LIMIT: {
    ENABLED: true,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  
  // ========== HEALTH CHECK ==========
  HEALTH_CHECK: {
    ENABLED: true,
    ENDPOINT: '/health',
    INCLUDE_DETAILED: true
  }
};

// ============================================================================
// VERIFICATION
// ============================================================================

// Verify all required configs are present
function verifyConfig() {
  const required = [
    'MONGODB',
    'POSTGRES',
    'REDIS',
    'SERVICES',
    'API_GATEWAY',
    'MESSAGING'
  ];
  
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing configuration:', missing);
    process.exit(1);
  }
  
  console.log('✅ Configuration loaded successfully');
  console.log('   Database: MongoDB, PostgreSQL, Redis');
  console.log('   Services: Auth, Estudiantes, Maestros');
  console.log('   Messaging: Kafka, RabbitMQ');
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = config;
module.exports.verify = verifyConfig;
