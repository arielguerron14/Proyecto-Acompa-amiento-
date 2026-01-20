#!/usr/bin/env node
// Debug script to check MongoDB connection

const axios = require('axios');

async function test() {
  try {
    console.log('Testing micro-estudiantes debug endpoints...');
    
    // Try test-query endpoint
    const res = await axios.get('http://localhost:8080/estudiantes/debug/test-query', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
