/**
 * Reporte Entity - Pure domain logic without Mongoose
 * Represents a student's tutoring hours report
 */
class ReporteEstudiante {
  constructor(id, estudianteId, estudianteName, items = [], totalHoras = 0, updatedAt = new Date()) {
    this.id = id;
    this.estudianteId = estudianteId;
    this.estudianteName = estudianteName;
    this.items = items;
    this.totalHoras = totalHoras;
    this.updatedAt = updatedAt;
  }

  static create(estudianteId, estudianteName) {
    return new ReporteEstudiante(null, estudianteId, estudianteName, [], 0, new Date());
  }

  static fromPersistence(data) {
    if (!data) return null;
    return new ReporteEstudiante(
      data._id,
      data.estudianteId,
      data.estudianteName,
      data.items || [],
      data.totalHoras || 0,
      data.updatedAt || new Date()
    );
  }

  calcularDuracion(inicio, fin) {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    const start = hi + mi / 60;
    const end = hf + mf / 60;
    return Math.max(0, end - start);
  }

  agregarEvento(maestroId, maestroName, materia, semestre, paralelo, dia, inicio, fin, modalidad = '', lugarAtencion = '') {
    const duracionHoras = this.calcularDuracion(inicio, fin);
    
    this.items.push({
      maestroId,
      maestroName,
      materia,
      semestre,
      paralelo,
      dia,
      inicio,
      fin,
      modalidad,
      lugarAtencion,
      duracionHoras
    });

    this.totalHoras += duracionHoras;
    this.updatedAt = new Date();
  }

  validate() {
    if (!this.estudianteId) {
      const err = new Error('estudianteId is required');
      err.status = 400;
      throw err;
    }
  }

  toPersistence() {
    return {
      estudianteId: this.estudianteId,
      estudianteName: this.estudianteName,
      items: this.items,
      totalHoras: this.totalHoras,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = ReporteEstudiante;
