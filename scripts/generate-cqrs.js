#!/usr/bin/env node

/**
 * CQRS Architecture Generator
 * Convierte la estructura de microservicios a CQRS automáticamente
 * 
 * Estructura CQRS:
 * src/
 *  ├─ api/
 *  │   └─ controllers/
 *  ├─ application/
 *  │   ├─ commands/
 *  │   ├─ command-handlers/
 *  │   ├─ queries/
 *  │   └─ query-handlers/
 *  ├─ domain/
 *  │   ├─ entities/
 *  │   ├─ aggregates/
 *  │   ├─ value-objects/
 *  │   └─ repositories/
 *  ├─ infrastructure/
 *  │   ├─ persistence-write/
 *  │   ├─ persistence-read/
 *  │   ├─ messaging/
 *  │   └─ config/
 *  └─ shared/
 *      └─ types/
 */

const fs = require('fs');
const path = require('path');

const logger = {
  info: (msg) => console.log(`✓ ${msg}`),
  error: (msg) => console.error(`✗ ${msg}`),
  warn: (msg) => console.warn(`⚠ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
};

/**
 * Estructura de carpetas a crear
 */
const CQRS_STRUCTURE = {
  'src/api/controllers': 'Controllers - API entry points',
  'src/application/commands': 'Command definitions',
  'src/application/command-handlers': 'Command handlers',
  'src/application/queries': 'Query definitions',
  'src/application/query-handlers': 'Query handlers',
  'src/domain/entities': 'Domain entities',
  'src/domain/aggregates': 'Aggregates - Root entities',
  'src/domain/value-objects': 'Value objects',
  'src/domain/repositories': 'Repository interfaces',
  'src/infrastructure/persistence-write': 'Write database access',
  'src/infrastructure/persistence-read': 'Read database access (projections)',
  'src/infrastructure/messaging': 'Event bus, event handlers',
  'src/infrastructure/config': 'Configuration',
  'src/shared/types': 'Shared types and interfaces',
};

/**
 * Genera template de comando
 */
function generateCommandTemplate(commandName) {
  return `/**
 * Command: ${commandName}
 * Encapsula la intención del usuario de realizar una acción
 */

export class ${commandName}Command {
  constructor(
    public readonly data: any
  ) {}
}
`;
}

/**
 * Genera template de command handler
 */
function generateCommandHandlerTemplate(commandName) {
  const handlerName = commandName.replace('Command', '') + 'CommandHandler';
  return `import { ${commandName}Command } from '../commands/${commandName}.command';

/**
 * Handler: ${handlerName}
 * Ejecuta la lógica de negocio asociada al comando
 */
export class ${handlerName} {
  async handle(command: ${commandName}Command): Promise<any> {
    // TODO: Implementar lógica de negocio
    throw new Error('Handler no implementado');
  }
}
`;
}

/**
 * Genera template de query
 */
function generateQueryTemplate(queryName) {
  return `/**
 * Query: ${queryName}
 * Define una pregunta para obtener datos
 */

export class ${queryName}Query {
  constructor(public readonly criteria: any) {}
}
`;
}

/**
 * Genera template de query handler
 */
function generateQueryHandlerTemplate(queryName) {
  const handlerName = queryName.replace('Query', '') + 'QueryHandler';
  return `import { ${queryName}Query } from '../queries/${queryName}.query';

/**
 * Handler: ${handlerName}
 * Ejecuta la lógica para recuperar datos
 */
export class ${handlerName} {
  async handle(query: ${queryName}Query): Promise<any> {
    // TODO: Implementar lógica de lectura
    throw new Error('Handler no implementado');
  }
}
`;
}

/**
 * Genera template de entidad
 */
function generateEntityTemplate(entityName) {
  return `/**
 * Entity: ${entityName}
 * Objeto del dominio con identidad única
 */

export class ${entityName} {
  private constructor(
    private readonly id: string,
    private readonly data: any
  ) {}

  static create(data: any): ${entityName} {
    // TODO: Implementar lógica de creación y validación
    const id = data.id || this.generateId();
    return new ${entityName}(id, data);
  }

  private static generateId(): string {
    return require('crypto').randomUUID();
  }

  getId(): string {
    return this.id;
  }

  getData(): any {
    return this.data;
  }
}
`;
}

/**
 * Genera template de repositorio
 */
function generateRepositoryTemplate(entityName) {
  const repoName = entityName + 'Repository';
  return `/**
 * Repository Interface: ${repoName}
 * Define las operaciones de persistencia para ${entityName}
 */

export interface ${repoName} {
  save(entity: ${entityName}): Promise<void>;
  
  findById(id: string): Promise<${entityName} | null>;
  
  findAll(): Promise<${entityName}[]>;
  
  delete(id: string): Promise<void>;
}
`;
}

/**
 * Crea la estructura de carpetas para CQRS
 */
function createCQRSStructure(microservicePath) {
  logger.info(`Creating CQRS structure in ${path.basename(microservicePath)}`);

  Object.keys(CQRS_STRUCTURE).forEach((folderPath) => {
    const fullPath = path.join(microservicePath, folderPath);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`  Created: ${folderPath}`);
    } else {
      logger.info(`  Already exists: ${folderPath}`);
    }
  });
}

/**
 * Migra controladores existentes a la estructura CQRS
 */
function migrateControllers(microservicePath) {
  const oldControllerPath = path.join(microservicePath, 'src/controllers');
  const newControllerPath = path.join(microservicePath, 'src/api/controllers');

  if (!fs.existsSync(oldControllerPath)) {
    logger.warn(`  No controllers found in ${oldControllerPath}`);
    return;
  }

  const files = fs.readdirSync(oldControllerPath);
  files.forEach((file) => {
    const srcFile = path.join(oldControllerPath, file);
    const destFile = path.join(newControllerPath, file);
    
    if (!fs.existsSync(destFile)) {
      fs.copyFileSync(srcFile, destFile);
      logger.info(`  Migrated controller: ${file}`);
    }
  });
}

/**
 * Migra modelos a entities del dominio
 */
function migrateModels(microservicePath) {
  const oldModelsPath = path.join(microservicePath, 'src/models');
  const newEntitiesPath = path.join(microservicePath, 'src/domain/entities');

  if (!fs.existsSync(oldModelsPath)) {
    logger.warn(`  No models found in ${oldModelsPath}`);
    return;
  }

  const files = fs.readdirSync(oldModelsPath);
  files.forEach((file) => {
    const srcFile = path.join(oldModelsPath, file);
    const destFile = path.join(newEntitiesPath, file);
    
    if (!fs.existsSync(destFile)) {
      fs.copyFileSync(srcFile, destFile);
      logger.info(`  Migrated model to entity: ${file}`);
    }
  });
}

/**
 * Migra servicios a command/query handlers
 */
function migrateServices(microservicePath) {
  const oldServicesPath = path.join(microservicePath, 'src/services');
  const commandHandlersPath = path.join(microservicePath, 'src/application/command-handlers');

  if (!fs.existsSync(oldServicesPath)) {
    logger.warn(`  No services found in ${oldServicesPath}`);
    return;
  }

  const files = fs.readdirSync(oldServicesPath);
  files.forEach((file) => {
    const srcFile = path.join(oldServicesPath, file);
    const destFile = path.join(commandHandlersPath, file);
    
    if (!fs.existsSync(destFile)) {
      fs.copyFileSync(srcFile, destFile);
      logger.info(`  Migrated service to command handler: ${file}`);
    }
  });
}

/**
 * Crea ejemplos de Commands y Queries
 */
function createExamples(microservicePath, microserviceName) {
  // Capitalizar nombre del microservicio
  const serviceName = microserviceName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // Crear ejemplos de Commands
  const exampleCommandFile = path.join(
    microservicePath,
    'src/application/commands/README.md'
  );

  if (!fs.existsSync(exampleCommandFile)) {
    const commandReadme = `# Commands

Commands representan intenciones del usuario de realizar acciones que modifican el estado.

## Ejemplo:

\`\`\`typescript
export class Create${serviceName}Command {
  constructor(
    public readonly email: string,
    public readonly name: string
  ) {}
}
\`\`\`
`;
    fs.writeFileSync(exampleCommandFile, commandReadme);
    logger.info(`  Created command example README`);
  }

  // Crear ejemplos de Queries
  const exampleQueryFile = path.join(
    microservicePath,
    'src/application/queries/README.md'
  );

  if (!fs.existsSync(exampleQueryFile)) {
    const queryReadme = `# Queries

Queries representan preguntas para obtener datos sin modificar el estado.

## Ejemplo:

\`\`\`typescript
export class Get${serviceName}ByIdQuery {
  constructor(public readonly id: string) {}
}
\`\`\`
`;
    fs.writeFileSync(exampleQueryFile, queryReadme);
    logger.info(`  Created query example README`);
  }

  // Crear archivo index para los handlers
  const handlerIndexFile = path.join(
    microservicePath,
    'src/application/command-handlers/index.ts'
  );

  if (!fs.existsSync(handlerIndexFile)) {
    const handlerIndex = `/**
 * Command Handlers - Exportar todos los handlers aquí
 * 
 * Ejemplo:
 * export { CreateUserCommandHandler } from './create-user.command-handler';
 */

export const commandHandlers = [];
`;
    fs.writeFileSync(handlerIndexFile, handlerIndex);
    logger.info(`  Created command handlers index`);
  }
}

/**
 * Crea un archivo de configuración para CQRS
 */
function createCQRSConfig(microservicePath) {
  const configFile = path.join(microservicePath, 'src/infrastructure/config/cqrs.config.ts');

  const content = `/**
 * CQRS Configuration
 * Centraliza la configuración de commands, queries y sus handlers
 */

import { commandHandlers } from '../../application/command-handlers';
import { queryHandlers } from '../../application/query-handlers';

export class CQRSConfig {
  private static readonly commandHandlerMap = new Map();
  private static readonly queryHandlerMap = new Map();

  static initialize(): void {
    // Registrar command handlers
    commandHandlers.forEach(handler => {
      this.commandHandlerMap.set(handler.constructor.name, handler);
    });

    // Registrar query handlers
    queryHandlers.forEach(handler => {
      this.queryHandlerMap.set(handler.constructor.name, handler);
    });

    console.log(\`✓ CQRS initialized with \${commandHandlers.length} commands and \${queryHandlers.length} queries\`);
  }

  static getCommandHandler(commandName: string) {
    return this.commandHandlerMap.get(commandName);
  }

  static getQueryHandler(queryName: string) {
    return this.queryHandlerMap.get(queryName);
  }
}
`;

  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, content);
    logger.info(`  Created CQRS configuration`);
  }
}

/**
 * Main execution
 */
async function main() {
  logger.section('🏗️  CQRS Architecture Generator');

  // Encontrar el directorio raíz del proyecto (uno nivel arriba de scripts/)
  const appsPath = path.join(__dirname, '..', 'apps');
  
  if (!fs.existsSync(appsPath)) {
    logger.error(`apps directory not found at ${appsPath}`);
    process.exit(1);
  }

  // Obtener lista de microservicios (excluyendo api-gateway y frontend)
  const microservices = fs.readdirSync(appsPath)
    .filter(dir => {
      const fullPath = path.join(appsPath, dir);
      return fs.statSync(fullPath).isDirectory() &&
             !['api-gateway', 'frontend-web'].includes(dir) &&
             fs.existsSync(path.join(fullPath, 'src'));
    });

  logger.section(`Found ${microservices.length} microservices to refactor`);

  let successCount = 0;
  let totalSteps = 0;

  microservices.forEach((microservice) => {
    const microservicePath = path.join(appsPath, microservice);
    
    logger.info(`\n📦 Processing: ${microservice}`);
    logger.info('-'.repeat(60));

    try {
      // Step 1: Crear estructura
      createCQRSStructure(microservicePath);
      
      // Step 2: Migrar controladores
      logger.info('  Migrating controllers...');
      migrateControllers(microservicePath);
      
      // Step 3: Migrar modelos
      logger.info('  Migrating models...');
      migrateModels(microservicePath);
      
      // Step 4: Migrar servicios
      logger.info('  Migrating services...');
      migrateServices(microservicePath);
      
      // Step 5: Crear ejemplos
      logger.info('  Creating examples...');
      createExamples(microservicePath, microservice);
      
      // Step 6: Crear configuración CQRS
      logger.info('  Creating CQRS config...');
      createCQRSConfig(microservicePath);

      successCount++;
      logger.info(`✅ ${microservice} successfully refactored`);
    } catch (error) {
      logger.error(`Failed to process ${microservice}: ${error.message}`);
    }

    totalSteps++;
  });

  logger.section(`✅ Refactoring Complete`);
  logger.info(`\n📊 Results:`);
  logger.info(`   Successfully refactored: ${successCount}/${microservices.length} microservices`);
  logger.info(`\n🎯 Next Steps:`);
  logger.info(`   1. Review the new CQRS structure in each microservice`);
  logger.info(`   2. Migrate your command/query logic into appropriate handlers`);
  logger.info(`   3. Update controllers to use the CQRS bus instead of direct service calls`);
  logger.info(`   4. Implement domain repositories for persistence`);
  logger.info(`   5. Create events for domain-driven design (optional)`);

  process.exit(successCount === microservices.length ? 0 : 1);
}

main().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
