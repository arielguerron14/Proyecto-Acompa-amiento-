class TrackEventCommand {
  constructor(eventType, userId, metadata = {}) {
    if (!eventType) throw new Error('eventType is required');

    this.eventType = eventType;
    this.userId = userId;
    this.metadata = metadata;
  }
}

module.exports = TrackEventCommand;
