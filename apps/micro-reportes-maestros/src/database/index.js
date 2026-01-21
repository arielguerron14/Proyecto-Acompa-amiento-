const pg = require('../config/postgres');
const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

async function connectDB() {
  // Connect to Postgres first (used by some parts of the service)
  await pg.query('SELECT 1 as ok');

  // Connect to MongoDB for ReporteMaestro documents
  mongoose.set('bufferTimeoutMS', 30000);
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });

  return { pg: pg.pool, mongo: mongoose.connection };
}

module.exports = { connectDB };
