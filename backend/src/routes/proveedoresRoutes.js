const express = require('express');
const router = express.Router();
const {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    verificarCampo
} = require('../controllers/proveedoresController.js');

router.get('/', getProveedores);
router.get('/verificar', verificarCampo);
router.get('/:id', getProveedorById);
router.post('/', createProveedor);
router.put('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);

module.exports = router;