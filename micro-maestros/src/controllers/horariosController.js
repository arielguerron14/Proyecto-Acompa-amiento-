const Horario = require('../models/Horario');

module.exports = {
  createHorario: async (req, res) => {
    try {
      const { maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin } = req.body;
      if (!maestroId || !maestroName || !semestre || !materia || !paralelo || !dia || !inicio || !fin) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      // overlap check (simple)
      const existentes = await Horario.find({ maestroId, dia });
      for (const e of existentes) {
        if (!(fin <= e.inicio || inicio >= e.fin)) {
          return res.status(409).json({ message: 'Overlap with existing horario' });
        }
      }

      const h = await Horario.create({ maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin });
      res.status(201).json(h);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
  },

  getHorariosByMaestro: async (req, res) => {
    try {
      const maestroId = Number(req.params.id);
      const list = await Horario.find({ maestroId }).sort({ dia:1, inicio:1 });
      res.json(list);
    } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
  },

  getAllHorarios: async (req,res) => {
    try {
      const { semestre, materia, paralelo } = req.query;
      const filters = {};
      if (semestre) filters.semestre = semestre;
      if (materia) filters.materia = materia;
      if (paralelo) filters.paralelo = paralelo;

      const list = await Horario.find(filters).sort({ materia:1, paralelo:1, maestroId:1, dia:1, inicio:1 });
      res.json(list);
    } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
  },

  deleteHorario: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Horario.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Horario no encontrado' });
      }
      res.json({ message: 'Horario eliminado', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};
