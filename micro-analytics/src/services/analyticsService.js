/**
 * Mock Analytics Service
 * En producción, integrar con base de datos real (MongoDB, ClickHouse, etc.)
 */

const EVENTS_STORE = [];

class AnalyticsService {
  /**
   * Obtiene eventos registrados
   */
  static async getEvents({ limit = 50, offset = 0, type }) {
    let events = EVENTS_STORE;

    if (type) {
      events = events.filter((e) => e.eventType === type);
    }

    return events.slice(offset, offset + limit);
  }

  /**
   * Obtiene estadísticas agregadas
   */
  static async getStats(period) {
    const stats = {
      period,
      totalEvents: EVENTS_STORE.length,
      eventsByType: {},
      eventsByUser: {},
    };

    EVENTS_STORE.forEach((event) => {
      stats.eventsByType[event.eventType] =
        (stats.eventsByType[event.eventType] || 0) + 1;
      stats.eventsByUser[event.userId] = (stats.eventsByUser[event.userId] || 0) + 1;
    });

    return stats;
  }

  /**
   * Registra un evento
   */
  static async trackEvent({ eventType, userId, metadata }) {
    const event = {
      id: `EVT-${Date.now()}`,
      eventType,
      userId: userId || 'anonymous',
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    EVENTS_STORE.push(event);
    console.log('[AnalyticsService] Event tracked:', event);

    return event;
  }

  /**
   * Genera un reporte
   */
  static async generateReport({ startDate, endDate, format = 'json' }) {
    const report = {
      generatedAt: new Date().toISOString(),
      startDate: startDate || 'N/A',
      endDate: endDate || 'N/A',
      totalEvents: EVENTS_STORE.length,
      eventSummary: await this.getStats('all'),
    };

    if (format === 'csv') {
      return this._convertToCSV(report);
    }

    return report;
  }

  /**
   * Convierte reporte a CSV
   */
  static _convertToCSV(report) {
    const rows = [
      ['Analytics Report'],
      ['Generated At', report.generatedAt],
      ['Total Events', report.totalEvents],
      [],
      ['Event Type', 'Count'],
    ];

    Object.entries(report.eventSummary.eventsByType).forEach(([type, count]) => {
      rows.push([type, count]);
    });

    return rows.map((row) => row.join(',')).join('\n');
  }
}

module.exports = AnalyticsService;
