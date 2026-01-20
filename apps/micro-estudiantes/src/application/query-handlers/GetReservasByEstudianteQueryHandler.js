/**
 * GetReservasByEstudianteQueryHandler
 * Maneja la query para obtener reservas de un estudiante
 */

class GetReservasByEstudianteQueryHandler {
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  async handle(query) {
    try {
      // 1. Buscar reservas en la BD
      const reservas = await this.reservaRepository.findByEstudiante(query.estudianteId);

      // 2. Retornar como array
      return Array.isArray(reservas) ? reservas : [];
    } catch (error) {
      console.error(`[GetReservasByEstudianteQueryHandler] Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GetReservasByEstudianteQueryHandler;
