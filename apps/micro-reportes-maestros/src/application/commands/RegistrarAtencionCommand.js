class RegistrarAtencionCommand {
  constructor(maestroId, maestroName, dia, inicio, fin, estudianteId, estudianteName, materia, semestre, paralelo, modalidad = '', lugarAtencion = '') {
    if (!maestroId) throw new Error('maestroId is required');
    if (!dia) throw new Error('dia is required');
    if (!inicio) throw new Error('inicio is required');
    if (!estudianteId) throw new Error('estudianteId is required');

    this.maestroId = maestroId;
    this.maestroName = maestroName;
    this.dia = dia;
    this.inicio = inicio;
    this.fin = fin;
    this.estudianteId = estudianteId;
    this.estudianteName = estudianteName;
    this.materia = materia;
    this.semestre = semestre;
    this.paralelo = paralelo;
    this.modalidad = modalidad;
    this.lugarAtencion = lugarAtencion;
  }
}

module.exports = RegistrarAtencionCommand;
