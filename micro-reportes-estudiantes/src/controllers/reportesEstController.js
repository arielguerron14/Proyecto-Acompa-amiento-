const Reporte = require('../models/ReporteEstudiante');

function calcularDuracion(inicio, fin){
  // formato "HH:MM"
  const [hi,mi] = inicio.split(':').map(Number);
  const [hf,mf] = fin.split(':').map(Number);
  const start = hi + mi/60;
  const end = hf + mf/60;
  return Math.max(0, end - start);
}

module.exports = {
  registrarEvento: async (req, res) => {
    try {
      const { estudianteId, estudianteName, maestroId, maestroName, dia, inicio, fin } = req.body;
      if (!estudianteId || !maestroId || !dia || !inicio || !fin) return res.status(400).json({ message: 'Missing fields' });

      const dur = calcularDuracion(inicio, fin);

      let reporte = await Reporte.findOne({ estudianteId });
      if (!reporte) {
        reporte = await Reporte.create({
          estudianteId,
          estudianteName,
          items: [{ maestroId, maestroName, dia, inicio, fin, duracionHoras: dur }],
          totalHoras: dur
        });
      } else {
        reporte.items.push({ maestroId, maestroName, dia, inicio, fin, duracionHoras: dur });
        reporte.totalHoras = (reporte.totalHoras || 0) + dur;
        reporte.updatedAt = new Date();
        await reporte.save();
      }

      res.status(201).json(reporte);
    } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
  },

  getReporteByEstudiante: async (req, res) => {
    try {
      const id = Number(req.params.id);
      const rep = await Reporte.findOne({ estudianteId: id });
      if (!rep) return res.status(404).json({ message: 'Reporte no encontrado' });
      res.json(rep);
    } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
  }
};
