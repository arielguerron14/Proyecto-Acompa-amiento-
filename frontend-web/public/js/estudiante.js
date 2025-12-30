// estudiante.js - Sistema de navegación por módulos del Panel de Estudiante

// Función principal para mostrar módulos
function showModule(moduleId) {
  // Ocultar todos los módulos
  document.querySelectorAll('.student-module')
    .forEach(m => m.classList.remove('active'));

  // Desmarcar todos los botones
  document.querySelectorAll('.menu-button')
    .forEach(b => b.classList.remove('active'));

  // Mostrar el módulo seleccionado
  document.getElementById(moduleId).classList.add('active');

  // Marcar el botón activo
  document.querySelector(`[data-module="${moduleId}"]`)
    .classList.add('active');
}

// Funciones de carga de datos
function cargarReservas() {
  if (!window.reservasManager) {
    window.reservasManager = new ReservasManager();
  }
  reservasManager.init();
}

function cargarHorariosDisponibles() {
  if (!window.reservarManager) {
    window.reservarManager = new ReservarManager();
  }
  reservarManager.init();
}

function cargarReportes() {
  if (!window.reportesManager) {
    window.reportesManager = new ReportesManager();
  }
  reportesManager.init();
}

function cargarNotificaciones() {
  if (!window.notificacionesManager) {
    window.notificacionesManager = new NotificacionesManager();
  }
  notificacionesManager.init();
}

// Configurar eventos de navegación
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar dashboard
  if (!window.dashboardManager) {
    window.dashboardManager = new DashboardManager();
  }
  dashboardManager.init();

  // Asignar eventos a los botones del menú
  document.querySelectorAll('[data-module]').forEach(btn => {
    btn.addEventListener('click', () => {
      const moduleId = btn.dataset.module;
      showModule(moduleId);

      // Cargar datos del módulo solo cuando se abre
      if (moduleId === 'mod-reservas') cargarReservas();
      if (moduleId === 'mod-reservar') cargarHorariosDisponibles();
      if (moduleId === 'mod-reportes') cargarReportes();
      if (moduleId === 'mod-notificaciones') cargarNotificaciones();
    });
  });

  // Mostrar automáticamente "Mis Reservas" al iniciar
  showModule('mod-reservas');
  cargarReservas();
});