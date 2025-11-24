const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HorarioSchema = new Schema({
  maestroId: { type: Number, required: true }, // id lógico (puede ser auto generado por tu propio sistema)
  maestroName: { type: String, required: true },
  semestre: { type: String, required: true },
  materia: { type: String, required: true },
  paralelo: { type: String, required: true },
  dia: { type: String, required: true }, // "Lunes"
  inicio: { type: String, required: true }, // "10:00"
  fin: { type: String, required: true }, // "11:00"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Horario', HorarioSchema);
