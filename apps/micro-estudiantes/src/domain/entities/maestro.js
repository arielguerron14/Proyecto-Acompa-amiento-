const mongoose = require('mongoose');

const MaestroSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  nombre: { type: String, required: true },
  materia: { type: String, required: true }
});

module.exports = mongoose.model('Maestro', MaestroSchema, 'maestros');
