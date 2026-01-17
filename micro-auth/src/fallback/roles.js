// Fallback roles and constants
const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.TEACHER]: ['read:students', 'write:grades', 'read:grades'],
  [ROLES.STUDENT]: ['read:own_profile'],
  [ROLES.PARENT]: ['read:child_profile']
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS
};
