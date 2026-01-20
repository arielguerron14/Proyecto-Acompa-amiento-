class GetReportesByMaestroQueryHandler {
  constructor(reporteRepository) {
    this.reporteRepository = reporteRepository;
  }

  async handle(query) {
    try {
      const reporte = await this.reporteRepository.findByMaestro(query.maestroId);
      
      if (!reporte) {
        const err = new Error('No reportes found');
        err.status = 404;
        throw err;
      }

      return {
        status: 200,
        reporte: {
          id: reporte.id,
          maestroId: reporte.maestroId,
          maestroName: reporte.maestroName,
          horas: reporte.horas,
          updatedAt: reporte.updatedAt
        }
      };
    } catch (error) {
      throw {
        status: error.status || 500,
        message: error.message
      };
    }
  }
}

module.exports = GetReportesByMaestroQueryHandler;
