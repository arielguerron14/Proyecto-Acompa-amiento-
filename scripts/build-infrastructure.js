#!/usr/bin/env node

/**
 * Script para generar configuración de infraestructura
 * 
 * Uso:
 *   node scripts/build-infrastructure.js
 * 
 * Este script:
 * 1. Lee .env.infrastructure
 * 2. Carga infrastructure.config.js
 * 3. Genera .env.generated con todas las variables
 * 4. Inyecta variables en todos los servicios
 * 5. Actualiza docker-compose.yml
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..');
const envInfraPath = path.join(projectRoot, '.env.infrastructure');
const envGeneratedPath = path.join(projectRoot, '.env.generated');

console.log('🏗️  Compilando configuración de infraestructura...\n');

// 1. Cargar .env.infrastructure
console.log('📖 Leyendo .env.infrastructure...');
if (!fs.existsSync(envInfraPath)) {
  console.error('❌ Archivo .env.infrastructure no encontrado');
  process.exit(1);
}

const envContent = fs.readFileSync(envInfraPath, 'utf-8');
const envVars = dotenv.parse(envContent);

// Inyectar en process.env
Object.assign(process.env, envVars);

// 2. Cargar infrastructure.config.js
console.log('📖 Cargando infrastructure.config.js...');
delete require.cache[require.resolve(path.join(projectRoot, 'infrastructure.config.js'))];
const infraConfig = require(path.join(projectRoot, 'infrastructure.config.js'));

// 3. Validar configuración
try {
  infraConfig.validate();
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

// 4. Generar .env.generated
console.log('\n📝 Generando .env.generated...');
const generatedEnv = infraConfig.toEnvVars();
const envContent2 = Object.entries(generatedEnv)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(envGeneratedPath, envContent2);
console.log(`✅ Generado: ${envGeneratedPath}`);

// 5. Inyectar en .env principal
console.log('\n📝 Actualizando .env...');
const mainEnvPath = path.join(projectRoot, '.env');
const existingEnv = fs.existsSync(mainEnvPath) ? fs.readFileSync(mainEnvPath, 'utf-8') : '';

// Preservar variables no relacionadas con infraestructura
const infrastructureKeys = Object.keys(generatedEnv);
const preservedLines = existingEnv
  .split('\n')
  .filter(line => {
    const key = line.split('=')[0];
    return !infrastructureKeys.includes(key) && line.trim() && !line.startsWith('#');
  });

const newEnv = [
  '# ==========================================',
  '# CONFIGURACIÓN GENERADA DE INFRAESTRUCTURA',
  '# NO EDITAR MANUALMENTE - Usa .env.infrastructure',
  '# ==========================================',
  '',
  ...Object.entries(generatedEnv).map(([k, v]) => `${k}=${v}`),
  '',
  '# ==========================================',
  '# CONFIGURACIÓN ADICIONAL (preservada)',
  '# ==========================================',
  ...preservedLines,
].join('\n');

fs.writeFileSync(mainEnvPath, newEnv);
console.log(`✅ Actualizado: ${mainEnvPath}`);

// 6. Mostrar resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE CONFIGURACIÓN');
console.log('='.repeat(60));
console.log('\n🌐 IPs PÚBLICAS:');
console.log(`   API Gateway:  ${generatedEnv.API_GATEWAY_IP}:${generatedEnv.API_GATEWAY_PORT}`);
console.log(`   Frontend:     ${generatedEnv.FRONTEND_IP}:${generatedEnv.FRONTEND_PORT}`);
console.log(`   Notificaciones: ${generatedEnv.NOTIFICACIONES_IP}:${generatedEnv.NOTIFICACIONES_PORT}`);

console.log('\n🔒 IPs PRIVADAS (internas):');
console.log(`   Core (Auth/Estudiantes/Maestros): ${generatedEnv.CORE_IP}`);
console.log(`     - Auth:          ${generatedEnv.CORE_IP}:${generatedEnv.AUTH_PORT}`);
console.log(`     - Estudiantes:   ${generatedEnv.CORE_IP}:${generatedEnv.ESTUDIANTES_PORT}`);
console.log(`     - Maestros:      ${generatedEnv.CORE_IP}:${generatedEnv.MAESTROS_PORT}`);
console.log(`   Database:     ${generatedEnv.DB_IP}`);
console.log(`     - MongoDB:      ${generatedEnv.DB_IP}:${generatedEnv.MONGO_PORT}`);
console.log(`     - PostgreSQL:   ${generatedEnv.DB_IP}:${generatedEnv.POSTGRES_PORT}`);
console.log(`     - Redis:        ${generatedEnv.DB_IP}:${generatedEnv.REDIS_PORT}`);

console.log('\n' + '='.repeat(60));
console.log('✅ Configuración compilada exitosamente');
console.log('='.repeat(60));
console.log('\n📋 Próximos pasos:');
console.log('   1. Revisa los cambios: cat .env');
console.log('   2. Reconstruye: npm run build:all');
console.log('   3. Redeploy:    docker-compose down && docker-compose up -d');
console.log('');
