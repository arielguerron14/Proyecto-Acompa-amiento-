const Notification = require('../../domain/entities/Notification');

class SendSMSCommandHandler {
  constructor(notificationRepository, notificacionesService) {
    this.notificationRepository = notificationRepository;
    this.notificacionesService = notificacionesService;
  }

  async handle(command) {
    try {
      // Create domain entity
      const notification = Notification.create(
        'sms',
        command.phoneNumber,
        null,
        command.message
      );

      // Save notification log for audit trail
      await this.notificationRepository.save(notification);

      // Delegate to service for actual sending
      const result = await this.notificacionesService.enviarSMS({
        phoneNumber: command.phoneNumber,
        message: command.message,
      });

      return {
        status: 200,
        message: 'SMS sent successfully',
        result,
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error sending SMS',
      };
    }
  }
}

module.exports = SendSMSCommandHandler;
