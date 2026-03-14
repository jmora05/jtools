const express = require('express');
const router = express.Router();
const {
    getProductos,
    getProductoById,
    getProductosStockBajo,
    createProducto,
    updateProducto,
    deleteProducto
} = require('../controllers/productosController.js');

router.get('/', getProductos);
router.get('/stock-bajo', getProductosStockBajo);
router.get('/:id', getProductoById);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

module.exports = router;