class GetEventsQuery {
  constructor(limit = 50, offset = 0, type = null) {
    this.limit = Math.min(parseInt(limit) || 50, 1000); // Max 1000 per query
    this.offset = parseInt(offset) || 0;
    this.type = type; // Optional filter by event type
  }
}

module.exports = GetEventsQuery;
