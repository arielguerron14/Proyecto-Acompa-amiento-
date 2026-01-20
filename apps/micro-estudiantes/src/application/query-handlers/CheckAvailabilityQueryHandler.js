/**
 * CheckAvailabilityQueryHandler
 * Maneja la query para verificar disponibilidad de horario
 */

class CheckAvailabilityQueryHandler {
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  async handle(query) {
    try {
      // 1. Verificar disponibilidad
      const available = await this.reservaRepository.isAvailable(
        query.maestroId,
        query.dia,
        query.inicio
      );

      // 2. Retornar resultado
      return {
        available: available,
        maestroId: query.maestroId,
        dia: query.dia,
        inicio: query.inicio
      };
    } catch (error) {
      console.error(`[CheckAvailabilityQueryHandler] Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CheckAvailabilityQueryHandler;
