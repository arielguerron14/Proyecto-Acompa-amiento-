const CreateHorarioCommand = require('../application/commands/CreateHorarioCommand');
const UpdateHorarioCommand = require('../application/commands/UpdateHorarioCommand');
const DeleteHorarioCommand = require('../application/commands/DeleteHorarioCommand');
const GetHorariosByMaestroQuery = require('../application/queries/GetHorariosByMaestroQuery');
const GetAllHorariosQuery = require('../application/queries/GetAllHorariosQuery');
const GetHorariosReportesQuery = require('../application/queries/GetHorariosReportesQuery');

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
 * HorariosController: Maneja horarios de maestros
 * MIGRADO A CQRS: Usa CommandBus y QueryBus en lugar de llamadas directas a servicios
 */

module.exports = {
  /**
   * POST /horarios
   * Crea un nuevo horario usando CQRS CommandBus
   */
  createHorario: async (req, res, next, commandBus) => {
    try {
      logger.info('🟢 [micro-maestros] POST /horarios recibido. req.body:', req.body);
      
      const { maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin, modalidad, lugarAtencion, cupoMaximo, observaciones } = req.body;

      if (!maestroId || !maestroName) {
        return res.status(400).json({ 
          error: 'maestroId y maestroName son requeridos' 
        });
      }

      // Crear comando
      const command = new CreateHorarioCommand(
        maestroId,
        maestroName,
        semestre,
        materia,
        paralelo,
        dia,
        inicio,
        fin,
        modalidad,
        lugarAtencion,
        cupoMaximo,
        observaciones
      );

      // Ejecutar comando a través del CQRS Bus
      logger.info('[horariosController.createHorario] Executing CreateHorarioCommand');
      const result = await commandBus.execute(command);

      return res.status(result.status || 201).json(result);
    } catch (err) {
      logger.error('❌ createHorario error:', err.message);
      const statusCode = err.status || 500;
      res.status(statusCode).json({ error: err.message || 'Error interno' });
    }
  },

  /**
   * PUT /horarios/:id
   * Actualiza un horario usando CQRS CommandBus
   */
  updateHorario: async (req, res, next, commandBus) => {
    try {
      logger.info('🟡 [micro-maestros] PUT /horarios/:id recibido. req.body:', req.body);
      
      const { maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin, modalidad, lugarAtencion, cupoMaximo, observaciones } = req.body;
      const { id } = req.params;

      if (!maestroId) {
        return res.status(400).json({ error: 'maestroId es requerido' });
      }

      // Crear comando
      const command = new UpdateHorarioCommand(
        id,
        maestroId,
        maestroName,
        semestre,
        materia,
        paralelo,
        dia,
        inicio,
        fin,
        modalidad,
        lugarAtencion,
        cupoMaximo,
        observaciones
      );

      // Ejecutar comando a través del CQRS Bus
      logger.info('[horariosController.updateHorario] Executing UpdateHorarioCommand');
      const result = await commandBus.execute(command);

      return res.status(result.status || 200).json(result);
    } catch (err) {
      logger.error('❌ updateHorario error:', err.message);
      const statusCode = err.status || 500;
      res.status(statusCode).json({ error: err.message || 'Error interno' });
    }
  },

  /**
   * GET /horarios/maestro/:id
   * Obtiene horarios de un maestro usando CQRS QueryBus
   */
  getHorariosByMaestro: async (req, res, next, queryBus) => {
    try {
      const maestroId = req.params.id;

      // Crear query
      const query = new GetHorariosByMaestroQuery(maestroId);

      // Ejecutar query a través del CQRS Bus
      logger.info(`[horariosController.getHorariosByMaestro] Executing GetHorariosByMaestroQuery for ${maestroId}`);
      const result = await queryBus.execute(query);

      return res.status(200).json(result);
    } catch (err) {
      logger.error('❌ getHorariosByMaestro error:', err.message);
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /**
   * GET /horarios/reportes/:maestroId
   * Obtiene reportes de horarios usando CQRS QueryBus
   */
  getHorariosReportes: async (req, res, next, queryBus) => {
    try {
      const maestroId = req.params.maestroId;

      // Crear query
      const query = new GetHorariosReportesQuery(maestroId);

      // Ejecutar query a través del CQRS Bus
      logger.info(`[horariosController.getHorariosReportes] Executing GetHorariosReportesQuery for ${maestroId}`);
      const result = await queryBus.execute(query);

      return res.status(200).json(result);
    } catch (err) {
      logger.error('❌ getHorariosReportes error:', err.message);
      res.status(200).json({ success: false, reportes: {}, error: err.message });
    }
  },

  /**
   * GET /horarios
   * Obtiene todos los horarios usando CQRS QueryBus
   */
  getAllHorarios: async (req, res, next, queryBus) => {
    try {
      const filters = req.query;

      // Crear query
      const query = new GetAllHorariosQuery(filters);

      // Ejecutar query a través del CQRS Bus
      logger.info('[horariosController.getAllHorarios] Executing GetAllHorariosQuery');
      const result = await queryBus.execute(query);

      return res.status(200).json(result);
    } catch (err) {
      logger.error('❌ getAllHorarios error:', err.message);
      res.status(err.status || 500).json({ message: err.message });
    }
  },

  /**
   * DELETE /horarios/:id
   * Elimina un horario usando CQRS CommandBus
   */
  deleteHorario: async (req, res, next, commandBus) => {
    try {
      const { id } = req.params;

      // Crear comando
      const command = new DeleteHorarioCommand(id);

      // Ejecutar comando a través del CQRS Bus
      logger.info(`[horariosController.deleteHorario] Executing DeleteHorarioCommand for ${id}`);
      const result = await commandBus.execute(command);

      return res.status(200).json(result);
    } catch (err) {
      logger.error('❌ deleteHorario error:', err.message);
      const statusCode = err.status || 500;
      res.status(statusCode).json({ message: err.message });
    }
  }
};
