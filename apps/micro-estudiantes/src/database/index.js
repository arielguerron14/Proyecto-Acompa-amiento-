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
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000
    });
    
    // Wait a bit for connection pool to be ready
    console.log('🟢 MongoDB connected, waiting for pool to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('🟢 MongoDB ready for queries');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error details:', error);
    throw error;
  }
}

module.exports = { connectDB };
