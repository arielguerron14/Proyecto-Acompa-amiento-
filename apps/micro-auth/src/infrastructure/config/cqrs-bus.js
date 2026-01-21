/**
 * CQRS Bus Configuration
 * Centraliza la configuración de commands, queries y sus handlers
 */

class CommandBus {
  constructor() {
    this.handlers = new Map();
  }

  register(commandOrName, handler) {
    const name = typeof commandOrName === 'function' ? commandOrName.name : String(commandOrName);
    this.handlers.set(name, handler);
    console.log(`✓ Registered command handler: ${name}`);
  }

  async execute(command) {
    const name = command && command.constructor && command.constructor.name ? command.constructor.name : String(command);
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No handler registered for command: ${name}`);
    }
    return await handler.handle(command);
  }
}

class QueryBus {
  constructor() {
    this.handlers = new Map();
  }

  register(queryOrName, handler) {
    const name = typeof queryOrName === 'function' ? queryOrName.name : String(queryOrName);
    this.handlers.set(name, handler);
    console.log(`✓ Registered query handler: ${name}`);
  }

  async execute(query) {
    const name = query && query.constructor && query.constructor.name ? query.constructor.name : String(query);
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No handler registered for query: ${name}`);
    }
    return await handler.handle(query);
  }
}

module.exports = {
  CommandBus,
  QueryBus,
};
