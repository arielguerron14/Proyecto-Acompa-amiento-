const Reserva = require('../models/Reserva');
const Maestro = require('../models/maestro');
const httpClient = require('../utils/httpClient');
const sharedConfig = require('../../../shared-config');

// URLs de servicios centralizadas
const getMaestrosUrl = () => sharedConfig.getServiceUrl('maestros');
const getReportesEstUrl = () => sharedConfig.getServiceUrl('reportes-est');
const getReportesMaestUrl = () => sharedConfig.getServiceUrl('reportes-maest');

const REQUIRED_FIELDS = ['estudianteId', 'maestroId'];

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
    console.log('DEBUG: getAvailableHorario called with:', { maestroId, dia, inicio, fin });
    const url = `${getMaestrosUrl()}/horarios/maestro/${maestroId}`;
    console.log('DEBUG: Calling URL:', url);
    let response = null;
    try {
      response = await httpClient.getSafe(url);
    } catch (e) {
      console.log('DEBUG: Error calling maestros service:', e.message);
    }
    console.log('DEBUG: httpClient.getSafe returned:', response ? 'response' : 'null');

    if (!response || response.status !== 200) {
      // Fallback: buscar maestro localmente
      const maestro = await Maestro.findById(maestroId);
      if (!maestro) {
        console.log('DEBUG: Maestro not found ni en microservicio ni en local');
        const error = new Error('Maestro not found');
        error.status = 404;
        throw error;
      }
      // Si no hay horarios, permitir solo si es entorno local/dev
      return { dia, inicio, fin };
    }

    console.log('DEBUG: Response data:', response.data);
    const match = response.data.horarios.find(h => h.dia === dia && h.inicio === inicio && h.fin === fin);
    console.log('DEBUG: Found match:', match);
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
    const existing = await Reserva.findOne({ maestroId, dia, inicio, estado: { $ne: 'Cancelada' } });
    if (existing) {
      const error = new Error('Horario ya reservado');
      error.status = 409;
      throw error;
    }
  }

  /**
   * Check if a horario is available (not reserved)
   * Returns true if available, false if already reserved
   */
  async isAvailable(maestroId, dia, inicio) {
    const existing = await Reserva.findOne({ maestroId, dia, inicio, estado: { $ne: 'Cancelada' } });
    return !existing;
  }

  /**
   * Notifica a los servicios de reportes
   */
  async notifyReportes(reserva) {
    console.log('DEBUG: notifyReportes called with reserva:', reserva);
    const estPayload = {
      estudianteId: reserva.estudianteId,
      estudianteName: reserva.estudianteName,
      maestroId: reserva.maestroId,
      maestroName: reserva.maestroName,
      materia: reserva.materia,
      semestre: reserva.semestre,
      paralelo: reserva.paralelo,
      dia: reserva.dia,
      inicio: reserva.inicio,
      fin: reserva.fin,
      modalidad: reserva.modalidad,
      lugarAtencion: reserva.lugarAtencion
    };
    console.log('DEBUG: estPayload to send:', estPayload);

    const maestPayload = {
      maestroId: reserva.maestroId,
      maestroName: reserva.maestroName,
      dia: reserva.dia,
      inicio: reserva.inicio,
      fin: reserva.fin,
      estudianteId: reserva.estudianteId,
      estudianteName: reserva.estudianteName,
    };

    // Fire and forget (no esperamos respuestas)
    await httpClient.postSafe(`${getReportesEstUrl()}/registrar`, estPayload);
    await httpClient.postSafe(`${getReportesMaestUrl()}/registrar`, maestPayload);
  }

  /**
   * Crea una nueva reserva - SIMPLIFICADO
   * Soporta: { estudianteId, maestroId, fecha, hora, asunto, descripcion }
   */
  async create(data) {
    try {
      console.log('DEBUG: create() called with:', data);
      
      // Validar campos minimos
      if (!data.estudianteId || !data.maestroId) {
        const error = new Error('estudianteId y maestroId son requeridos');
        error.status = 400;
        throw error;
      }
      // Normalize horario fields
      const dia = data.fecha || data.dia || new Date().toISOString().split('T')[0];
      const inicio = data.hora || data.inicio || '00:00';
      const fin = data.fin || data.hora || '00:00';

      // Prevent duplicate active reservations for the same slot
      await this.checkDuplicate(data.maestroId, dia, inicio);

      // Crear reserva
      let reserva;
      try {
        reserva = await Reserva.create({
        estudianteId: data.estudianteId,
        estudianteName: data.estudianteName || 'Usuario',
        maestroId: data.maestroId,
        maestroName: data.maestroName || 'Sin asignar',
        materia: data.asunto || data.materia || 'Sin especificar',
        semestre: data.semestre || '2026-01',
        paralelo: data.paralelo || 'A',
        dia,
        inicio,
        fin,
        modalidad: data.modalidad || 'Virtual',
        lugarAtencion: data.lugarAtencion || 'Por definir',
        estado: 'Activa'
      });
      } catch (err) {
        // Handle duplicate key error from MongoDB (race condition)
        if (err && err.code === 11000) {
          const e = new Error('Horario ya reservado');
          e.status = 409;
          throw e;
        }
        throw err;
      }

      console.log('DEBUG: Reserva created successfully:', reserva._id);
      // Fire-and-forget notify report services
      this.notifyReportes(reserva).catch(e => console.warn('notifyReportes failed:', e && e.message));
      return { success: true, data: reserva };
    } catch (err) {
      console.error('DEBUG: Error in create():', err.message);
      throw err;
    }
  }

  /**
   * Obtiene reservas por estudiante
   */
  async getByEstudiante(estudianteId) {
    console.log('DEBUG: getByEstudiante called with:', estudianteId);

    // Validate input
    if (!estudianteId || typeof estudianteId !== 'string') {
      console.warn('getByEstudiante: invalid estudianteId provided');
      return [];
    }

    try {
      const list = await Reserva.find({ estudianteId }).sort({ dia: 1, inicio: 1 });
      return list || [];
    } catch (err) {
      console.error('ERROR: getByEstudiante DB error:', err && err.stack ? err.stack : err);
      const error = new Error('Error al obtener reservas del estudiante');
      error.status = 500;
      throw error;
    }
  }

  /**
   * Obtiene reservas por maestro
   */
  async getByMaestro(maestroId) {
    return Reserva.find({ maestroId }).sort({ dia: 1, inicio: 1 });
  }

  /**
   * Cancela una reserva por ID
   */
  async cancelById(id) {
    const reserva = await Reserva.findById(id);
    if (!reserva) {
      const error = new Error('Reserva no encontrada');
      error.status = 404;
      throw error;
    }
    if (reserva.estado !== 'Activa') {
      const error = new Error('La reserva ya está cancelada');
      error.status = 400;
      throw error;
    }
    reserva.estado = 'Cancelada';
    reserva.canceladoAt = new Date();
    reserva.motivoCancelacion = 'Cancelada por el estudiante';
    await reserva.save();
    return reserva;
  }

  /**
   * Cancela reservas por horario (cuando el maestro desactiva el horario)
   */
  async cancelByHorario(maestroId, dia, inicio, fin) {
    const result = await Reserva.updateMany(
      { maestroId, dia, inicio, fin, estado: 'Activa' },
      {
        estado: 'Cancelada',
        canceladoAt: new Date(),
        motivoCancelacion: 'Horario desactivado por el maestro'
      }
    );
    return result.modifiedCount;
  }
}

module.exports = new ReservasService();
