const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservaSchema = new Schema({
  estudianteId: { type: String, required: true },
  estudianteName: { type: String, required: true },
  maestroId: { type: Number, required: true },
  maestroName: { type: String, required: true },
  dia: { type: String, required: true },
  inicio: { type: String, required: true },
  fin: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reserva', ReservaSchema);
