const RegistrarEventoCommand = require('../application/commands/RegistrarEventoCommand');
const GetReporteByEstudianteQuery = require('../application/queries/GetReporteByEstudianteQuery');

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
 * ReportesEstController: Maneja reportes de estudiantes
 * MIGRADO A CQRS: Usa CommandBus y QueryBus en lugar de llamadas directas a servicios
 */

module.exports = {
  /**
   * POST /reportes/estudiantes/registrar
   * Registra un evento de tutoria usando CQRS CommandBus
   */
  registrarEvento: async (req, res, next, commandBus) => {
    try {
      logger.info('DEBUG: registrarEvento called with body:', req.body);
      
      const { estudianteId, estudianteName, maestroId, maestroName, materia, semestre, paralelo, dia, inicio, fin, modalidad, lugarAtencion } = req.body;
      
      if (!estudianteId || !maestroId || !dia || !inicio || !fin) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      // Crear comando
      const command = new RegistrarEventoCommand(
        estudianteId,
        estudianteName,
        maestroId,
        maestroName,
        materia,
        semestre,
        paralelo,
        dia,
        inicio,
        fin,
        modalidad,
        lugarAtencion
      );

      // Ejecutar comando a través del CQRS Bus
      logger.info('[reportesEstController.registrarEvento] Executing RegistrarEventoCommand');
      const result = await commandBus.execute(command);

      return res.status(result.status || 201).json(result.reporte);
    } catch (err) {
      logger.error('Error en registrarEvento:', err.message);
      res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
  },

  /**
   * GET /reportes/estudiantes/reporte/:id
   * Obtiene reporte de un estudiante usando CQRS QueryBus
   */
  getReporteByEstudiante: async (req, res, next, queryBus) => {
    try {
      const id = req.params.id;
      logger.info('DEBUG: getReporteByEstudiante called with id:', id, 'type:', typeof id);

      // Crear query
      const query = new GetReporteByEstudianteQuery(id);

      // Ejecutar query a través del CQRS Bus
      logger.info('[reportesEstController.getReporteByEstudiante] Executing GetReporteByEstudianteQuery');
      const result = await queryBus.execute(query);

      return res.status(result.status || 200).json(result.reporte);
    } catch (err) {
      logger.error('DEBUG: Error in getReporteByEstudiante:', err.message);
      const statusCode = err.status || 500;
      res.status(statusCode).json({ message: err.message });
    }
  }
};
