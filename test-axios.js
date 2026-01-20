#!/usr/bin/env node

const axios = require('axios');

async function test() {
  try {
    console.log('Testing axios request...');
    const response = await axios.post('http://micro-auth:3000/auth/register', {
      name: 'AxiosTest',
      email: `axios${Date.now()}@example.com`,
      password: 'pass123'
    }, {
      validateStatus: () => true
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers: ${JSON.stringify(response.headers)}`);
    console.log(`Data: ${JSON.stringify(response.data)}`);
    console.log(`Data type: ${typeof response.data}`);
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}

test();
