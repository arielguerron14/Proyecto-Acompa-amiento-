const RegistrarAtencionCommand = require('../application/commands/RegistrarAtencionCommand');
const GetReportesByMaestroQuery = require('../application/queries/GetReportesByMaestroQuery');
const GetReporteByIdQuery = require('../application/queries/GetReporteByIdQuery');

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
 * ReportesMaestroController: Maneja reportes de maestros
 * MIGRADO A CQRS: Usa CommandBus y QueryBus en lugar de llamadas directas a servicios
 */

module.exports = {
  /**
   * POST /reportes/maestros/registrar o /registrar
   * Registra asistencia usando CQRS CommandBus
   */
  registrarAtencion: async (req, res, next, commandBus) => {
    try {
      const { 
        maestroId, maestroName, dia, inicio, fin, 
        estudianteId, estudianteName,
        materia, semestre, paralelo, modalidad, lugarAtencion
      } = req.body;
      
      if (!maestroId || !dia || !inicio || !estudianteId) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      // Crear comando
      const command = new RegistrarAtencionCommand(
        maestroId,
        maestroName,
        dia,
        inicio,
        fin,
        estudianteId,
        estudianteName,
        materia,
        semestre,
        paralelo,
        modalidad,
        lugarAtencion
      );

      // Ejecutar comando a través del CQRS Bus
      logger.info('[reportesMaestroController.registrarAtencion] Executing RegistrarAtencionCommand');
      const result = await commandBus.execute(command);

      return res.status(result.status || 200).json(result.reporte);
    } catch (err) {
      logger.error('Error en registrarAtencion:', err.message);
      res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
  },

  /**
   * GET /reportes/maestros/reportes/:maestroId o /reportes/:maestroId
   * Obtiene reporte por maestroId usando CQRS QueryBus
   */
  getReportesByMaestro: async (req, res, next, queryBus) => {
    try {
      const maestroId = req.params.maestroId;
      
      // Crear query
      const query = new GetReportesByMaestroQuery(maestroId);

      // Ejecutar query a través del CQRS Bus
      logger.info(`[reportesMaestroController.getReportesByMaestro] Executing GetReportesByMaestroQuery for ${maestroId}`);
      const result = await queryBus.execute(query);

      return res.status(result.status || 200).json(result.reporte);
    } catch (err) {
      logger.error('Error en getReportesByMaestro:', err.message);
      const statusCode = err.status || 500;
      res.status(statusCode).json({ message: err.message });
    }
  },

  /**
   * GET /reportes/maestros/reporte/:id o /reporte/:id
   * Obtiene reporte por ID usando CQRS QueryBus
   */
  getReporteByMaestro: async (req, res, next, queryBus) => {
    try {
      const id = req.params.id;
      
      // Crear query
      const query = new GetReporteByIdQuery(id);

      // Ejecutar query a través del CQRS Bus
      logger.info(`[reportesMaestroController.getReporteByMaestro] Executing GetReporteByIdQuery for ${id}`);
      const result = await queryBus.execute(query);

      return res.status(result.status || 200).json(result.reporte);
    } catch (err) {
      logger.error('Error en getReporteByMaestro:', err.message);
      const statusCode = err.status || 500;
      res.status(statusCode).json({ message: err.message });
    }
  }
};
