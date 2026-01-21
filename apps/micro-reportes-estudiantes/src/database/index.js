const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for micro-reportes-estudiantes');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = { connectDB };
