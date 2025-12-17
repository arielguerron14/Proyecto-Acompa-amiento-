const express = require('express');
const cors = require('cors');

console.log('🚀 Starting API Gateway server...');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// APLICAR SEGURIDAD Y CORS PRIMERO (antes que cualquier ruta)
const maestros = process.env.MAESTROS_URL || 'http://micro-maestros:5001';
const estudiantes = process.env.ESTUDIANTES_URL || 'http://micro-estudiantes:5002';
const reportesEst = process.env.REPORTES_EST_URL || 'http://micro-reportes-estudiantes:5003';
const reportesMaest = process.env.REPORTES_MAEST_URL || 'http://micro-reportes-maestros:5004';
const frontend = process.env.FRONTEND_URL || 'http://frontend-web:5500';

// applySecurity(app, { whitelist: [frontend] });

// app.use(requestLogger);

// Rutas de autenticación (públicas)
app.use('/auth', authRoutes);

app.use('/maestros', createProxyMiddleware({ target: maestros, changeOrigin: true, pathRewrite: {'^/maestros': ''} }));
app.use('/estudiantes', createProxyMiddleware({ target: estudiantes, changeOrigin: true, pathRewrite: {'^/estudiantes': ''} }));
app.use('/reportes/estudiantes', createProxyMiddleware({ target: reportesEst, changeOrigin: true, pathRewrite: {'^/reportes/estudiantes': ''} }));
app.use('/reportes/maestros', createProxyMiddleware({ target: reportesMaest, changeOrigin: true, pathRewrite: {'^/reportes/maestros': ''} }));

// proxy frontend by default (but only for specific paths, not /)
// Commented out to avoid conflicts with auth routes
// app.use('/', createProxyMiddleware({ target: frontend, changeOrigin: true }));

// Gestión de Horarios de Atención
let horariosAtencion = [
  {
    id: '1',
    maestroId: 'maestro1',
    maestroName: 'Prof. García',
    carrera: 'Ingeniería',
    semestre: 1,
    materiaCodigo: 'MAT101',
    materiaNombre: 'Matemáticas Básicas',
    dia: 'Lunes',
    horaInicio: '08:00',
    horaFin: '10:00',
    duracionMinutos: 120,
    modalidad: 'Presencial',
    lugarAtencion: 'Sala 101',
    cupoMaximo: 20,
    estado: 'Activo',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'maestro1'
  },
  {
    id: '2',
    maestroId: 'maestro2',
    maestroName: 'Prof. López',
    carrera: 'Ingeniería',
    semestre: 2,
    materiaCodigo: 'FIS201',
    materiaNombre: 'Física General',
    dia: 'Martes',
    horaInicio: '10:00',
    horaFin: '12:00',
    duracionMinutos: 120,
    modalidad: 'Virtual',
    lugarAtencion: 'Zoom Room 1',
    cupoMaximo: 15,
    estado: 'Activo',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'maestro2'
  },
  {
    id: '3',
    maestroId: 'maestro1',
    maestroName: 'Prof. García',
    carrera: 'Ingeniería',
    semestre: 1,
    materiaCodigo: 'QUI102',
    materiaNombre: 'Química General',
    dia: 'Miércoles',
    horaInicio: '14:00',
    horaFin: '16:00',
    duracionMinutos: 120,
    modalidad: 'Presencial',
    lugarAtencion: 'Laboratorio 1',
    cupoMaximo: 10,
    estado: 'Activo',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'maestro1'
  },
  {
    id: '4',
    maestroId: 'maestro3',
    maestroName: 'Prof. Martínez',
    carrera: 'Ingeniería',
    semestre: 3,
    materiaCodigo: 'PRO301',
    materiaNombre: 'Programación Avanzada',
    dia: 'Jueves',
    horaInicio: '16:00',
    horaFin: '18:00',
    duracionMinutos: 120,
    modalidad: 'Híbrida',
    lugarAtencion: 'Sala 203',
    cupoMaximo: 12,
    estado: 'Activo',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'maestro3'
  }
]; // Array en memoria para simplicidad

// GET /horarios - Listar todos los horarios activos
app.get('/horarios', (req, res) => {
  try {
    const horariosActivos = horariosAtencion.filter(h => h.estado === 'Activo');
    res.json({ success: true, horarios: horariosActivos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener horarios' });
  }
});

// POST /horarios - Crear horario
app.post('/horarios', (req, res) => {
  try {
    const { maestroId, carrera, semestre, materiaCodigo, materiaNombre, dia, horaInicio, horaFin, duracionMinutos, modalidad, lugarAtencion, cupoMaximo, estado, observaciones } = req.body;
    
    // Validaciones básicas
    if (!maestroId || !carrera || !semestre || !materiaCodigo || !dia || !horaInicio || !horaFin || !modalidad || !lugarAtencion || !cupoMaximo) {
      return res.status(400).json({ success: false, error: 'Campos obligatorios faltantes' });
    }
    
    // Validar no cruces de horarios
    const conflicto = horariosAtencion.find(h => 
      h.maestroId === maestroId && 
      h.dia === dia && 
      h.estado === 'Activo' &&
      ((horaInicio >= h.horaInicio && horaInicio < h.horaFin) || 
       (horaFin > h.horaInicio && horaFin <= h.horaFin) ||
       (horaInicio <= h.horaInicio && horaFin >= h.horaFin))
    );
    
    if (conflicto) {
      return res.status(409).json({ success: false, error: 'Conflicto de horario detectado' });
    }
    
    const nuevoHorario = {
      id: Date.now().toString(),
      maestroId,
      carrera,
      semestre,
      materiaCodigo,
      materiaNombre,
      dia,
      horaInicio,
      horaFin,
      duracionMinutos,
      modalidad,
      lugarAtencion,
      cupoMaximo,
      estado: estado || 'Activo',
      observaciones: observaciones || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: maestroId
    };
    
    horariosAtencion.push(nuevoHorario);
    res.status(201).json({ success: true, horario: nuevoHorario });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al crear horario' });
  }
});

// GET /horarios/maestro/:id - Listar horarios del maestro
app.get('/horarios/maestro/:id', (req, res) => {
  try {
    const maestroId = req.params.id;
    const horarios = horariosAtencion.filter(h => h.maestroId === maestroId);
    res.json({ success: true, horarios });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener horarios' });
  }
});

// PUT /horarios/:id - Actualizar horario
app.put('/horarios/:id', (req, res) => {
  try {
    const id = req.params.id;
    const index = horariosAtencion.findIndex(h => h.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Horario no encontrado' });
    }
    
    const { horaInicio, horaFin, dia, maestroId } = req.body;
    
    // Validar no cruces si cambian hora o día
    if (horaInicio || horaFin || dia) {
      const conflicto = horariosAtencion.find((h, i) => 
        i !== index &&
        h.maestroId === (maestroId || horariosAtencion[index].maestroId) && 
        h.dia === (dia || horariosAtencion[index].dia) && 
        h.estado === 'Activo' &&
        ((horaInicio || horariosAtencion[index].horaInicio) >= h.horaInicio && (horaInicio || horariosAtencion[index].horaInicio) < h.horaFin) || 
        ((horaFin || horariosAtencion[index].horaFin) > h.horaInicio && (horaFin || horariosAtencion[index].horaFin) <= h.horaFin) ||
        ((horaInicio || horariosAtencion[index].horaInicio) <= h.horaInicio && (horaFin || horariosAtencion[index].horaFin) >= h.horaFin)
      );
      
      if (conflicto) {
        return res.status(409).json({ success: false, error: 'Conflicto de horario detectado' });
      }
    }
    
    horariosAtencion[index] = { ...horariosAtencion[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, horario: horariosAtencion[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al actualizar horario' });
  }
});

// DELETE /horarios/:id - Eliminar horario
app.delete('/horarios/:id', (req, res) => {
  try {
    const id = req.params.id;
    const index = horariosAtencion.findIndex(h => h.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Horario no encontrado' });
    }
    
    horariosAtencion.splice(index, 1);
    res.json({ success: true, message: 'Horario eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al eliminar horario' });
  }
});

// GET /horarios/reportes/:maestroId - Reportes
app.get('/horarios/reportes/:maestroId', (req, res) => {
  try {
    const maestroId = req.params.maestroId;
    const horarios = horariosAtencion.filter(h => h.maestroId === maestroId && h.estado === 'Activo');
    
    const reportes = {
      totalHorasSemana: horarios.reduce((sum, h) => sum + h.duracionMinutos, 0) / 60,
      horasPorMateria: {},
      horariosPorDia: {},
      horariosPorModalidad: {},
      cuposDisponibles: horarios.reduce((sum, h) => sum + h.cupoMaximo, 0),
      materiasDemanda: {}
    };
    
    horarios.forEach(h => {
      // Horas por materia
      if (!reportes.horasPorMateria[h.materiaNombre]) {
        reportes.horasPorMateria[h.materiaNombre] = 0;
      }
      reportes.horasPorMateria[h.materiaNombre] += h.duracionMinutos / 60;
      
      // Horarios por día
      if (!reportes.horariosPorDia[h.dia]) {
        reportes.horariosPorDia[h.dia] = 0;
      }
      reportes.horariosPorDia[h.dia]++;
      
      // Horarios por modalidad
      if (!reportes.horariosPorModalidad[h.modalidad]) {
        reportes.horariosPorModalidad[h.modalidad] = 0;
      }
      reportes.horariosPorModalidad[h.modalidad]++;
      
      // Materias con mayor demanda (por cupo)
      if (!reportes.materiasDemanda[h.materiaNombre]) {
        reportes.materiasDemanda[h.materiaNombre] = 0;
      }
      reportes.materiasDemanda[h.materiaNombre] += h.cupoMaximo;
    });
    
    res.json({ success: true, reportes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al generar reportes' });
  }
});

// Serve simple health endpoint instead of proxying everything
>>>>>>> 6c44b93 (feat: comprehensive project cleanup and documentation updates)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Gateway is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
console.log(`🌐 Starting server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`🎉 API Gateway listening on port ${PORT}`);
});
