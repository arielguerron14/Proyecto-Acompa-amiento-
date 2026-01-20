/**
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

    console.log(`✓ CQRS initialized with ${commandHandlers.length} commands and ${queryHandlers.length} queries`);
  }

  static getCommandHandler(commandName: string) {
    return this.commandHandlerMap.get(commandName);
  }

  static getQueryHandler(queryName: string) {
    return this.queryHandlerMap.get(queryName);
  }
}
