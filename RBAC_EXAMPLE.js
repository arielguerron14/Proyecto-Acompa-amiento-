/**
 * Ejemplo de integración de RBAC en rutas
 * 
 * Importar los middlewares:
 * const { authenticateToken, requirePermission, requireRole, optionalAuth } = require('../middlewares/authMiddleware');
 * 
 * Uso en rutas:
 * 
 * 1. Requerir autenticación (JWT)
 *    router.get('/datos-protegidos', authenticateToken, (req, res) => {
 *      // req.user contiene { userId, role, email, iat, exp }
 *      res.json({ user: req.user });
 *    });
 * 
 * 2. Requerir permiso específico (RBAC)
 *    router.post('/horarios', 
 *      authenticateToken, 
 *      requirePermission('create:horarios'),
 *      (req, res) => {
 *        // Solo usuarios con permiso 'create:horarios' pueden acceder
 *        res.json({ message: 'Horario creado' });
 *      }
 *    );
 * 
 * 3. Requerir uno de varios permisos
 *    router.delete('/reservas/:id',
 *      authenticateToken,
 *      requireAnyPermission('delete:reservas', 'manage:roles'),
 *      (req, res) => {
 *        // Acceso si el usuario tiene 'delete:reservas' OR 'manage:roles'
 *        res.json({ message: 'Reserva eliminada' });
 *      }
 *    );
 * 
 * 4. Requerir un rol específico
 *    router.get('/admin-panel',
 *      authenticateToken,
 *      requireRole('admin'),
 *      (req, res) => {
 *        // Solo admins pueden acceder
 *        res.json({ message: 'Panel administrativo' });
 *      }
 *    );
 * 
 * 5. Múltiples roles
 *    router.put('/reportes/:id',
 *      authenticateToken,
 *      requireRole('admin', 'maestro'),
 *      (req, res) => {
 *        // Solo admins o maestros pueden acceder
 *        res.json({ message: 'Reporte actualizado' });
 *      }
 *    );
 * 
 * 6. Autenticación opcional (para públicos y autenticados)
 *    router.get('/horarios',
 *      optionalAuth,
 *      (req, res) => {
 *        // Si hay token válido, req.user estará disponible
 *        // Si no hay token, req.user será undefined
 *        if (req.user) {
 *          res.json({ horarios: [...], user: req.user });
 *        } else {
 *          res.json({ horarios: [...], user: null });
 *        }
 *      }
 *    );
 */

// ============================================
// MATRIZ DE PERMISOS POR ROL
// ============================================

const ROLES = {
  ADMIN: 'admin',
  MAESTRO: 'maestro',
  ESTUDIANTE: 'estudiante',
  AUDITOR: 'auditor',
};

const ROLE_PERMISSIONS = {
  admin: [
    // Horarios
    'create:horarios',
    'read:horarios',
    'update:horarios',
    'delete:horarios',
    // Reservas
    'create:reservas',
    'read:reservas',
    'update:reservas',
    'delete:reservas',
    // Reportes
    'read:reportes',
    'create:reportes',
    'delete:reportes',
    // Gestión de sistema
    'manage:users',
    'manage:roles',
  ],
  maestro: [
    'create:horarios',
    'read:horarios',
    'update:horarios',
    'read:reservas',
    'read:reportes',
  ],
  estudiante: [
    'read:horarios',
    'create:reservas',
    'read:reservas',
    'update:reservas',
    'read:reportes',
  ],
  auditor: [
    'read:horarios',
    'read:reservas',
    'read:reportes',
  ],
};

// ============================================
// EJEMPLOS DE RUTAS PROTEGIDAS
// ============================================

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission, requireRole, optionalAuth } = require('../middlewares/authMiddleware');

// === Horarios ===

// Leer horarios (públicamente, pero más datos si autenticado)
router.get('/horarios', optionalAuth, (req, res) => {
  const horarios = [
    { id: 1, maestro: 'Juan', dia: 'Lunes', inicio: '08:00', fin: '10:00' },
    { id: 2, maestro: 'María', dia: 'Martes', inicio: '10:00', fin: '12:00' },
  ];

  if (req.user) {
    res.json({ horarios, authenticated: true, user: req.user });
  } else {
    res.json({ horarios, authenticated: false });
  }
});

// Crear horario (requerida autenticación + permiso)
router.post('/horarios', authenticateToken, requirePermission('create:horarios'), (req, res) => {
  res.json({ success: true, message: 'Horario creado', user: req.user.email });
});

// Actualizar horario (requerida autenticación + permiso)
router.put('/horarios/:id', authenticateToken, requirePermission('update:horarios'), (req, res) => {
  res.json({ success: true, message: 'Horario actualizado', user: req.user.email });
});

// Eliminar horario (solo admin)
router.delete('/horarios/:id', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Horario eliminado', user: req.user.email });
});

// === Reservas ===

// Leer reservas (autenticación requerida)
router.get('/reservas', authenticateToken, (req, res) => {
  const reservas = [{ id: 1, estudiante: 'Carlos', maestro: 'Juan', dia: 'Lunes' }];
  res.json({ reservas, user: req.user });
});

// Crear reserva (autenticación + permiso)
router.post('/reservas', authenticateToken, requirePermission('create:reservas'), (req, res) => {
  res.json({ success: true, message: 'Reserva creada', user: req.user.email });
});

// === Reportes ===

// Leer reportes (autenticación + permiso)
router.get('/reportes', authenticateToken, requirePermission('read:reportes'), (req, res) => {
  const reportes = [{ id: 1, titulo: 'Reporte semanal', fecha: '2025-12-01' }];
  res.json({ reportes, user: req.user });
});

// === Gestión de sistema (solo admin) ===

// Panel de administración
router.get('/admin', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({ message: 'Bienvenido al panel administrativo', user: req.user.email });
});

module.exports = router;
