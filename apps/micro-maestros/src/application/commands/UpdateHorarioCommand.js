class UpdateHorarioCommand {
  constructor(id, maestroId, maestroName, semestre, materia, paralelo, dia, inicio, fin, modalidad = 'Presencial', lugarAtencion = '', cupoMaximo = 30, observaciones = '') {
    if (!id) throw new Error('id is required');
    if (!maestroId) throw new Error('maestroId is required');
    if (!dia) throw new Error('dia is required');
    if (!inicio) throw new Error('inicio is required');
    if (!fin) throw new Error('fin is required');

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
  }
}

module.exports = UpdateHorarioCommand;
