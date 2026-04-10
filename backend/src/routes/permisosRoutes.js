const express = require('express');
const router = express.Router();
const {
    getPermisos,
    getPermisosById,
    createPermisos,
    updatePermisos,
    deletePermisos,
    syncSystemModules,
    getSystemModules
} = require('../controllers/permisosController.js');

router.get('/', getPermisos);
router.get('/system-modules', getSystemModules);
router.post('/sync-modules', syncSystemModules);
router.get('/:id', getPermisosById);
router.post('/', createPermisos);
router.put('/:id', updatePermisos);
router.delete('/:id', deletePermisos);

module.exports = router;
