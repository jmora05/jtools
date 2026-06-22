const express = require('express');
const router = express.Router();
const {
    getVentas,
    getVentaById,
    createVenta,
    updateVenta,
    deleteVenta,
    anularVenta,
    cambiarEstadoVenta,
    completarPedido,
} = require('../controllers/ventasController.js');

router.get('/', getVentas);
router.get('/:id', getVentaById);
router.post('/', createVenta);
router.put('/:id', updateVenta);
router.patch('/:id/anular', anularVenta);
router.patch('/:id/estado', cambiarEstadoVenta);
router.patch('/:id/completar', completarPedido);
router.delete('/:id', deleteVenta);

module.exports = router;