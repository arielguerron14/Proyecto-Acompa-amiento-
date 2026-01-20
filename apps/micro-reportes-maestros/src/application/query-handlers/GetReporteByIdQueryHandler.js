class GetReporteByIdQueryHandler {
  constructor(reporteRepository) {
    this.reporteRepository = reporteRepository;
  }

  async handle(query) {
    try {
      const reporte = await this.reporteRepository.findById(query.id);
      
      if (!reporte) {
        const err = new Error('Reporte no encontrado');
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

module.exports = GetReporteByIdQueryHandler;
