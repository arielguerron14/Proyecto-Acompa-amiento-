#!/usr/bin/env node

const axios = require('axios');

async function test() {
  try {
    console.log('Testing health endpoint with axios...');
    const response = await axios.get('http://localhost:8080/health', {
      validateStatus: () => true,
      transformResponse: [data => data]
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Data type: ${typeof response.data}`);
    console.log(`Data: ${response.data}`);
    
    try {
      const parsed = JSON.parse(response.data);
      console.log(`Parsed: ${JSON.stringify(parsed)}`);
    } catch (e) {
      console.log(`Parse error: ${e.message}`);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}

test();
