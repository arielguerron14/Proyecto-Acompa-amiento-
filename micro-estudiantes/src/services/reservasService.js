const Reserva = require('../models/Reserva');
const httpClient = require('../utils/httpClient');

const MAESTROS_URL = process.env.MAESTROS_URL || 'http://micro-maestros:5001';
const REPORTES_EST_URL = process.env.REPORTES_EST_URL || 'http://micro-reportes-estudiantes:5003';
const REPORTES_MAEST_URL = process.env.REPORTES_MAEST_URL || 'http://micro-reportes-maestros:5004';

const REQUIRED_FIELDS = ['estudianteId', 'estudianteName', 'maestroId', 'dia', 'inicio', 'fin'];

class ReservasService {
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
   * Obtiene horario disponible del maestro
   */
  async getAvailableHorario(maestroId, dia, inicio, fin) {
    const url = `${MAESTROS_URL}/horarios/maestro/${maestroId}`;
    const response = await httpClient.getSafe(url);

    if (!response || response.status !== 200) {
      const error = new Error('Maestro not found');
      error.status = 404;
      throw error;
    }

    const match = response.data.find(h => h.dia === dia && h.inicio === inicio && h.fin === fin);
    if (!match) {
      const error = new Error('Horario not available');
      error.status = 404;
      throw error;
    }

    return match;
  }

  /**
   * Verifica que no exista reserva duplicada
   */
  async checkDuplicate(maestroId, dia, inicio) {
    const existing = await Reserva.findOne({ maestroId, dia, inicio });
    if (existing) {
      const error = new Error('Horario ya reservado');
      error.status = 409;
      throw error;
    }
  }

  /**
   * Notifica a los servicios de reportes
   */
  async notifyReportes(reserva) {
    const estPayload = {
      estudianteId: reserva.estudianteId,
      estudianteName: reserva.estudianteName,
      maestroId: reserva.maestroId,
      maestroName: reserva.maestroName,
      dia: reserva.dia,
      inicio: reserva.inicio,
      fin: reserva.fin,
    };

    const maestPayload = {
      maestroId: reserva.maestroId,
      maestroName: reserva.maestroName,
      dia: reserva.dia,
      inicio: reserva.inicio,
      estudianteId: reserva.estudianteId,
      estudianteName: reserva.estudianteName,
    };

    // Fire and forget (no esperamos respuestas)
    await httpClient.postSafe(`${REPORTES_EST_URL}/registrar`, estPayload);
    await httpClient.postSafe(`${REPORTES_MAEST_URL}/registrar`, maestPayload);
  }

  /**
   * Crea una nueva reserva
   */
  async create(data) {
    this.validateRequired(data);
    const { estudianteId, estudianteName, maestroId, dia, inicio, fin } = data;

    // Validar disponibilidad en micro-maestros
    const horario = await this.getAvailableHorario(maestroId, dia, inicio, fin);

    // Validar que no esté duplicada
    await this.checkDuplicate(maestroId, dia, inicio);

    // Crear reserva
    const reserva = await Reserva.create({
      estudianteId,
      estudianteName,
      maestroId,
      maestroName: horario.maestroName || data.maestroName || 'Sin nombre',
      dia,
      inicio,
      fin,
    });

    // Notificar a reportes (asincrónico)
    this.notifyReportes(reserva).catch(() => {}); // Silent fail

    return reserva;
  }

  /**
   * Obtiene reservas por estudiante
   */
  async getByEstudiante(estudianteId) {
    return Reserva.find({ estudianteId }).sort({ createdAt: -1 });
  }

  /**
   * Obtiene reservas por maestro
   */
  async getByMaestro(maestroId) {
    return Reserva.find({ maestroId }).sort({ dia: 1, inicio: 1 });
  }
}

module.exports = new ReservasService();
