const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * Configura el transportador de email
 */
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER || 'demo@ethereal.email',
    pass: process.env.SMTP_PASS || 'demo-password',
  },
});

/**
 * Templates de email
 */
const EMAIL_TEMPLATES = {
  WELCOME: (data) => ({
    subject: `Bienvenido a ${data.appName || 'Nuestro Sistema'}`,
    html: `
      <h1>¡Bienvenido!</h1>
      <p>Hola ${data.name || 'usuario'},</p>
      <p>Tu cuenta ha sido creada exitosamente.</p>
    `,
  }),
  PASSWORD_RESET: (data) => ({
    subject: 'Resetea tu contraseña',
    html: `
      <h1>Reseteo de Contraseña</h1>
      <p>Haz clic en el siguiente enlace para resetear tu contraseña:</p>
      <a href="${data.resetLink || '#'}">Resetear Contraseña</a>
    `,
  }),
  BOOKING_CONFIRMATION: (data) => ({
    subject: 'Tu reserva ha sido confirmada',
    html: `
      <h1>Confirmación de Reserva</h1>
      <p>Tu reserva para ${data.eventName || 'el evento'} ha sido confirmada.</p>
      <p><strong>Fecha:</strong> ${data.eventDate || 'N/A'}</p>
      <p><strong>Hora:</strong> ${data.eventTime || 'N/A'}</p>
    `,
  }),
};

class NotificacionesService {
  /**
   * Envía un email
   */
  static async sendEmail({ to, subject, body, templateId, data }) {
    try {
      let htmlContent = body;

      // Si se proporciona un template, usarlo
      if (templateId && EMAIL_TEMPLATES[templateId]) {
        const template = EMAIL_TEMPLATES[templateId](data || {});
        htmlContent = template.html;
        subject = subject || template.subject;
      }

      const info = await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@sistema.com',
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[NotificacionesService] Email sent to ${to}:`, info.messageId);

      return {
        messageId: info.messageId,
        to,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[NotificacionesService.sendEmail]', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Envía un SMS
   */
  static async sendSMS({ phoneNumber, message }) {
    try {
      // Mock implementation - en producción usar Twilio, AWS SNS, etc.
      console.log(`[NotificacionesService] SMS to ${phoneNumber}: ${message}`);

      const smsId = `SMS-${Date.now()}`;

      return {
        smsId,
        phoneNumber,
        message,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[NotificacionesService.sendSMS]', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Envía una notificación push
   */
  static async sendPush({ userId, title, body, data }) {
    try {
      // Mock implementation - en producción usar Firebase Cloud Messaging, etc.
      console.log(
        `[NotificacionesService] Push to user ${userId}: ${title} - ${body}`
      );

      const pushId = `PUSH-${Date.now()}`;

      return {
        pushId,
        userId,
        title,
        body,
        data,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[NotificacionesService.sendPush]', error);
      throw new Error(`Failed to send push notification: ${error.message}`);
    }
  }
}

module.exports = NotificacionesService;
