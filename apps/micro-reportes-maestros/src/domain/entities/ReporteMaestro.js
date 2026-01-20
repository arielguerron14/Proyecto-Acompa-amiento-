/**
 * ReporteMaestro Entity - Pure domain logic without Mongoose
 * Represents a teacher's attendance report
 */
class ReporteMaestro {
  constructor(id, maestroId, maestroName, horas = [], updatedAt = new Date()) {
    this.id = id;
    this.maestroId = maestroId;
    this.maestroName = maestroName;
    this.horas = horas;
    this.updatedAt = updatedAt;
  }

  static create(maestroId, maestroName) {
    return new ReporteMaestro(null, maestroId, maestroName, [], new Date());
  }

  static fromPersistence(data) {
    if (!data) return null;
    return new ReporteMaestro(
      data._id,
      data.maestroId,
      data.maestroName,
      data.horas || [],
      data.updatedAt || new Date()
    );
  }

  registrarAtencion(dia, inicio, fin, estudianteId, estudianteName, materia, semestre, paralelo, modalidad = '', lugarAtencion = '') {
    const horaIdx = this.horas.findIndex(h => h.dia === dia && h.inicio === inicio);
    
    if (horaIdx === -1) {
      // New time slot
      this.horas.push({
        dia,
        inicio,
        fin,
        materia,
        semestre,
        paralelo,
        modalidad,
        lugarAtencion,
        alumnosAtendidos: 1,
        alumnos: [{ estudianteId, estudianteName }]
      });
    } else {
      // Update existing time slot
      const hora = this.horas[horaIdx];
      if (!hora.alumnos.some(a => a.estudianteId === estudianteId)) {
        hora.alumnos.push({ estudianteId, estudianteName });
        hora.alumnosAtendidos = hora.alumnos.length;
      }
      // Update additional fields if provided
      if (materia) hora.materia = materia;
      if (semestre) hora.semestre = semestre;
      if (paralelo) hora.paralelo = paralelo;
      if (modalidad) hora.modalidad = modalidad;
      if (lugarAtencion) hora.lugarAtencion = lugarAtencion;
    }
    
    this.updatedAt = new Date();
  }

  validate() {
    if (!this.maestroId) {
      const err = new Error('maestroId is required');
      err.status = 400;
      throw err;
    }
  }

  toPersistence() {
    return {
      maestroId: this.maestroId,
      maestroName: this.maestroName,
      horas: this.horas,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = ReporteMaestro;
