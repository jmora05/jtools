const express = require('express');
const router = express.Router();
const {
    getUsuarios,
    getUsuariosById,
    createUsuarios,
    updateUsuarios,
    toggleUsuarioEstado,
    deleteUsuarios
} = require('../controllers/usuariosController.js');

router.get('/', getUsuarios);
router.get('/:id', getUsuariosById);
router.post('/', createUsuarios);
router.put('/:id', updateUsuarios);
router.patch('/:id/toggle', toggleUsuarioEstado); 
router.delete('/:id', deleteUsuarios);

module.exports = router;