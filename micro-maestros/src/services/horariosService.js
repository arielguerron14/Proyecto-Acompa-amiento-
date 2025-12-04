const Horario = require('../models/Horario');

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
   * Obtiene todos los horarios con filtros opcionales
   */
  async getAll(filters = {}) {
    const query = {};
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
    return deleted;
  }
}

module.exports = new HorariosService();
