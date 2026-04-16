const express = require('express');
const router = express.Router();
const {
    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    desactivarEmpleado,
    puedeEliminarse,
    deleteEmpleadoPermanente
} = require('../controllers/empleadosController.js');

router.get('/', getEmpleados);
router.get('/:id/puede-eliminarse', puedeEliminarse);
router.get('/:id', getEmpleadoById);
router.post('/', createEmpleado);
router.put('/:id/desactivar', desactivarEmpleado);
router.put('/:id', updateEmpleado);
router.delete('/:id', deleteEmpleadoPermanente);

module.exports = router;