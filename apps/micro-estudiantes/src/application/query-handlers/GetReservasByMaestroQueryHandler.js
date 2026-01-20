/**
 * GetReservasByMaestroQueryHandler
 * Maneja la query para obtener reservas de un maestro
 */

class GetReservasByMaestroQueryHandler {
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  async handle(query) {
    try {
      // 1. Buscar reservas en la BD
      const reservas = await this.reservaRepository.findByMaestro(query.maestroId);

      // 2. Retornar como array
      return Array.isArray(reservas) ? reservas : [];
    } catch (error) {
      console.error(`[GetReservasByMaestroQueryHandler] Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GetReservasByMaestroQueryHandler;
