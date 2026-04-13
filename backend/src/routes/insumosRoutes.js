const express = require('express');
const router = express.Router();
const {
    getInsumos,
    getInsumoById,
    getInsumosActivos,
    getInsumosBajoStock,
    createInsumo,
    updateInsumo,
    deleteInsumo,
    forceDeleteInsumo,
} = require('../controllers/insumosController.js');

router.get('/', getInsumos);
router.get('/activos', getInsumosActivos);
router.get('/bajo-stock', getInsumosBajoStock);
router.get('/:id', getInsumoById);
router.post('/', createInsumo);
router.put('/:id', updateInsumo);
router.delete('/:id/force', forceDeleteInsumo);
router.delete('/:id', deleteInsumo);

module.exports = router;