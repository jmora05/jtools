const express = require('express');
const router = express.Router();
const {
    getInsumos,
    getInsumoById,
    getInsumosAgotados,
    getInsumosDisponibles,
    createInsumo,
    updateInsumo,
    cambiarEstadoInsumo,
    deleteInsumo
} = require('../controllers/insumosController.js');

router.get('/', getInsumos);
router.get('/agotados', getInsumosAgotados);
router.get('/disponibles', getInsumosDisponibles);
router.get('/:id', getInsumoById);
router.post('/', createInsumo);
router.put('/:id', updateInsumo);
router.patch('/:id/estado', cambiarEstadoInsumo);
router.delete('/:id', deleteInsumo);

module.exports = router;