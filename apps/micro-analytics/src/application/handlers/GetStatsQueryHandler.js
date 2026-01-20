class GetStatsQueryHandler {
  constructor(analyticsRepository, analyticsService) {
    this.analyticsRepository = analyticsRepository;
    this.analyticsService = analyticsService;
  }

  async handle(query) {
    try {
      const stats = await this.analyticsRepository.getAggregatedStats(query.period);

      return {
        status: 200,
        message: 'Stats retrieved successfully',
        data: {
          period: query.period,
          stats: stats.map(s => ({
            eventType: s._id,
            count: s.count,
          })),
          total: stats.reduce((sum, s) => sum + s.count, 0),
        },
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error retrieving stats',
      };
    }
  }
}

module.exports = GetStatsQueryHandler;
