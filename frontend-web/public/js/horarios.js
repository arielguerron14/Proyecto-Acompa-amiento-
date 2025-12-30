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

// Elementos del DOM
const tabButtons = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.module');
const horarioForm = document.getElementById('horario-form');
const horariosTable = document.getElementById('horarios-table').querySelector('tbody');
const semestreSelect = document.getElementById('semestre');
const materiaSelect = document.getElementById('materia');
const horaInicioInput = document.getElementById('hora-inicio');
const horaFinInput = document.getElementById('hora-fin');
const duracionDisplay = document.getElementById('duracion-display');
const guardarBtn = document.getElementById('guardar-horario');
const cancelarBtn = document.getElementById('cancelar-horario');

// Reportes
const totalHorasSemana = document.getElementById('total-horas-semana');
const horasPorMateria = document.getElementById('horas-por-materia');
const horariosPorDia = document.getElementById('horarios-por-dia');
const horariosPorModalidad = document.getElementById('horarios-por-modalidad');
const cuposDisponibles = document.getElementById('cupos-disponibles');
const materiasDemanda = document.getElementById('materias-demanda');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initApp();
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
    btn.addEventListener('click', () => switchTab(btn.dataset.module));
  });

  // Formulario
  semestreSelect.addEventListener('change', updateMateriaOptions);
  horaInicioInput.addEventListener('change', calcularDuracion);
  horaFinInput.addEventListener('change', calcularDuracion);

  guardarBtn.addEventListener('click', guardarHorario);
  cancelarBtn.addEventListener('click', cancelarEdicion);

  // Validación en tiempo real
  horarioForm.addEventListener('input', validarFormulario);
}

// Cambiar pestaña
function switchTab(tabName) {
  currentTab = tabName;

  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));

  document.querySelector(`[data-module="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');
}

// Cargar horarios del backend
async function loadHorarios() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showError('No hay sesión activa');
      return;
    }

    // Decodificar token para obtener maestroId (simplificado)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const maestroId = payload.userId;

    const apiBase = window.API_CONFIG ? window.API_CONFIG.API_BASE : 'http://localhost:8080';
    const response = await fetch(`${apiBase}/horarios/maestro/${maestroId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

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
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const maestroId = payload.userId;

    const apiBase = window.API_CONFIG ? window.API_CONFIG.API_BASE : 'http://localhost:8080';
    const response = await fetch(`${apiBase}/horarios/reportes/${maestroId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (data.success) {
      renderReportes(data.reportes);
    }
  } catch (error) {
    console.error('Error cargando reportes:', error);
  }
}

// Renderizar horarios en tabla
function renderHorarios() {
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
  totalHorasSemana.textContent = reportes.totalHorasSemana.toFixed(1);

  // Horas por materia
  horasPorMateria.innerHTML = '';
  Object.entries(reportes.horasPorMateria).forEach(([materia, horas]) => {
    horasPorMateria.innerHTML += `<div>${materia}: ${horas.toFixed(1)}h</div>`;
  });

  // Horarios por día
  horariosPorDia.innerHTML = '';
  DIAS_SEMANA.forEach(dia => {
    const count = reportes.horariosPorDia[dia] || 0;
    horariosPorDia.innerHTML += `<div>${dia}: ${count}</div>`;
  });

  // Horarios por modalidad
  horariosPorModalidad.innerHTML = '';
  MODALIDADES.forEach(modalidad => {
    const count = reportes.horariosPorModalidad[modalidad] || 0;
    horariosPorModalidad.innerHTML += `<div>${modalidad}: ${count}</div>`;
  });

  cuposDisponibles.textContent = reportes.cuposDisponibles;

  // Materias con mayor demanda
  materiasDemanda.innerHTML = '';
  Object.entries(reportes.materiasDemanda)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([materia, cupos]) => {
      materiasDemanda.innerHTML += `<div>${materia}: ${cupos} cupos</div>`;
    });
}

// Actualizar opciones de materia según semestre
function updateMateriaOptions() {
  const semestre = parseInt(semestreSelect.value);
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
  const inicio = horaInicioInput.value;
  const fin = horaFinInput.value;

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
  const semestre = semestreSelect.value;
  const materia = materiaSelect.value;
  const paralelo = document.getElementById('paralelo').value;
  const dia = document.getElementById('dia').value;
  const horaInicio = horaInicioInput.value;
  const horaFin = horaFinInput.value;
  const modalidad = document.getElementById('modalidad').value;
  const lugar = document.getElementById('lugar').value;
  const cupo = document.getElementById('cupo').value;

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

  const horarioData = {
    maestroId: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId,
    maestroName: 'Profesor',
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

  try {
    const token = localStorage.getItem('token');
    const apiBase = window.API_CONFIG ? window.API_CONFIG.API_BASE : 'http://localhost:8080';
    const url = horarioEditando ? `${apiBase}/horarios/${horarioEditando}` : `${apiBase}/horarios`;
    const method = horarioEditando ? 'PUT' : 'POST';

    console.log('Enviando petición:', method, url);
    console.log('Datos:', horarioData);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(horarioData)
    });

    console.log('Respuesta recibida:', response.status, response.statusText);

    const result = await response.json();

    if (response.ok && (result.success || method === 'POST')) {
      showSuccess(horarioEditando ? 'Horario actualizado' : 'Horario creado');
      horarioForm.reset();
      horarioEditando = null;
      guardarBtn.textContent = 'Crear Horario';
      loadHorarios();
      loadReportes();
    } else {
      let errorMsg = result.message || result.error || 'Error al guardar horario';
      
      // Mensaje específico para conflicto de horarios
      if (response.status === 409) {
        errorMsg = 'Conflicto de horario: Ya existe un horario que se solapa con el horario que intentas crear. Por favor, elige una hora diferente o un día diferente.';
      }
      
      showError(errorMsg);
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  }
}

// Editar horario
function editarHorario(id) {
  const horario = horarios.find(h => h._id === id);
  if (!horario) return;

  horarioEditando = id;

  // Llenar formulario
  semestreSelect.value = horario.semestre;
  updateMateriaOptions();
  // Para materia, necesitamos extraer el código del string "CODIGO - NOMBRE"
  const materiaMatch = horario.materia.match(/^([A-Z0-9]+) - /);
  if (materiaMatch) {
    materiaSelect.value = materiaMatch[1];
  }
  document.getElementById('dia').value = horario.dia;
  horaInicioInput.value = horario.inicio;
  horaFinInput.value = horario.fin;
  document.getElementById('modalidad').value = horario.modalidad;
  document.getElementById('lugar').value = horario.lugarAtencion;
  document.getElementById('cupo').value = horario.cupoMaximo;
  document.getElementById('estado').value = horario.estado;
  document.getElementById('observaciones').value = horario.observaciones;

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
    const token = localStorage.getItem('token');
    const apiBase = window.API_CONFIG ? window.API_CONFIG.API_BASE : 'http://localhost:8080';
    const response = await fetch(`${apiBase}/horarios/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

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
    const token = localStorage.getItem('token');
    const apiBase = window.API_CONFIG ? window.API_CONFIG.API_BASE : 'http://localhost:8080';
    const response = await fetch(`${apiBase}/horarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

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