/**
 * Query: GetReservasByEstudianteQuery
 * Obtiene todas las reservas de un estudiante
 */

class GetReservasByEstudianteQuery {
  constructor(estudianteId) {
    if (!estudianteId) {
      throw new Error('estudianteId es requerido');
    }
    this.estudianteId = estudianteId;
  }
}

module.exports = GetReservasByEstudianteQuery;
