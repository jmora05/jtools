const express = require('express');
const router = express.Router();
const {
    getNominas,
    getNominaById,
    getNominasByEmpleado,
    createNomina,
    updateNomina,
    marcarComoPagada,
    deleteNomina,
} = require('../controllers/nominaController');

router.get('/',                        getNominas);
router.get('/empleado/:empleadoId',    getNominasByEmpleado);
router.get('/:id',                     getNominaById);
router.post('/',                       createNomina);
router.put('/:id/pagar',              marcarComoPagada);
router.put('/:id',                     updateNomina);
router.delete('/:id',                  deleteNomina);

module.exports = router;
