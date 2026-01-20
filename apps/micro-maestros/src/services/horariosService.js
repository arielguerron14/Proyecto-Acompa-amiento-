const Horario = require('../models/Horario');
const axios = require('axios');
const sharedConfig = require('shared-config');

// Axios instance with a sensible timeout to avoid hanging when other services are slow/unavailable
const axiosInstance = axios.create({ timeout: 10000 });

const REQUIRED_FIELDS = ['maestroId', 'maestroName', 'semestre', 'materia', 'paralelo', 'dia', 'inicio', 'fin'];

class HorariosService {
  /**
   * Valida que todos los campos requeridos estén presentes
   */
  validateRequired(data) {
    const missing = REQUIRED_FIELDS.filter(field => !data[field]);
    if (missing.length) {
      const error = new Error(`Missing fields: ${missing.join(', ')}`);
      error.status = 400;
      throw error;
    }
  }

  /**
   * Verifica solapamientos de horarios
   */
  async checkOverlap(maestroId, dia, inicio, fin, excludeId = null) {
    const query = { maestroId, dia };
    if (excludeId) query._id = { $ne: excludeId };

    const existentes = await Horario.find(query);
    const hasOverlap = existentes.some(e => !(fin <= e.inicio || inicio >= e.fin));

    if (hasOverlap) {
      const error = new Error('Overlap with existing horario');
      error.status = 409;
      throw error;
    }
  }

  /**
   * Crea un nuevo horario
   */
  async create(data) {
    this.validateRequired(data);
    const { maestroId, dia, inicio, fin } = data;

    await this.checkOverlap(maestroId, dia, inicio, fin);
    return Horario.create(data);
  }

  /**
   * Obtiene horarios por maestro
   */
  async getByMaestro(maestroId) {
    return Horario.find({ maestroId }).sort({ dia: 1, inicio: 1 });
  }

  /**
   * Obtiene reportes de horarios por maestro
   */
  async getReportesByMaestro(maestroId) {
    // Wrap report generation in a timeout so that slow downstream services (or DB) can't hang the request
    const doGenerate = async () => {
      const horarios = await Horario.find({ maestroId });

      // Obtener reservas activas del servicio de estudiantes
      let reservasCount = {};
      try {
        const estudiantesUrl = sharedConfig.getServiceUrl('estudiantes');
        const response = await axiosInstance.get(`${estudiantesUrl}/reservas/maestro/${maestroId}`);
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(r => {
            if (r.estado !== 'Cancelada') {
              const key = `${r.dia}-${r.inicio}`;
              reservasCount[key] = (reservasCount[key] || 0) + 1;
            }
          });
        } else {
          // Si la respuesta es vacía o no es array, simplemente dejar reservasCount vacío
          reservasCount = {};
        }
      } catch (err) {
        console.error('Error obteniendo reservas:', err.message, err.code || '', err.stack || '');
        // Si falla la llamada, no romper el endpoint, retornar reservasCount vacío
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
        const reservasActivas = reservasCount[key] || 0;
        const cupoMaximo = h.cupoMaximo || 0;
        reportes.cuposDisponibles += Math.max(0, cupoMaximo - reservasActivas);

        // Horas por materia
        if (!reportes.horasPorMateria[h.materia]) {
          reportes.horasPorMateria[h.materia] = 0;
        }
        const inicio = new Date(`1970-01-01T${h.inicio}:00`);
        const fin = new Date(`1970-01-01T${h.fin}:00`);
        const horas = (fin - inicio) / (1000 * 60 * 60);
        reportes.horasPorMateria[h.materia] += horas;

        // Horarios por día
        if (!reportes.horariosPorDia[h.dia]) {
          reportes.horariosPorDia[h.dia] = 0;
        }
        reportes.horariosPorDia[h.dia]++;

        // Horarios por modalidad (if exists)
        if (h.modalidad) {
          if (!reportes.horariosPorModalidad[h.modalidad]) {
            reportes.horariosPorModalidad[h.modalidad] = 0;
          }
          reportes.horariosPorModalidad[h.modalidad]++;
        }

        // Materias con mayor demanda (por cupo disponible)
        if (!reportes.materiasDemanda[h.materia]) {
          reportes.materiasDemanda[h.materia] = 0;
        }
        reportes.materiasDemanda[h.materia] += Math.max(0, cupoMaximo - reservasActivas);
      });

      return reportes;
    };

    const timeoutMs = parseInt(process.env.HORARIOS_REPORT_TIMEOUT_MS || '5000', 10);
    return new Promise((resolve) => {
      let finished = false;
      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          console.error('Error in getHorariosReportes: Report generation timed out');
          resolve({
            totalHorasSemana: 0,
            horasPorMateria: {},
            horariosPorDia: {},
            horariosPorModalidad: {},
            cuposDisponibles: 0,
            materiasDemanda: {},
            error: 'timeout'
          });
        }
      }, timeoutMs);
      doGenerate().then(result => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve(result || {
            totalHorasSemana: 0,
            horasPorMateria: {},
            horariosPorDia: {},
            horariosPorModalidad: {},
            cuposDisponibles: 0,
            materiasDemanda: {},
            error: 'empty'
          });
        }
      }).catch(err => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          console.error('Error obteniendo reservas:', err.message, err);
          resolve({
            totalHorasSemana: 0,
            horasPorMateria: {},
            horariosPorDia: {},
            horariosPorModalidad: {},
            cuposDisponibles: 0,
            materiasDemanda: {},
            error: err.message
          });
        }
      });
    });
  }

  /**
   * Obtiene todos los horarios con filtros opcionales
   */
  async getAll(filters = {}) {
    const query = { estado: 'Activo' }; // Solo horarios activos
    if (filters.semestre) query.semestre = filters.semestre;
    if (filters.materia) query.materia = filters.materia;
    if (filters.paralelo) query.paralelo = filters.paralelo;

    return Horario.find(query).sort({ materia: 1, paralelo: 1, maestroId: 1, dia: 1, inicio: 1 });
  }

  /**
   * Elimina un horario
   */
  async delete(id) {
    const deleted = await Horario.findByIdAndDelete(id);
    if (!deleted) {
      const error = new Error('Horario no encontrado');
      error.status = 404;
      throw error;
    }

    // Cancelar reservas asociadas
    try {
      const estudiantesUrl = sharedConfig.getServiceUrl('estudiantes');
      await axiosInstance.post(`${estudiantesUrl}/reservas/cancel-by-horario`, {
        maestroId: deleted.maestroId,
        dia: deleted.dia,
        inicio: deleted.inicio,
        fin: deleted.fin
      });
    } catch (err) {
      console.error('Error cancelando reservas:', err.message, err.code || '', err.stack || '');
      // No fallar la eliminación si falla la cancelación
    }

    return deleted;
  }

  /**
   * Actualiza un horario
   */
  async update(id, data) {
    const horario = await Horario.findById(id);
    if (!horario) {
      const error = new Error('Horario no encontrado');
      error.status = 404;
      throw error;
    }

    // Si se está cambiando a inactivo, cancelar reservas
    if (data.estado === 'Inactivo' && horario.estado === 'Activo') {
      try {
        const estudiantesUrl = sharedConfig.getServiceUrl('estudiantes');
        await axiosInstance.post(`${estudiantesUrl}/reservas/cancel-by-horario`, {
          maestroId: horario.maestroId,
          dia: horario.dia,
          inicio: horario.inicio,
          fin: horario.fin
        });
      } catch (err) {
        console.error('Error cancelando reservas:', err.message, err.code || '', err.stack || '');
        // No fallar la actualización si falla la cancelación
      }
    }

    const updatedHorario = await Horario.findByIdAndUpdate(id, data, { new: true });
    return updatedHorario;
  }
}

module.exports = new HorariosService();
