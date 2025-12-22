const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simulación de base de datos en memoria
let horarios = [];
let reservas = [];

// Crear horario
app.post('/horarios', (req, res) => {
  const { maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin } = req.body;

  // Validación básica
  if (!maestroId || !maestroName || !semestre || !materia || !paralelo || !dia || !inicio || !fin) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  // Verificar solapamiento
  const conflicto = horarios.find(h =>
    h.maestroId === maestroId &&
    h.dia === dia &&
    !(fin <= h.inicio || inicio >= h.fin)
  );

  if (conflicto) {
    return res.status(409).json({ message: 'Conflicto de horario detectado' });
  }

  const nuevoHorario = {
    _id: Date.now().toString(),
    maestroId,
    maestroName,
    semestre: parseInt(semestre),
    materia,
    paralelo,
    dia,
    inicio,
    fin,
    createdAt: new Date()
  };

  horarios.push(nuevoHorario);
  res.status(201).json(nuevoHorario);
});

// Obtener horarios por maestro
app.get('/horarios/maestro/:id', (req, res) => {
  const maestroId = req.params.id;
  const horariosMaestro = horarios.filter(h => h.maestroId === maestroId);
  res.json(horariosMaestro);
});

// Obtener todos los horarios
app.get('/horarios', (req, res) => {
  res.json(horarios);
});

// Reportes de horarios
app.get('/horarios/reportes/:maestroId', (req, res) => {
  const maestroId = req.params.maestroId;
  const horariosMaestro = horarios.filter(h => h.maestroId === maestroId);

  const reportes = {
    totalHorasSemana: horariosMaestro.reduce((sum, h) => {
      const inicio = new Date(`1970-01-01T${h.inicio}:00`);
      const fin = new Date(`1970-01-01T${h.fin}:00`);
      const horas = (fin - inicio) / (1000 * 60 * 60);
      return sum + horas;
    }, 0),
    horasPorMateria: {},
    horariosPorDia: {},
    horariosPorModalidad: {},
    cuposDisponibles: horariosMaestro.reduce((sum, h) => sum + (h.cupoMaximo || 30), 0),
    materiasDemanda: {}
  };

  horariosMaestro.forEach(h => {
    if (!reportes.horasPorMateria[h.materia]) {
      reportes.horasPorMateria[h.materia] = 0;
    }
    const inicio = new Date(`1970-01-01T${h.inicio}:00`);
    const fin = new Date(`1970-01-01T${h.fin}:00`);
    const horas = (fin - inicio) / (1000 * 60 * 60);
    reportes.horasPorMateria[h.materia] += horas;

    if (!reportes.horariosPorDia[h.dia]) {
      reportes.horariosPorDia[h.dia] = 0;
    }
    reportes.horariosPorDia[h.dia]++;
  });

  res.json(reportes);
});

// Crear reserva
app.post('/estudiantes/reservar', (req, res) => {
  const { estudianteId, estudianteName, maestroId, maestroName, dia, inicio, fin, materia } = req.body;

  if (!estudianteId || !estudianteName || !maestroId || !dia || !inicio || !fin) {
    return res.status(400).json({ message: 'Campos requeridos faltantes' });
  }

  // Verificar que el horario existe
  const horario = horarios.find(h =>
    h.maestroId === maestroId &&
    h.dia === dia &&
    h.inicio === inicio &&
    h.fin === fin
  );

  if (!horario) {
    return res.status(404).json({ message: 'Horario no encontrado' });
  }

  // Verificar que no esté ya reservado
  const yaReservado = reservas.find(r =>
    r.maestroId === maestroId &&
    r.dia === dia &&
    r.inicio === inicio
  );

  if (yaReservado) {
    return res.status(409).json({ message: 'Horario ya reservado' });
  }

  const nuevaReserva = {
    _id: Date.now().toString(),
    estudianteId,
    estudianteName,
    maestroId,
    maestroName,
    dia,
    inicio,
    fin,
    materia,
    createdAt: new Date()
  };

  reservas.push(nuevaReserva);
  res.status(201).json(nuevaReserva);
});

// Obtener reservas por estudiante
app.get('/estudiantes/reservas/estudiante/:id', (req, res) => {
  const estudianteId = req.params.id;
  const reservasEstudiante = reservas.filter(r => r.estudianteId === estudianteId);
  res.json(reservasEstudiante);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'test-api',
    horarios: horarios.length,
    reservas: reservas.length
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Test API server running on port ${PORT}`);
  console.log(`📅 Crear horario: POST http://localhost:${PORT}/horarios`);
  console.log(`📋 Listar horarios: GET http://localhost:${PORT}/horarios`);
  console.log(`🎯 Reservar: POST http://localhost:${PORT}/estudiantes/reservar`);
});