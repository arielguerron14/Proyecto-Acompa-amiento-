/**
 * Tipos de eventos estándar del sistema
 */
const EventTypes = {
  // Reservas
  RESERVA_CREADA: 'reserva.creada',
  RESERVA_ACTUALIZADA: 'reserva.actualizada',
  RESERVA_CANCELADA: 'reserva.cancelada',
  RESERVA_CONFIRMADA: 'reserva.confirmada',

  // Horarios
  HORARIO_CREADO: 'horario.creado',
  HORARIO_ACTUALIZADO: 'horario.actualizado',
  HORARIO_ELIMINADO: 'horario.eliminado',

  // Usuarios
  USUARIO_REGISTRADO: 'usuario.registrado',
  USUARIO_ACTUALIZADO: 'usuario.actualizado',
  USUARIO_ELIMINADO: 'usuario.eliminado',

  // Reportes
  REPORTE_GENERADO: 'reporte.generado',
  REPORTE_EXPORTADO: 'reporte.exportado',

  // Notificaciones
  NOTIFICACION_ENVIADA: 'notificacion.enviada',
  NOTIFICACION_FALLIDA: 'notificacion.fallida',

  // Autenticación
  LOGIN_EXITOSO: 'login.exitoso',
  LOGIN_FALLIDO: 'login.fallido',
  TOKEN_REFRESCADO: 'token.refrescado',

  // Errores
  ERROR_GENERAL: 'error.general',
  ERROR_VALIDACION: 'error.validacion',
  ERROR_AUTENTICACION: 'error.autenticacion',
};

/**
 * Tipos de tareas para colas de mensajes
 */
const TaskTypes = {
  ENVIAR_EMAIL: 'task.enviar-email',
  ENVIAR_SMS: 'task.enviar-sms',
  GENERAR_REPORTE: 'task.generar-reporte',
  PROCESAR_IMAGEN: 'task.procesar-imagen',
  LIMPIAR_DATOS: 'task.limpiar-datos',
  BACKUP: 'task.backup',
};

/**
 * Estados de procesamiento
 */
const ProcessingStatus = {
  PENDIENTE: 'pendiente',
  PROCESANDO: 'procesando',
  COMPLETADO: 'completado',
  FALLIDO: 'fallido',
  RETRASADO: 'retrasado',
};

/**
 * Niveles de severidad
 */
const SeverityLevels = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Crea un evento estándar
 */
function createEvent(type, data, source) {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    source: source || 'unknown',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Crea una tarea estándar
 */
function createTask(type, payload, priority = 'normal') {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    priority, // 'low', 'normal', 'high'
    status: ProcessingStatus.PENDIENTE,
    attempts: 0,
    maxAttempts: 3,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Crea una métrica de telemetría
 */
function createMetric(name, value, unit = '', tags = {}) {
  return {
    name,
    value,
    unit,
    tags,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  EventTypes,
  TaskTypes,
  ProcessingStatus,
  SeverityLevels,
  createEvent,
  createTask,
  createMetric,
};
