/**
 * Horario Entity - Pure domain logic without Mongoose
 * Represents a teacher's available time slot
 */
class Horario {
  constructor(id, maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin, modalidad = 'Presencial', lugarAtencion = '', cupoMaximo = 30, observaciones = '', estado = 'Activo', createdAt = new Date()) {
    this.id = id;
    this.maestroId = maestroId;
    this.maestroName = maestroName;
    this.semestre = semestre;
    this.materia = materia;
    this.paralelo = paralelo;
    this.dia = dia;
    this.inicio = inicio;
    this.fin = fin;
    this.modalidad = modalidad;
    this.lugarAtencion = lugarAtencion;
    this.cupoMaximo = cupoMaximo;
    this.observaciones = observaciones;
    this.estado = estado;
    this.createdAt = createdAt;
  }

  static create(maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin, modalidad = 'Presencial', lugarAtencion = '', cupoMaximo = 30, observaciones = '') {
    return new Horario(null, maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin, modalidad, lugarAtencion, cupoMaximo, observaciones, 'Activo', new Date());
  }

  static fromPersistence(data) {
    if (!data) return null;
    return new Horario(
      data._id,
      data.maestroId,
      data.maestroName,
      data.semestre,
      data.materia,
      data.paralelo,
      data.dia,
      data.inicio,
      data.fin,
      data.modalidad || 'Presencial',
      data.lugarAtencion || '',
      data.cupoMaximo || 30,
      data.observaciones || '',
      data.estado || 'Activo',
      data.createdAt || new Date()
    );
  }

  validate() {
    const requiredFields = ['maestroId', 'maestroName', 'semestre', 'materia', 'paralelo', 'dia', 'inicio', 'fin'];
    const missing = requiredFields.filter(field => !this[field]);
    if (missing.length) {
      const err = new Error(`Missing required fields: ${missing.join(', ')}`);
      err.status = 400;
      throw err;
    }

    // Validate time format HH:MM
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(this.inicio) || !timeRegex.test(this.fin)) {
      const err = new Error('inicio and fin must be in HH:MM format');
      err.status = 400;
      throw err;
    }

    // Ensure fin > inicio
    const [initHour, initMin] = this.inicio.split(':').map(Number);
    const [finHour, finMin] = this.fin.split(':').map(Number);
    const initTime = initHour * 60 + initMin;
    const finTime = finHour * 60 + finMin;

    if (finTime <= initTime) {
      const err = new Error('fin time must be greater than inicio time');
      err.status = 400;
      throw err;
    }
  }

  deactivate() {
    this.estado = 'Inactivo';
  }

  reactivate() {
    this.estado = 'Activo';
  }

  toPersistence() {
    return {
      maestroId: this.maestroId,
      maestroName: this.maestroName,
      semestre: this.semestre,
      materia: this.materia,
      paralelo: this.paralelo,
      dia: this.dia,
      inicio: this.inicio,
      fin: this.fin,
      modalidad: this.modalidad,
      lugarAtencion: this.lugarAtencion,
      cupoMaximo: this.cupoMaximo,
      observaciones: this.observaciones,
      estado: this.estado,
      createdAt: this.createdAt
    };
  }
}

module.exports = Horario;
