class GetReportesByMaestroQuery {
  constructor(maestroId) {
    if (!maestroId) throw new Error('maestroId is required');
    this.maestroId = maestroId;
  }
}

module.exports = GetReportesByMaestroQuery;
