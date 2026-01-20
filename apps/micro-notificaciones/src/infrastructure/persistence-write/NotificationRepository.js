const Notification = require('../../domain/entities/Notification');
const NotificacionesModel = require('../persistence-read/models/notificaciones');

class NotificationRepository {
  async save(notification) {
    try {
      const doc = notification.toPersistence();
      const notificacion = new NotificacionesModel(doc);
      const saved = await notificacion.save();
      return Notification.fromPersistence(saved);
    } catch (error) {
      throw new Error(`Error saving notification: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const doc = await NotificacionesModel.findById(id);
      if (!doc) return null;
      return Notification.fromPersistence(doc);
    } catch (error) {
      throw new Error(`Error finding notification by id: ${error.message}`);
    }
  }

  async findByDestinatario(destinatario) {
    try {
      const docs = await NotificacionesModel.find({ destinatario });
      return docs.map(doc => Notification.fromPersistence(doc));
    } catch (error) {
      throw new Error(`Error finding notifications by destinatario: ${error.message}`);
    }
  }
}

module.exports = NotificationRepository;
