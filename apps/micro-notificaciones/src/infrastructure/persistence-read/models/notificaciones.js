const mongoose = require('mongoose');

const notificacionesSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true,
    },
    destinatario: {
      type: String,
      required: true,
    },
    asunto: {
      type: String,
    },
    contenido: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ['pendiente', 'enviado', 'fallido'],
      default: 'pendiente',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaEnvio: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'notificaciones',
  }
);

module.exports = mongoose.model('Notificaciones', notificacionesSchema);
