// Single entry point for shared-auth module (barrel export)
// Reduces coupling by exposing unified API to all consumers

module.exports = {
  // Services
  AuthService: require('./src/services/authService'),

  // Middleware & decorators
  ...require('./src/middlewares/authMiddleware'),

  // Constants
  ROLES: require('./src/constants/roles').ROLES,
  ROLE_PERMISSIONS: require('./src/constants/roles').ROLE_PERMISSIONS,
};
