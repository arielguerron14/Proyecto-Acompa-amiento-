const reservasService = require('../services/reservasService');

module.exports = {
  createReserva: async (req, res) => {
    try {
      console.log('🔹 BODY RECIBIDO:', JSON.stringify(req.body, null, 2));
      console.log('🔹 KEYS:', Object.keys(req.body));
      
      // Validar campos requeridos
      const { estudianteId, maestroId, fecha, hora } = req.body;
      
      if (!estudianteId || !maestroId) {
        return res.status(400).json({ 
          success: false, 
          message: 'estudianteId y maestroId son obligatorios' 
        });
      }
      
      if (!fecha || !hora) {
        return res.status(400).json({ 
          success: false, 
          message: 'fecha y hora son obligatorios' 
        });
      }
      
      const result = await reservasService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.log('❌ createReserva error:', err.message);
      res.status(err.status || 500).json({ success: false, message: err.message });
    }
  },

  getReservasByEstudiante: async (req, res) => {
    try {
      console.log('🔹 USER DEL TOKEN:', JSON.stringify(req.user, null, 2));
      console.log('🔹 PARAMS:', req.params);
      
      const estudianteId = req.params.id; // From URL parameter
      
      if (!estudianteId) {
        console.log('❌ No estudianteId provided');
        return res.json({ success: true, data: [] });
      }

      // Validate basic format
      if (typeof estudianteId !== 'string' || estudianteId.trim() === '') {
        console.warn('getReservasByEstudiante: invalid estudianteId param');
        return res.status(400).json({ success: false, message: 'ID de estudiante inválido' });
      }
      
      console.log('🔍 Buscando reservas para estudiante:', estudianteId);
      const list = await reservasService.getByEstudiante(estudianteId);
      res.json({ success: true, data: list });
    } catch (err) {
      console.error('❌ getReservasByEstudiante error:', err && err.stack ? err.stack : err);
      res.status(err.status || 500).json({ success: false, message: err.message || 'Error al obtener reservas' });
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
