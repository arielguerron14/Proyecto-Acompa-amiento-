/**
 * Reserva Entity
 * Encapsula la lógica de negocio de una reserva
 */

class Reserva {
  constructor(id, estudianteId, maestroId, fecha, hora, dia, inicio, fin, asunto, descripcion, estado, materia, semestre, paralelo, modalidad, lugarAtencion, estudianteName, maestroName, createdAt, updatedAt) {
    this.id = id;
    this.estudianteId = estudianteId;
    this.maestroId = maestroId;
    this.fecha = fecha;
    this.hora = hora;
    this.dia = dia;
    this.inicio = inicio;
    this.fin = fin;
    this.asunto = asunto;
    this.descripcion = descripcion;
    this.estado = estado || 'Activa';
    this.materia = materia;
    this.semestre = semestre;
    this.paralelo = paralelo;
    this.modalidad = modalidad;
    this.lugarAtencion = lugarAtencion;
    this.estudianteName = estudianteName;
    this.maestroName = maestroName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Factory method para crear una nueva reserva
   */
  static create(estudianteId, maestroId, fecha, hora, dia, inicio, fin, asunto, descripcion, materia, semestre, paralelo, modalidad, lugarAtencion) {
    return new Reserva(null, estudianteId, maestroId, fecha, hora, dia, inicio, fin, asunto, descripcion, 'Activa', materia, semestre, paralelo, modalidad, lugarAtencion);
  }

  /**
   * Factory method para reconstruir desde persistencia
   */
  static fromPersistence(data) {
    const reserva = new Reserva(
      data._id || data.id,
      data.estudianteId,
      data.maestroId,
      data.fecha,
      data.hora,
      data.dia,
      data.inicio,
      data.fin,
      data.asunto,
      data.descripcion,
      data.estado,
      data.materia,
      data.semestre,
      data.paralelo,
      data.modalidad,
      data.lugarAtencion,
      data.estudianteName,
      data.maestroName,
      data.createdAt,
      data.updatedAt
    );
    return reserva;
  }

  /**
   * Validación de reglas del dominio
   */
  validate() {
    if (!this.estudianteId) {
      throw new Error('estudianteId es requerido');
    }
    if (!this.maestroId) {
      throw new Error('maestroId es requerido');
    }
    // Al menos una forma de especificar el horario
    const hasDate = !!(this.fecha && this.hora);
    const hasHorario = !!(this.dia && this.inicio);
    if (!hasDate && !hasHorario) {
      throw new Error('Se requiere fecha+hora o dia+inicio para crear la reserva');
    }
  }

  /**
   * Convertir a objeto para persistencia
   */
  toPersistence() {
    return {
      _id: this.id,
      estudianteId: this.estudianteId,
      maestroId: this.maestroId,
      fecha: this.fecha,
      hora: this.hora,
      dia: this.dia,
      inicio: this.inicio,
      fin: this.fin,
      asunto: this.asunto,
      descripcion: this.descripcion,
      estado: this.estado,
      materia: this.materia,
      semestre: this.semestre,
      paralelo: this.paralelo,
      modalidad: this.modalidad,
      lugarAtencion: this.lugarAtencion,
      estudianteName: this.estudianteName,
      maestroName: this.maestroName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Cancelar reserva
   */
  cancel() {
    if (this.estado === 'Cancelada') {
      throw new Error('La reserva ya está cancelada');
    }
    this.estado = 'Cancelada';
    this.updatedAt = new Date();
  }

  /**
   * Confirmar reserva
   */
  confirm() {
    if (this.estado === 'Confirmada') {
      throw new Error('La reserva ya está confirmada');
    }
    this.estado = 'Confirmada';
    this.updatedAt = new Date();
  }
}

module.exports = Reserva;
