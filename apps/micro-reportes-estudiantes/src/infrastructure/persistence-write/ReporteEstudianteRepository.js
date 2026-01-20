const ReporteModel = require('../../models/ReporteEstudiante');
const ReporteEstudiante = require('../../domain/entities/ReporteEstudiante');

class ReporteEstudianteRepository {
  async save(reporte) {
    try {
      const persistenceData = reporte.toPersistence();
      
      if (reporte.id) {
        // Update
        const updated = await ReporteModel.findByIdAndUpdate(reporte.id, persistenceData, { new: true });
        return ReporteEstudiante.fromPersistence(updated);
      } else {
        // Create
        const created = await ReporteModel.create(persistenceData);
        return ReporteEstudiante.fromPersistence(created);
      }
    } catch (err) {
      console.error('[ReporteEstudianteRepository.save]', err.message);
      throw err;
    }
  }

  async findByEstudiante(estudianteId) {
    try {
      const doc = await ReporteModel.findOne({ estudianteId });
      return doc ? ReporteEstudiante.fromPersistence(doc) : null;
    } catch (err) {
      console.error('[ReporteEstudianteRepository.findByEstudiante]', err.message);
      throw err;
    }
  }

  async findById(id) {
    try {
      const doc = await ReporteModel.findById(id);
      return doc ? ReporteEstudiante.fromPersistence(doc) : null;
    } catch (err) {
      console.error('[ReporteEstudianteRepository.findById]', err.message);
      throw err;
    }
  }
}

module.exports = ReporteEstudianteRepository;
