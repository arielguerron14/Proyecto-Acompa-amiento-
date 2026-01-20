const Notification = require('../../domain/entities/Notification');

class SendPushCommandHandler {
  constructor(notificationRepository, notificacionesService) {
    this.notificationRepository = notificationRepository;
    this.notificacionesService = notificacionesService;
  }

  async handle(command) {
    try {
      // Create domain entity
      const notification = Notification.create(
        'push',
        command.userId,
        command.title,
        command.body
      );

      // Save notification log for audit trail
      await this.notificationRepository.save(notification);

      // Delegate to service for actual sending
      const result = await this.notificacionesService.enviarPush({
        userId: command.userId,
        title: command.title,
        body: command.body,
        data: command.data,
      });

      return {
        status: 200,
        message: 'Push notification sent successfully',
        result,
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error sending push notification',
      };
    }
  }
}

module.exports = SendPushCommandHandler;
