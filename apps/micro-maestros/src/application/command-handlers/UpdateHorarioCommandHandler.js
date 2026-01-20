const Horario = require('../../domain/entities/Horario');

class UpdateHorarioCommandHandler {
  constructor(horarioRepository) {
    this.horarioRepository = horarioRepository;
  }

  async handle(command) {
    try {
      // Find existing horario
      const existing = await this.horarioRepository.findById(command.id);
      if (!existing) {
        const err = new Error('Horario not found');
        err.status = 404;
        throw err;
      }

      // Check for overlaps (excluding current horario)
      const hasOverlap = await this.horarioRepository.checkOverlap(command.maestroId, command.dia, command.inicio, command.fin, command.id);
      if (hasOverlap) {
        const err = new Error('Overlap with existing horario');
        err.status = 409;
        throw err;
      }

      // Create updated domain entity
      const horario = new Horario(
        command.id,
        command.maestroId,
        command.maestroName,
        command.semestre,
        command.materia,
        command.paralelo,
        command.dia,
        command.inicio,
        command.fin,
        command.modalidad,
        command.lugarAtencion,
        command.cupoMaximo,
        command.observaciones,
        existing.estado,
        existing.createdAt
      );

      // Validate domain rules
      horario.validate();

      // Persist
      const saved = await this.horarioRepository.save(horario);

      return {
        success: true,
        status: 200,
        message: 'Horario updated successfully',
        horario: {
          id: saved.id,
          maestroId: saved.maestroId,
          maestroName: saved.maestroName,
          semestre: saved.semestre,
          materia: saved.materia,
          paralelo: saved.paralelo,
          dia: saved.dia,
          inicio: saved.inicio,
          fin: saved.fin,
          modalidad: saved.modalidad,
          lugarAtencion: saved.lugarAtencion,
          cupoMaximo: saved.cupoMaximo,
          observaciones: saved.observaciones,
          estado: saved.estado,
          createdAt: saved.createdAt
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

module.exports = UpdateHorarioCommandHandler;
