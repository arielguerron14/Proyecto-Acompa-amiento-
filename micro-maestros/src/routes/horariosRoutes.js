const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/horariosController');

router.post('/horarios', ctrl.createHorario);
router.get('/horarios/maestro/:id', ctrl.getHorariosByMaestro);
router.get('/horarios', ctrl.getAllHorarios);
router.delete('/horarios/:id', ctrl.deleteHorario);

module.exports = router;
