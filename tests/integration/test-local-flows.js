/**
 * Suite de pruebas automáticas para los 4 flujos principales
 * - Registrar usuario (Sign Up)
 * - Login / Ingresar
 * - Crear reserva
 * - Reservar / Confirmar reserva
 * 
 * Ejecutar: node tests/integration/test-local-flows.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración local desde config/instance_ips.json
let config = {};
try {
  const configPath = path.join(__dirname, '../../config/instance_ips.json');
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error('❌ Error leyendo config/instance_ips.json:', e.message);
  process.exit(1);
}

// URL base del API Gateway
const GATEWAY_HOST = config['api-gateway']?.host || 'localhost';
const GATEWAY_PORT = config['api-gateway']?.port || 8080;
const BASE_URL = `http://${GATEWAY_HOST}:${GATEWAY_PORT}`;

// Variables globales para tests
let testResults = [];
let authToken = null;
let userId = null;
let reservaId = null;

console.log('\n' + '='.repeat(80));
console.log('🧪 PRUEBAS AUTOMÁTICAS - FLUJOS PRINCIPALES');
console.log('='.repeat(80));
console.log(`📍 API Gateway: ${BASE_URL}\n`);

/**
 * Helper para hacer requests HTTP
 */
function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: { error: 'Invalid JSON response' },
            raw: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message,
        body: { error: error.message }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        error: 'Timeout',
        body: { error: 'Request timeout after 5000ms' }
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Registrar nuevo usuario
 */
async function testRegister() {
  console.log('\n▶️  FLUJO 1: REGISTRAR USUARIO (Sign Up)');
  console.log('-'.repeat(80));

  const testEmail = `test-${Date.now()}@example.com`;
  const registerData = {
    email: testEmail,
    password: 'TestPass123!',
    nombre: 'Test User',
    rol: 'estudiante'
  };

  const response = await makeRequest('POST', '/auth/register', registerData);
  
  console.log(`POST /auth/register`);
  console.log(`Status: ${response.status}`);
  
  if (response.error) {
    console.log(`❌ Error: ${response.error}`);
    testResults.push({ test: 'Registrar Usuario', status: '❌ FAILED', reason: response.error });
    return;
  }

  if (response.status === 201 || response.status === 200) {
    userId = response.body.userId || response.body.user?.id;
    authToken = response.body.token;
    console.log(`✅ EXITOSA - Usuario registrado`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${authToken ? authToken.substring(0, 30) + '...' : 'N/A'}`);
    testResults.push({ test: 'Registrar Usuario', status: '✅ EXITOSA' });
  } else if (response.status === 409) {
    console.log(`⚠️  Usuario ya existe`);
    testResults.push({ test: 'Registrar Usuario', status: '⚠️  EXISTE' });
  } else {
    console.log(`❌ Error HTTP ${response.status}`);
    console.log(`   Respuesta:`, JSON.stringify(response.body, null, 2));
    testResults.push({ test: 'Registrar Usuario', status: `❌ HTTP ${response.status}` });
  }
}

/**
 * Login / Ingresar
 */
async function testLogin() {
  console.log('\n▶️  FLUJO 2: INGRESAR / LOGIN');
  console.log('-'.repeat(80));

  const loginData = {
    email: 'test@example.com',
    password: 'TestPass123!'
  };

  const response = await makeRequest('POST', '/auth/login', loginData);

  console.log(`POST /auth/login`);
  console.log(`Status: ${response.status}`);

  if (response.error) {
    console.log(`❌ Error: ${response.error}`);
    testResults.push({ test: 'Login', status: '❌ FAILED', reason: response.error });
    return;
  }

  if (response.status === 200) {
    authToken = response.body.token;
    userId = response.body.userId || response.body.user?.id;
    console.log(`✅ EXITOSA - Login realizado`);
    console.log(`   Token: ${authToken ? authToken.substring(0, 30) + '...' : 'N/A'}`);
    testResults.push({ test: 'Login', status: '✅ EXITOSA' });
  } else {
    console.log(`❌ Error HTTP ${response.status}`);
    console.log(`   Respuesta:`, JSON.stringify(response.body, null, 2));
    testResults.push({ test: 'Login', status: `❌ HTTP ${response.status}` });
  }
}

/**
 * Crear reserva
 */
async function testCreateReservation() {
  console.log('\n▶️  FLUJO 3: CREAR RESERVA');
  console.log('-'.repeat(80));

  const reservaData = {
    aula: 'A-101',
    descripcion: 'Reunión de proyecto',
    fecha_inicio: new Date(Date.now() + 86400000).toISOString(),
    fecha_fin: new Date(Date.now() + 90000000).toISOString(),
    estudianteId: userId || 'EST-001',
    maestroId: 'MAE-001'
  };

  const response = await makeRequest('POST', '/reservas/create', reservaData);

  console.log(`POST /reservas/create`);
  console.log(`Status: ${response.status}`);

  if (response.error) {
    console.log(`❌ Error: ${response.error}`);
    testResults.push({ test: 'Crear Reserva', status: '❌ FAILED', reason: response.error });
    return;
  }

  if (response.status === 201 || response.status === 200) {
    reservaId = response.body.id || response.body.reservaId;
    console.log(`✅ EXITOSA - Reserva creada`);
    console.log(`   Aula: ${reservaData.aula}`);
    console.log(`   Reserva ID: ${reservaId}`);
    testResults.push({ test: 'Crear Reserva', status: '✅ EXITOSA' });
  } else {
    console.log(`❌ Error HTTP ${response.status}`);
    console.log(`   Respuesta:`, JSON.stringify(response.body, null, 2));
    testResults.push({ test: 'Crear Reserva', status: `❌ HTTP ${response.status}` });
  }
}

/**
 * Confirmar / Reservar
 */
async function testConfirmReservation() {
  console.log('\n▶️  FLUJO 4: CONFIRMAR / RESERVAR');
  console.log('-'.repeat(80));

  if (!reservaId) {
    console.log(`⚠️  Sin Reserva ID (crear reserva falló)`);
    testResults.push({ test: 'Confirmar Reserva', status: '⚠️  SKIPPED' });
    return;
  }

  const confirmData = {
    observaciones: 'Reserva confirmada'
  };

  const response = await makeRequest('POST', `/reservas/${reservaId}/confirmar`, confirmData);

  console.log(`POST /reservas/${reservaId}/confirmar`);
  console.log(`Status: ${response.status}`);

  if (response.error) {
    console.log(`❌ Error: ${response.error}`);
    testResults.push({ test: 'Confirmar Reserva', status: '❌ FAILED', reason: response.error });
    return;
  }

  if (response.status === 200 || response.status === 201) {
    console.log(`✅ EXITOSA - Reserva confirmada`);
    console.log(`   Estado: ${response.body.estado || 'confirmada'}`);
    testResults.push({ test: 'Confirmar Reserva', status: '✅ EXITOSA' });
  } else {
    console.log(`❌ Error HTTP ${response.status}`);
    console.log(`   Respuesta:`, JSON.stringify(response.body, null, 2));
    testResults.push({ test: 'Confirmar Reserva', status: `❌ HTTP ${response.status}` });
  }
}

/**
 * Health check
 */
async function testHealthCheck() {
  console.log('\n▶️  VALIDACIÓN PREVIA: Health Check');
  console.log('-'.repeat(80));

  const response = await makeRequest('GET', '/health');

  console.log(`GET /health`);
  console.log(`Status: ${response.status}`);

  if (response.status === 200) {
    console.log(`✅ API Gateway respondiendo correctamente`);
    return true;
  } else {
    console.log(`❌ API Gateway no responde (Status ${response.status})`);
    console.log(`   Verifica que docker-compose esté levantado:  docker compose ps`);
    return false;
  }
}

/**
 * Ejecutar todas las pruebas
 */
async function runAllTests() {
  const healthOk = await testHealthCheck();
  
  if (!healthOk) {
    console.log('\n⚠️  API Gateway no está disponible. Levanta los servicios primero:');
    console.log('   docker compose up -d');
    process.exit(1);
  }

  await testRegister();
  await testLogin();
  await testCreateReservation();
  await testConfirmReservation();

  // Resumen
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(80));

  const passed = testResults.filter(r => r.status.includes('✅')).length;
  const failed = testResults.filter(r => r.status.includes('❌')).length;
  const skipped = testResults.filter(r => r.status.includes('⚠️')).length;
  const total = testResults.length;

  testResults.forEach(result => {
    console.log(`${result.status} - ${result.test}`);
    if (result.reason) {
      console.log(`   Razón: ${result.reason}`);
    }
  });

  console.log('\n' + '-'.repeat(80));
  console.log(`✅ Exitosas: ${passed}/${total}`);
  console.log(`❌ Fallidas: ${failed}/${total}`);
  console.log(`⚠️  Omitidas: ${skipped}/${total}`);

  if (failed === 0 && passed === total - skipped) {
    console.log('\n🎉 ¡TODOS LOS FLUJOS FUNCIONAN CORRECTAMENTE!');
    process.exit(0);
  } else if (failed > 0) {
    console.log('\n⚠️  Algunas pruebas fallaron. Verifica los endpoints y rutas.');
    console.log('\n📝 Si faltan rutas, ejecuta el workflow con --update-routes');
    process.exit(1);
  }
}

// Ejecutar
runAllTests().catch(e => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});
