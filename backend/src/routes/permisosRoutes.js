const express = require('express');
const router = express.Router();
const {
    getPermisos,
    getPermisosById,
    createPermisos,
    updatePermisos,
    deletePermisos
} = require('../controllers/permisosController.js');

router.get('/', getPermisos);
router.get('/:id', getPermisosById);
router.post('/', createPermisos);
router.put('/:id', updatePermisos);
router.delete('/:id', deletePermisos);

module.exports = router;