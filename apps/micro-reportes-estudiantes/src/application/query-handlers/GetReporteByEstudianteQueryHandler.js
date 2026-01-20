class GetReporteByEstudianteQueryHandler {
  constructor(reporteRepository) {
    this.reporteRepository = reporteRepository;
  }

  async handle(query) {
    try {
      const reporte = await this.reporteRepository.findByEstudiante(query.estudianteId);
      
      if (!reporte) {
        const err = new Error('Reporte no encontrado');
        err.status = 404;
        throw err;
      }

      return {
        status: 200,
        reporte: {
          id: reporte.id,
          estudianteId: reporte.estudianteId,
          estudianteName: reporte.estudianteName,
          items: reporte.items,
          totalHoras: reporte.totalHoras,
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

module.exports = GetReporteByEstudianteQueryHandler;
