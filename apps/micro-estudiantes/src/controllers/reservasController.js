const CreateReservaCommand = require('../application/commands/CreateReservaCommand');
const CancelReservaCommand = require('../application/commands/CancelReservaCommand');
const GetReservasByEstudianteQuery = require('../application/queries/GetReservasByEstudianteQuery');
const GetReservasByMaestroQuery = require('../application/queries/GetReservasByMaestroQuery');
const CheckAvailabilityQuery = require('../application/queries/CheckAvailabilityQuery');

let logger;
try {
  ({ logger } = require('@proyecto/shared-auth/src/middlewares/logger'));
} catch (err) {
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
}

/**
 * ReservasController: Maneja reservas
 * MIGRADO A CQRS: Usa CommandBus y QueryBus en lugar de llamadas directas a servicios
 */

module.exports = {
  /**
   * POST /reservas o /reservar
   * Crea una nueva reserva usando CQRS CommandBus
   */
  createReserva: async (req, res, next, commandBus) => {
    try {
      logger.info('🔹 BODY RECIBIDO:', JSON.stringify(req.body, null, 2));
      
      // Extraer datos del body
      const { estudianteId, maestroId, fecha, hora, dia, inicio, fin, asunto, descripcion, materia, semestre, paralelo, modalidad, lugarAtencion } = req.body;

      if (!estudianteId || !maestroId) {
        return res.status(400).json({ 
          success: false, 
          message: 'estudianteId y maestroId son obligatorios' 
        });
      }

      // Crear comando
      const command = new CreateReservaCommand(
        estudianteId,
        maestroId,
        fecha,
        hora,
        dia,
        inicio,
        fin,
        asunto,
        descripcion,
        materia,
        semestre,
        paralelo,
        modalidad,
        lugarAtencion
      );

      // Ejecutar comando a través del CQRS Bus
      logger.info(`[reservasController.createReserva] Executing CreateReservaCommand`);
      const result = await commandBus.execute(command);

      return res.status(201).json(result);
    } catch (err) {
      logger.error('❌ createReserva error:', err.message);
      const statusCode = err.status || 500;
      res.status(statusCode).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /reservas/estudiante/:id
   * Obtiene reservas de un estudiante usando CQRS QueryBus
   */
  getReservasByEstudiante: async (req, res, next, queryBus) => {
    try {
      const estudianteId = req.params.id;
      
      if (!estudianteId) {
        return res.status(200).json([]);
      }

      // Crear query
      const query = new GetReservasByEstudianteQuery(estudianteId);

      // Ejecutar query a través del CQRS Bus
      logger.info(`[reservasController.getReservasByEstudiante] Executing GetReservasByEstudianteQuery for ${estudianteId}`);
      const list = await queryBus.execute(query);

      return res.status(200).json(Array.isArray(list) ? list : []);
    } catch (err) {
      logger.error('❌ getReservasByEstudiante error:', err.message);
      res.status(err.status || 500).json({ success: false, message: err.message || 'Error al obtener reservas' });
    }
  },

  /**
   * GET /reservas/check
   * Verifica disponibilidad de horario usando CQRS QueryBus
   */
  checkAvailability: async (req, res, next, queryBus) => {
    try {
      const { maestroId, dia, inicio } = req.query;
      
      if (!maestroId || !dia || !inicio) {
        return res.status(400).json({ available: false, message: 'maestroId, dia y inicio son requeridos' });
      }

      // Crear query
      const query = new CheckAvailabilityQuery(maestroId, dia, inicio);

      // Ejecutar query a través del CQRS Bus
      logger.info(`[reservasController.checkAvailability] Executing CheckAvailabilityQuery`);
      const result = await queryBus.execute(query);

      return res.status(200).json(result);
    } catch (err) {
      logger.error('checkAvailability error:', err.message);
      return res.status(err.status || 500).json({ available: false, message: err.message || 'Error verificando disponibilidad' });
    }
  },

  /**
   * GET /reservas/maestro/:id
   * Obtiene reservas de un maestro usando CQRS QueryBus
   */
  getReservasByMaestro: async (req, res, next, queryBus) => {
    try {
      const maestroId = req.params.id;

      // Crear query
      const query = new GetReservasByMaestroQuery(maestroId);

      // Ejecutar query a través del CQRS Bus
      logger.info(`[reservasController.getReservasByMaestro] Executing GetReservasByMaestroQuery for ${maestroId}`);
      const list = await queryBus.execute(query);

      if (Array.isArray(list)) {
        res.status(200).json(list);
      } else {
        res.status(200).json([]);
      }
    } catch (err) {
      logger.error('getReservasByMaestro error:', err.message);
      res.status(500).json({ error: err.message || 'Error interno' });
    }
  },

  /**
   * POST /reservas/cancel-by-horario
   * Cancela reservas por horario (placeholder)
   */
  cancelReservasByHorario: async (req, res, next, commandBus) => {
    try {
      // Placeholder: Implement if needed
      res.status(501).json({ message: 'Not yet implemented via CQRS' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * PUT /reservas/:id/cancel
   * Cancela una reserva usando CQRS CommandBus
   */
  cancelReserva: async (req, res, next, commandBus) => {
    try {
      const { id } = req.params;

      // Crear comando
      const command = new CancelReservaCommand(id);

      // Ejecutar comando a través del CQRS Bus
      logger.info(`[reservasController.cancelReserva] Executing CancelReservaCommand for ${id}`);
      const result = await commandBus.execute(command);

      return res.status(200).json(result);
    } catch (err) {
      logger.error('cancelReserva error:', err.message);
      res.status(err.status || 500).json({ message: err.message });
    }
  },
};
