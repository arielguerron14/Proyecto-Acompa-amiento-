/**
 * Command: CancelReservaCommand
 * Encapsula la intención de cancelar una reserva
 */

class CancelReservaCommand {
  constructor(reservaId) {
    if (!reservaId) {
      throw new Error('reservaId es requerido');
    }
    this.reservaId = reservaId;
  }
}

module.exports = CancelReservaCommand;
