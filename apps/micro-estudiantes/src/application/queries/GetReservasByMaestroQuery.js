/**
 * Query: GetReservasByMaestroQuery
 * Obtiene todas las reservas de un maestro
 */

class GetReservasByMaestroQuery {
  constructor(maestroId) {
    if (!maestroId) {
      throw new Error('maestroId es requerido');
    }
    this.maestroId = maestroId;
  }
}

module.exports = GetReservasByMaestroQuery;
