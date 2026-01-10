
const axios = require('axios');
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
      const config = {
        method,
        url: `${baseUrl}${path}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 30000 // 30 second timeout
      };

      if (body) {
        config.data = body;
      }

      console.log(`🔄 [HttpForwarder] Forwarding to: ${config.url} (method: ${method})`);
      const response = await axios(config);
      console.log(`✅ [HttpForwarder] Response received: ${response.status} from ${config.url}`);
      return { status: response.status, data: response.data };
    } catch (err) {
      console.error(`❌ [HttpForwarder] Failed to forward to ${path}:`, err.message);
      console.error(`❌ [HttpForwarder] Target URL was: ${baseUrl}${path}`);
      logger.error(`[HttpForwarder] Failed to forward to ${path}:`, err.message);

      // Handle axios errors
      if (err.response) {
        // Server responded with error status
        console.error(`⚠️ [HttpForwarder] Server responded with error: ${err.response.status}`);
        return { status: err.response.status, data: err.response.data };
      } else if (err.request) {
        // Request was made but no response received
        console.error(`⚠️ [HttpForwarder] No response received from ${baseUrl}${path}`);
        console.error(`⚠️ [HttpForwarder] Error details:`, err.message);
        throw new Error(`Service unavailable: ${baseUrl}${path}`);
      } else {
        // Something else happened
        throw err;
      }
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
