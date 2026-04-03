const express = require('express');
const router  = express.Router();

const {
    getProductos,
    getProductoById,
    getProductosStockBajo,
    createProducto,
    updateProducto,
    deleteProducto,
} = require('../controllers/productosController');

const {
    validarCrearProducto,
    validarActualizarProducto,
    manejarErrores,
} = require('../validators/productoValidator');

router.get('/',           getProductos);
router.get('/stock-bajo', getProductosStockBajo);
router.get('/:id',        getProductoById);

router.post('/',    validarCrearProducto,      manejarErrores, createProducto);
router.put('/:id',  validarActualizarProducto, manejarErrores, updateProducto);
router.delete('/:id', deleteProducto);

module.exports = router;