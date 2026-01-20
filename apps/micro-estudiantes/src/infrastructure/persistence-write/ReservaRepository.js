/**
 * ReservaRepository Implementation
 * Implementación del repositorio de reservas usando MongoDB
 */

const Reserva = require('../../domain/entities/Reserva');
const ReservaModel = require('../../models/Reserva');

class ReservaRepository {
  async save(reserva) {
    try {
      const persistenceData = reserva.toPersistence();

      // Usar findByIdAndUpdate para upsert, o crear uno nuevo
      let result;
      if (persistenceData._id) {
        result = await ReservaModel.findByIdAndUpdate(
          persistenceData._id,
          persistenceData,
          { upsert: true, new: true }
        );
      } else {
        // Crear nuevo documento
        result = await ReservaModel.create(persistenceData);
      }

      console.log(`[ReservaRepository] Reserva saved: ${result._id}`);
      return Reserva.fromPersistence(result);
    } catch (error) {
      console.error(`[ReservaRepository] Save error: ${error.message}`);
      throw error;
    }
  }

  async findById(id) {
    try {
      const document = await ReservaModel.findById(id);
      if (!document) return null;

      return Reserva.fromPersistence(document);
    } catch (error) {
      console.error(`[ReservaRepository] FindById error: ${error.message}`);
      throw error;
    }
  }

  async findByEstudiante(estudianteId) {
    try {
      const documents = await ReservaModel.find({ estudianteId, estado: { $ne: 'Cancelada' } });
      return documents.map(doc => Reserva.fromPersistence(doc));
    } catch (error) {
      console.error(`[ReservaRepository] FindByEstudiante error: ${error.message}`);
      throw error;
    }
  }

  async findByMaestro(maestroId) {
    try {
      const documents = await ReservaModel.find({ maestroId, estado: { $ne: 'Cancelada' } });
      return documents.map(doc => Reserva.fromPersistence(doc));
    } catch (error) {
      console.error(`[ReservaRepository] FindByMaestro error: ${error.message}`);
      throw error;
    }
  }

  async checkDuplicate(maestroId, dia, inicio) {
    try {
      const existing = await ReservaModel.findOne({ maestroId, dia, inicio, estado: { $ne: 'Cancelada' } });
      return !!existing;
    } catch (error) {
      console.error(`[ReservaRepository] CheckDuplicate error: ${error.message}`);
      throw error;
    }
  }

  async isAvailable(maestroId, dia, inicio) {
    try {
      const existing = await ReservaModel.findOne({ maestroId, dia, inicio, estado: { $ne: 'Cancelada' } });
      return !existing;
    } catch (error) {
      console.error(`[ReservaRepository] IsAvailable error: ${error.message}`);
      throw error;
    }
  }

  async delete(id) {
    try {
      await ReservaModel.findByIdAndDelete(id);
      console.log(`[ReservaRepository] Reserva deleted: ${id}`);
    } catch (error) {
      console.error(`[ReservaRepository] Delete error: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    try {
      const documents = await ReservaModel.find({});
      return documents.map(doc => Reserva.fromPersistence(doc));
    } catch (error) {
      console.error(`[ReservaRepository] FindAll error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ReservaRepository;
