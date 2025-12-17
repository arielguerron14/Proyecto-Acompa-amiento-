const reservasService = require('../services/reservasService');

module.exports = {
  createReserva: async (req, res) => {
    try {
      const reserva = await reservasService.create(req.body);
      res.status(201).json(reserva);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  },

  getReservasByEstudiante: async (req, res) => {
    try {
      const estudianteId = req.params.id; // Keep as string
      const list = await reservasService.getByEstudiante(estudianteId);
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getReservasByMaestro: async (req, res) => {
    try {
      const maestroId = Number(req.params.id);
      const list = await reservasService.getByMaestro(maestroId);
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
