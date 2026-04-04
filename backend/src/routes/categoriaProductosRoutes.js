const express = require('express');
const router  = express.Router();

const {
    getCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria,
} = require('../controllers/categoriaProductosController.js');

const {
    validarCrearCategoria,
    validarActualizarCategoria,
    manejarErrores,
} = require('../validators/categoriaValidator');

router.get('/',      getCategorias);
router.get('/:id',   getCategoriaById);

// ▸ El validator actúa ANTES del controlador
router.post('/',    validarCrearCategoria,      manejarErrores, createCategoria);
router.put('/:id',  validarActualizarCategoria, manejarErrores, updateCategoria);
router.delete('/:id', deleteCategoria);

module.exports = router;