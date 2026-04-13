const express = require('express');
const router = express.Router();

const {
    getCompras,
    getCompraById,
    getComprasByEstado,
    createCompra,
    updateCompra,
    cambiarEstadoCompra,
    deleteCompra,
} = require('../controllers/comprasController.js');

const {
    validarCrearCompra,
    validarActualizarCompra,
    validarCambiarEstado,
    validarEliminarCompra,
    validarObtenerPorId,
    validarObtenerPorEstado,
    validarQueryListar,
} = require('../validators/Comprasvalidator.js');

// GET  /                  → listar todas (con filtros opcionales por query)
router.get('/',                 validarQueryListar,      getCompras);

// GET  /estado/:estado    → listar por estado  ⚠️ DEBE ir ANTES de /:id
router.get('/estado/:estado',   validarObtenerPorEstado, getComprasByEstado);

// GET  /:id               → obtener por ID
router.get('/:id',              validarObtenerPorId,     getCompraById);

// POST /                  → crear compra
router.post('/',                validarCrearCompra,      createCompra);

// PUT  /:id               → actualizar compra (solo pendiente)
router.put('/:id',              validarActualizarCompra, updateCompra);

// PATCH /:id/estado       → cambiar estado
router.patch('/:id/estado',     validarCambiarEstado,    cambiarEstadoCompra);

// DELETE /:id             → eliminar (solo pendiente sin detalles)
router.delete('/:id',           validarEliminarCompra,   deleteCompra);

module.exports = router;