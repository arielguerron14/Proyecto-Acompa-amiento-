const mongoose = require('mongoose');
const sharedConfig = require('../../../shared-config');

async function connectDB() {
  try {
    const mongoUrl = process.env.MONGO_URI || sharedConfig.getMongoUrl();
    await mongoose.connect(mongoUrl);
    console.log('MongoDB connected for micro-reportes-estudiantes');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = { connectDB };
