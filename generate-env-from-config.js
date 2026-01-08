#!/usr/bin/env node

/**
 * GENERADOR AUTOMÁTICO DE ARCHIVOS .env DESDE infrastructure.config.js
 * 
 * Este script lee la configuración centralizada y genera automáticamente
 * todos los archivos .env.prod.* para las 12 instancias EC2.
 * 
 * USO: node generate-env-from-config.js
 * 
 * Genera:
 * - .env.prod.core
 * - .env.prod.db
 * - .env.prod.reportes
 * - .env.prod.notificaciones
 * - .env.prod.messaging
 * - .env.prod.api-gateway
 * - .env.prod.frontend
 * - .env.prod.monitoring
 * - .env.prod.kafka
 * - .env.prod.prometheus
 * - .env.prod.grafana
 * - .env.prod.rabbitmq
 */

const fs = require('fs');
const path = require('path');

// Importar configuración centralizada
const infraConfig = require('./infrastructure.config.js');

// Rutas base
const PROJECT_ROOT = __dirname;

// ============================================================
// DEFINICIÓN DE ARCHIVOS .env POR INSTANCIA
// ============================================================

const envFiles = {
  // EC2-CORE - Ejecuta: auth, estudiantes, maestros
  'core': {
    path: path.join(PROJECT_ROOT, '.env.prod.core'),
    env: {
      // ========== AMBIENTE ==========
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-core',
      
      // ========== DATABASE ==========
      MONGO_URL: () => `mongodb://admin:MyMongoProd123!@${infraConfig.PRIVATE.DB_IP}:27017/acompaamiento?authSource=admin`,
      POSTGRES_URL: () => `postgresql://admin:MyPostgresProd123!@${infraConfig.PRIVATE.DB_IP}:5432/acompaamiento`,
      REDIS_URL: () => `redis://${infraConfig.PRIVATE.DB_IP}:6379`,

      // ========== INTERNAL SERVICES (PRIVATE IPs) ==========
      REPORTES_EST_SERVICE: () => `http://${infraConfig.PRIVATE.REPORTES_IP}:${infraConfig.PRIVATE.REPORTES_ESTUDIANTES_PORT}`,
      REPORTES_MAEST_SERVICE: () => `http://${infraConfig.PRIVATE.REPORTES_IP}:${infraConfig.PRIVATE.REPORTES_MAESTROS_PORT}`,
      NOTIFICACIONES_SERVICE: () => `http://${infraConfig.PRIVATE.NOTIFICACIONES_IP}:${infraConfig.PRIVATE.NOTIFICACIONES_PORT}`,
      MESSAGING_BROKER: () => `mqtt://${infraConfig.PRIVATE.MESSAGING_IP}:${infraConfig.PRIVATE.MESSAGING_PORT}`,

      // ========== CORS ==========
      CORS_ORIGIN: () => `http://${infraConfig.PUBLIC.FRONTEND_IP},http://${infraConfig.PRIVATE.FRONTEND_PRIVATE_IP}:5500`,

      // ========== PORTS ==========
      AUTH_PORT: 3000,
      ESTUDIANTES_PORT: 3001,
      MAESTROS_PORT: 3002,
    }
  },

  // EC2-DB - MongoDB, PostgreSQL, Redis
  'db': {
    path: path.join(PROJECT_ROOT, '.env.prod.db'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-db',
      MONGO_ROOT_USERNAME: 'admin',
      MONGO_ROOT_PASSWORD: 'MyMongoProd123!',
      POSTGRES_USER: 'admin',
      POSTGRES_PASSWORD: 'MyPostgresProd123!',
    }
  },

  // EC2-Reportes - Reportes de estudiantes y maestros
  'reportes': {
    path: path.join(PROJECT_ROOT, '.env.prod.reportes'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-reportes',
      MONGO_URL: () => `mongodb://admin:MyMongoProd123!@${infraConfig.PRIVATE.DB_IP}:27017/reportes?authSource=admin`,
      POSTGRES_URL: () => `postgresql://admin:MyPostgresProd123!@${infraConfig.PRIVATE.DB_IP}:5432/reportes`,
      REPORTES_ESTUDIANTES_PORT: infraConfig.PRIVATE.REPORTES_ESTUDIANTES_PORT,
      REPORTES_MAESTROS_PORT: infraConfig.PRIVATE.REPORTES_MAESTROS_PORT,
    }
  },

  // EC2-Notificaciones
  'notificaciones': {
    path: path.join(PROJECT_ROOT, '.env.prod.notificaciones'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-notificaciones',
      NOTIFICACIONES_PORT: infraConfig.PRIVATE.NOTIFICACIONES_PORT,
      MESSAGING_BROKER: () => `mqtt://${infraConfig.PRIVATE.MESSAGING_IP}:${infraConfig.PRIVATE.MESSAGING_PORT}`,
    }
  },

  // EC2-Messaging - MQTT Broker
  'messaging': {
    path: path.join(PROJECT_ROOT, '.env.prod.messaging'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-messaging',
      MQTT_PORT: infraConfig.PRIVATE.MESSAGING_PORT,
      MQTT_HOST: infraConfig.PRIVATE.MESSAGING_IP,
    }
  },

  // EC2-API-Gateway
  'api-gateway': {
    path: path.join(PROJECT_ROOT, '.env.prod.api-gateway'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-api-gateway',
      PORT: infraConfig.PRIVATE.API_GATEWAY_PORT,
      AUTH_SERVICE: () => `http://${infraConfig.PRIVATE.CORE_IP}:3000`,
      ESTUDIANTES_SERVICE: () => `http://${infraConfig.PRIVATE.CORE_IP}:3001`,
      MAESTROS_SERVICE: () => `http://${infraConfig.PRIVATE.CORE_IP}:3002`,
      REPORTES_EST_SERVICE: () => `http://${infraConfig.PRIVATE.REPORTES_IP}:${infraConfig.PRIVATE.REPORTES_ESTUDIANTES_PORT}`,
      REPORTES_MAEST_SERVICE: () => `http://${infraConfig.PRIVATE.REPORTES_IP}:${infraConfig.PRIVATE.REPORTES_MAESTROS_PORT}`,
      NOTIFICACIONES_SERVICE: () => `http://${infraConfig.PRIVATE.NOTIFICACIONES_IP}:${infraConfig.PRIVATE.NOTIFICACIONES_PORT}`,
      CORS_ORIGIN: () => `http://${infraConfig.PUBLIC.FRONTEND_IP},http://${infraConfig.PRIVATE.FRONTEND_IP}:5500`,
    }
  },

  // EC2-Frontend
  'frontend': {
    path: path.join(PROJECT_ROOT, '.env.prod.frontend'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-frontend',
      API_BASE_URL: () => `http://${infraConfig.PUBLIC.API_GATEWAY_IP}:${infraConfig.PUBLIC.API_GATEWAY_PORT}`,
      // Alternativa para acceso interno
      API_BASE_URL_PRIVATE: () => `http://${infraConfig.PRIVATE.API_GATEWAY_IP}:${infraConfig.PRIVATE.API_GATEWAY_PORT}`,
    }
  },

  // EC2-Monitoring (Prometheus + Grafana)
  'monitoring': {
    path: path.join(PROJECT_ROOT, '.env.prod.monitoring'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-monitoring',
      PROMETHEUS_PORT: infraConfig.PRIVATE.PROMETHEUS_PORT,
      GRAFANA_PORT: infraConfig.PRIVATE.GRAFANA_PORT,
      PROMETHEUS_TARGETS: () => {
        const targets = [
          `${infraConfig.PRIVATE.CORE_IP}:8080`,
          `${infraConfig.PRIVATE.CORE_IP}:3000`,
          `${infraConfig.PRIVATE.CORE_IP}:3001`,
          `${infraConfig.PRIVATE.CORE_IP}:3002`,
          `${infraConfig.PRIVATE.REPORTES_IP}:${infraConfig.PRIVATE.REPORTES_ESTUDIANTES_PORT}`,
          `${infraConfig.PRIVATE.REPORTES_IP}:${infraConfig.PRIVATE.REPORTES_MAESTROS_PORT}`,
          `${infraConfig.PRIVATE.NOTIFICACIONES_IP}:${infraConfig.PRIVATE.NOTIFICACIONES_PORT}`,
        ];
        return targets.join(',');
      }
    }
  },

  // EC2-Kafka
  'kafka': {
    path: path.join(PROJECT_ROOT, '.env.prod.kafka'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-kafka',
      KAFKA_BROKER_ID: 1,
      KAFKA_PORT: infraConfig.PRIVATE.KAFKA_PORT,
      KAFKA_ZOOKEEPER_PORT: infraConfig.PRIVATE.KAFKA_ZOOKEEPER_PORT,
      KAFKA_HOST: infraConfig.PRIVATE.KAFKA_IP,
    }
  },

  // EC2-Prometheus
  'prometheus': {
    path: path.join(PROJECT_ROOT, '.env.prod.prometheus'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-prometheus',
      PROMETHEUS_PORT: infraConfig.PRIVATE.PROMETHEUS_PORT,
    }
  },

  // EC2-Grafana
  'grafana': {
    path: path.join(PROJECT_ROOT, '.env.prod.grafana'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-grafana',
      GRAFANA_PORT: infraConfig.PRIVATE.GRAFANA_PORT,
      PROMETHEUS_URL: () => `http://${infraConfig.PRIVATE.MONITORING_IP}:${infraConfig.PRIVATE.PROMETHEUS_PORT}`,
    }
  },

  // EC2-RabbitMQ
  'rabbitmq': {
    path: path.join(PROJECT_ROOT, '.env.prod.rabbitmq'),
    env: {
      NODE_ENV: 'production',
      SERVICE_NAME: 'ec2-rabbitmq',
      RABBITMQ_PORT: infraConfig.PRIVATE.RABBITMQ_PORT,
      RABBITMQ_MANAGEMENT_PORT: infraConfig.PRIVATE.RABBITMQ_MANAGEMENT_PORT,
      RABBITMQ_DEFAULT_USER: 'admin',
      RABBITMQ_DEFAULT_PASS: 'RabbitMQProd123!',
    }
  },
};

// ============================================================
// FUNCIONES DE UTILIDAD
// ============================================================

/**
 * Convierte un valor (string o función) a su representación final
 */
function resolveValue(value) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}

/**
 * Genera contenido de archivo .env
 */
function generateEnvContent(envObj) {
  const lines = [];
  lines.push('# AUTO-GENERATED: Este archivo es generado automáticamente por generate-env-from-config.js');
  lines.push('# NO EDITAR MANUALMENTE - Los cambios serán sobrescritos');
  lines.push('# Para cambiar valores, edita infrastructure.config.js y ejecuta: node generate-env-from-config.js');
  lines.push('');

  for (const [key, value] of Object.entries(envObj)) {
    const resolvedValue = resolveValue(value);
    lines.push(`${key}=${resolvedValue}`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Escribe archivo .env
 */
function writeEnvFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Generado: ${path.relative(PROJECT_ROOT, filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al generar ${filePath}:`, error.message);
    return false;
  }
}

// ============================================================
// EJECUCIÓN PRINCIPAL
// ============================================================

console.log('\n' + '='.repeat(80));
console.log('GENERADOR AUTOMÁTICO DE ARCHIVOS .env.prod.*');
console.log('='.repeat(80) + '\n');

let generated = 0;
let failed = 0;

for (const [name, config] of Object.entries(envFiles)) {
  const envContent = generateEnvContent(config.env);
  if (writeEnvFile(config.path, envContent)) {
    generated++;
  } else {
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`RESUMEN: ${generated} archivos generados, ${failed} errores`);
console.log('='.repeat(80) + '\n');

console.log('📝 Archivos generados:');
for (const [name] of Object.entries(envFiles)) {
  console.log(`   .env.prod.${name}`);
}

console.log('\n✅ ¡Centralización completada!');
console.log('   Todos los .env.prod.* ahora usan infrastructure.config.js como fuente de verdad');
console.log('\n⚠️  IMPORTANTE: Cuando cambies IPs en infrastructure.config.js:');
console.log('   1. Ejecuta: node generate-env-from-config.js');
console.log('   2. Los cambios se reflejarán automáticamente en TODOS los archivos .env.prod.*\n');
