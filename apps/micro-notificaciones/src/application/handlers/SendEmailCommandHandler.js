const Notification = require('../../domain/entities/Notification');

class SendEmailCommandHandler {
  constructor(notificationRepository, notificacionesService) {
    this.notificationRepository = notificationRepository;
    this.notificacionesService = notificacionesService;
  }

  async handle(command) {
    try {
      // Create domain entity
      const notification = Notification.create(
        'email',
        command.to,
        command.subject || 'Sin asunto',
        command.body || 'Contenido cargado desde plantilla'
      );

      // Save notification log for audit trail
      await this.notificationRepository.save(notification);

      // Delegate to service for actual sending
      const result = await this.notificacionesService.enviarEmail({
        to: command.to,
        subject: command.subject,
        body: command.body,
        templateId: command.templateId,
        data: command.data,
      });

      return {
        status: 200,
        message: 'Email sent successfully',
        result,
      };
    } catch (error) {
      const status = error.status || 500;
      throw {
        status,
        message: error.message || 'Error sending email',
      };
    }
  }
}

module.exports = SendEmailCommandHandler;
