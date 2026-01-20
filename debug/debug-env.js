#!/usr/bin/env node
// Debug script to check environment variables

console.log('Environment Variables:');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);

const config = require('./apps/micro-estudiantes/src/config');
console.log('\nParsed Config:');
console.log('MONGO_URI from config:', config.MONGO_URI);
