const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/horariosController');

router.post('/horarios', ctrl.createHorario);
router.put('/horarios/:id', ctrl.updateHorario);
router.get('/horarios/maestro/:id', ctrl.getHorariosByMaestro);
router.get('/horarios/reportes/:maestroId', ctrl.getHorariosReportes);
router.get('/horarios', ctrl.getAllHorarios);
router.delete('/horarios/:id', ctrl.deleteHorario);

module.exports = router;
