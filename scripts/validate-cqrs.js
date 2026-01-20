#!/usr/bin/env node

/**
 * CQRS Validation Script
 * Verifica que toda la arquitectura CQRS esté correcta
 */

const fs = require('fs');
const path = require('path');

const logger = {
  info: (msg) => console.log(`✓ ${msg}`),
  error: (msg) => console.error(`✗ ${msg}`),
  warn: (msg) => console.warn(`⚠ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
};

const REQUIRED_DIRS = [
  'src/api/controllers',
  'src/application/commands',
  'src/application/command-handlers',
  'src/application/queries',
  'src/application/query-handlers',
  'src/domain/entities',
  'src/domain/aggregates',
  'src/domain/value-objects',
  'src/domain/repositories',
  'src/infrastructure/persistence-write',
  'src/infrastructure/persistence-read',
  'src/infrastructure/messaging',
  'src/infrastructure/config',
  'src/shared/types',
];

function validateMicroservice(microservicePath, microserviceName) {
  let validCount = 0;
  let errors = [];

  for (const dir of REQUIRED_DIRS) {
    const fullPath = path.join(microservicePath, dir);
    if (fs.existsSync(fullPath)) {
      validCount++;
    } else {
      errors.push(`Missing: ${dir}`);
    }
  }

  if (errors.length === 0) {
    logger.info(`✅ ${microserviceName}: All directories present (${validCount}/${REQUIRED_DIRS.length})`);
    return true;
  } else {
    logger.error(`❌ ${microserviceName}: Missing ${errors.length} directories`);
    errors.forEach(err => logger.warn(`    ${err}`));
    return false;
  }
}

function checkFileStructure(microservicePath, microserviceName) {
  let issues = [];

  // Check command handlers have handle method
  const commandHandlersPath = path.join(microservicePath, 'src/application/command-handlers');
  if (fs.existsSync(commandHandlersPath)) {
    const files = fs.readdirSync(commandHandlersPath)
      .filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'README.md');
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(commandHandlersPath, file), 'utf8');
      if (!content.includes('async handle(') && !content.includes('handle(')) {
        issues.push(`${file}: Missing handle method`);
      }
      if (!content.includes('class') && !content.includes('export')) {
        issues.push(`${file}: Not a proper class export`);
      }
    });
  }

  // Check query handlers have handle method
  const queryHandlersPath = path.join(microservicePath, 'src/application/query-handlers');
  if (fs.existsSync(queryHandlersPath)) {
    const files = fs.readdirSync(queryHandlersPath)
      .filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'README.md');
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(queryHandlersPath, file), 'utf8');
      if (!content.includes('async handle(') && !content.includes('handle(')) {
        issues.push(`${file}: Missing handle method`);
      }
    });
  }

  // Check repositories have required methods
  const repositoriesPath = path.join(microservicePath, 'src/domain/repositories');
  if (fs.existsSync(repositoriesPath)) {
    const files = fs.readdirSync(repositoriesPath)
      .filter(f => f.endsWith('.js') && f !== 'README.md');
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(repositoriesPath, file), 'utf8');
      const requiredMethods = ['save', 'findById', 'delete'];
      requiredMethods.forEach(method => {
        if (!content.includes(method)) {
          issues.push(`${file}: Missing ${method} method`);
        }
      });
    });
  }

  if (issues.length > 0) {
    logger.warn(`⚠️  ${microserviceName}: Found ${issues.length} code structure issues`);
    issues.forEach(issue => logger.warn(`    ${issue}`));
  }

  return issues.length === 0;
}

function main() {
  logger.section('🔍 CQRS Architecture Validation');

  const appsPath = path.join(__dirname, '..', 'apps');
  
  if (!fs.existsSync(appsPath)) {
    logger.error(`apps directory not found at ${appsPath}`);
    process.exit(1);
  }

  const microservices = fs.readdirSync(appsPath)
    .filter(dir => {
      const fullPath = path.join(appsPath, dir);
      return fs.statSync(fullPath).isDirectory() &&
             !['api-gateway', 'frontend-web'].includes(dir) &&
             fs.existsSync(path.join(fullPath, 'src'));
    });

  logger.section(`Validating ${microservices.length} microservices`);

  let validCount = 0;
  let structureErrors = 0;
  let codeErrors = 0;

  microservices.forEach((microservice) => {
    const microservicePath = path.join(appsPath, microservice);
    
    const dirValid = validateMicroservice(microservicePath, microservice);
    const codeValid = checkFileStructure(microservicePath, microservice);

    if (dirValid) validCount++;
    if (!dirValid) structureErrors++;
    if (!codeValid) codeErrors++;
  });

  logger.section('📊 Validation Summary');
  logger.info(`Directory structure: ${validCount}/${microservices.length} valid`);
  logger.info(`Code structure: ${codeErrors} issues found`);

  if (validCount === microservices.length && codeErrors === 0) {
    logger.info('\n✅ All microservices have proper CQRS architecture!');
    process.exit(0);
  } else {
    logger.error('\n❌ Some microservices need fixes');
    logger.warn('\nRun: npm run cqrs:regenerate');
    process.exit(1);
  }
}

main().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
