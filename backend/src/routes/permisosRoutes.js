const express = require('express');
const router  = express.Router();
const { getPermisos, syncSystemModules } = require('../controllers/permisosController.js');

// GET  /api/permisos          — lista todos los permisos del sistema (para checkboxes en roles)
router.get('/', getPermisos);

// POST /api/permisos/sync-modules — sincroniza módulos del sistema como permisos en BD
router.post('/sync-modules', syncSystemModules);

module.exports = router;
