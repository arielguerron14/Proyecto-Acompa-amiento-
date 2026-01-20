const Event = require('../../domain/entities/Event');
const EventModel = require('../persistence-read/models/Event');

class AnalyticsRepository {
  async save(event) {
    try {
      const doc = event.toPersistence();
      const eventDoc = new EventModel(doc);
      const saved = await eventDoc.save();
      return Event.fromPersistence(saved);
    } catch (error) {
      throw new Error(`Error saving event: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const doc = await EventModel.findById(id);
      if (!doc) return null;
      return Event.fromPersistence(doc);
    } catch (error) {
      throw new Error(`Error finding event by id: ${error.message}`);
    }
  }

  async findByType(type, limit = 50, offset = 0) {
    try {
      const docs = await EventModel.find({ eventType: type })
        .limit(limit)
        .skip(offset)
        .sort({ timestamp: -1 });
      return docs.map(doc => Event.fromPersistence(doc));
    } catch (error) {
      throw new Error(`Error finding events by type: ${error.message}`);
    }
  }

  async findAll(limit = 50, offset = 0) {
    try {
      const docs = await EventModel.find({})
        .limit(limit)
        .skip(offset)
        .sort({ timestamp: -1 });
      return docs.map(doc => Event.fromPersistence(doc));
    } catch (error) {
      throw new Error(`Error finding all events: ${error.message}`);
    }
  }

  async findByDateRange(startDate, endDate) {
    try {
      const docs = await EventModel.find({
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }).sort({ timestamp: -1 });
      return docs.map(doc => Event.fromPersistence(doc));
    } catch (error) {
      throw new Error(`Error finding events by date range: ${error.message}`);
    }
  }

  async countByType(type) {
    try {
      return await EventModel.countDocuments({ eventType: type });
    } catch (error) {
      throw new Error(`Error counting events by type: ${error.message}`);
    }
  }

  async getAggregatedStats(period) {
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate;

      switch (period) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const stats = await EventModel.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: now },
          },
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Error getting aggregated stats: ${error.message}`);
    }
  }
}

module.exports = AnalyticsRepository;
