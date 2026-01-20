/**
 * Query: CheckAvailabilityQuery
 * Verifica la disponibilidad de un horario
 */

class CheckAvailabilityQuery {
  constructor(maestroId, dia, inicio) {
    if (!maestroId || !dia || !inicio) {
      throw new Error('maestroId, dia e inicio son requeridos');
    }
    this.maestroId = maestroId;
    this.dia = dia;
    this.inicio = inicio;
  }
}

module.exports = CheckAvailabilityQuery;
