const HorarioModel = require('../../models/Horario');
const Horario = require('../../domain/entities/Horario');

class HorarioRepository {
  async save(horario) {
    try {
      const persistenceData = horario.toPersistence();
      
      if (horario.id) {
        // Update
        const updated = await HorarioModel.findByIdAndUpdate(horario.id, persistenceData, { new: true });
        return Horario.fromPersistence(updated);
      } else {
        // Create
        const created = await HorarioModel.create(persistenceData);
        return Horario.fromPersistence(created);
      }
    } catch (err) {
      console.error('[HorarioRepository.save]', err.message);
      throw err;
    }
  }

  async findById(id) {
    try {
      const doc = await HorarioModel.findById(id);
      return doc ? Horario.fromPersistence(doc) : null;
    } catch (err) {
      console.error('[HorarioRepository.findById]', err.message);
      throw err;
    }
  }

  async findByMaestro(maestroId) {
    try {
      const docs = await HorarioModel.find({ maestroId }).sort({ dia: 1, inicio: 1 });
      return docs.map(doc => Horario.fromPersistence(doc));
    } catch (err) {
      console.error('[HorarioRepository.findByMaestro]', err.message);
      throw err;
    }
  }

  async findAll(filters = {}) {
    try {
      const docs = await HorarioModel.find(filters).sort({ dia: 1, inicio: 1 });
      return docs.map(doc => Horario.fromPersistence(doc));
    } catch (err) {
      console.error('[HorarioRepository.findAll]', err.message);
      throw err;
    }
  }

  async checkOverlap(maestroId, dia, inicio, fin, excludeId = null) {
    try {
      const query = { maestroId, dia };
      if (excludeId) query._id = { $ne: excludeId };

      const existentes = await HorarioModel.find(query);
      return existentes.some(e => !(fin <= e.inicio || inicio >= e.fin));
    } catch (err) {
      console.error('[HorarioRepository.checkOverlap]', err.message);
      throw err;
    }
  }

  async delete(id) {
    try {
      await HorarioModel.findByIdAndDelete(id);
    } catch (err) {
      console.error('[HorarioRepository.delete]', err.message);
      throw err;
    }
  }
}

module.exports = HorarioRepository;
