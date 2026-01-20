/**
 * Command: CreateReservaCommand
 * Encapsula la intención de crear una nueva reserva
 */

class CreateReservaCommand {
  constructor(estudianteId, maestroId, fecha, hora, dia, inicio, fin, asunto, descripcion, materia, semestre, paralelo, modalidad, lugarAtencion) {
    if (!estudianteId || !maestroId) {
      throw new Error('estudianteId y maestroId son requeridos');
    }
    
    this.estudianteId = estudianteId;
    this.maestroId = maestroId;
    this.fecha = fecha;
    this.hora = hora;
    this.dia = dia;
    this.inicio = inicio;
    this.fin = fin;
    this.asunto = asunto;
    this.descripcion = descripcion;
    this.materia = materia;
    this.semestre = semestre;
    this.paralelo = paralelo;
    this.modalidad = modalidad;
    this.lugarAtencion = lugarAtencion;
  }
}

module.exports = CreateReservaCommand;
