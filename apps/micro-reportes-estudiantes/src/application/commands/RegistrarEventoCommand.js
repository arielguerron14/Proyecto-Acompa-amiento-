class RegistrarEventoCommand {
  constructor(estudianteId, estudianteName, maestroId, maestroName, materia, semestre, paralelo, dia, inicio, fin, modalidad = '', lugarAtencion = '') {
    if (!estudianteId) throw new Error('estudianteId is required');
    if (!maestroId) throw new Error('maestroId is required');
    if (!dia) throw new Error('dia is required');
    if (!inicio) throw new Error('inicio is required');
    if (!fin) throw new Error('fin is required');

    this.estudianteId = estudianteId;
    this.estudianteName = estudianteName;
    this.maestroId = maestroId;
    this.maestroName = maestroName;
    this.materia = materia;
    this.semestre = semestre;
    this.paralelo = paralelo;
    this.dia = dia;
    this.inicio = inicio;
    this.fin = fin;
    this.modalidad = modalidad;
    this.lugarAtencion = lugarAtencion;
  }
}

module.exports = RegistrarEventoCommand;
