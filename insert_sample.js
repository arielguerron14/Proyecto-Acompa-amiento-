use maestrosdb;
db.horarios.insertMany([
  {
    maestroId: 1,
    maestroName: 'Prof. García',
    semestre: '1',
    materia: 'MAT101',
    paralelo: 'A',
    dia: 'Lunes',
    inicio: '08:00',
    fin: '10:00',
    modalidad: 'Presencial',
    lugarAtencion: 'Aula 101',
    cupoMaximo: 25,
    estado: 'Activo',
    observaciones: 'Clase regular'
  },
  {
    maestroId: 1,
    maestroName: 'Prof. García',
    semestre: '1',
    materia: 'FIS101',
    paralelo: 'B',
    dia: 'Martes',
    inicio: '10:00',
    fin: '12:00',
    modalidad: 'Virtual',
    lugarAtencion: 'Zoom Room A',
    cupoMaximo: 30,
    estado: 'Activo',
    observaciones: 'Laboratorio virtual'
  },
  {
    maestroId: 2,
    maestroName: 'Prof. López',
    semestre: '2',
    materia: 'MAT102',
    paralelo: 'A',
    dia: 'Miércoles',
    inicio: '14:00',
    fin: '16:00',
    modalidad: 'Híbrida',
    lugarAtencion: 'Aula 201 / Teams',
    cupoMaximo: 20,
    estado: 'Activo',
    observaciones: 'Sesión híbrida'
  },
  {
    maestroId: 2,
    maestroName: 'Prof. López',
    semestre: '2',
    materia: 'QUI101',
    paralelo: 'B',
    dia: 'Jueves',
    inicio: '16:00',
    fin: '18:00',
    modalidad: 'Presencial',
    lugarAtencion: 'Laboratorio Q1',
    cupoMaximo: 15,
    estado: 'Inactivo',
    observaciones: 'Laboratorio de química'
  }
]);