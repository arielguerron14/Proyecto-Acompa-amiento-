#!/usr/bin/env node

const http = require('http');

function testRequest() {
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 5000,
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
      console.log(`Data chunk: ${JSON.stringify(chunk.toString())}`);
      data += chunk;
    });

    res.on('end', () => {
      console.log(`Total data: ${data}`);
      try {
        const parsed = JSON.parse(data);
        console.log(`Parsed: ${JSON.stringify(parsed)}`);
      } catch (e) {
        console.log(`Parse error: ${e.message}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });

  req.on('timeout', () => {
    console.error('Timeout!');
    req.destroy();
  });

  const body = JSON.stringify({
    name: 'Test',
    email: 'test@example.com',
    password: 'pass123',
  });
  console.log(`Sending: ${body}`);
  req.write(body);
  req.end();
}

testRequest();
