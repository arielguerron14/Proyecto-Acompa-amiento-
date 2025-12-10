const path = require('path');

module.exports = {
  // Usa Node.js como ambiente de test (no jsdom)
  testEnvironment: 'node',

  // Directorio donde Jest busca archivos de test
  testMatch: ['**/__tests__/**/*.test.js'],

  // Mapeo de módulos para resolver rutas relativas
  moduleNameMapper: {
    '^../../../shared-auth/(.*)$': path.resolve(__dirname, '../shared-auth/$1'),
  },

  // Configuración de resolución de módulos
  modulePaths: [path.resolve(__dirname, '..')],

  // Archivos a excluir de cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/**/index.js',
  ],

  // Patrones a ignorar en cobertura
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Umbral mínimo de cobertura
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Timeout por defecto para tests (10 segundos)
  testTimeout: 10000,

  // Reporters (salida de tests)
  reporters: ['default', 'summary'],

  // No usar cache (útil durante desarrollo)
  cache: true,

  // Verbose output
  verbose: true,

  // Módulos a limpiar entre tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
