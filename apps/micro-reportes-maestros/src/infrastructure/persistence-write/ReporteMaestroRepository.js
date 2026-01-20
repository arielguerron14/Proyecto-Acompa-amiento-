const ReporteModel = require('../../models/ReporteMaestro');
const ReporteMaestro = require('../../domain/entities/ReporteMaestro');

class ReporteMaestroRepository {
  async save(reporte) {
    try {
      const persistenceData = reporte.toPersistence();
      
      if (reporte.id) {
        // Update
        const updated = await ReporteModel.findByIdAndUpdate(reporte.id, persistenceData, { new: true });
        return ReporteMaestro.fromPersistence(updated);
      } else {
        // Create
        const created = await ReporteModel.create(persistenceData);
        return ReporteMaestro.fromPersistence(created);
      }
    } catch (err) {
      console.error('[ReporteMaestroRepository.save]', err.message);
      throw err;
    }
  }

  async findByMaestro(maestroId) {
    try {
      const doc = await ReporteModel.findOne({ maestroId });
      return doc ? ReporteMaestro.fromPersistence(doc) : null;
    } catch (err) {
      console.error('[ReporteMaestroRepository.findByMaestro]', err.message);
      throw err;
    }
  }

  async findById(id) {
    try {
      const doc = await ReporteModel.findById(id);
      return doc ? ReporteMaestro.fromPersistence(doc) : null;
    } catch (err) {
      console.error('[ReporteMaestroRepository.findById]', err.message);
      throw err;
    }
  }
}

module.exports = ReporteMaestroRepository;
