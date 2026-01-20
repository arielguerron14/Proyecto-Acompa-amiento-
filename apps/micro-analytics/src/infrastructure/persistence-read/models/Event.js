const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['user_login', 'user_logout', 'document_view', 'document_edit', 'search', 'export', 'error'],
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

module.exports = mongoose.model('Event', eventSchema);
