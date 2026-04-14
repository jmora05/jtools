const express = require('express');
const router = express.Router();
const {
    getRoles,
    getRolesById,
    createRoles,
    updateRoles,
    deleteRoles,
    getRolPermisos,
    setRolPermisos,
    toggleRolActivo
} = require('../controllers/rolesController.js');

router.get('/', getRoles);
router.get('/:id', getRolesById);
router.post('/', createRoles);
router.put('/:id', updateRoles);
router.delete('/:id', deleteRoles);
router.get('/:id/permisos', getRolPermisos);
router.put('/:id/permisos', setRolPermisos);
router.patch('/:id/toggle', toggleRolActivo);

module.exports = router;