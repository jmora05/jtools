const express = require('express');
const router = express.Router();
const {
    getRoles,
    getRolesById,
    createRoles,
    updateRoles,
    deleteRoles,
    getRolPermisos,
    setRolPermisos
} = require('../controllers/rolesController.js');
const { route } = require('./empleadosRoutes.js');

router.get('/', getRoles);
router.get('/:id', getRolesById);
router.post('/', createRoles);
router.put('/:id', updateRoles);
router.delete('/:id', deleteRoles);
router.post('/:id/permisos', getRolPermisos);
router.put('/:id/permisos', setRolPermisos);

module.exports = router;