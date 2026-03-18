const express = require('express');
const router = express.Router();
const {
    getRoles,
    getRolesById,
    createRoles,
    updateRoles,
    deleteRoles
} = require('../controllers/rolesController.js');

router.get('/', getRoles);
router.get('/:id', getRolesById);
router.post('/', createRoles);
router.put('/:id', updateRoles);
router.delete('/:id', deleteRoles);

module.exports = router;