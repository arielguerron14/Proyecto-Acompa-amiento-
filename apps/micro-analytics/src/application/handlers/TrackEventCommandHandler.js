const Event = require('../../domain/entities/Event');

class TrackEventCommandHandler {
  constructor(analyticsRepository, analyticsService) {
    this.analyticsRepository = analyticsRepository;
    this.analyticsService = analyticsService;
  }

  async handle(command) {
    try {
      // Create domain entity
      const event = Event.create(
        command.eventType,
        command.userId,
        command.metadata
      );

      // Persist event
      const savedEvent = await this.analyticsRepository.save(event);

      return {
        status: 201,
        message: 'Event tracked successfully',
        result: {
          id: savedEvent.id,
          eventType: savedEvent.eventType,
          userId: savedEvent.userId,
          timestamp: savedEvent.timestamp,
        },
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error tracking event',
      };
    }
  }
}

module.exports = TrackEventCommandHandler;
