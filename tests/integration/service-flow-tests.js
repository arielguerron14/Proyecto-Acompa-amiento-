/**
 * Suite de Tests de Flujos - Proyecto Acompañamiento
 * Valida todos los microservicios y flujos de negocio
 * 
 * Rutas de prueba:
 * 1. Health Checks - Validar disponibilidad de todos los servicios
 * 2. Auth Flow - Login, token generation, RBAC
 * 3. Student Management - CRUD operations
 * 4. Teacher Management - CRUD operations
 * 5. Notifications - Send & receive
 * 6. Reports Generation - Create & query reports
 * 7. Analytics - Data aggregation
 * 8. Integration Tests - End-to-end workflows
 */

const axios = require('axios');
const assert = require('assert');

// Configuración de instancias
const INSTANCES = {
  'core': '3.236.99.88',
  'api-gateway': '98.86.94.92',
  'messaging': '35.172.111.207',
  'db': '13.217.220.8',
  'notifications': '98.92.17.165',
  'monitoring': '54.205.158.101',
  'frontend': '52.72.57.10',
  'reportes': '3.236.99.88', // En CORE
  'analytics': '3.236.99.88'  // En CORE
};

// Puertos de servicios
const PORTS = {
  'api-gateway': 8080,
  'auth': 5005,
  'estudiantes': 5002,
  'maestros': 5001,
  'notificaciones': 5006,
  'reportes-estudiantes': 5003,
  'reportes-maestros': 5004,
  'analytics': 5007,
  'monitoring': 5009
};

// Variables globales para test
let authToken = null;
let studentId = null;
let teacherId = null;
let reportId = null;

/**
 * UTILIDADES
 */

class TestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async run(testName, testFn) {
    try {
      console.log(`\n🧪 Ejecutando: ${testName}`);
      await testFn();
      this.passed++;
      this.results.push({ name: testName, status: '✅ PASS' });
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      this.failed++;
      this.results.push({ name: testName, status: `❌ FAILED: ${error.message}` });
      console.error(`❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(80));
    this.results.forEach(r => console.log(`${r.status} - ${r.name}`));
    console.log(`\n✅ Pasadas: ${this.passed}`);
    console.log(`❌ Fallidas: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    console.log(`🎯 Tasa de éxito: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(80) + '\n');
  }
}

const runner = new TestRunner();

/**
 * HEALTH CHECKS - Validar disponibilidad de servicios
 */

async function healthCheck(service, ip, port, path = '/health') {
  const url = `http://${ip}:${port}${path}`;
  try {
    const response = await axios.get(url, { timeout: 5000 });
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    return true;
  } catch (error) {
    throw new Error(`${service} no responde en ${url}: ${error.message}`);
  }
}

async function testHealthChecks() {
  const services = [
    { name: 'API Gateway', ip: INSTANCES['api-gateway'], port: PORTS['api-gateway'] },
    { name: 'Auth Service', ip: INSTANCES['core'], port: PORTS['auth'] },
    { name: 'Estudiantes', ip: INSTANCES['core'], port: PORTS['estudiantes'] },
    { name: 'Maestros', ip: INSTANCES['core'], port: PORTS['maestros'] },
    { name: 'Notificaciones', ip: INSTANCES['notifications'], port: PORTS['notificaciones'] },
    { name: 'Reportes Estudiantes', ip: INSTANCES['core'], port: PORTS['reportes-estudiantes'] },
    { name: 'Reportes Maestros', ip: INSTANCES['core'], port: PORTS['reportes-maestros'] },
    { name: 'Analytics', ip: INSTANCES['core'], port: PORTS['analytics'] }
  ];

  for (const service of services) {
    await runner.run(`Health Check: ${service.name}`, async () => {
      await healthCheck(service.name, service.ip, service.port);
    });
  }
}

/**
 * AUTH FLOW - Login y generación de tokens
 */

async function testAuthLogin() {
  await runner.run('Auth: Login como Maestro', async () => {
    const response = await axios.post(
      `http://${INSTANCES['core']}:${PORTS['auth']}/login`,
      {
        email: 'maestro@test.com',
        password: 'Test@123'
      },
      { timeout: 5000 }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.token, 'No token en respuesta');
    authToken = response.data.token;
  });
}

async function testAuthTokenValidation() {
  await runner.run('Auth: Validar token JWT', async () => {
    assert(authToken, 'No hay token para validar');
    
    const response = await axios.post(
      `http://${INSTANCES['core']}:${PORTS['auth']}/validate`,
      { token: authToken },
      { timeout: 5000 }
    );

    assert(response.status === 200, 'Token inválido');
    assert(response.data.valid === true, 'Token no válido');
  });
}

async function testAuthRBAC() {
  await runner.run('Auth: RBAC - Acceso basado en roles', async () => {
    const response = await axios.get(
      `http://${INSTANCES['core']}:${PORTS['auth']}/roles`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200, 'No se obtuvieron roles');
    assert(Array.isArray(response.data.roles), 'Roles no es array');
  });
}

/**
 * STUDENT MANAGEMENT - CRUD Operations
 */

async function testCreateStudent() {
  await runner.run('Estudiantes: CREATE - Crear nuevo estudiante', async () => {
    const response = await axios.post(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/estudiantes`,
      {
        nombre: 'Juan Pérez',
        apellido: 'García',
        email: 'juan.perez@test.com',
        grado: '10A',
        estado: 'activo'
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 201 || response.status === 200, `Expected 201/200, got ${response.status}`);
    assert(response.data.id || response.data._id, 'No se retornó ID del estudiante');
    studentId = response.data.id || response.data._id;
  });
}

async function testReadStudent() {
  await runner.run('Estudiantes: READ - Obtener estudiante', async () => {
    assert(studentId, 'No hay studentId para consultar');
    
    const response = await axios.get(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/estudiantes/${studentId}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.nombre, 'No tiene nombre el estudiante');
  });
}

async function testUpdateStudent() {
  await runner.run('Estudiantes: UPDATE - Actualizar estudiante', async () => {
    assert(studentId, 'No hay studentId para actualizar');
    
    const response = await axios.put(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/estudiantes/${studentId}`,
      { grado: '10B', estado: 'activo' },
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
  });
}

async function testDeleteStudent() {
  await runner.run('Estudiantes: DELETE - Eliminar estudiante', async () => {
    assert(studentId, 'No hay studentId para eliminar');
    
    const response = await axios.delete(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/estudiantes/${studentId}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200 || response.status === 204, `Expected 200/204, got ${response.status}`);
  });
}

/**
 * TEACHER MANAGEMENT - CRUD Operations
 */

async function testCreateTeacher() {
  await runner.run('Maestros: CREATE - Crear nuevo maestro', async () => {
    const response = await axios.post(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/maestros`,
      {
        nombre: 'Carlos López',
        apellido: 'Martínez',
        email: 'carlos.lopez@test.com',
        asignatura: 'Matemáticas',
        estado: 'activo'
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 201 || response.status === 200, `Expected 201/200, got ${response.status}`);
    assert(response.data.id || response.data._id, 'No se retornó ID del maestro');
    teacherId = response.data.id || response.data._id;
  });
}

async function testReadTeacher() {
  await runner.run('Maestros: READ - Obtener maestro', async () => {
    assert(teacherId, 'No hay teacherId para consultar');
    
    const response = await axios.get(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/maestros/${teacherId}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.nombre, 'No tiene nombre el maestro');
  });
}

/**
 * NOTIFICATIONS - Send & Receive
 */

async function testSendNotification() {
  await runner.run('Notificaciones: Enviar notificación', async () => {
    const response = await axios.post(
      `http://${INSTANCES['notifications']}:${PORTS['notificaciones']}/api/notificaciones`,
      {
        destinatario: 'test@example.com',
        asunto: 'Test Notification',
        mensaje: 'Este es un mensaje de prueba',
        tipo: 'email'
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200 || response.status === 201, `Expected 200/201, got ${response.status}`);
    assert(response.data.id || response.data.notificationId, 'No se retornó ID de notificación');
  });
}

async function testGetNotifications() {
  await runner.run('Notificaciones: Obtener notificaciones', async () => {
    const response = await axios.get(
      `http://${INSTANCES['notifications']}:${PORTS['notificaciones']}/api/notificaciones`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(Array.isArray(response.data) || Array.isArray(response.data.notificaciones), 'No es array de notificaciones');
  });
}

/**
 * REPORTS - Generation & Query
 */

async function testGenerateReport() {
  await runner.run('Reportes: Generar reporte de estudiante', async () => {
    const response = await axios.post(
      `http://${INSTANCES['core']}:${PORTS['reportes-estudiantes']}/api/reportes`,
      {
        studentId: 'test-student-001',
        periodo: '2024-Q1',
        tipo: 'desempeño'
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200 || response.status === 201, `Expected 200/201, got ${response.status}`);
    assert(response.data.id || response.data.reportId, 'No se retornó ID de reporte');
    reportId = response.data.id || response.data.reportId;
  });
}

async function testQueryReport() {
  await runner.run('Reportes: Consultar reporte generado', async () => {
    assert(reportId, 'No hay reportId para consultar');
    
    const response = await axios.get(
      `http://${INSTANCES['core']}:${PORTS['reportes-estudiantes']}/api/reportes/${reportId}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data, 'No se retornó datos del reporte');
  });
}

/**
 * ANALYTICS - Data Aggregation
 */

async function testAnalyticsAggregation() {
  await runner.run('Analytics: Agregar datos de desempeño', async () => {
    const response = await axios.post(
      `http://${INSTANCES['core']}:${PORTS['analytics']}/api/analytics/aggregate`,
      {
        tipo: 'desempeño_estudiantes',
        periodo: '2024-Q1',
        filtros: { grado: '10A' }
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.resultado, 'No hay resultado de agregación');
  });
}

async function testAnalyticsDashboard() {
  await runner.run('Analytics: Obtener dashboard de métricas', async () => {
    const response = await axios.get(
      `http://${INSTANCES['core']}:${PORTS['analytics']}/api/analytics/dashboard`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 5000
      }
    );

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.metricas, 'No hay métricas en dashboard');
  });
}

/**
 * INTEGRATION TESTS - End-to-end workflows
 */

async function testCompleteStudentWorkflow() {
  await runner.run('Integration: Flujo completo de estudiante (CREATE→READ→UPDATE→DELETE)', async () => {
    // CREATE
    const createRes = await axios.post(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/estudiantes`,
      {
        nombre: 'Integration Test',
        apellido: 'Student',
        email: 'integration@test.com',
        grado: '11A'
      },
      { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 5000 }
    );
    assert(createRes.status === 200 || createRes.status === 201);
    const testStudentId = createRes.data.id || createRes.data._id;

    // READ
    const readRes = await axios.get(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/estudiantes/${testStudentId}`,
      { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 5000 }
    );
    assert(readRes.status === 200);

    // UPDATE
    const updateRes = await axios.put(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/estudiantes/${testStudentId}`,
      { grado: '11B' },
      { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 5000 }
    );
    assert(updateRes.status === 200);

    // DELETE
    const deleteRes = await axios.delete(
      `http://${INSTANCES['api-gateway']}:${PORTS['api-gateway']}/api/estudiantes/${testStudentId}`,
      { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 5000 }
    );
    assert(deleteRes.status === 200 || deleteRes.status === 204);
  });
}

async function testCompleteReportingWorkflow() {
  await runner.run('Integration: Flujo completo de reportes (Generar→Consultar→Exportar)', async () => {
    // GENERATE
    const genRes = await axios.post(
      `http://${INSTANCES['core']}:${PORTS['reportes-estudiantes']}/api/reportes`,
      { studentId: 'integration-001', tipo: 'desempeño' },
      { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 5000 }
    );
    assert(genRes.status === 200 || genRes.status === 201);
    const testReportId = genRes.data.id || genRes.data.reportId;

    // QUERY
    const queryRes = await axios.get(
      `http://${INSTANCES['core']}:${PORTS['reportes-estudiantes']}/api/reportes/${testReportId}`,
      { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 5000 }
    );
    assert(queryRes.status === 200);

    // EXPORT
    const exportRes = await axios.get(
      `http://${INSTANCES['core']}:${PORTS['reportes-estudiantes']}/api/reportes/${testReportId}/export?format=pdf`,
      { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 5000 }
    );
    assert(exportRes.status === 200 || exportRes.status === 201);
  });
}

/**
 * MAIN TEST EXECUTION
 */

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 INICIANDO SUITE DE PRUEBAS DE MICROSERVICIOS');
  console.log('='.repeat(80));

  // 1. Health Checks
  console.log('\n📋 FASE 1: Health Checks');
  await testHealthChecks();

  // 2. Authentication
  console.log('\n📋 FASE 2: Autenticación');
  await testAuthLogin();
  await testAuthTokenValidation();
  await testAuthRBAC();

  // 3. Student Management
  console.log('\n📋 FASE 3: Gestión de Estudiantes');
  await testCreateStudent();
  await testReadStudent();
  await testUpdateStudent();
  await testDeleteStudent();

  // 4. Teacher Management
  console.log('\n📋 FASE 4: Gestión de Maestros');
  await testCreateTeacher();
  await testReadTeacher();

  // 5. Notifications
  console.log('\n📋 FASE 5: Notificaciones');
  await testSendNotification();
  await testGetNotifications();

  // 6. Reports
  console.log('\n📋 FASE 6: Reportes');
  await testGenerateReport();
  await testQueryReport();

  // 7. Analytics
  console.log('\n📋 FASE 7: Analytics');
  await testAnalyticsAggregation();
  await testAnalyticsDashboard();

  // 8. Integration Tests
  console.log('\n📋 FASE 8: Tests de Integración');
  await testCompleteStudentWorkflow();
  await testCompleteReportingWorkflow();

  // Print Summary
  runner.printSummary();
}

// Ejecutar
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n❌ Error fatal en suite de pruebas:', error);
    process.exit(1);
  });
}

module.exports = { runner, runAllTests };
