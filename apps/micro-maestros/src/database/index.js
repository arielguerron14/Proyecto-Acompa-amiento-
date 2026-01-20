const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

async function connectDB() {
  console.log(`🔌 Attempting to connect to MongoDB: ${MONGO_URI}`);
  
  // Increase timeouts to avoid transient buffering timeouts under load or
  // short-lived network hiccups in the compose network.
  mongoose.set('bufferTimeoutMS', 30000);
  
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      authSource: 'admin',
      retryWrites: false,
      maxPoolSize: 10,
      minPoolSize: 5
    });
    console.log('🟢 MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error details:', error);
    throw error;
  }
}

module.exports = { connectDB };
