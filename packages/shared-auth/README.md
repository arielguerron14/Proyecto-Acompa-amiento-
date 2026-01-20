# Shared Authentication Module

Centralized JWT + RBAC implementation for all microservices.

## Features
- ✅ JWT access token generation & verification (15m expiry)
- ✅ Refresh token rotation (7d expiry)
- ✅ Role-based access control (4 roles: admin, maestro, estudiante, auditor)
- ✅ Fine-grained permission matrix
- ✅ 5 composable middleware functions for flexible endpoint protection

## Usage

```javascript
// Centralized import (barrel export from shared-auth)
const {
  AuthService,
  authenticateToken,
  requirePermission,
  requireRole,
  optionalAuth,
  ROLES,
  ROLE_PERMISSIONS
} = require('@proyecto/shared-auth');

// Or import specific modules
const AuthService = require('./src/services/authService');
const { authenticateToken, requirePermission } = require('./src/middlewares/authMiddleware');
const { ROLES } = require('./src/constants/roles');
```

## Architecture Benefits

- **DRY (Don't Repeat Yourself)**: Single source of truth for auth logic, roles, and permissions
- **SOLID Principles**:
  - **S**ingle Responsibility: Each module (service, middleware, constants) has one clear purpose
  - **O**pen/Closed: Easy to extend permissions without modifying existing code
  - **L**iskov Substitution: All microservices use identical interface
  - **I**nterface Segregation: Consumers only import what they need
  - **D**ependency Inversion: Services depend on shared module, not vice versa
- **Low Coupling**: Microservices only depend on shared-auth, reducing interdependencies
- **High Cohesion**: All auth-related logic grouped in one module with clear boundaries
- **KISS (Keep It Simple, Stupid)**: Straightforward API, no unnecessary complexity
