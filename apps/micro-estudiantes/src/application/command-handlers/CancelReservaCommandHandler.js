/**
 * CancelReservaCommandHandler
 * Maneja el comando de cancelar una reserva
 */

const Reserva = require('../../domain/entities/Reserva');
const ReservaRepository = require('../../infrastructure/persistence-write/ReservaRepository');

class CancelReservaCommandHandler {
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  async handle(command) {
    try {
      // 1. Buscar la reserva
      const reserva = await this.reservaRepository.findById(command.reservaId);
      if (!reserva) {
        const error = new Error('Reserva no encontrada');
        error.status = 404;
        throw error;
      }

      // 2. Validar que pueda cancelarse
      if (reserva.estado === 'Cancelada') {
        const error = new Error('La reserva ya está cancelada');
        error.status = 400;
        throw error;
      }

      // 3. Cancelar la reserva (lógica del dominio)
      reserva.cancel();

      // 4. Persistir cambios
      const cancelledReserva = await this.reservaRepository.save(reserva);

      // 5. Retornar resultado
      return {
        success: true,
        message: 'Reserva cancelada exitosamente',
        reserva: {
          id: cancelledReserva.id,
          estudianteId: cancelledReserva.estudianteId,
          maestroId: cancelledReserva.maestroId,
          estado: cancelledReserva.estado,
          updatedAt: cancelledReserva.updatedAt
        }
      };
    } catch (error) {
      console.error(`[CancelReservaCommandHandler] Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CancelReservaCommandHandler;
