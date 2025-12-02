const NotificacionesService = require('../services/notificacionesService');

/**
 * Envía una notificación por email
 */
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, body, templateId, data } = req.body;

    if (!to || (!body && !templateId)) {
      return res.status(400).json({
        error: 'to, subject, and (body or templateId) are required',
      });
    }

    const result = await NotificacionesService.sendEmail({
      to,
      subject,
      body,
      templateId,
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      result,
    });
  } catch (error) {
    console.error('[notificacionesController.sendEmail]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Envía una notificación por SMS
 */
exports.sendSMS = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'phoneNumber and message are required',
      });
    }

    const result = await NotificacionesService.sendSMS({
      phoneNumber,
      message,
    });

    res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      result,
    });
  } catch (error) {
    console.error('[notificacionesController.sendSMS]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Envía una notificación push
 */
exports.sendPush = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        error: 'userId, title, and body are required',
      });
    }

    const result = await NotificacionesService.sendPush({
      userId,
      title,
      body,
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Push notification sent successfully',
      result,
    });
  } catch (error) {
    console.error('[notificacionesController.sendPush]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Retorna los templates disponibles
 */
exports.getTemplates = (req, res) => {
  const templates = [
    {
      id: 'WELCOME',
      name: 'Bienvenida',
      subject: 'Bienvenido a {{appName}}',
      description: 'Email de bienvenida para nuevos usuarios',
    },
    {
      id: 'PASSWORD_RESET',
      name: 'Reseteo de Contraseña',
      subject: 'Resetea tu contraseña',
      description: 'Email para resetear contraseña',
    },
    {
      id: 'BOOKING_CONFIRMATION',
      name: 'Confirmación de Reserva',
      subject: 'Tu reserva ha sido confirmada',
      description: 'Email de confirmación de reserva',
    },
    {
      id: 'REMINDER',
      name: 'Recordatorio',
      subject: 'Recordatorio: {{eventName}} en {{eventTime}}',
      description: 'Recordatorio de evento próximo',
    },
  ];

  res.status(200).json({
    templates,
  });
};
