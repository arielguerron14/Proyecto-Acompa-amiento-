const Reserva = require('../models/Reserva');
const axios = require('axios');

const REPORTES_EST = process.env.REPORTES_EST_URL || 'http://localhost:5003';
const REPORTES_MAEST = process.env.REPORTES_MAEST_URL || 'http://localhost:5004';
const MAESTROS_URL = process.env.MAESTROS_URL || 'http://localhost:5001';

module.exports = {
  createReserva: async (req, res) => {
    try {
      const { estudianteId, estudianteName, maestroId, dia, inicio, fin } = req.body;
      if (!estudianteId || !estudianteName || !maestroId || !dia || !inicio || !fin) return res.status(400).json({ message: 'Missing fields' });

      // validate horario exists in micro-maestros
      const maUrl = `${MAESTROS_URL}/horarios/maestro/${maestroId}`;
      const maRes = await axios.get(maUrl).catch(()=> null);
      if (!maRes || maRes.status !== 200) return res.status(404).json({ message: 'Maestro not found' });

      const match = maRes.data.find(h => h.dia === dia && h.inicio === inicio && h.fin === fin);
      if (!match) return res.status(404).json({ message: 'Horario not available' });

      // check no existing reservation for same maestro + dia + inicio
      const existing = await Reserva.findOne({ maestroId, dia, inicio });
      if (existing) return res.status(409).json({ message: 'Horario ya reservado' });

      const reserva = await Reserva.create({
        estudianteId, estudianteName,
        maestroId, maestroName: match.maestroName || req.body.maestroName || 'Sin nombre',
        dia, inicio, fin
      });

      // Notify reportes-estudiantes
      try {
        await axios.post(`${REPORTES_EST}/registrar`, {
          estudianteId, estudianteName,
          maestroId, maestroName: reserva.maestroName,
          dia, inicio, fin
        });
      } catch(err){ console.warn('Warning: reportes-estudiantes not reachable', err.message); }

      // Notify reportes-maestros
      try {
        await axios.post(`${REPORTES_MAEST}/registrar`, {
          maestroId, maestroName: reserva.maestroName,
          dia, inicio, estudianteId, estudianteName
        });
      } catch(err){ console.warn('Warning: reportes-maestros not reachable', err.message); }

      res.status(201).json(reserva);
    } catch(err){
      console.error(err); res.status(500).json({ message: 'Server error' });
    }
  },

  getReservasByEstudiante: async (req, res) => {
    try {
      const id = Number(req.params.id);
      const list = await Reserva.find({ estudianteId: id }).sort({ createdAt:-1 });
      res.json(list);
    } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
  },

  getReservasByMaestro: async (req, res) => {
    try {
      const id = Number(req.params.id);
      const list = await Reserva.find({ maestroId: id }).sort({ dia:1, inicio:1 });
      res.json(list);
    } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
  }
};
