const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://172.31.67.47:27017/micro-reportes-estudiantes');
    console.log('MongoDB connected for micro-reportes-estudiantes');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = { connectDB };
