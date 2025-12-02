/**
 * Utilitarios de retry y timeout
 */

/**
 * Reintenta una función con backoff exponencial
 */
async function retryWithBackoff(fn, maxAttempts = 3, initialDelay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(
          `[Utils] Reintentando en ${delay}ms (intento ${attempt}/${maxAttempts})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Ejecuta una función con timeout
 */
async function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout después de ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Realiza un circuit breaker
 */
class CircuitBreaker {
  constructor(fn, { threshold = 5, timeout = 60000 } = {}) {
    this.fn = fn;
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(
          `Circuit breaker OPEN. Reintentar en ${
            this.nextAttempt - Date.now()
          }ms`
        );
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await this.fn(...args);
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  _onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.threshold,
    };
  }
}

module.exports = {
  retryWithBackoff,
  withTimeout,
  CircuitBreaker,
};
