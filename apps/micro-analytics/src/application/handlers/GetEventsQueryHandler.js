class GetEventsQueryHandler {
  constructor(analyticsRepository, analyticsService) {
    this.analyticsRepository = analyticsRepository;
    this.analyticsService = analyticsService;
  }

  async handle(query) {
    try {
      let events;

      if (query.type) {
        events = await this.analyticsRepository.findByType(
          query.type,
          query.limit,
          query.offset
        );
      } else {
        events = await this.analyticsRepository.findAll(query.limit, query.offset);
      }

      return {
        status: 200,
        message: 'Events retrieved successfully',
        data: events.map(e => ({
          id: e.id,
          eventType: e.eventType,
          userId: e.userId,
          metadata: e.metadata,
          timestamp: e.timestamp,
        })),
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error retrieving events',
      };
    }
  }
}

module.exports = GetEventsQueryHandler;
