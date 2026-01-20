// Single entry point for shared-auth module (barrel export)
// Reduces coupling by exposing unified API to all consumers

module.exports = {
  // Services
  AuthService: require('./services/authService'),

  // Middleware & decorators
  ...require('./middlewares/authMiddleware'),

  // Constants
  ROLES: require('./constants/roles').ROLES,
  ROLE_PERMISSIONS: require('./constants/roles').ROLE_PERMISSIONS,
};
