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
      const maestroId = Number(req.params.id);
      const list = await horariosService.getByMaestro(maestroId);
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
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
};
