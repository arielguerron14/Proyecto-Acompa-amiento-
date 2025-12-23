const ROLES = {
  ADMIN: 'admin',
  MAESTRO: 'maestro',
  ESTUDIANTE: 'estudiante',
  AUDITOR: 'auditor',
};

// Permission matrix: keep lightweight and explicit
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'create:horarios', 'read:horarios', 'update:horarios', 'delete:horarios',
    'create:reservas', 'read:reservas', 'update:reservas', 'delete:reservas',
    'read:reportes', 'create:reportes', 'delete:reportes',
    'manage:users', 'manage:roles'
  ],
  [ROLES.MAESTRO]: [
    'create:horarios', 'read:horarios', 'update:horarios',
    'read:reservas', 'read:reportes'
  ],
  [ROLES.ESTUDIANTE]: [
    'read:horarios',
    'create:reservas', 'read:reservas', 'update:reservas',
    'read:reportes'
  ],
  [ROLES.AUDITOR]: [
    'read:horarios', 'read:reservas', 'read:reportes', 'audit'
  ]
};

module.exports = { ROLES, ROLE_PERMISSIONS };
