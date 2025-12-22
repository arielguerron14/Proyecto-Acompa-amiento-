const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HorarioSchema = new Schema({
  maestroId: { type: String, required: true }, // Changed from Number to String to match user IDs
  maestroName: { type: String, required: true },
  semestre: { type: String, required: true },
  materia: { type: String, required: true },
  paralelo: { type: String, required: true },
  dia: { type: String, required: true }, // "Lunes"
  inicio: { type: String, required: true }, // "10:00"
  fin: { type: String, required: true }, // "11:00"
  modalidad: { type: String, default: 'Presencial' },
  lugarAtencion: { type: String },
  cupoMaximo: { type: Number, default: 30 },
  estado: { type: String, default: 'Activo' },
  observaciones: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Horario', HorarioSchema);
