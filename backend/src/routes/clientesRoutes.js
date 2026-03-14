const express = require('express');
const router = express.Router();
const {
    getClientes,
    getClienteById,
    getHistorialCliente,
    getClientesActivos,
    createCliente,
    updateCliente,
    deleteCliente
} = require('../controllers/clientesController.js');

router.get('/', getClientes);
router.get('/activos', getClientesActivos);
router.get('/:id/historial', getHistorialCliente);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

module.exports = router;