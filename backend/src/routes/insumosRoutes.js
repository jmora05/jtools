const express = require('express');
const router  = express.Router();
const {
    getInsumos,
    getInsumoById,
    getInsumosDisponibles,
    getInsumosDependencias,
    createInsumo,
    updateInsumo,
    cambiarEstadoInsumo,
    deleteInsumo,
    forceDeleteInsumo,
} = require('../controllers/insumosController');

// GET
router.get('/',                    getInsumos);
router.get('/disponibles',         getInsumosDisponibles);
router.get('/:id/dependencias',    getInsumosDependencias);
router.get('/:id',                 getInsumoById);

// POST
router.post('/', createInsumo);

// PUT
router.put('/:id', updateInsumo);

// PATCH - cambiar estado (disponible / agotado)  ← ruta que usa el frontend
router.patch('/:id/estado', cambiarEstadoInsumo);

// DELETE - soft (marca agotado)
router.delete('/:id', deleteInsumo);

// DELETE - físico (solo si ya está agotado)
router.delete('/:id/force', forceDeleteInsumo);

module.exports = router;