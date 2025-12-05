/**
 * Tests de integración para auth endpoints
 * Usa Supertest para simular requests HTTP a los endpoints de autenticación
 * Tests: /auth/verify-token, /auth/validate-permission, /auth/roles, /auth/roles/:roleId/permissions
 */

const request = require('supertest');
const app = require('../src/app');
const AuthService = require('../../../shared-auth/src/services/authService');
const { ROLE_PERMISSIONS } = require('../../../shared-auth/src/constants/roles');

describe('Auth Routes - Integration Tests', () => {
  let validAccessToken;
  let validRefreshToken;
  let invalidToken = 'invalid.token.here';

  beforeAll(() => {
    // Generar tokens válidos para usar en los tests
    const tokenPair = AuthService.generateTokenPair('test-user-1', 'maestro', 'maestro@test.com');
    validAccessToken = tokenPair.accessToken;
    validRefreshToken = tokenPair.refreshToken;
  });

  // ==================== TEST: HEALTH CHECK ====================

  describe('GET /health', () => {
    test('debe retornar estado healthy', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'micro-auth');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('el timestamp debe ser válido', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp instanceof Date).toBe(true);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  // ==================== TEST: VERIFY TOKEN ====================

  describe('POST /auth/verify-token', () => {
    test('debe verificar un token válido', async () => {
      const response = await request(app)
        .post('/auth/verify-token')
        .send({ token: validAccessToken })
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('userId', 'test-user-1');
      expect(response.body.payload).toHaveProperty('role', 'maestro');
      expect(response.body.payload).toHaveProperty('email', 'maestro@test.com');
    });

    test('debe retornar error para token inválido', async () => {
      const response = await request(app)
        .post('/auth/verify-token')
        .send({ token: invalidToken })
        .expect(401);

      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    test('debe retornar error para token faltante', async () => {
      const response = await request(app)
        .post('/auth/verify-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Token required');
    });

    test('debe retornar error para payload vacío', async () => {
      const response = await request(app)
        .post('/auth/verify-token')
        .send(null)
        .expect(400);
    });

    test('debe manejar tokens expirados', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'test-user', role: 'maestro' },
        process.env.JWT_SECRET || 'dev-jwt-secret',
        { expiresIn: '-1s' }
      );

      const response = await request(app)
        .post('/auth/verify-token')
        .send({ token: expiredToken })
        .expect(401);

      expect(response.body.valid).toBe(false);
    });

    test('debe retornar error para token con formato incorrecto', async () => {
      const response = await request(app)
        .post('/auth/verify-token')
        .send({ token: 'not-a-jwt-token' })
        .expect(401);

      expect(response.body.valid).toBe(false);
    });
  });

  // ==================== TEST: VALIDATE PERMISSION ====================

  describe('POST /auth/validate-permission', () => {
    test('debe validar un permiso válido para maestro', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId: 'test-user-1',
          role: 'maestro',
          requiredPermission: 'read',
        })
        .expect(200);

      expect(response.body).toHaveProperty('userId', 'test-user-1');
      expect(response.body).toHaveProperty('role', 'maestro');
      expect(response.body).toHaveProperty('requiredPermission', 'read');
      expect(response.body).toHaveProperty('hasPermission', true);
    });

    test('debe retornar false para permiso que no tiene el rol', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId: 'test-user-1',
          role: 'estudiante',
          requiredPermission: 'delete',
        })
        .expect(200);

      expect(response.body.hasPermission).toBe(false);
    });

    test('debe permitir permiso "read" para estudiante', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId: 'test-user-1',
          role: 'estudiante',
          requiredPermission: 'read',
        })
        .expect(200);

      expect(response.body.hasPermission).toBe(true);
    });

    test('debe retornar error sin token de autorización', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .send({
          userId: 'test-user-1',
          role: 'maestro',
          requiredPermission: 'read',
        })
        .expect(401);
    });

    test('debe retornar error sin role en body', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId: 'test-user-1',
          requiredPermission: 'read',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Role and requiredPermission required');
    });

    test('debe retornar error sin requiredPermission en body', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId: 'test-user-1',
          role: 'maestro',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Role and requiredPermission required');
    });

    test('debe validar todos los roles: admin', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId: 'test-user-1',
          role: 'admin',
          requiredPermission: 'manage',
        })
        .expect(200);

      expect(response.body.hasPermission).toBe(true);
    });

    test('debe validar todos los roles: auditor', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId: 'test-user-1',
          role: 'auditor',
          requiredPermission: 'audit',
        })
        .expect(200);

      expect(response.body.hasPermission).toBe(true);
    });

    test('debe retornar false para rol desconocido', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId: 'test-user-1',
          role: 'unknown-role',
          requiredPermission: 'read',
        })
        .expect(200);

      expect(response.body.hasPermission).toBe(false);
    });

    test('debe rechazar token inválido', async () => {
      const response = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({
          userId: 'test-user-1',
          role: 'maestro',
          requiredPermission: 'read',
        })
        .expect(401);
    });
  });

  // ==================== TEST: GET ROLES ====================

  describe('GET /auth/roles', () => {
    test('debe retornar lista de roles disponibles', async () => {
      const response = await request(app)
        .get('/auth/roles')
        .expect(200);

      expect(response.body).toHaveProperty('roles');
      expect(Array.isArray(response.body.roles)).toBe(true);
      expect(response.body.roles.length).toBeGreaterThan(0);
    });

    test('debe incluir todos los roles esperados', async () => {
      const response = await request(app)
        .get('/auth/roles')
        .expect(200);

      const expectedRoles = ['admin', 'maestro', 'estudiante', 'auditor'];
      expectedRoles.forEach((role) => {
        expect(response.body.roles).toContain(role);
      });
    });

    test('debe retornar al menos 4 roles', async () => {
      const response = await request(app)
        .get('/auth/roles')
        .expect(200);

      expect(response.body.roles.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ==================== TEST: GET ROLE PERMISSIONS ====================

  describe('GET /auth/roles/:roleId/permissions', () => {
    test('debe retornar permisos para rol maestro', async () => {
      const response = await request(app)
        .get('/auth/roles/maestro/permissions')
        .expect(200);

      expect(response.body).toHaveProperty('role', 'maestro');
      expect(response.body).toHaveProperty('permissions');
      expect(Array.isArray(response.body.permissions)).toBe(true);
      expect(response.body.permissions.length).toBeGreaterThan(0);
    });

    test('debe retornar permisos para rol estudiante', async () => {
      const response = await request(app)
        .get('/auth/roles/estudiante/permissions')
        .expect(200);

      expect(response.body.role).toBe('estudiante');
      expect(Array.isArray(response.body.permissions)).toBe(true);
    });

    test('debe retornar permisos para rol admin', async () => {
      const response = await request(app)
        .get('/auth/roles/admin/permissions')
        .expect(200);

      expect(response.body.role).toBe('admin');
      // Admin debe tener más permisos que otros roles
      expect(response.body.permissions.length).toBeGreaterThan(0);
    });

    test('debe retornar permisos para rol auditor', async () => {
      const response = await request(app)
        .get('/auth/roles/auditor/permissions')
        .expect(200);

      expect(response.body.role).toBe('auditor');
      expect(response.body.permissions).toContain('audit');
    });

    test('debe retornar 404 para rol desconocido', async () => {
      const response = await request(app)
        .get('/auth/roles/unknown-role/permissions')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    test('debe retornar 404 con mensaje correcto para rol inexistente', async () => {
      const response = await request(app)
        .get('/auth/roles/fake-role/permissions')
        .expect(404);

      expect(response.body.error).toContain('fake-role');
      expect(response.body.error).toContain('not found');
    });

    test('debe ser case-sensitive en nombre de rol', async () => {
      // Intentar con uppercase
      const response = await request(app)
        .get('/auth/roles/MAESTRO/permissions')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  // ==================== TEST: 404 - NOT FOUND ====================

  describe('Rutas no existentes', () => {
    test('debe retornar 404 para ruta desconocida', async () => {
      const response = await request(app)
        .get('/auth/unknown-endpoint')
        .expect(404);
    });

    test('debe retornar 404 para POST a ruta desconocida', async () => {
      const response = await request(app)
        .post('/auth/fake-endpoint')
        .send({})
        .expect(404);
    });
  });

  // ==================== TEST: INTEGRACIÓN COMPLETA ====================

  describe('Flujo completo de autenticación e integración', () => {
    test('debe hacer flujo: verify token -> validate permission -> get roles', async () => {
      // 1. Verificar token válido
      const verifyResponse = await request(app)
        .post('/auth/verify-token')
        .send({ token: validAccessToken })
        .expect(200);

      expect(verifyResponse.body.valid).toBe(true);
      const userId = verifyResponse.body.payload.userId;

      // 2. Validar permiso con token autenticado
      const permResponse = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          userId,
          role: 'maestro',
          requiredPermission: 'read',
        })
        .expect(200);

      expect(permResponse.body.hasPermission).toBe(true);

      // 3. Obtener lista de roles
      const rolesResponse = await request(app)
        .get('/auth/roles')
        .expect(200);

      expect(rolesResponse.body.roles.length).toBeGreaterThan(0);

      // 4. Obtener permisos del rol maestro
      const permissionsResponse = await request(app)
        .get('/auth/roles/maestro/permissions')
        .expect(200);

      expect(permissionsResponse.body.permissions).toContain('read');
    });

    test('debe rechazar token inválido en validate-permission', async () => {
      // 1. Intentar verificar token inválido
      const verifyResponse = await request(app)
        .post('/auth/verify-token')
        .send({ token: invalidToken })
        .expect(401);

      expect(verifyResponse.body.valid).toBe(false);

      // 2. Intentar usar token inválido en validate-permission
      const permResponse = await request(app)
        .post('/auth/validate-permission')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({
          userId: 'test-user',
          role: 'maestro',
          requiredPermission: 'read',
        })
        .expect(401);
    });
  });

  // ==================== TEST: CONTENT-TYPE Y HEADERS ====================

  describe('Headers y Content-Type', () => {
    test('todas las respuestas deben tener Content-Type application/json', async () => {
      const endpoints = [
        { method: 'get', path: '/auth/roles' },
        { method: 'get', path: '/health' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.type).toMatch(/json/);
      }
    });

    test('debe aceptar Content-Type application/json', async () => {
      const response = await request(app)
        .post('/auth/verify-token')
        .set('Content-Type', 'application/json')
        .send({ token: validAccessToken })
        .expect(200);

      expect(response.body.valid).toBe(true);
    });
  });
});
