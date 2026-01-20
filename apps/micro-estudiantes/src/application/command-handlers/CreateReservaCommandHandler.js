/**
 * CreateReservaCommandHandler
 * Maneja el comando de crear una nueva reserva
 */

const Reserva = require('../../domain/entities/Reserva');
const ReservaRepository = require('../../infrastructure/persistence-write/ReservaRepository');
const httpClient = require('../../utils/httpClient');
const sharedConfig = require('shared-config');

class CreateReservaCommandHandler {
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  async handle(command) {
    try {
      // 1. Normalizar horario fields
      const dia = command.fecha || command.dia || new Date().toISOString().split('T')[0];
      const inicio = command.hora || command.inicio || '00:00';
      const fin = command.fin || command.hora || '00:00';

      // 2. Validar que el usuario no exista duplicado
      const isDuplicate = await this.reservaRepository.checkDuplicate(command.maestroId, dia, inicio);
      if (isDuplicate) {
        const error = new Error('Horario ya reservado');
        error.status = 409;
        throw error;
      }

      // 3. Crear la entidad de reserva (aplicar reglas del dominio)
      const reserva = Reserva.create(
        command.estudianteId,
        command.maestroId,
        command.fecha,
        command.hora,
        dia,
        inicio,
        fin,
        command.asunto,
        command.descripcion,
        command.materia,
        command.semestre,
        command.paralelo,
        command.modalidad,
        command.lugarAtencion
      );

      // 4. Validar las reglas del dominio
      reserva.validate();

      // 5. Persistir la reserva
      const savedReserva = await this.reservaRepository.save(reserva);

      // 6. Notificar a servicios de reportes (fire and forget)
      this.notifyReportes(savedReserva);

      // 7. Retornar resultado
      return {
        success: true,
        message: 'Reserva creada exitosamente',
        reserva: {
          id: savedReserva.id,
          estudianteId: savedReserva.estudianteId,
          maestroId: savedReserva.maestroId,
          dia: savedReserva.dia,
          inicio: savedReserva.inicio,
          fin: savedReserva.fin,
          estado: savedReserva.estado,
          createdAt: savedReserva.createdAt
        }
      };
    } catch (error) {
      console.error(`[CreateReservaCommandHandler] Error: ${error.message}`);
      throw error;
    }
  }

  async notifyReportes(reserva) {
    console.log('[CreateReservaCommandHandler] Notifying reportes services...');
    const getReportesEstUrl = () => sharedConfig.getServiceUrl('reportes-est');
    const getReportesMaestUrl = () => sharedConfig.getServiceUrl('reportes-maest');

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

    const maestPayload = {
      maestroId: reserva.maestroId,
      maestroName: reserva.maestroName,
      materia: reserva.materia,
      semestre: reserva.semestre,
      paralelo: reserva.paralelo,
      dia: reserva.dia,
      inicio: reserva.inicio,
      fin: reserva.fin,
      modalidad: reserva.modalidad,
      lugarAtencion: reserva.lugarAtencion,
      estudianteId: reserva.estudianteId,
      estudianteName: reserva.estudianteName,
    };

    // Fire and forget (no esperamos respuestas)
    await httpClient.postSafe(`${getReportesEstUrl()}/registrar`, estPayload);
    await httpClient.postSafe(`${getReportesMaestUrl()}/registrar`, maestPayload);
  }
}

module.exports = CreateReservaCommandHandler;
