const reservasService = require('../services/reservasService');

module.exports = {
  createReserva: async (req, res) => {
    try {
      console.log('🔹 BODY RECIBIDO:', JSON.stringify(req.body, null, 2));
      console.log('🔹 KEYS:', Object.keys(req.body));
      
      // Validar campos requeridos
      // Accept either (fecha + hora) OR (dia + inicio) to support both frontends
      const { estudianteId, maestroId, fecha, hora, dia, inicio } = req.body;

      if (!estudianteId || !maestroId) {
        return res.status(400).json({ 
          success: false, 
          message: 'estudianteId y maestroId son obligatorios' 
        });
      }

      const hasDate = !!(fecha && hora);
      const hasHorario = !!(dia && inicio);
      if (!hasDate && !hasHorario) {
        return res.status(400).json({ 
          success: false, 
          message: 'Se requiere fecha+hora o dia+inicio para crear la reserva' 
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
        // Keep API simple for clients: always return an array for list endpoints
        return res.status(200).json([]);
      }

      // Validate basic format
      if (typeof estudianteId !== 'string' || estudianteId.trim() === '') {
        console.warn('getReservasByEstudiante: invalid estudianteId param');
        return res.status(400).json({ success: false, message: 'ID de estudiante inválido', data: [] });
      }

      console.log('🔍 Buscando reservas para estudiante:', estudianteId);
      const list = await reservasService.getByEstudiante(estudianteId);
      // Respond with a plain array to match frontend expectations (array or empty array)
      res.status(200).json(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('❌ getReservasByEstudiante error:', err && err.stack ? err.stack : err);
      res.status(err.status || 500).json({ success: false, message: err.message || 'Error al obtener reservas' });
    }
  },

  // Check availability for a given maestro+dia+inicio
  checkAvailability: async (req, res) => {
    try {
      const { maestroId, dia, inicio } = req.query;
      if (!maestroId || !dia || !inicio) {
        return res.status(400).json({ available: false, message: 'maestroId, dia y inicio son requeridos' });
      }

      const available = await reservasService.isAvailable(maestroId, dia, inicio);
      return res.status(200).json({ available });
    } catch (err) {
      console.error('checkAvailability error:', err && err.stack ? err.stack : err);
      return res.status(err.status || 500).json({ available: false, message: err.message || 'Error verificando disponibilidad' });
    }
  },

  getReservasByMaestro: async (req, res) => {
    try {
      const maestroId = req.params.id; // Keep as string
      const list = await reservasService.getByMaestro(maestroId);
      // Nunca retornar 304, solo 200 si hay datos o array vacío si error
      if (Array.isArray(list)) {
        res.status(200).json(list);
      } else {
        res.status(200).json([]);
      }
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error interno' });
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
