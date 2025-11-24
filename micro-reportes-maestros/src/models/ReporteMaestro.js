const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HoraSchema = new Schema({
  dia: String,
  inicio: String,
  fin: String,
  alumnosAtendidos: { type: Number, default: 0 },
  alumnos: [{ estudianteId: Number, estudianteName: String }]
});

const ReporteMaestroSchema = new Schema({
  maestroId: { type: Number, required: true },
  maestroName: String,
  horas: [HoraSchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReporteMaestro', ReporteMaestroSchema);
