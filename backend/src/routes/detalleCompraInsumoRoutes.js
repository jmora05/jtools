const express = require('express');
const router = express.Router();
const {
    getDetallesByCompra,
    getDetalleCompraInsumoById,
    createDetalleCompraInsumo,
    updateDetalleCompraInsumo,
    deleteDetalleCompraInsumo
} = require('../controllers/detalleCompraInsumoController.js');

router.get('/compra/:comprasId', getDetallesByCompra);
router.get('/:id', getDetalleCompraInsumoById);
router.post('/', createDetalleCompraInsumo);
router.put('/:id', updateDetalleCompraInsumo);
router.delete('/:id', deleteDetalleCompraInsumo);

module.exports = router;