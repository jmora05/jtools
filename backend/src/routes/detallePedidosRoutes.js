const express = require('express');
const router = express.Router();
const {
    getDetallesByPedido,
    getDetallePedidoById,
    createDetallePedido,
    updateDetallePedido,
    deleteDetallePedido
} = require('../controllers/detallePedidosController.js');

router.get('/pedido/:pedidosId', getDetallesByPedido);
router.get('/:id', getDetallePedidoById);
router.post('/', createDetallePedido);
router.put('/:id', updateDetallePedido);
router.delete('/:id', deleteDetallePedido);

module.exports = router;