class Event {
  constructor(id, eventType, userId, metadata, timestamp) {
    this.id = id;
    this.eventType = eventType;
    this.userId = userId;
    this.metadata = metadata;
    this.timestamp = timestamp;
  }

  static create(eventType, userId, metadata = {}) {
    const event = new Event(
      null,
      eventType,
      userId,
      metadata,
      new Date()
    );
    event.validate();
    return event;
  }

  static fromPersistence(doc) {
    return new Event(
      doc._id.toString(),
      doc.eventType,
      doc.userId,
      doc.metadata,
      doc.timestamp
    );
  }

  validate() {
    if (!this.eventType) throw new Error('eventType is required');
  }

  toPersistence() {
    return {
      eventType: this.eventType,
      userId: this.userId,
      metadata: this.metadata,
      timestamp: this.timestamp,
    };
  }
}

module.exports = Event;
