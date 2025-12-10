const { logger } = require('../middlewares/logger');

/**
 * HTTP request forwarder helper
 * Forwards requests to another microservice and handles response parsing
 * Follows GRASP: Expert pattern for HTTP communication logic
 */
class HttpForwarder {
  /**
   * Forward a request to a target service
   * @param {string} baseUrl - Base URL of the target service
   * @param {string} path - Path to forward to
   * @param {string} method - HTTP method (GET, POST, etc)
   * @param {object} body - Request body (optional)
   * @param {object} headers - Additional headers (optional)
   * @returns {Promise<{status: number, data: any}>}
   */
  static async forward(baseUrl, path, method, body = null, headers = {}) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${baseUrl}${path}`, options);
      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return { status: response.status, data };
    } catch (err) {
      logger.error(`[HttpForwarder] Failed to forward to ${path}:`, err.message);
      throw err;
    }
  }

  /**
   * Convenience method to forward to a microservice with optional Authorization header
   * @param {string} baseUrl - Base URL of target microservice
   * @param {string} path - Path to forward
   * @param {string} method - HTTP method
   * @param {object} body - Request body
   * @param {string} authHeader - Authorization header value (optional)
   * @returns {Promise<{status: number, data: any}>}
   */
  static async forwardWithAuth(baseUrl, path, method, body, authHeader) {
    const headers = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    return this.forward(baseUrl, path, method, body, headers);
  }
}

module.exports = HttpForwarder;
