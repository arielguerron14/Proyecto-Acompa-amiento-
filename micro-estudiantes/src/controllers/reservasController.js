const reservasService = require('../services/reservasService');

module.exports = {
  createReserva: async (req, res) => {
    try {
      console.log('DEBUG: createReserva called with body:', req.body);
      console.log('DEBUG: maestroId type:', typeof req.body.maestroId, 'value:', req.body.maestroId);
      const result = await reservasService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.log('DEBUG: createReserva error:', err.message);
      res.status(err.status || 500).json({ success: false, message: err.message });
    }
  },

  getReservasByEstudiante: async (req, res) => {
    try {
      const estudianteId = req.params.id; // Keep as string
      const list = await reservasService.getByEstudiante(estudianteId);
      res.json({ success: true, data: list });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getReservasByMaestro: async (req, res) => {
    try {
      const maestroId = req.params.id; // Keep as string
      const list = await reservasService.getByMaestro(maestroId);
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  cancelReservasByHorario: async (req, res) => {
    try {
      const { maestroId, dia, inicio, fin } = req.body;
      const count = await reservasService.cancelByHorario(maestroId, dia, inicio, fin);
      res.json({ message: `${count} reservas canceladas` });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  cancelReserva: async (req, res) => {
    try {
      const { id } = req.params;
      const reserva = await reservasService.cancelById(id);
      res.json(reserva);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  },
};
