const ReporteEstudiante = require('../../domain/entities/ReporteEstudiante');

class RegistrarEventoCommandHandler {
  constructor(reporteRepository) {
    this.reporteRepository = reporteRepository;
  }

  async handle(command) {
    try {
      // Find or create reporte for student
      let reporte = await this.reporteRepository.findByEstudiante(command.estudianteId);
      
      if (!reporte) {
        // Create new reporte
        reporte = ReporteEstudiante.create(command.estudianteId, command.estudianteName);
      }

      // Add event to reporte
      reporte.agregarEvento(
        command.maestroId,
        command.maestroName,
        command.materia,
        command.semestre,
        command.paralelo,
        command.dia,
        command.inicio,
        command.fin,
        command.modalidad,
        command.lugarAtencion
      );

      // Validate domain rules
      reporte.validate();

      // Persist
      const saved = await this.reporteRepository.save(reporte);

      return {
        status: 201,
        message: 'Evento registrado exitosamente',
        reporte: {
          id: saved.id,
          estudianteId: saved.estudianteId,
          estudianteName: saved.estudianteName,
          items: saved.items,
          totalHoras: saved.totalHoras,
          updatedAt: saved.updatedAt
        }
      };
    } catch (error) {
      const statusCode = error.status || 500;
      throw {
        status: statusCode,
        message: error.message
      };
    }
  }
}

module.exports = RegistrarEventoCommandHandler;
