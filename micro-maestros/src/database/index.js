const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

async function connectDB() {
  // Increase timeouts to avoid transient buffering timeouts under load or
  // short-lived network hiccups in the compose network.
  mongoose.set('bufferTimeoutMS', 30000);
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });
  return mongoose.connection;
}

module.exports = { connectDB };
