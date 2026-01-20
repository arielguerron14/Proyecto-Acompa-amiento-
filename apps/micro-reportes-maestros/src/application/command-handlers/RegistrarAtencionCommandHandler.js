const ReporteMaestro = require('../../domain/entities/ReporteMaestro');

class RegistrarAtencionCommandHandler {
  constructor(reporteRepository) {
    this.reporteRepository = reporteRepository;
  }

  async handle(command) {
    try {
      // Find or create reporte for teacher
      let reporte = await this.reporteRepository.findByMaestro(command.maestroId);
      
      if (!reporte) {
        // Create new reporte
        reporte = ReporteMaestro.create(command.maestroId, command.maestroName);
      }

      // Register attendance
      reporte.registrarAtencion(
        command.dia,
        command.inicio,
        command.fin,
        command.estudianteId,
        command.estudianteName,
        command.materia,
        command.semestre,
        command.paralelo,
        command.modalidad,
        command.lugarAtencion
      );

      // Validate domain rules
      reporte.validate();

      // Persist
      const saved = await this.reporteRepository.save(reporte);

      return {
        status: 200,
        message: 'Atención registrada exitosamente',
        reporte: {
          id: saved.id,
          maestroId: saved.maestroId,
          maestroName: saved.maestroName,
          horas: saved.horas,
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

module.exports = RegistrarAtencionCommandHandler;
