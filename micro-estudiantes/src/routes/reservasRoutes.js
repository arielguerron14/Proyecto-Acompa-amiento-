const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservasController');

router.post('/reservar', ctrl.createReserva);
router.get('/reservas/estudiante/:id', ctrl.getReservasByEstudiante);
router.get('/reservas/maestro/:id', ctrl.getReservasByMaestro);
router.post('/reservas/cancel-by-horario', ctrl.cancelReservasByHorario);
router.put('/reservas/:id/cancel', ctrl.cancelReserva);

module.exports = router;
