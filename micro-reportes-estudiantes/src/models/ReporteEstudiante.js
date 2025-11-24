const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  maestroId: Number,
  maestroName: String,
  dia: String,
  inicio: String,
  fin: String,
  duracionHoras: Number // e.g., 1.0
});

const ReporteSchema = new Schema({
  estudianteId: { type: Number, required: true },
  estudianteName: { type: String, required: true },
  items: [ItemSchema],
  totalHoras: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReporteEstudiante', ReporteSchema);
