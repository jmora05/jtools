const express = require('express');
const router = express.Router();
const {
    getInsumosByProducto,
    getProductosByInsumo,
    getInsumoProductoById,
    createInsumoProducto,
    updateInsumoProducto,
    deleteInsumoProducto
} = require('../controllers/insumoProductoController.js');

router.get('/producto/:productosId', getInsumosByProducto);
router.get('/insumo/:insumosId', getProductosByInsumo);
router.get('/:id', getInsumoProductoById);
router.post('/', createInsumoProducto);
router.put('/:id', updateInsumoProducto);
router.delete('/:id', deleteInsumoProducto);

module.exports = router;