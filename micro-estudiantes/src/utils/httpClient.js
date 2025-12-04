const axios = require('axios');
const { logger } = require('../middlewares/logger');

class HttpClient {
  constructor() {
    this.timeout = 5000;
  }

  /**
   * Realiza un GET request
   */
  async get(url) {
    try {
      const response = await axios.get(url, { timeout: this.timeout });
      return response;
    } catch (error) {
      logger.error(`GET ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Realiza un POST request
   */
  async post(url, data) {
    try {
      const response = await axios.post(url, data, { timeout: this.timeout });
      return response;
    } catch (error) {
      logger.warn(`POST ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Realiza un GET con tolerancia a fallos
   */
  async getSafe(url) {
    try {
      return await this.get(url);
    } catch {
      return null;
    }
  }

  /**
   * Realiza un POST con tolerancia a fallos
   */
  async postSafe(url, data) {
    try {
      return await this.post(url, data);
    } catch {
      return null;
    }
  }
}

module.exports = new HttpClient();
