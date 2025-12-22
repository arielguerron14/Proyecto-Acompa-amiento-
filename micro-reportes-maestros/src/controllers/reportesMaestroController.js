const Reporte = require('../models/ReporteMaestro');

module.exports = {
  registrarAtencion: async (req, res) => {
    try {
      const { maestroId, maestroName, dia, inicio, estudianteId, estudianteName, fin } = req.body;
      if (!maestroId || !dia || !inicio || !estudianteId) return res.status(400).json({ message: 'Missing fields' });

      let reporte = await Reporte.findOne({ maestroId });
      if (!reporte) {
        reporte = await Reporte.create({
          maestroId,
          maestroName,
          horas: [{ dia, inicio, fin, alumnosAtendidos: 1, alumnos: [{ estudianteId, estudianteName }] }]
        });
        return res.status(201).json(reporte);
      }

      // buscar la hora
      const horaIdx = reporte.horas.findIndex(h => h.dia === dia && h.inicio === inicio);
      if (horaIdx === -1) {
        reporte.horas.push({ dia, inicio, fin, alumnosAtendidos: 1, alumnos: [{ estudianteId, estudianteName }] });
      } else {
        const hora = reporte.horas[horaIdx];
        // prevenir duplicados
        if (!hora.alumnos.some(a => a.estudianteId === estudianteId)) {
          hora.alumnos.push({ estudianteId, estudianteName });
          hora.alumnosAtendidos = hora.alumnos.length;
        }
      }
      reporte.updatedAt = new Date();
      await reporte.save();
      res.status(200).json(reporte);
    } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
  },

  getReportesByMaestro: async (req, res) => {
    try {
      const maestroId = req.params.maestroId;
      const reportes = await Reporte.findOne({ maestroId });
      if (!reportes) return res.status(404).json({ message: 'No reportes found' });
      res.json(reportes);
    } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
  }
};
