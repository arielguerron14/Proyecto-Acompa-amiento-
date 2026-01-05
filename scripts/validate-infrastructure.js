#!/usr/bin/env node

/**
 * Script para validar configuración de infraestructura
 * 
 * Verificar que:
 * - Todos los servicios leen correctamente las IPs
 * - No hay hardcodes de IPs en archivos de código
 * - La configuración es consistente
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const infraConfig = require(path.join(projectRoot, 'infrastructure.config.js'));

console.log('🔍 Validando configuración de infraestructura...\n');

const issues = [];
const warnings = [];

// 1. Validar infraestructura.config.js
try {
  infraConfig.validate();
  console.log('✅ infrastructure.config.js válido');
} catch (err) {
  issues.push(`infrastructure.config.js: ${err.message}`);
}

// 2. Verificar que .env está actualizado
console.log('\n📝 Verificando .env...');
const envPath = path.join(projectRoot, '.env');
if (!fs.existsSync(envPath)) {
  warnings.push('⚠️  .env no encontrado - ejecuta: npm run build:infrastructure');
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasConfig = envContent.includes('CONFIGURACIÓN GENERADA DE INFRAESTRUCTURA');
  
  if (hasConfig) {
    console.log('✅ .env contiene configuración generada');
  } else {
    warnings.push('⚠️  .env no parece estar generado por build-infrastructure.js');
  }
}

// 3. Buscar hardcodes de IPs en código
console.log('\n🔎 Buscando hardcodes de IPs en código...');
const filesToCheck = [
  'api-gateway/src/routes/authRoutes.js',
  'api-gateway/src/routes/estudiantesRoutes.js',
  'api-gateway/src/routes/maestrosRoutes.js',
  'micro-auth/src/app.js',
  'micro-auth/src/config/index.js',
  'micro-estudiantes/src/config/index.js',
  'micro-maestros/src/config/index.js',
  'frontend-web/js/config.js',
];

const ipsToCheck = ['100.48.66.29', '44.210.134.93', '13.223.196.229', '13.220.99.207'];

filesToCheck.forEach(file => {
  const filepath = path.join(projectRoot, file);
  if (fs.existsSync(filepath)) {
    const content = fs.readFileSync(filepath, 'utf-8');
    
    ipsToCheck.forEach(ip => {
      if (content.includes(ip)) {
        // Permitir en archivos de configuración central
        if (!file.includes('infrastructure.config') && !file.includes('config/index')) {
          warnings.push(`⚠️  IP ${ip} encontrada en ${file} (debería usar variable de entorno)`);
        }
      }
    });
  }
});

// 4. Verificar archivos de configuración de cada servicio
console.log('\n📂 Verificando archivos de configuración por servicio...');

const configFiles = [
  { path: 'micro-auth/src/config/index.js', service: 'micro-auth' },
  { path: 'micro-estudiantes/src/config/index.js', service: 'micro-estudiantes' },
  { path: 'micro-maestros/src/config/index.js', service: 'micro-maestros' },
];

configFiles.forEach(({ path: filePath, service }) => {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    if (content.includes('process.env')) {
      console.log(`  ✅ ${service}: usando variables de entorno`);
    } else {
      warnings.push(`  ⚠️  ${service}: no parece usar variables de entorno`);
    }
  }
});

// 5. Resumen
console.log('\n' + '='.repeat(60));
if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ VALIDACIÓN EXITOSA - Infraestructura correctamente configurada');
} else if (issues.length > 0) {
  console.log('❌ ERRORES ENCONTRADOS:');
  issues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log('⚠️  ADVERTENCIAS:');
  warnings.forEach(warning => console.log(`   ${warning}`));
}
console.log('='.repeat(60));

process.exit(issues.length > 0 ? 1 : 0);
