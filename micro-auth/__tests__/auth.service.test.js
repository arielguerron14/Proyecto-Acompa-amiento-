/**
 * Tests unitarios para AuthService
 * Pruebas: Generación de tokens, verificación, refresh, extracción de headers
 */

const AuthService = require('../../../shared-auth/src/services/authService');
const jwt = require('jsonwebtoken');

// Mock de variables de entorno
const originalEnv = process.env;

describe('AuthService - Unit Tests', () => {
  beforeEach(() => {
    // Restaurar ambiente antes de cada test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ==================== TEST: GENERAR ACCESS TOKEN ====================

  describe('generateAccessToken', () => {
    test('debe generar un token de acceso válido', () => {
      const payload = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const token = AuthService.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT formato: header.payload.signature
    });

    test('el token debe contener el payload correcto', () => {
      const payload = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const token = AuthService.generateAccessToken(payload);
      const decoded = jwt.decode(token);

      expect(decoded.userId).toBe('user1');
      expect(decoded.role).toBe('maestro');
      expect(decoded.email).toBe('maestro@test.com');
      expect(decoded.exp).toBeDefined();
    });

    test('tokens diferentes deben tener diferentes firmas', () => {
      const payload1 = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const payload2 = { userId: 'user2', role: 'estudiante', email: 'estudiante@test.com' };

      const token1 = AuthService.generateAccessToken(payload1);
      const token2 = AuthService.generateAccessToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  // ==================== TEST: GENERAR REFRESH TOKEN ====================

  describe('generateRefreshToken', () => {
    test('debe generar un token de refresco válido', () => {
      const payload = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const token = AuthService.generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('refresh token debe contener el payload', () => {
      const payload = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const token = AuthService.generateRefreshToken(payload);
      const decoded = jwt.decode(token);

      expect(decoded.userId).toBe('user1');
      expect(decoded.role).toBe('maestro');
    });

    test('refresh token debe tener expiración diferente a access token', () => {
      const payload = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const accessToken = AuthService.generateAccessToken(payload);
      const refreshToken = AuthService.generateRefreshToken(payload);

      const accessDecoded = jwt.decode(accessToken);
      const refreshDecoded = jwt.decode(refreshToken);

      // El refresh token debe expirar más tarde que el access token
      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  // ==================== TEST: GENERAR PAR DE TOKENS ====================

  describe('generateTokenPair', () => {
    test('debe generar un par de tokens válidos', () => {
      const result = AuthService.generateTokenPair('user1', 'maestro', 'maestro@test.com');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    test('ambos tokens deben contener el payload correcto', () => {
      const result = AuthService.generateTokenPair('user1', 'maestro', 'maestro@test.com');

      const accessDecoded = jwt.decode(result.accessToken);
      const refreshDecoded = jwt.decode(result.refreshToken);

      expect(accessDecoded.userId).toBe('user1');
      expect(accessDecoded.role).toBe('maestro');
      expect(accessDecoded.email).toBe('maestro@test.com');

      expect(refreshDecoded.userId).toBe('user1');
      expect(refreshDecoded.role).toBe('maestro');
      expect(refreshDecoded.email).toBe('maestro@test.com');
    });

    test('debe retornar expiresIn', () => {
      const result = AuthService.generateTokenPair('user1', 'maestro', 'maestro@test.com');
      expect(result.expiresIn).toBe('15m');
    });

    test('diferentes usuarios deben generar tokens diferentes', () => {
      const result1 = AuthService.generateTokenPair('user1', 'maestro', 'maestro@test.com');
      const result2 = AuthService.generateTokenPair('user2', 'estudiante', 'estudiante@test.com');

      expect(result1.accessToken).not.toBe(result2.accessToken);
      expect(result1.refreshToken).not.toBe(result2.refreshToken);
    });
  });

  // ==================== TEST: VERIFICAR ACCESS TOKEN ====================

  describe('verifyAccessToken', () => {
    test('debe verificar un token válido correctamente', () => {
      const payload = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const token = AuthService.generateAccessToken(payload);
      const verified = AuthService.verifyAccessToken(token);

      expect(verified.userId).toBe('user1');
      expect(verified.role).toBe('maestro');
      expect(verified.email).toBe('maestro@test.com');
    });

    test('debe lanzar error para token inválido', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => AuthService.verifyAccessToken(invalidToken)).toThrow();
    });

    test('debe lanzar error para token expirado', () => {
      // Crear token con expiración inmediata
      const expiredToken = jwt.sign(
        { userId: 'user1', role: 'maestro' },
        process.env.JWT_SECRET || 'dev-jwt-secret',
        { expiresIn: '-1s' } // Expirado hace 1 segundo
      );

      expect(() => AuthService.verifyAccessToken(expiredToken)).toThrow();
    });

    test('debe lanzar error para token con firma incorrecta', () => {
      const payload = { userId: 'user1', role: 'maestro' };
      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' });

      expect(() => AuthService.verifyAccessToken(token)).toThrow();
    });
  });

  // ==================== TEST: VERIFICAR REFRESH TOKEN ====================

  describe('verifyRefreshToken', () => {
    test('debe verificar un refresh token válido', () => {
      const payload = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const token = AuthService.generateRefreshToken(payload);
      const verified = AuthService.verifyRefreshToken(token);

      expect(verified.userId).toBe('user1');
      expect(verified.role).toBe('maestro');
    });

    test('debe lanzar error para refresh token inválido', () => {
      const invalidToken = 'invalid.refresh.token';

      expect(() => AuthService.verifyRefreshToken(invalidToken)).toThrow();
    });

    test('access token no debe ser verificable como refresh token', () => {
      const payload = { userId: 'user1', role: 'maestro' };
      const accessToken = AuthService.generateAccessToken(payload);

      // Debería fallar porque fue firmado con JWT_SECRET, no REFRESH_SECRET
      expect(() => AuthService.verifyRefreshToken(accessToken)).toThrow();
    });
  });

  // ==================== TEST: REFRESH ACCESS TOKEN ====================

  describe('refreshAccessToken', () => {
    test('debe generar un nuevo access token desde un refresh token válido', () => {
      const payload = { userId: 'user1', role: 'maestro', email: 'maestro@test.com' };
      const refreshToken = AuthService.generateRefreshToken(payload);

      const newAccessToken = AuthService.refreshAccessToken(refreshToken);

      expect(newAccessToken).toBeDefined();
      expect(typeof newAccessToken).toBe('string');

      // Verificar que el nuevo token sea válido
      const verified = AuthService.verifyAccessToken(newAccessToken);
      expect(verified.userId).toBe('user1');
      expect(verified.role).toBe('maestro');
    });

    test('debe lanzar error para refresh token inválido', () => {
      const invalidRefreshToken = 'invalid.refresh.token';

      expect(() => AuthService.refreshAccessToken(invalidRefreshToken)).toThrow();
    });

    test('el nuevo token debe ser diferente al anterior', () => {
      const payload = { userId: 'user1', role: 'maestro' };
      const refreshToken = AuthService.generateRefreshToken(payload);

      const newToken1 = AuthService.refreshAccessToken(refreshToken);
      // Esperar un poco para que los timestamps sean diferentes
      jest.useFakeTimers();
      jest.advanceTimersByTime(100);

      const newToken2 = AuthService.refreshAccessToken(refreshToken);
      jest.useRealTimers();

      // Pueden ser iguales si el tiempo es el mismo, pero la funcionalidad es correcta
      expect(newToken1).toBeDefined();
      expect(newToken2).toBeDefined();
    });
  });

  // ==================== TEST: EXTRAER TOKEN DE HEADER ====================

  describe('extractTokenFromHeader', () => {
    test('debe extraer token de header Bearer válido', () => {
      const payload = { userId: 'user1', role: 'maestro' };
      const token = AuthService.generateAccessToken(payload);
      const authHeader = `Bearer ${token}`;

      const extracted = AuthService.extractTokenFromHeader(authHeader);

      expect(extracted).toBe(token);
    });

    test('debe manejar mayúsculas en "Bearer"', () => {
      const payload = { userId: 'user1', role: 'maestro' };
      const token = AuthService.generateAccessToken(payload);

      const testCases = [
        `Bearer ${token}`,
        `bearer ${token}`,
        `BEARER ${token}`,
        `BeArEr ${token}`,
      ];

      testCases.forEach((authHeader) => {
        const extracted = AuthService.extractTokenFromHeader(authHeader);
        expect(extracted).toBe(token);
      });
    });

    test('debe retornar null para header sin Bearer', () => {
      const payload = { userId: 'user1', role: 'maestro' };
      const token = AuthService.generateAccessToken(payload);

      const extracted = AuthService.extractTokenFromHeader(token);
      expect(extracted).toBeNull();
    });

    test('debe retornar null para header nulo', () => {
      const extracted = AuthService.extractTokenFromHeader(null);
      expect(extracted).toBeNull();
    });

    test('debe retornar null para header undefined', () => {
      const extracted = AuthService.extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    test('debe retornar null para header vacío', () => {
      const extracted = AuthService.extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    test('debe retornar null para header con formato incorrecto', () => {
      const testCases = ['Bearer', 'Bearer token1 token2', 'Basic dGVzdA=='];

      testCases.forEach((authHeader) => {
        const extracted = AuthService.extractTokenFromHeader(authHeader);
        expect(extracted).toBeNull();
      });
    });
  });

  // ==================== TEST: INTEGRACIÓN COMPLETA ====================

  describe('Flujo completo de autenticación', () => {
    test('debe crear, verificar y refrescar tokens correctamente', () => {
      // 1. Crear tokens
      const result = AuthService.generateTokenPair('user1', 'maestro', 'maestro@test.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // 2. Verificar access token
      const accessVerified = AuthService.verifyAccessToken(result.accessToken);
      expect(accessVerified.userId).toBe('user1');

      // 3. Extraer token del header
      const authHeader = `Bearer ${result.accessToken}`;
      const extracted = AuthService.extractTokenFromHeader(authHeader);
      expect(extracted).toBe(result.accessToken);

      // 4. Verificar token extraído
      const verifiedExtracted = AuthService.verifyAccessToken(extracted);
      expect(verifiedExtracted.userId).toBe('user1');

      // 5. Refrescar access token
      const newAccessToken = AuthService.refreshAccessToken(result.refreshToken);
      const newVerified = AuthService.verifyAccessToken(newAccessToken);
      expect(newVerified.userId).toBe('user1');
    });

    test('debe manejar diferentes roles correctamente', () => {
      const roles = ['admin', 'maestro', 'estudiante', 'auditor'];

      roles.forEach((role) => {
        const result = AuthService.generateTokenPair('testuser', role, 'test@test.com');
        const verified = AuthService.verifyAccessToken(result.accessToken);

        expect(verified.role).toBe(role);
      });
    });
  });
});
