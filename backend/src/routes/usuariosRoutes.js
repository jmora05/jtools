const express = require('express');
const router = express.Router();
const {
    getUsuarios,
    getUsuariosById,
    createUsuarios,
    updateUsuarios,
    deleteUsuarios
} = require('../controllers/usuariosController.js');

router.get('/', getUsuarios);
router.get('/:id', getUsuariosById);
router.post('/', createUsuarios);
router.put('/:id', updateUsuarios);
router.delete('/:id', deleteUsuarios);

module.exports = router;