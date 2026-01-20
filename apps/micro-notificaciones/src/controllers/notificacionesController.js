const SendEmailCommand = require('../application/commands/SendEmailCommand');
const SendSMSCommand = require('../application/commands/SendSMSCommand');
const SendPushCommand = require('../application/commands/SendPushCommand');
const GetTemplatesQuery = require('../application/queries/GetTemplatesQuery');

/**
 * Envía una notificación por email
 */
exports.sendEmail = async (req, res, commandBus) => {
  try {
    const { to, subject, body, templateId, data } = req.body;

    if (!to || (!body && !templateId)) {
      return res.status(400).json({
        error: 'to and (body or templateId) are required',
      });
    }

    const command = new SendEmailCommand(to, subject, body, templateId, data);
    const result = await commandBus.execute(command);

    res.status(result.status || 200).json({
      success: true,
      message: result.message,
      data: result.result,
    });
  } catch (error) {
    console.error('[notificacionesController.sendEmail]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Envía una notificación por SMS
 */
exports.sendSMS = async (req, res, commandBus) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'phoneNumber and message are required',
      });
    }

    const command = new SendSMSCommand(phoneNumber, message);
    const result = await commandBus.execute(command);

    res.status(result.status || 200).json({
      success: true,
      message: result.message,
      data: result.result,
    });
  } catch (error) {
    console.error('[notificacionesController.sendSMS]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Envía una notificación push
 */
exports.sendPush = async (req, res, commandBus) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        error: 'userId, title, and body are required',
      });
    }

    const command = new SendPushCommand(userId, title, body, data);
    const result = await commandBus.execute(command);

    res.status(result.status || 200).json({
      success: true,
      message: result.message,
      data: result.result,
    });
  } catch (error) {
    console.error('[notificacionesController.sendPush]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Retorna los templates disponibles
 */
exports.getTemplates = async (req, res, queryBus) => {
  try {
    const query = new GetTemplatesQuery();
    const result = await queryBus.execute(query);

    res.status(result.status || 200).json({
      templates: result.data || [],
    });
  } catch (error) {
    console.error('[notificacionesController.getTemplates]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};
