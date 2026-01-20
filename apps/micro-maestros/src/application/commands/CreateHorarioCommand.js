class CreateHorarioCommand {
  constructor(maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin, modalidad = 'Presencial', lugarAtencion = '', cupoMaximo = 30, observaciones = '') {
    if (!maestroId) throw new Error('maestroId is required');
    if (!maestroName) throw new Error('maestroName is required');
    if (!semestre) throw new Error('semestre is required');
    if (!materia) throw new Error('materia is required');
    if (!paralelo) throw new Error('paralelo is required');
    if (!dia) throw new Error('dia is required');
    if (!inicio) throw new Error('inicio is required');
    if (!fin) throw new Error('fin is required');

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
  }
}

module.exports = CreateHorarioCommand;
