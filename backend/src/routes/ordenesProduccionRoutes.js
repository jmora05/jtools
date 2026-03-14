const express = require('express');
const router = express.Router();
const {
    getOrdenesProduccion,
    getOrdenProduccionById,
    createOrdenProduccion,
    updateOrdenProduccion,
    deleteOrdenProduccion
} = require('../controllers/ordenesProduccionController.js');

router.get('/', getOrdenesProduccion);
router.get('/:id', getOrdenProduccionById);
router.post('/', createOrdenProduccion);
router.put('/:id', updateOrdenProduccion);
router.delete('/:id', deleteOrdenProduccion);

module.exports = router;