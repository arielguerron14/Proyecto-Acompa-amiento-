const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservasController');

router.post('/reservar', ctrl.createReserva);
router.get('/reservas/estudiante/:id', ctrl.getReservasByEstudiante);
router.get('/reservas/maestro/:id', ctrl.getReservasByMaestro);

module.exports = router;
