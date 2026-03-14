const express = require('express');
const router = express.Router();
const {
    getDetallesByVenta,
    getDetalleVentaById,
    createDetalleVenta,
    updateDetalleVenta,
    deleteDetalleVenta
} = require('../controllers/detalleVentasController.js');

router.get('/venta/:ventasId', getDetallesByVenta);
router.get('/:id', getDetalleVentaById);
router.post('/', createDetalleVenta);
router.put('/:id', updateDetalleVenta);
router.delete('/:id', deleteDetalleVenta);

module.exports = router;