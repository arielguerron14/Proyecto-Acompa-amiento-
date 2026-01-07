const Reserva = require('../models/Reserva');
const httpClient = require('../utils/httpClient');

const MAESTROS_URL = process.env.MAESTROS_URL || 'http://13.223.196.229:3002';
const REPORTES_EST_URL = process.env.REPORTES_EST_URL || 'http://100.28.217.159:5003';
const REPORTES_MAEST_URL = process.env.REPORTES_MAEST_URL || 'http://100.28.217.159:5004';

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
    const url = `${MAESTROS_URL}/horarios/maestro/${maestroId}`;
    console.log('DEBUG: Calling URL:', url);
    const response = await httpClient.getSafe(url);
    console.log('DEBUG: httpClient.getSafe returned:', response ? 'response' : 'null');

    if (!response || response.status !== 200) {
      console.log('DEBUG: No response or bad status:', response?.status);
      const error = new Error('Maestro not found');
      error.status = 404;
      throw error;
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
    await httpClient.postSafe(`${REPORTES_EST_URL}/registrar`, estPayload);
    await httpClient.postSafe(`${REPORTES_MAEST_URL}/registrar`, maestPayload);
  }

  /**
   * Crea una nueva reserva
   * Soporta dos formatos:
   * 1. Formato antiguo: { estudianteId, estudianteName, maestroId, dia, inicio, fin, ... }
   * 2. Formato nuevo: { estudianteId, maestroId, fecha, hora, asunto, descripcion }
   */
  async create(data) {
    console.log('DEBUG: Starting create reserva with data:', data);
    this.validateRequired(data);
    
    // Soportar ambos formatos
    let reserva;
    
    // Si tiene fecha/hora (formato nuevo), crear directamente sin validar con maestros
    if (data.fecha && data.hora) {
      console.log('DEBUG: Formato nuevo (fecha/hora) detectado');
      reserva = await Reserva.create({
        estudianteId: data.estudianteId,
        estudianteName: data.name || data.estudianteName || 'Usuario',
        maestroId: data.maestroId,
        maestroName: data.maestroName || 'Sin asignar',
        materia: data.asunto || data.materia || 'Sin especificar',
        semestre: data.semestre || '2026-01',
        paralelo: data.paralelo || 'A',
        dia: data.fecha,
        inicio: data.hora,
        fin: data.hora,
        modalidad: data.modalidad || 'Virtual',
        lugarAtencion: data.lugarAtencion || 'Por definir',
        estado: 'Activa'
      });
    } else if (data.dia && data.inicio && data.fin) {
      // Formato antiguo: validar con maestros
      console.log('DEBUG: Formato antiguo (dia/inicio/fin) detectado');
      const { estudianteId, estudianteName, maestroId, dia, inicio, fin } = data;
      
      // Validar disponibilidad en micro-maestros
      console.log('DEBUG: Calling getAvailableHorario');
      const horario = await this.getAvailableHorario(maestroId, dia, inicio, fin);
      console.log('DEBUG: getAvailableHorario returned:', horario);

      // Validar que no esté duplicada
      console.log('DEBUG: Calling checkDuplicate');
      await this.checkDuplicate(maestroId, dia, inicio, fin);
      console.log('DEBUG: checkDuplicate passed');

      // Crear reserva
      console.log('DEBUG: Creating reserva in database');
      reserva = await Reserva.create({
        estudianteId,
        estudianteName,
        maestroId,
        maestroName: horario.maestroName || data.maestroName || 'Sin nombre',
        materia: horario.materia,
        semestre: horario.semestre,
        paralelo: horario.paralelo,
        dia,
        inicio,
        fin,
        modalidad: horario.modalidad,
        lugarAtencion: horario.lugarAtencion
      });
    } else {
      const error = new Error('Se requiere: (fecha, hora) o (dia, inicio, fin)');
      error.status = 400;
      throw error;
    }
    
    console.log('DEBUG: Reserva created:', reserva._id);

    // Notificar a reportes (ignorar errores)
    try {
      await this.notifyReportes(reserva);
    } catch (e) {
      console.log('DEBUG: Error notificando reportes (ignorado):', e.message);
    }

    console.log('DEBUG: Returning reserva');
    return { success: true, data: reserva };
  }

  /**
   * Obtiene reservas por estudiante
   */
  async getByEstudiante(estudianteId) {
    console.log('DEBUG: getByEstudiante called with:', estudianteId);
    try {
      const result = await Reserva.find({ estudianteId, estado: { $ne: 'Cancelada' } }).sort({ createdAt: -1 });
      console.log('DEBUG: getByEstudiante found:', result.length, 'reservas');
      return result;
    } catch (err) {
      console.log('DEBUG: getByEstudiante error:', err.message, err.stack);
      throw err;
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
