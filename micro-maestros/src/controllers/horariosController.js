const horariosService = require('../services/horariosService');

module.exports = {
  createHorario: async (req, res) => {
    try {
      const horario = await horariosService.create(req.body);
      res.status(201).json(horario);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  },

  getHorariosByMaestro: async (req, res) => {
    try {
      const maestroId = req.params.id; // Keep as string/ObjectId
      const list = await horariosService.getByMaestro(maestroId);
      res.json({ success: true, horarios: list });
    } catch (err) {
      console.error('Error in getHorariosByMaestro:', err.message, err.stack || '');
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  },

  getHorariosReportes: async (req, res) => {
    try {
      const maestroId = req.params.maestroId;
      const reportes = await horariosService.getReportesByMaestro(maestroId);
      res.json({ success: true, reportes });
    } catch (err) {
      console.error('Error in getHorariosReportes:', err.message, err.stack || '');
      res.status(err.status || 500).json({ success: false, error: err.message });
    }
  },

  getAllHorarios: async (req, res) => {
    try {
      const list = await horariosService.getAll(req.query);
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
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
