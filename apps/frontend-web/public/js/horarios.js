// Función para cambiar de pestaña
function switchTab(moduleName) {
  // Remover clase active de todas las pestañas
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  // Agregar clase active a la pestaña seleccionada
  const selectedTab = document.querySelector(`.nav-tab[data-module="${moduleName}"]`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Ocultar todos los módulos
  document.querySelectorAll('.module').forEach(module => {
    module.classList.remove('active');
  });
  // Mostrar el módulo seleccionado
  const selectedModule = document.getElementById(moduleName);
  if (selectedModule) {
    selectedModule.classList.add('active');
  }
}
const MATERIAS_POR_SEMESTRE = {
  1: [
    { codigo: 'MAT101', nombre: 'Matemáticas I' },
    { codigo: 'FIS101', nombre: 'Física I' },
    { codigo: 'QUI101', nombre: 'Química' },
    { codigo: 'ING101', nombre: 'Introducción a la Ingeniería' },
    { codigo: 'PRO101', nombre: 'Programación I' }
  ],
  2: [
    { codigo: 'MAT102', nombre: 'Matemáticas II' },
    { codigo: 'FIS102', nombre: 'Física II' },
    { codigo: 'EST101', nombre: 'Estadística' },
    { codigo: 'PRO102', nombre: 'Programación II' },
    { codigo: 'BD101', nombre: 'Bases de Datos I' }
  ],
  3: [
    { codigo: 'MAT201', nombre: 'Matemáticas III' },
    { codigo: 'ALG101', nombre: 'Algoritmos' },
    { codigo: 'SO101', nombre: 'Sistemas Operativos' },
    { codigo: 'BD102', nombre: 'Bases de Datos II' },
    { codigo: 'RED101', nombre: 'Redes de Computadoras' }
  ],
  4: [
    { codigo: 'IA101', nombre: 'Inteligencia Artificial' },
    { codigo: 'SEG101', nombre: 'Seguridad Informática' },
    { codigo: 'WEB101', nombre: 'Desarrollo Web' },
    { codigo: 'MOV101', nombre: 'Desarrollo Móvil' },
    { codigo: 'PRO201', nombre: 'Programación Avanzada' }
  ],
  5: [
    { codigo: 'BIG101', nombre: 'Big Data' },
    { codigo: 'CLO101', nombre: 'Computación en la Nube' },
    { codigo: 'IOT101', nombre: 'Internet of Things' },
    { codigo: 'PROJ101', nombre: 'Gestión de Proyectos' },
    { codigo: 'TES101', nombre: 'Testing y Calidad' }
  ],
  6: [
    { codigo: 'ML101', nombre: 'Machine Learning' },
    { codigo: 'DEVOPS101', nombre: 'DevOps' },
    { codigo: 'BLOCK101', nombre: 'Blockchain' },
    { codigo: 'TCC101', nombre: 'Trabajo de Titulación I' }
  ],
  7: [
    { codigo: 'TCC201', nombre: 'Trabajo de Titulación II' },
    { codigo: 'EMP101', nombre: 'Emprendimiento' },
    { codigo: 'ETH101', nombre: 'Ética Profesional' }
  ],
  8: [
    { codigo: 'TCC301', nombre: 'Trabajo de Titulación III' },
    { codigo: 'PRA101', nombre: 'Prácticas Profesionales' }
  ]
};

// Constantes
const CARRERA = 'Ingeniería en Sistemas de Información';
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MODALIDADES = ['Presencial', 'Virtual', 'Híbrido'];
const HORARIO_MIN = '07:00';
const HORARIO_MAX = '20:00';

// Estado de la aplicación
let horarios = [];
let horarioEditando = null;
let currentTab = 'horarios';

// Marca global para evitar incluir el script dos veces
window.__horariosScriptLoaded = true;

// Elementos del DOM (defensivos: algunos pueden no existir según la página)
const tabButtons = document.querySelectorAll('.nav-tab') || [];
const tabContents = document.querySelectorAll('.module') || [];
const horarioForm = document.getElementById('horario-form') || null;
const _horariosTableElem = document.getElementById('horarios-table');
const horariosTable = _horariosTableElem ? _horariosTableElem.querySelector('tbody') : null;
const semestreSelect = document.getElementById('semestre') || null;
const materiaSelect = document.getElementById('materia') || null;
const horaInicioInput = document.getElementById('hora-inicio') || null;
const horaFinInput = document.getElementById('hora-fin') || null;
const duracionDisplay = document.getElementById('duracion-display') || null;
const guardarBtn = document.getElementById('guardar-horario') || null;
const cancelarBtn = document.getElementById('cancelar-horario') || null;

// Reportes (may not be present on all pages)
const totalHorasSemana = document.getElementById('total-horas-semana') || null;
const horasPorMateria = document.getElementById('horas-por-materia') || null;
const horariosPorDia = document.getElementById('horarios-por-dia') || null;
const horariosPorModalidad = document.getElementById('horarios-por-modalidad') || null;
const cuposDisponibles = document.getElementById('cupos-disponibles') || null;
const materiasDemanda = document.getElementById('materias-demanda') || null;
// Reportes controls
const btnActualizarReportes = document.getElementById('btn-actualizar-reportes') || null;
const reportesStatus = document.getElementById('reportes-status') || null;

// Inicialización (evitar inicialización doble cuando se carga desde maestro.js)
window.__horariosAppInitialized = window.__horariosAppInitialized || false;
function initAppOnce() {
  if (window.__horariosAppInitialized) return;
  window.__horariosAppInitialized = true;
  initApp();
}

document.addEventListener('DOMContentLoaded', () => {
  initAppOnce();
});

function initApp() {
  setupEventListeners();
  loadHorarios();
  loadReportes();
  updateMateriaOptions();
}

// Configurar event listeners
function setupEventListeners() {
  // Tabs
  tabButtons.forEach(btn => {
    try {
      btn.addEventListener('click', () => switchTab(btn.dataset.module));
    } catch (err) {
      // ignore attach errors
    }
  });

  // Formulario (attach only if elements exist)
  if (semestreSelect) semestreSelect.addEventListener('change', updateMateriaOptions);
  if (horaInicioInput) horaInicioInput.addEventListener('change', calcularDuracion);
  if (horaFinInput) horaFinInput.addEventListener('change', calcularDuracion);

  if (guardarBtn) guardarBtn.addEventListener('click', guardarHorario);
  if (cancelarBtn) cancelarBtn.addEventListener('click', cancelarEdicion);

  // Reportes: manual refresh button
  if (btnActualizarReportes) btnActualizarReportes.addEventListener('click', () => {
    if (reportesStatus) reportesStatus.textContent = 'Actualizando reportes...';
    loadReportes(true);
  });

  // Validación en tiempo real
  if (horarioForm) horarioForm.addEventListener('input', validarFormulario);
}

// Cargar horarios del backend
async function loadHorarios() {
  try {
    const user = await (window.authManager && window.authManager.getUserData ? window.authManager.getUserData() : Promise.resolve(null));
    if (!user || !user.userId) {
      showError('No hay sesión activa');
      return;
    }

    const maestroId = user.userId;
    const base = (window.authManager && window.authManager.baseURL) || (window.API_CONFIG && window.API_CONFIG.API_BASE) || 'http://localhost:8080';
    const url = `${String(base).replace(/\/$/, '')}/horarios/maestro/${maestroId}`;
    console.debug('[horarios.js] GET', url);
    const response = await fetch(url, {
      headers: (window.authManager && window.authManager.getAuthHeaders) ? window.authManager.getAuthHeaders() : { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    console.debug('[horarios.js] Status', response.status);

    const data = await response.json();
    if (data.success) {
      horarios = data.horarios;
      renderHorarios();
    } else {
      showError('Error al cargar horarios');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  }
}

// Cargar reportes
async function loadReportes() {
  try {
    const user = await (window.authManager && window.authManager.getUserData ? window.authManager.getUserData() : Promise.resolve(null));
    if (!user || !user.userId) {
      if (reportesStatus) reportesStatus.textContent = 'No hay sesión activa';
      return;
    }

    const maestroId = user.userId;
    const base = (window.authManager && window.authManager.baseURL) || (window.API_CONFIG && window.API_CONFIG.API_BASE) || 'http://localhost:8080';
    // Align to config: reportes-maestros list is /reportes/maestro/:id
    const url = `${String(base).replace(/\/$/, '')}/reportes/maestro/${maestroId}`;
    if (reportesStatus) reportesStatus.textContent = 'Cargando reportes...';
    console.debug('[horarios.js] GET', url);
    const response = await fetch(url, {
      headers: (window.authManager && window.authManager.getAuthHeaders) ? window.authManager.getAuthHeaders() : { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    console.debug('[horarios.js] Status', response.status);

      // Si no hay reportes para el maestro, evitar error y mostrar estado amigable
      if (response.status === 404) {
        if (reportesStatus) reportesStatus.textContent = 'Sin reportes para este maestro aún';
        return;
      }

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Error parsing reportes JSON:', e);
      if (reportesStatus) reportesStatus.textContent = 'Error: respuesta inválida del servidor';
      return;
    }

    if (data && data.success) {
      renderReportes(data.reportes);
      if (reportesStatus) reportesStatus.textContent = `Actualizado ${new Date().toLocaleTimeString()}`;
      console.log('Reportes cargados:', data.reportes);
    } else {
      console.warn('Carga de reportes falló:', data);
      if (reportesStatus) reportesStatus.textContent = `Error cargando reportes: ${data && data.reportes && data.reportes.error ? data.reportes.error : (data && data.error ? data.error : 'sin detalles')}`;
    }
  } catch (error) {
    console.error('Error cargando reportes:', error);
    if (reportesStatus) reportesStatus.textContent = `Error de conexión: ${error && error.message ? error.message : error}`;
  }
}

// Renderizar horarios en tabla
function renderHorarios() {
  if (!horariosTable) return; // nothing to render on this page

  horariosTable.innerHTML = '';

  if (horarios.length === 0) {
    horariosTable.innerHTML = '<tr><td colspan="8" class="no-data">No hay horarios registrados</td></tr>';
    return;
  }

  horarios.forEach(horario => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${horario.materia}</td>
      <td>${horario.dia}</td>
      <td>${horario.inicio} - ${horario.fin}</td>
      <td>${calcularDuracionMinutos(horario.inicio, horario.fin)} min</td>
      <td>${horario.modalidad}</td>
      <td>${horario.lugarAtencion}</td>
      <td><span class="estado ${horario.estado.toLowerCase()}">${horario.estado}</span></td>
      <td class="acciones">
        <button class="btn-editar" onclick="editarHorario('${horario._id}')">Editar</button>
        <button class="btn-eliminar" onclick="eliminarHorario('${horario._id}')">Eliminar</button>
        <button class="btn-estado" onclick="cambiarEstado('${horario._id}')">
          ${horario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    `;

    horariosTable.appendChild(row);
  });
}

// Renderizar reportes
function renderReportes(reportes) {
  if (totalHorasSemana) totalHorasSemana.textContent = (reportes.totalHorasSemana || 0).toFixed(1);

  // Horas por materia
  if (horasPorMateria) {
    horasPorMateria.innerHTML = '';
    Object.entries(reportes.horasPorMateria || {}).forEach(([materia, horas]) => {
      horasPorMateria.innerHTML += `<div>${materia}: ${horas.toFixed(1)}h</div>`;
    });
  }

  // Horarios por día
  if (horariosPorDia) {
    horariosPorDia.innerHTML = '';
    DIAS_SEMANA.forEach(dia => {
      const count = (reportes.horariosPorDia && reportes.horariosPorDia[dia]) || 0;
      horariosPorDia.innerHTML += `<div>${dia}: ${count}</div>`;
    });
  }

  // Horarios por modalidad
  if (horariosPorModalidad) {
    horariosPorModalidad.innerHTML = '';
    MODALIDADES.forEach(modalidad => {
      const count = (reportes.horariosPorModalidad && reportes.horariosPorModalidad[modalidad]) || 0;
      horariosPorModalidad.innerHTML += `<div>${modalidad}: ${count}</div>`;
    });
  }

  if (cuposDisponibles) cuposDisponibles.textContent = reportes.cuposDisponibles || 0;

  // Materias con mayor demanda
  if (materiasDemanda) {
    materiasDemanda.innerHTML = '';
    Object.entries(reportes.materiasDemanda || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([materia, cupos]) => {
        materiasDemanda.innerHTML += `<div>${materia}: ${cupos} cupos</div>`;
      });
  }
}

// Cargar y mostrar mis reservas como maestro
async function loadMisReservas() {
  try {
    const user = await (window.authManager && window.authManager.getUserData ? window.authManager.getUserData() : Promise.resolve(null));
    if (!user || !user.userId) {
      console.warn('No hay sesión activa, saltando loadMisReservas');
      return;
    }

    const maestroId = user.userId;
    const base = (window.authManager && window.authManager.baseURL) || (window.API_CONFIG && window.API_CONFIG.API_BASE) || 'http://localhost:8080';
    // Align to config: reportes-maestros list is /reportes/maestro/:id
    const url = `${String(base).replace(/\/$/, '')}/reportes/maestro/${maestroId}`;
    console.debug('[horarios.js] GET', url);
    // Obtener reporte del maestro (que contiene sus reservas)
    const response = await fetch(url, {
      headers: (window.authManager && window.authManager.getAuthHeaders) ? window.authManager.getAuthHeaders() : { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    console.debug('[horarios.js] Status', response.status);
    // 404 significa que aún no hay reportes para este maestro; manejamos silenciosamente
    if (response.status === 404) {
      console.debug('[horarios.js] No hay reportes para este maestro aún (404)');
      renderMisReservas([], user.name || 'Maestro');
      return;
    }

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Error parsing mis reservas JSON:', e);
      return;
    }

    if (data && data.horas) {
      renderMisReservas(data.horas, data.maestroName);
      console.log('Mis reservas cargadas:', data.horas);
    } else {
      console.warn('No horas found in reporte:', data);
    }
  } catch (error) {
    console.error('Error cargando mis reservas:', error);
  }
}

// Renderizar mis reservas en tabla
function renderMisReservas(horas, maestroName) {
  const tbody = document.getElementById('reservas-tbody');
  if (!tbody) return; // nothing to render on this page

  tbody.innerHTML = '';

  if (!horas || horas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #9ca3af;">📭 No hay reservas registradas aún</td></tr>';
    return;
  }

  horas.forEach(hora => {
    if (!hora.alumnos || hora.alumnos.length === 0) return; // Skip horas sin estudiantes

    hora.alumnos.forEach(alumno => {
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #e5e7eb';
      
      const estado = 'Activa'; // TODO: agregar campo estado a ReporteMaestro si es necesario
      
      row.innerHTML = `
        <td style="padding: 12px;">${maestroName || 'N/A'}</td>
        <td style="padding: 12px;">${hora.materia || 'N/A'}</td>
        <td style="padding: 12px;">${hora.dia || 'N/A'}</td>
        <td style="padding: 12px;">${hora.inicio || 'N/A'} - ${hora.fin || 'N/A'}</td>
        <td style="padding: 12px;">
          <span style="background-color: ${getModalidadColor(hora.modalidad)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">
            ${hora.modalidad || 'N/A'}
          </span>
        </td>
        <td style="padding: 12px;">${hora.lugarAtencion || 'N/A'}</td>
        <td style="padding: 12px;">
          <span style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">
            ${estado}
          </span>
        </td>
      `;

      tbody.appendChild(row);
    });
  });
}

// Helper para obtener color de modalidad
function getModalidadColor(modalidad) {
  switch(modalidad) {
    case 'Presencial': return '#3b82f6'; // blue
    case 'Virtual': return '#8b5cf6'; // purple
    case 'Híbrido': return '#f59e0b'; // amber
    default: return '#6b7280'; // gray
  }
}

// Actualizar opciones de materia según semestre
function updateMateriaOptions() {
  // Defensive: if the select elements are not present on the page, do nothing
  if (!semestreSelect || !materiaSelect) return;

  const semestre = parseInt(semestreSelect.value) || 0;
  const materias = MATERIAS_POR_SEMESTRE[semestre] || [];

  materiaSelect.innerHTML = '<option value="">Seleccione una materia</option>';
  materias.forEach(materia => {
    const option = document.createElement('option');
    option.value = materia.codigo;
    option.textContent = `${materia.codigo} - ${materia.nombre}`;
    option.dataset.nombre = materia.nombre;
    materiaSelect.appendChild(option);
  });
}

// Calcular duración automáticamente
function calcularDuracion() {
  // Defensive: ensure inputs and display exist
  if (!horaInicioInput || !horaFinInput || !duracionDisplay) {
    return 0;
  }

  const inicio = (horaInicioInput.value || '').trim();
  const fin = (horaFinInput.value || '').trim();

  if (inicio && fin) {
    const inicioMin = timeToMinutes(inicio);
    const finMin = timeToMinutes(fin);

    if (finMin > inicioMin) {
      const duracion = finMin - inicioMin;
      duracionDisplay.textContent = `${duracion} minutos`;
      return duracion;
    }
  }

  duracionDisplay.textContent = '0 minutos';
  return 0;
}

// Convertir tiempo HH:MM a minutos
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Calcular duración en minutos entre dos horas
function calcularDuracionMinutos(inicio, fin) {
  const inicioMin = timeToMinutes(inicio);
  const finMin = timeToMinutes(fin);
  return finMin > inicioMin ? finMin - inicioMin : 0;
}

// Validar formulario
function validarFormulario() {
  // Defensive getters: if elements are missing, use default empty values
  const semestre = semestreSelect ? semestreSelect.value : '';
  const materia = materiaSelect ? materiaSelect.value : '';
  const paraleloElem = document.getElementById('paralelo');
  const paralelo = paraleloElem ? paraleloElem.value : '';
  const diaElem = document.getElementById('dia');
  const dia = diaElem ? diaElem.value : '';
  const horaInicio = horaInicioInput ? horaInicioInput.value : '';
  const horaFin = horaFinInput ? horaFinInput.value : '';
  const modalidadElem = document.getElementById('modalidad');
  const modalidad = modalidadElem ? modalidadElem.value : '';
  const lugarElem = document.getElementById('lugar');
  const lugar = lugarElem ? lugarElem.value : '';
  const cupoElem = document.getElementById('cupo');
  const cupo = cupoElem ? cupoElem.value : '';

  let isValid = true;
  let errors = [];

  // Campos obligatorios
  if (!semestre) errors.push('Semestre es obligatorio');
  if (!materia) errors.push('Materia es obligatoria');
  if (!paralelo) errors.push('Paralelo es obligatorio');
  if (!dia) errors.push('Día es obligatorio');
  if (!horaInicio) errors.push('Hora inicio es obligatoria');
  if (!horaFin) errors.push('Hora fin es obligatoria');
  if (!modalidad) errors.push('Modalidad es obligatoria');
  if (!lugar) errors.push('Lugar es obligatorio');
  if (!cupo || cupo < 1) errors.push('Cupo debe ser mayor a 0');

  // Validar horas
  if (horaInicio && horaFin) {
    const inicioMin = timeToMinutes(horaInicio);
    const finMin = timeToMinutes(horaFin);

    if (inicioMin >= finMin) {
      errors.push('Hora inicio debe ser menor que hora fin');
    }

    const duracion = finMin - inicioMin;
    if (duracion < 30) {
      errors.push('Duración mínima es 30 minutos');
    }

    // Validar horario permitido
    const minTime = timeToMinutes(HORARIO_MIN);
    const maxTime = timeToMinutes(HORARIO_MAX);

    if (inicioMin < minTime || finMin > maxTime) {
      errors.push(`Horario debe estar entre ${HORARIO_MIN} y ${HORARIO_MAX}`);
    }
  }

  // Mostrar errores
  const errorDiv = document.getElementById('horario-errors');
  if (errors.length > 0) {
    errorDiv.innerHTML = errors.map(error => `<div>${error}</div>`).join('');
    errorDiv.style.display = 'block';
    guardarBtn.disabled = true;
  } else {
    errorDiv.style.display = 'none';
    guardarBtn.disabled = false;
  }

  return errors.length === 0;
}

// Guardar horario
async function guardarHorario() {
  if (!validarFormulario()) return;

  const formData = new FormData(horarioForm);
  const data = Object.fromEntries(formData);

  // Obtener datos adicionales
  const materiaOption = materiaSelect.selectedOptions[0];
  if (!materiaOption) {
    showError('Error: Materia no válida seleccionada');
    return;
  }

  const duracion = calcularDuracion();

  const user = await (window.authManager && window.authManager.getUserData ? window.authManager.getUserData() : Promise.resolve(null));
  const horarioData = {
    maestroId: user && user.userId ? user.userId : null,
    maestroName: user && user.name ? user.name : 'Profesor',
    semestre: data.semestre,
    materia: `${data.materia} - ${materiaOption.dataset.nombre}`,
    paralelo: data.paralelo || 'A',
    dia: data.dia,
    inicio: data['hora-inicio'],
    fin: data['hora-fin'],
    modalidad: data.modalidad,
    lugarAtencion: data.lugar,
    cupoMaximo: parseInt(data.cupo) || 30,
    estado: data.estado || 'Activo',
    observaciones: data.observaciones || ''
  };

  let response = null;
  try {
    const base = (window.authManager && window.authManager.baseURL) || (window.API_CONFIG && window.API_CONFIG.API_BASE) || 'http://localhost:8080';
    const url = horarioEditando ? `${String(base).replace(/\/$/, '')}/horarios/${horarioEditando}` : `${String(base).replace(/\/$/, '')}/horarios`;
    const method = horarioEditando ? 'PUT' : 'POST';

    if (guardarBtn) {
      guardarBtn.disabled = true;
      guardarBtn.textContent = horarioEditando ? 'Actualizando...' : 'Guardando...';
    }

    console.log('Enviando petición:', method, url);
    console.log('Datos (object):', horarioData);
    console.log('Datos (stringified):', JSON.stringify(horarioData));

    try {
      console.debug('[horarios.js]', method, url);
      response = await fetch(url, {
        method,
        headers: (window.authManager && window.authManager.getAuthHeaders) ? window.authManager.getAuthHeaders() : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(horarioData)
      });
      console.debug('[horarios.js] Status', response && response.status);
    } catch (error) {
      // Network error (CORS, backend caído, etc)
      console.error('NetworkError:', error);
      showError('No se pudo conectar al servidor. Verifica tu conexión o que el backend esté activo.');
      return;
    }

    let result = {};
    let isJson = false;
    if (response && response.status !== 204 && response.status !== 304) {
      try {
        result = await response.json();
        isJson = true;
      } catch (e) {
        result = {};
      }
    }

    if (response && response.ok && (result.success || method === 'POST')) {
      showSuccess(horarioEditando ? 'Horario actualizado' : 'Horario creado');
      horarioForm.reset();
      horarioEditando = null;
      loadHorarios();
      loadReportes();
    } else {
      let errorMsg = (isJson && (result.message || result.error)) || 'Error al guardar horario';
      if (response && response.status === 409) {
        errorMsg = 'Conflicto de horario: Ya existe un horario que se solapa con el horario que intentas crear. Por favor, elige una hora diferente o un día diferente.';
      }
      showError(errorMsg);
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  } finally {
    if (guardarBtn) {
      guardarBtn.disabled = false;
      guardarBtn.textContent = horarioEditando ? 'Actualizar Horario' : 'Crear Horario';
    }
  }
}

// Editar horario
function editarHorario(id) {
  const horario = horarios.find(h => h._id === id);
  if (!horario) return;

  horarioEditando = id;

  // Llenar formulario
  // Re-query defensively to avoid stale nulls
  const semestreSelectEl = document.getElementById('semestre');
  const materiaSelectEl = document.getElementById('materia');
  const diaEl = document.getElementById('dia');
  const modalidadEl = document.getElementById('modalidad');
  const lugarEl = document.getElementById('lugar');
  const cupoEl = document.getElementById('cupo');
  const estadoEl = document.getElementById('estado');
  const observacionesEl = document.getElementById('observaciones');

  // Sync globals if they were null at load time
  if (!semestreSelect && semestreSelectEl) semestreSelect = semestreSelectEl;
  if (!materiaSelect && materiaSelectEl) materiaSelect = materiaSelectEl;
  if (!horaInicioInput) horaInicioInput = document.getElementById('hora-inicio');
  if (!horaFinInput) horaFinInput = document.getElementById('hora-fin');

  // Set semestre first (ensure string matching option values)
  if (semestreSelectEl) {
    semestreSelectEl.value = String(horario.semestre || '');
  }
  // Update materia options according to semestre
  updateMateriaOptions();

  // Select materia robustly: handle "CODIGO - NOMBRE" or just nombre
  if (materiaSelectEl) {
    let selectedValue = '';
    let code = '';
    let name = '';
    if (typeof horario.materia === 'string') {
      const parts = horario.materia.split(' - ');
      if (parts.length >= 2) {
        code = parts[0].trim();
        name = parts.slice(1).join(' - ').trim();
      } else {
        // No dash: try to infer code via option dataset or text match
        name = horario.materia.trim();
      }
    }

    if (code) {
      selectedValue = code;
    } else if (name) {
      // Try to find option whose dataset.nombre equals name or text includes name
      const opts = Array.from(materiaSelectEl.options);
      const foundByData = opts.find(o => (o.dataset && o.dataset.nombre) && o.dataset.nombre === name);
      const foundByText = opts.find(o => String(o.textContent || '').includes(name));
      const found = foundByData || foundByText;
      if (found) selectedValue = found.value;
    }

    if (selectedValue) materiaSelectEl.value = selectedValue;
  }

  if (diaEl) diaEl.value = horario.dia || '';
  if (horaInicioInput) horaInicioInput.value = horario.inicio || '';
  if (horaFinInput) horaFinInput.value = horario.fin || '';
  if (modalidadEl) modalidadEl.value = horario.modalidad || '';
  if (lugarEl) lugarEl.value = horario.lugarAtencion || '';
  if (cupoEl) cupoEl.value = String(horario.cupoMaximo || '');
  if (estadoEl) estadoEl.value = horario.estado || 'Activo';
  if (observacionesEl) observacionesEl.value = horario.observaciones || '';

  calcularDuracion();
  guardarBtn.textContent = 'Actualizar Horario';

  // Cambiar a pestaña de formulario
  switchTab('horarios');
  document.getElementById('horarios').scrollIntoView();
}

// Eliminar horario
async function eliminarHorario(id) {
  if (!confirm('¿Está seguro de eliminar este horario?')) return;

  try {
    const base = (window.authManager && window.authManager.baseURL) || (window.API_CONFIG && window.API_CONFIG.API_BASE) || 'http://localhost:8080';
    const url = `${String(base).replace(/\/$/, '')}/horarios/${id}`;
    console.debug('[horarios.js] DELETE', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: (window.authManager && window.authManager.getAuthHeaders) ? window.authManager.getAuthHeaders() : { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    console.debug('[horarios.js] Status', response.status);

    const result = await response.json();

    if (response.ok && result.message === 'Horario eliminado') {
      showSuccess('Horario eliminado');
      loadHorarios();
      loadReportes();
    } else {
      showError(result.message || 'Error al eliminar horario');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  }
}

// Cambiar estado del horario
async function cambiarEstado(id) {
  const horario = horarios.find(h => h._id === id);
  if (!horario) return;

  const nuevoEstado = horario.estado === 'Activo' ? 'Inactivo' : 'Activo';

  try {
    const base = (window.authManager && window.authManager.baseURL) || (window.API_CONFIG && window.API_CONFIG.API_BASE) || 'http://localhost:8080';
    const url = `${String(base).replace(/\/$/, '')}/horarios/${id}`;
    console.debug('[horarios.js] PUT', url, 'body:', { estado: nuevoEstado });
    const response = await fetch(url, {
      method: 'PUT',
      headers: (window.authManager && window.authManager.getAuthHeaders) ? window.authManager.getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    console.debug('[horarios.js] Status', response.status);

    const result = await response.json();

    if (result.success) {
      showSuccess(`Horario ${nuevoEstado.toLowerCase()}`);
      loadHorarios();
      loadReportes();
    } else {
      showError(result.error || 'Error al cambiar estado');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  }
}

// Cancelar edición
function cancelarEdicion() {
  horarioForm.reset();
  horarioEditando = null;
  guardarBtn.textContent = 'Crear Horario';
  document.getElementById('horario-errors').style.display = 'none';
}

// Mostrar mensajes
function showSuccess(message) {
  // Implementar toast o alert de éxito
  alert('✅ ' + message);
}

function showError(message) {
  // Implementar toast o alert de error
  alert('❌ ' + message);
}