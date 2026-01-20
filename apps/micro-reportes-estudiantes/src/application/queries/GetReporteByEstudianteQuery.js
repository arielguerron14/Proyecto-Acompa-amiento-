class GetReporteByEstudianteQuery {
  constructor(estudianteId) {
    if (!estudianteId) throw new Error('estudianteId is required');
    this.estudianteId = estudianteId;
  }
}

module.exports = GetReporteByEstudianteQuery;
