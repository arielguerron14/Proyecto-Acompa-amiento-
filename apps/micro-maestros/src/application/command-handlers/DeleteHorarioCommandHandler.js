class DeleteHorarioCommandHandler {
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

      // Delete
      await this.horarioRepository.delete(command.id);

      return {
        success: true,
        status: 200,
        message: 'Horario deleted successfully',
        id: command.id
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

module.exports = DeleteHorarioCommandHandler;
