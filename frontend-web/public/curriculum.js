const CURRICULUM_DATA = [
  {
    semester: 'Primer Semestre',
    page: 'p. 1',
    courses: [
      'Fundamentos de Matemática',
      'Análisis I',
      'Programación I',
      'Fundamentos de Sistemas de Información',
      'Física Aplicada'
    ]
  },
  {
    semester: 'Segundo Semestre',
    page: 'p. 1',
    courses: [
      'Comunicación y Lenguaje',
      'Programación II',
      'Análisis II',
      'Nuevas Tecnologías e Innovación en Sistemas de Información',
      'Matemáticas Discretas',
      'Álgebra Lineal'
    ]
  },
  {
    semester: 'Tercer Semestre',
    page: 'p. 2',
    courses: [
      'Estructura de Datos',
      'Arquitectura de Computadores',
      'Introducción a la Investigación Científica',
      'Interfaces de Usuario',
      'Probabilidades y Estadística',
      'Ecuaciones Diferenciales'
    ]
  },
  {
    semester: 'Cuarto Semestre',
    page: 'p. 2',
    courses: [
      'Liderazgo',
      'Algoritmos',
      'Sistemas Operativos I',
      'Infraestructura de TI - I',
      'Métodos Numéricos',
      'Almacenaje de Datos y de la Información'
    ]
  },
  {
    semester: 'Quinto Semestre',
    page: 'p. 2',
    courses: [
      'Marcos de Desarrollo I',
      'Sistemas Operativos II',
      'Infraestructura de TI - II',
      'Gestión de Datos y de la Información',
      'Análisis y Diseño de Sistemas'
    ]
  },
  {
    semester: 'Sexto Semestre',
    page: 'p. 3',
    courses: [
      'Marcos de Desarrollo II',
      'Análisis de Datos',
      'Seguridad y Gestión de Riesgo en las TI',
      'Desarrollo de Sistemas de Información',
      'Contabilidad Financiera',
      'Vinculación con la Colectividad I'
    ]
  },
  {
    semester: 'Séptimo Semestre',
    page: 'p. 3',
    courses: [
      'Programación Web',
      'Arquitectura de Software',
      'Sociedad de la Información',
      'Inteligencia de Negocios',
      'Fundamentos de Economía',
      'Investigación Aplicada',
      'Vinculación con la Colectividad II'
    ]
  },
  {
    semester: 'Octavo Semestre',
    page: 'pp. 3-4',
    courses: [
      'Programación Distribuida',
      'Minería de Datos',
      'Control de Calidad del Software',
      'Auditoría de TI',
      'Investigación Operativa',
      'Prácticas Pre Profesionales I'
    ]
  },
  {
    semester: 'Noveno Semestre',
    page: 'p. 4',
    courses: [
      'Prácticas Pre Profesionales II',
      'Modelos de Investigación de Operaciones',
      'Gestión en Procesos de Negocios (BPM)',
      'Gestión de Proyectos en Sistemas de Información',
      'Legislación Informática',
      'Titulación I'
    ]
  },
  {
    semester: 'Décimo Semestre',
    page: 'p. 4',
    courses: [
      'Prácticas Pre Profesionales III',
      'Sistemas de Información Empresarial',
      'Formación de Empresas de Base Tecnológica',
      'Programación para Dispositivos Móviles',
      'Estrategia, Gestión y Adquisición en los Sistemas de Información',
      'Titulación II'
    ]
  }
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

function initPlanner({ semesterSelectId, subjectSelectId, tableBodyId, summaryId, buttonId }) {
  const semesterSelect = document.getElementById(semesterSelectId);
  const subjectSelect = document.getElementById(subjectSelectId);
  const tableBody = document.getElementById(tableBodyId);
  const summary = document.getElementById(summaryId);
  const button = document.getElementById(buttonId);

  if (!semesterSelect || !subjectSelect || !tableBody || !summary || !button) {
    return;
  }

  const radioGroupName = `${tableBodyId}-day`;

  CURRICULUM_DATA.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${item.semester} (${item.page})`;
    semesterSelect.appendChild(option);
  });

  function populateSubjects(index = 0) {
    subjectSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona una materia';
    placeholder.disabled = true;
    placeholder.selected = true;
    subjectSelect.appendChild(placeholder);

    const semester = CURRICULUM_DATA[index];
    if (!semester) {
      subjectSelect.disabled = true;
      return;
    }

    semester.courses.forEach(course => {
      const option = document.createElement('option');
      option.value = course;
      option.textContent = course;
      subjectSelect.appendChild(option);
    });
    subjectSelect.disabled = false;
  }

  function buildTable() {
    tableBody.innerHTML = '';
    DAYS_OF_WEEK.forEach((day, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.day = day.label;

      const dayCell = document.createElement('td');
      dayCell.textContent = day.label;

      const startCell = document.createElement('td');
      const startInput = document.createElement('input');
      startInput.type = 'time';
      startInput.dataset.role = 'start';
      startInput.id = `${tableBodyId}-start-${idx}`;
      startCell.appendChild(startInput);

      const endCell = document.createElement('td');
      const endInput = document.createElement('input');
      endInput.type = 'time';
      endInput.dataset.role = 'end';
      endInput.id = `${tableBodyId}-end-${idx}`;
      endCell.appendChild(endInput);

      const selectCell = document.createElement('td');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = radioGroupName;
      radio.value = day.key;
      radio.ariaLabel = `Elegir ${day.label}`;
      selectCell.appendChild(radio);

      tr.appendChild(dayCell);
      tr.appendChild(startCell);
      tr.appendChild(endCell);
      tr.appendChild(selectCell);
      tableBody.appendChild(tr);
    });
  }

  function updateSummary(message) {
    summary.textContent = message;
  }

  button.addEventListener('click', () => {
    const semesterIndex = Number(semesterSelect.value || 0);
    const semesterLabel = CURRICULUM_DATA[semesterIndex]?.semester || 'Semestre sin definir';
    const subject = subjectSelect.value;

    if (!subject) {
      updateSummary('Selecciona una materia para registrar un horario.');
      return;
    }

    const selectedRadio = tableBody.querySelector(`input[name="${radioGroupName}"]:checked`);
    if (!selectedRadio) {
      updateSummary('Selecciona un día en la tabla para continuar.');
      return;
    }

    const row = selectedRadio.closest('tr');
    const dayLabel = row?.dataset.day || 'Día sin definir';
    const startInput = row?.querySelector('input[data-role="start"]');
    const endInput = row?.querySelector('input[data-role="end"]');

    const startValue = startInput?.value || '--:--';
    const endValue = endInput?.value || '--:--';

    updateSummary(`Asignaste ${subject} (${semesterLabel}) el ${dayLabel} de ${startValue} a ${endValue}.`);
  });

  semesterSelect.addEventListener('change', event => {
    populateSubjects(Number(event.target.value));
  });

  semesterSelect.value = '0';
  populateSubjects(0);
  buildTable();
}

function setupSemesterCourseSelect({ semesterSelectId, courseSelectId, onCourseChange }) {
  const semesterSelect = document.getElementById(semesterSelectId);
  const courseSelect = document.getElementById(courseSelectId);
  if (!semesterSelect || !courseSelect) return null;

  const getSemesterContext = () => {
    const value = semesterSelect.value;
    const index = value === '' ? -1 : Number(value);
    const semesterLabel = index >= 0 ? (CURRICULUM_DATA[index]?.semester || '') : '';
    return { index, semesterLabel };
  };

  const emitSelection = () => {
    if (typeof onCourseChange !== 'function') return;
    const { index, semesterLabel } = getSemesterContext();
    const courseValue = courseSelect.value || '';
    onCourseChange({
      semesterIndex: index,
      semester: semesterLabel,
      course: courseValue,
      hasSelection: Boolean(semesterLabel && courseValue)
    });
  };

  const buildCoursePlaceholder = () => {
    courseSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona una materia';
    placeholder.disabled = true;
    placeholder.selected = true;
    courseSelect.appendChild(placeholder);
    courseSelect.disabled = true;
    emitSelection();
  };

  semesterSelect.innerHTML = '';
  const semesterPlaceholder = document.createElement('option');
  semesterPlaceholder.value = '';
  semesterPlaceholder.textContent = 'Selecciona un semestre';
  semesterPlaceholder.disabled = true;
  semesterPlaceholder.selected = true;
  semesterSelect.appendChild(semesterPlaceholder);

  CURRICULUM_DATA.forEach((entry, idx) => {
    const option = document.createElement('option');
    option.value = String(idx);
    option.textContent = entry.semester;
    semesterSelect.appendChild(option);
  });

  const updateCourses = (index) => {
    const semester = CURRICULUM_DATA[index];
    if (!semester) {
      buildCoursePlaceholder();
      return;
    }
    courseSelect.disabled = false;
    courseSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona una materia';
    placeholder.disabled = true;
    placeholder.selected = true;
    courseSelect.appendChild(placeholder);

    semester.courses.forEach(course => {
      const option = document.createElement('option');
      option.value = course;
      option.textContent = course;
      courseSelect.appendChild(option);
    });
    emitSelection();
  };

  semesterSelect.addEventListener('change', event => {
    updateCourses(Number(event.target.value));
  });

  courseSelect.addEventListener('change', () => {
    emitSelection();
  });

  buildCoursePlaceholder();

  return () => {
    semesterSelect.selectedIndex = 0;
    buildCoursePlaceholder();
  };
}

