/**
 * Logger centralizado para messaging
 */
class Logger {
  constructor(service = 'messaging') {
    this.service = service;
  }

  info(message, data = {}) {
    console.log(`[${this.service}] ℹ️  ${message}`, data);
  }

  warn(message, data = {}) {
    console.warn(`[${this.service}] ⚠️  ${message}`, data);
  }

  error(message, error = null) {
    console.error(`[${this.service}] ❌ ${message}`, error);
  }

  debug(message, data = {}) {
    if (process.env.DEBUG === 'true') {
      console.log(`[${this.service}] 🐛 ${message}`, data);
    }
  }

  success(message, data = {}) {
    console.log(`[${this.service}] ✅ ${message}`, data);
  }
}

module.exports = Logger;
