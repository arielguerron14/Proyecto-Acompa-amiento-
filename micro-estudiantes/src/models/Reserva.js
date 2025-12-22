const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservaSchema = new Schema({
  estudianteId: { type: String, required: true },
  estudianteName: { type: String, required: true },
  maestroId: { type: String, required: true },
  maestroName: { type: String, required: true },
  materia: { type: String, required: true },
  semestre: { type: String, required: true },
  paralelo: { type: String, required: true },
  dia: { type: String, required: true },
  inicio: { type: String, required: true },
  fin: { type: String, required: true },
  modalidad: { type: String },
  lugarAtencion: { type: String },
  estado: { type: String, default: 'Activa' },
  canceladoAt: { type: Date },
  motivoCancelacion: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reserva', ReservaSchema);
