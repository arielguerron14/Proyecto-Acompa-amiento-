class GetAllHorariosQueryHandler {
  constructor(horarioRepository) {
    this.horarioRepository = horarioRepository;
  }

  async handle(query) {
    try {
      const horarios = await this.horarioRepository.findAll(query.filters);
      return horarios.map(h => ({
        id: h.id,
        maestroId: h.maestroId,
        maestroName: h.maestroName,
        semestre: h.semestre,
        materia: h.materia,
        paralelo: h.paralelo,
        dia: h.dia,
        inicio: h.inicio,
        fin: h.fin,
        modalidad: h.modalidad,
        lugarAtencion: h.lugarAtencion,
        cupoMaximo: h.cupoMaximo,
        observaciones: h.observaciones,
        estado: h.estado,
        createdAt: h.createdAt
      }));
    } catch (error) {
      throw {
        status: error.status || 500,
        message: error.message
      };
    }
  }
}

module.exports = GetAllHorariosQueryHandler;
