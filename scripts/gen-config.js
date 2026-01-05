#!/usr/bin/env node

/**
 * Script para generar configuración de infraestructura e inyectarla en servicios
 * Se ejecuta al iniciar cada contenedor para aplicar configuración centralizada
 * 
 * Uso:
 *   node scripts/gen-config.js [servicio]
 * 
 * Genera archivos .env.local en cada servicio con variables de infraestructura
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno si existen
require('dotenv').config();

const projectRoot = process.cwd();

// Importar configuración centralizada
let infraConfig;
try {
  infraConfig = require(path.join(projectRoot, 'infrastructure.config.js'));
} catch (err) {
  console.warn('⚠️  infrastructure.config.js no encontrado, usando process.env');
  infraConfig = null;
}

// Generar variables de entorno para un servicio específico
function generateServiceConfig(serviceName) {
  const envVars = {};

  if (infraConfig) {
    // Obtener todas las variables de infraestructura
    const allVars = infraConfig.toEnvVars();
    Object.assign(envVars, allVars);
  }

  // Preservar variables de entorno ya definidas (higher priority)
  const priorityVars = [
    'PORT', 'DEBUG', 'NODE_ENV', 'ENVIRONMENT',
    'MONGO_URI', 'DB_HOST', 'DB_PORT', 'DB_NAME',
    'REDIS_HOST', 'REDIS_PORT',
    'AUTH_SERVICE', 'ESTUDIANTES_SERVICE', 'MAESTROS_SERVICE',
    'CORE_IP', 'DB_IP',
  ];

  priorityVars.forEach(key => {
    if (process.env[key]) {
      envVars[key] = process.env[key];
    }
  });

  return envVars;
}

// Escribir .env.local en un directorio
function writeEnvFile(dirPath, envVars) {
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envPath = path.join(dirPath, '.env.local');
  fs.writeFileSync(envPath, envContent);
  return envPath;
}

// Main
const serviceName = process.argv[2] || 'all';

console.log('🔧 Generando configuración de infraestructura...');
console.log(`   Servicio: ${serviceName}`);

const serviceDirs = {
  'api-gateway': path.join(projectRoot, 'api-gateway'),
  'micro-auth': path.join(projectRoot, 'micro-auth'),
  'micro-estudiantes': path.join(projectRoot, 'micro-estudiantes'),
  'micro-maestros': path.join(projectRoot, 'micro-maestros'),
  'frontend-web': path.join(projectRoot, 'frontend-web'),
};

if (serviceName === 'all') {
  // Generar para todos los servicios
  Object.entries(serviceDirs).forEach(([name, dir]) => {
    if (fs.existsSync(dir)) {
      const config = generateServiceConfig(name);
      const envPath = writeEnvFile(dir, config);
      console.log(`✅ ${name}: ${envPath}`);
    }
  });
} else if (serviceDirs[serviceName]) {
  // Generar para un servicio específico
  const dir = serviceDirs[serviceName];
  if (fs.existsSync(dir)) {
    const config = generateServiceConfig(serviceName);
    const envPath = writeEnvFile(dir, config);
    console.log(`✅ ${serviceName}: ${envPath}`);
  } else {
    console.error(`❌ Directorio no encontrado: ${dir}`);
    process.exit(1);
  }
} else {
  console.error(`❌ Servicio desconocido: ${serviceName}`);
  console.error('   Servicios disponibles: ' + Object.keys(serviceDirs).join(', '));
  process.exit(1);
}

console.log('\n📝 Variables generadas exitosamente');
console.log('💡 Los servicios ahora usan la configuración centralizada');
