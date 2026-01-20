const horariosService = require('../services/horariosService');

module.exports = {
  createHorario: async (req, res) => {
    try {
      console.log('🟢 [micro-maestros] POST /horarios recibido. req.body:', req.body, '| typeof:', typeof req.body);
      const horario = await horariosService.create(req.body);
      if (!horario) {
        return res.status(500).json({ error: 'No se pudo crear el horario' });
      }
      res.status(201).json(horario);
    } catch (err) {
      console.error('Error en createHorario:', err.message, err.stack || '');
      res.status(500).json({ error: err.message || 'Error interno' });
    }
  },
  updateHorario: async (req, res) => {
    try {
      console.log('🟡 [micro-maestros] PUT /horarios/:id recibido. req.body:', req.body, '| typeof:', typeof req.body);
      // Aquí iría la lógica de actualización real
      res.status(200).json({ success: true, message: 'Update dummy OK' });
    } catch (err) {
      console.error('Error en updateHorario:', err.message, err.stack || '');
      res.status(500).json({ error: err.message || 'Error interno' });
    }
  },

  getHorariosByMaestro: async (req, res) => {
    try {
      const maestroId = req.params.id;
      const list = await horariosService.getByMaestro(maestroId);
      // Nunca retornar 304, siempre 200 con array (vacío si no hay)
      res.status(200).json({ success: true, horarios: list || [] });
    } catch (err) {
      console.error('Error in getHorariosByMaestro:', err.message, err.stack || '');
      res.status(err.status === 304 ? 500 : (err.status || 500)).json({ success: false, error: err.message });
    }
  },

  getHorariosReportes: async (req, res) => {
    try {
      const maestroId = req.params.maestroId;
      const reportes = await horariosService.getReportesByMaestro(maestroId);
      // Responder con estructura consistente { success, reportes }
      res.status(200).json({ success: true, reportes: reportes || {} });
    } catch (err) {
      console.error('Error in getHorariosReportes:', err.message, err.stack || '');
      // Si ocurre un error inesperado, responder 200 con objeto vacío y campo error
      res.status(200).json({ success: false, reportes: {
        totalHorasSemana: 0,
        horasPorMateria: {},
        horariosPorDia: {},
        horariosPorModalidad: {},
        cuposDisponibles: 0,
        materiasDemanda: {},
        error: err.message || 'Error interno'
      }});
    }
  },

  getAllHorarios: async (req, res) => {
    try {
      const list = await horariosService.getAll(req.query);
      // Nunca retornar 304, siempre 200 con array (vacío si no hay)
      res.status(200).json(list || []);
    } catch (err) {
      res.status(err.status === 304 ? 500 : (err.status || 500)).json({ message: err.message });
    }
  },

  deleteHorario: async (req, res) => {
    try {
      await horariosService.delete(req.params.id);
      res.json({ message: 'Horario eliminado', id: req.params.id });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  },

  updateHorario: async (req, res) => {
    try {
      const horario = await horariosService.update(req.params.id, req.body);
      res.json({ success: true, horario });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  },
};
