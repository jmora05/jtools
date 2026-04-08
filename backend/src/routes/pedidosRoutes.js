const express = require('express');
const router = express.Router();
const {
    getPedidos,
    getPedidoById,
    createPedido,
    updatePedido,
    deletePedido
} = require('../controllers/pedidosController.js');
const {
    validateCreatePedido,
    validateUpdatePedido,
    validateParamId
} = require('../validators/pedidosValidator.js');
 
router.get('/', getPedidos);
router.get('/:id', validateParamId, getPedidoById);
router.post('/', validateCreatePedido, createPedido);
router.put('/:id', validateParamId, validateUpdatePedido, updatePedido);
router.delete('/:id', validateParamId, deletePedido);
 
module.exports = router;