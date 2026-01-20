#!/usr/bin/env node

/**
 * Script para corregir automáticamente endpoints faltantes en microservicios
 * Detecta y corrige:
 * 1. AuthService.generateAccessTokenWithVersion faltante
 * 2. POST /reservas/create endpoint faltante
 * 3. Otros endpoints faltantes detectados por los tests
 */

const fs = require('fs');
const path = require('path');

const logger = {
  info: (msg) => console.log(`✓ ${msg}`),
  error: (msg) => console.error(`✗ ${msg}`),
  warn: (msg) => console.warn(`⚠ ${msg}`)
};

// ============================================
// FIX #1: AuthService.generateAccessTokenWithVersion
// ============================================
function fixAuthService() {
  logger.info('Checking AuthService for token generation method...');
  
  const sharedAuthPath = path.join(__dirname, '../packages/shared-auth/src/services/authService.js');
  const fallbackAuthPath = path.join(__dirname, '../apps/micro-auth/src/fallback/authService.js');
  
  let filePath = sharedAuthPath;
  let fileContent = '';
  
  // Try shared-auth first, then fallback
  if (fs.existsSync(sharedAuthPath)) {
    fileContent = fs.readFileSync(sharedAuthPath, 'utf8');
  } else if (fs.existsSync(fallbackAuthPath)) {
    fileContent = fs.readFileSync(fallbackAuthPath, 'utf8');
    filePath = fallbackAuthPath;
  } else {
    logger.error(`AuthService not found at ${sharedAuthPath} or ${fallbackAuthPath}`);
    return false;
  }
  
  // Check if generateAccessTokenWithVersion exists
  if (fileContent.includes('generateAccessTokenWithVersion')) {
    logger.info('✓ generateAccessTokenWithVersion already exists');
    return true;
  }
  
  // Check for generateAccessToken and create alias
  if (fileContent.includes('generateAccessToken')) {
    logger.info('Found generateAccessToken, creating generateAccessTokenWithVersion alias...');
    
    // Add the alias method if it doesn't exist
    const aliasCode = `\n// Alias for compatibility with tokenVersion parameter\nmodule.exports.generateAccessTokenWithVersion = function(userId, roles, tokenVersion = 0) {\n  return this.generateAccessToken({ userId, roles: Array.isArray(roles) ? roles : [roles], tokenVersion });\n};\n`;
    
    // Check if it's already being exported as module.exports
    if (fileContent.includes('module.exports =')) {
      // It's using module.exports = { ... }
      const exportMatch = fileContent.match(/module\.exports\s*=\s*{([^}]+)}/);
      if (exportMatch && !exportMatch[0].includes('generateAccessTokenWithVersion')) {
        // Add to exports
        const newContent = fileContent.replace(
          /(\s*}\s*;)/,
          `,\n  generateAccessTokenWithVersion: function(userId, roles, tokenVersion = 0) {\n    return this.generateAccessToken({ userId, roles: Array.isArray(roles) ? roles : [roles], tokenVersion });\n  }\n}`
        );
        fs.writeFileSync(filePath, newContent);
        logger.info(`✓ Added generateAccessTokenWithVersion to ${path.basename(filePath)}`);
        return true;
      }
    }
    
    // Append as separate export
    fs.appendFileSync(filePath, aliasCode);
    logger.info(`✓ Appended generateAccessTokenWithVersion to ${path.basename(filePath)}`);
    return true;
  }
  
  logger.error('No token generation method found in AuthService');
  return false;
}

// ============================================
// FIX #2: POST /reservas/create endpoint
// ============================================
function fixReservasEndpoint() {
  logger.info('Checking reservas routes for /create endpoint...');
  
  const routesPath = path.join(__dirname, '../apps/micro-estudiantes/src/routes/reservasRoutes.js');
  
  if (!fs.existsSync(routesPath)) {
    logger.error(`Routes file not found: ${routesPath}`);
    return false;
  }
  
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Check if /reservas/create route exists
  if (content.includes("'/reservas/create'") || content.includes('"/reservas/create"')) {
    logger.info('✓ POST /reservas/create route already exists');
    return true;
  }
  
  // Check if createReserva controller exists
  if (!content.includes('ctrl.createReserva')) {
    logger.warn('createReserva controller method not found');
    return false;
  }
  
  // Add the route if /reservar exists (use it as template)
  if (content.includes("router.post('/reservar'")) {
    logger.info('Found POST /reservar route, adding /reservas/create alias...');
    
    // Add right after the /reservar route
    const newRoute = "\nrouter.post('/reservas/create', ctrl.createReserva);  // Alias for POST /reservar";
    content = content.replace(
      /(router\.post\('\/reservar'[^;]+;)/,
      `$1${newRoute}`
    );
    
    fs.writeFileSync(routesPath, content);
    logger.info('✓ Added POST /reservas/create route alias');
    return true;
  }
  
  logger.error('Could not find POST /reservar route to use as template');
  return false;
}

// ============================================
// Main execution
// ============================================
async function main() {
  logger.info('='.repeat(50));
  logger.info('🔧 Starting automatic endpoint fixes...');
  logger.info('='.repeat(50));
  
  let fixes = 0;
  
  // Fix 1: AuthService
  logger.info('\n[1/2] Fixing AuthService...');
  if (fixAuthService()) {
    fixes++;
  }
  
  // Fix 2: Reservas endpoint
  logger.info('\n[2/2] Fixing Reservas endpoint...');
  if (fixReservasEndpoint()) {
    fixes++;
  }
  
  logger.info('\n' + '='.repeat(50));
  logger.info(`✓ Completed ${fixes}/2 fixes`);
  logger.info('='.repeat(50));
  
  process.exit(fixes === 2 ? 0 : 1);
}

main().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
