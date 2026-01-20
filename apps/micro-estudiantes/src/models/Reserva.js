const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservaSchema = new Schema({
  estudianteId: { type: String, required: true },
  estudianteName: { type: String, required: false, default: 'Usuario' },
  maestroId: { type: String, required: true },
  maestroName: { type: String, required: false, default: 'Sin asignar' },
  materia: { type: String, required: false, default: 'Sin especificar' },
  semestre: { type: String, required: false, default: '2026-01' },
  paralelo: { type: String, required: false, default: 'A' },
  dia: { type: String, required: true },
  inicio: { type: String, required: true },
  fin: { type: String, required: false },
  modalidad: { type: String, required: false, default: 'Virtual' },
  lugarAtencion: { type: String, required: false, default: 'Por definir' },
  estado: { type: String, default: 'Activa' },
  canceladoAt: { type: Date },
  motivoCancelacion: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Ensure no active duplicate reservations for same estudiante+maestro+dia+inicio
// Use a partial unique index so cancelled reservations can be re-created
ReservaSchema.index(
  { estudianteId: 1, maestroId: 1, dia: 1, inicio: 1 },
  { unique: true, partialFilterExpression: { estado: 'Activa' } }
);

module.exports = mongoose.model('Reserva', ReservaSchema);
