const express = require('express');
const router = express.Router();
const {
    getCompras,
    getCompraById,
    getComprasByEstado,
    createCompra,
    updateCompra,
    cambiarEstadoCompra,
    deleteCompra
} = require('../controllers/comprasController.js');

router.get('/', getCompras);
router.get('/estado/:estado', getComprasByEstado);
router.get('/:id', getCompraById);
router.post('/', createCompra);
router.put('/:id', updateCompra);
router.patch('/:id/estado', cambiarEstadoCompra);
router.delete('/:id', deleteCompra);

module.exports = router;