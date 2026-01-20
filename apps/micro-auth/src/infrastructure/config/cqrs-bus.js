/**
 * CQRS Bus
 * Orquesta la ejecución de Commands y Queries
 * Patrón de Bus que desacopla los controllers de los handlers
 */

class CommandBus {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Registra un handler para un comando
   */
  register(commandClass, handler) {
    const commandName = commandClass.name;
    this.handlers.set(commandName, handler);
    console.log(`✓ Registered command handler: ${commandName}`);
  }

  /**
   * Ejecuta un comando
   */
  async execute(command) {
    const commandName = command.constructor.name;
    const handler = this.handlers.get(commandName);

    if (!handler) {
      const error = new Error(`No handler registered for command: ${commandName}`);
      error.status = 500;
      throw error;
    }

    console.log(`[CommandBus] Executing: ${commandName}`);
    return handler.handle(command);
  }
}

class QueryBus {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Registra un handler para una query
   */
  register(queryClass, handler) {
    const queryName = queryClass.name;
    this.handlers.set(queryName, handler);
    console.log(`✓ Registered query handler: ${queryName}`);
  }

  /**
   * Ejecuta una query
   */
  async execute(query) {
    const queryName = query.constructor.name;
    const handler = this.handlers.get(queryName);

    if (!handler) {
      const error = new Error(`No handler registered for query: ${queryName}`);
      error.status = 500;
      throw error;
    }

    console.log(`[QueryBus] Executing: ${queryName}`);
    return handler.handle(query);
  }
}

module.exports = {
  CommandBus,
  QueryBus
};
