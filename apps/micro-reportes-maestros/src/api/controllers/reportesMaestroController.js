const Reporte = require('../models/ReporteMaestro');

module.exports = {
  registrarAtencion: async (req, res) => {
    try {
      const { 
        maestroId, maestroName, dia, inicio, fin, 
        estudianteId, estudianteName,
        materia, semestre, paralelo, modalidad, lugarAtencion
      } = req.body;
      if (!maestroId || !dia || !inicio || !estudianteId) return res.status(400).json({ message: 'Missing fields' });

      let reporte = await Reporte.findOne({ maestroId });
      if (!reporte) {
        reporte = await Reporte.create({
          maestroId,
          maestroName,
          horas: [{ 
            dia, inicio, fin, 
            materia, semestre, paralelo, modalidad, lugarAtencion,
            alumnosAtendidos: 1, 
            alumnos: [{ estudianteId, estudianteName }] 
          }]
        });
        return res.status(201).json(reporte);
      }

      // buscar la hora
      const horaIdx = reporte.horas.findIndex(h => h.dia === dia && h.inicio === inicio);
      if (horaIdx === -1) {
        reporte.horas.push({ 
          dia, inicio, fin, 
          materia, semestre, paralelo, modalidad, lugarAtencion,
          alumnosAtendidos: 1, 
          alumnos: [{ estudianteId, estudianteName }] 
        });
      } else {
        const hora = reporte.horas[horaIdx];
        // prevenir duplicados
        if (!hora.alumnos.some(a => a.estudianteId === estudianteId)) {
          hora.alumnos.push({ estudianteId, estudianteName });
          hora.alumnosAtendidos = hora.alumnos.length;
        }
        // Actualizar campos adicionales si cambieron
        if (materia) hora.materia = materia;
        if (semestre) hora.semestre = semestre;
        if (paralelo) hora.paralelo = paralelo;
        if (modalidad) hora.modalidad = modalidad;
        if (lugarAtencion) hora.lugarAtencion = lugarAtencion;
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
,

  // Get a single reporte by its id
  getReporteByMaestro: async (req, res) => {
    try {
      const id = req.params.id;
      const reporte = await Reporte.findById(id);
      if (!reporte) return res.status(404).json({ message: 'Reporte no encontrado' });
      res.json(reporte);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
  }
};
