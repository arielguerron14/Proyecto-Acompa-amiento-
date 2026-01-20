#!/usr/bin/env node

/**
 * Comprehensive automated tests for all 4 main flows:
 * 1. Register User
 * 2. Login User
 * 3. Create Reservation
 * 4. Confirm Reservation
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read configuration
const configPath = path.join(__dirname, '../../config/instance_ips.json');
const routesPath = path.join(__dirname, '../../config/api_routes.json');

let config = {};
let routes = {};

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
} catch (err) {
  console.error('❌ Error reading configuration:', err.message);
  process.exit(1);
}

const apiGateway = `http://${config['api-gateway'].host}:${config['api-gateway'].port}`;

console.log(`\n🚀 Starting automated tests for all flows`);
console.log(`📍 API Gateway: ${apiGateway}`);
console.log(`⏱️  Timeout: 5000ms per request\n`);

// Test results
const results = {
  tests: [],
  passed: 0,
  failed: 0,
  skipped: 0,
};

// HTTP request helper using axios
async function makeRequest(method, path, body = null, headers = {}) {
  try {
    const url = apiGateway + path;
    
    const response = await axios({
      method: method.toLowerCase(),
      url: url,
      data: body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 5000,
      validateStatus: () => true // Accept any status code
      // Let axios use default transformResponse
    });
    
    return {
      status: response.status,
      headers: response.headers,
      body: response.data,
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('📋 Test 1: Health Check');
  const response = await makeRequest('GET', '/health');
  
  console.log(`  Raw response: status=${response.status}, type=${typeof response.body}, body=${JSON.stringify(response.body).substring(0, 100)}`);
  
  const result = {
    name: 'Health Check',
    path: '/health',
    method: 'GET',
    status: response.status,
    passed: response.status === 200,
  };
  
  if (result.passed) {
    console.log(`  ✅ ${response.status} OK`);
    results.passed++;
  } else {
    console.log(`  ❌ Status ${response.status}`);
    if (response.error) console.log(`     Error: ${response.error}`);
    if (typeof response.body === 'object' && response.body?.message) {
      console.log(`     Message: ${response.body.message}`);
    }
    results.failed++;
  }
  
  results.tests.push(result);
}

// Test 2: Register User
async function testRegisterUser() {
  console.log('\n📋 Test 2: Register User');
  
  const email = `test${Date.now()}@example.com`;
  const userData = {
    name: 'Test User',
    email: email,
    password: 'TestPassword123!',
  };
  
  const registerPath = routes.routes?.auth?.register || '/auth/register';
  console.log(`  Endpoint: POST ${registerPath}`);
  
  const response = await makeRequest('POST', registerPath, userData);
  
  const result = {
    name: 'Register User',
    path: registerPath,
    method: 'POST',
    status: response.status,
    passed: response.status === 200 || response.status === 201,
  };
  
  if (result.passed) {
    console.log(`  ✅ ${response.status} OK`);
    results.passed++;
    return { email, password: userData.password };
  } else {
    console.log(`  ❌ Status ${response.status}`);
    if (response.error) {
      console.log(`     Error: ${response.error}`);
    } else if (response.body?.message) {
      console.log(`     Message: ${response.body.message}`);
    } else if (response.body?.error) {
      console.log(`     Error: ${JSON.stringify(response.body.error)}`);
    } else if (typeof response.body === 'string' && response.body) {
      console.log(`     Response: ${response.body}`);
    } else if (response.rawResponse) {
      console.log(`     Raw: ${response.rawResponse}`);
    } else {
      console.log(`     Response: ${JSON.stringify(response.body)}`);
    }
    results.failed++;
    return null;
  }
}

// Test 3: Login User
async function testLoginUser(registeredEmail, registeredPassword) {
  console.log('\n📋 Test 3: Login User');
  
  const credentials = {
    email: registeredEmail || `test${Date.now() - 5000}@example.com`,
    password: registeredPassword || 'TestPassword123!',
  };
  
  const loginPath = routes.routes?.auth?.login || '/auth/login';
  console.log(`  Endpoint: POST ${loginPath}`);
  
  const response = await makeRequest('POST', loginPath, credentials);
  
  const result = {
    name: 'Login User',
    path: loginPath,
    method: 'POST',
    status: response.status,
    passed: response.status === 200,
  };
  
  if (result.passed) {
    console.log(`  ✅ ${response.status} OK`);
    results.passed++;
    return response.body?.data?.token || response.body?.token;
  } else {
    console.log(`  ❌ Status ${response.status}`);
    if (response.error) {
      console.log(`     Error: ${response.error}`);
    } else if (response.body?.message) {
      console.log(`     Message: ${response.body.message}`);
    } else if (response.body?.error) {
      console.log(`     Error: ${JSON.stringify(response.body.error)}`);
    } else {
      console.log(`     Response: ${JSON.stringify(response.body).substring(0, 200)}`);
    }
    results.failed++;
    return null;
  }
}

// Test 4: Create Reservation
async function testCreateReservation(token) {
  console.log('\n📋 Test 4: Create Reservation');
  
  const reservationData = {
    estudianteId: '507f1f77bcf86cd799439011',
    maestroId: '507f1f77bcf86cd799439012',
    fecha: '2024-12-20',
    hora: '10:00',
    asunto: 'Test Reservation',
  };
  
  const createPath = routes.routes?.estudiantes?.reservas?.create || '/estudiantes/reservas/create';
  console.log(`  Endpoint: POST ${createPath}`);
  
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await makeRequest('POST', createPath, reservationData, headers);
  
  const result = {
    name: 'Create Reservation',
    path: createPath,
    method: 'POST',
    status: response.status,
    passed: response.status === 200 || response.status === 201,
  };
  
  if (result.passed) {
    console.log(`  ✅ ${response.status} OK`);
    results.passed++;
    return response.body?.data?.id;
  } else {
    console.log(`  ❌ Status ${response.status}`);
    if (response.error) {
      console.log(`     Error: ${response.error}`);
    } else if (response.body?.message) {
      console.log(`     Message: ${response.body.message}`);
    } else if (response.body?.availableEndpoints) {
      console.log(`     Available endpoints:`, response.body.availableEndpoints);
    }
    results.failed++;
    return null;
  }
}

// Test 5: Confirm Reservation
async function testConfirmReservation(reservationId, token) {
  console.log('\n📋 Test 5: Confirm Reservation');
  
  if (!reservationId) {
    console.log(`  ⚠️  Skipped (no reservation ID from test 4)`);
    results.skipped++;
    return;
  }
  
  const confirmPath = (routes.routes?.estudiantes?.reservas?.confirm || '/estudiantes/reservas/:id/confirmar')
    .replace(':id', reservationId);
  console.log(`  Endpoint: PUT ${confirmPath}`);
  
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await makeRequest('PUT', confirmPath, {}, headers);
  
  const result = {
    name: 'Confirm Reservation',
    path: confirmPath,
    method: 'PUT',
    status: response.status,
    passed: response.status === 200,
  };
  
  if (result.passed) {
    console.log(`  ✅ ${response.status} OK`);
    results.passed++;
  } else {
    console.log(`  ❌ Status ${response.status}`);
    if (response.error) {
      console.log(`     Error: ${response.error}`);
    } else if (response.body?.message) {
      console.log(`     Message: ${response.body.message}`);
    }
    results.failed++;
  }
  
  results.tests.push(result);
}

// Run all tests
async function runAllTests() {
  try {
    await testHealthCheck();  // Test health FIRST
    const userCreds = await testRegisterUser();
    const token = await testLoginUser(userCreds?.email, userCreds?.password);
    const reservationId = await testCreateReservation(token);
    await testConfirmReservation(reservationId, token);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    results.tests.forEach((test, index) => {
      const status = test.passed ? '✅' : test.skipped ? '⚠️' : '❌';
      console.log(`${index + 1}. ${status} ${test.name} (${test.method} ${test.path})`);
      console.log(`   Status: ${test.status}`);
    });
    
    console.log('\n📈 Results:');
    console.log(`   ✅ Passed: ${results.passed}/5`);
    console.log(`   ❌ Failed: ${results.failed}/5`);
    console.log(`   ⚠️  Skipped: ${results.skipped}/5`);
    
    if (results.failed === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${results.failed} test(s) failed. Check the output above.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
