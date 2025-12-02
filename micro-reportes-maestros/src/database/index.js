const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

async function connectDB() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  return mongoose.connection;
}

module.exports = { connectDB };
