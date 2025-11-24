const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesMaestroController');

router.post('/registrar', ctrl.registrarAtencion);
router.get('/reporte/:id', ctrl.getReporteByMaestro);

module.exports = router;
