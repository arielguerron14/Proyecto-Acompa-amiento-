const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

async function connectDB() {
  console.log(`🔌 Attempting to connect to MongoDB: ${MONGO_URI}`);
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: 'admin',
      retryWrites: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
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
