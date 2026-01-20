const json2csv = require('json2csv').Parser;

class GenerateReportQueryHandler {
  constructor(analyticsRepository, analyticsService) {
    this.analyticsRepository = analyticsRepository;
    this.analyticsService = analyticsService;
  }

  async handle(query) {
    try {
      let events = [];

      if (query.startDate && query.endDate) {
        events = await this.analyticsRepository.findByDateRange(
          query.startDate,
          query.endDate
        );
      }

      const reportData = events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        userId: e.userId || 'N/A',
        timestamp: e.timestamp.toISOString(),
        metadata: JSON.stringify(e.metadata),
      }));

      if (query.format === 'csv') {
        try {
          const parser = new json2csv({ fields: ['id', 'eventType', 'userId', 'timestamp', 'metadata'] });
          const csv = parser.parse(reportData);
          return {
            status: 200,
            message: 'Report generated successfully',
            data: csv,
            format: 'csv',
          };
        } catch (csvError) {
          // Fallback to JSON if csv2json fails
          return {
            status: 200,
            message: 'Report generated successfully',
            data: reportData,
            format: 'json',
          };
        }
      }

      return {
        status: 200,
        message: 'Report generated successfully',
        data: reportData,
        format: 'json',
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error generating report',
      };
    }
  }
}

module.exports = GenerateReportQueryHandler;
