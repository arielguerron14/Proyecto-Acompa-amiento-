/**
 * CQRS Bus Configuration
 * Centraliza la configuración de commands, queries y sus handlers
 */

class CommandBus {
  constructor() {
    this.handlers = new Map();
  }

  register(commandName, handler) {
    this.handlers.set(commandName, handler);
    console.log(`✓ Registered command handler: ${commandName}`);
  }

  async execute(command) {
    const handler = this.handlers.get(command.constructor.name);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.constructor.name}`);
    }
    return await handler.handle(command);
  }
}

class QueryBus {
  constructor() {
    this.handlers = new Map();
  }

  register(queryName, handler) {
    this.handlers.set(queryName, handler);
    console.log(`✓ Registered query handler: ${queryName}`);
  }

  async execute(query) {
    const handler = this.handlers.get(query.constructor.name);
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.constructor.name}`);
    }
    return await handler.handle(query);
  }
}

module.exports = {
  CommandBus,
  QueryBus,
};
