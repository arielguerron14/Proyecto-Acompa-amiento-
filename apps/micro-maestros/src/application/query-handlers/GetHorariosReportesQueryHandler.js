const axios = require('axios');
const sharedConfig = require('shared-config');

const axiosInstance = axios.create({ timeout: 10000 });

class GetHorariosReportesQueryHandler {
  constructor(horarioRepository) {
    this.horarioRepository = horarioRepository;
  }

  async handle(query) {
    try {
      const horarios = await this.horarioRepository.findByMaestro(query.maestroId);

      // Obtener reservas activas del servicio de estudiantes
      let reservasCount = {};
      try {
        const estudiantesUrl = sharedConfig.getServiceUrl('estudiantes');
        const response = await axiosInstance.get(`${estudiantesUrl}/reservas/maestro/${query.maestroId}`);
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(r => {
            if (r.estado !== 'Cancelada') {
              const key = `${r.dia}-${r.inicio}`;
              reservasCount[key] = (reservasCount[key] || 0) + 1;
            }
          });
        } else {
          reservasCount = {};
        }
      } catch (err) {
        console.error('Error obteniendo reservas:', err.message);
        reservasCount = {};
      }

      const reportes = {
        totalHorasSemana: horarios.reduce((sum, h) => {
          const inicio = new Date(`1970-01-01T${h.inicio}:00`);
          const fin = new Date(`1970-01-01T${h.fin}:00`);
          const horas = (fin - inicio) / (1000 * 60 * 60);
          return sum + horas;
        }, 0),
        horasPorMateria: {},
        horariosPorDia: {},
        horariosPorModalidad: {},
        cuposDisponibles: 0,
        materiasDemanda: {}
      };

      horarios.forEach(h => {
        const key = `${h.dia}-${h.inicio}`;
        const reservas = reservasCount[key] || 0;
        const cuposDisp = h.cupoMaximo - reservas;

        // Hours per subject
        reportes.horasPorMateria[h.materia] = (reportes.horasPorMateria[h.materia] || 0) + ((new Date(`1970-01-01T${h.fin}:00`) - new Date(`1970-01-01T${h.inicio}:00`)) / (1000 * 60 * 60));

        // Schedules per day
        if (!reportes.horariosPorDia[h.dia]) reportes.horariosPorDia[h.dia] = [];
        reportes.horariosPorDia[h.dia].push(h.materia);

        // Schedules per modality
        if (!reportes.horariosPorModalidad[h.modalidad]) reportes.horariosPorModalidad[h.modalidad] = [];
        reportes.horariosPorModalidad[h.modalidad].push(h.materia);

        reportes.cuposDisponibles += cuposDisp;
        reportes.materiasDemanda[h.materia] = (reportes.materiasDemanda[h.materia] || 0) + reservas;
      });

      return {
        success: true,
        status: 200,
        reportes
      };
    } catch (error) {
      throw {
        status: error.status || 500,
        message: error.message
      };
    }
  }
}

module.exports = GetHorariosReportesQueryHandler;
