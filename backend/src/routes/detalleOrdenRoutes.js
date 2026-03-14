const express = require('express');
const router = express.Router();
const {
    getDetallesByOrden,
    getDetalleOrdenById,
    createDetalleOrden,
    updateDetalleOrden,
    deleteDetalleOrden
} = require('../controllers/detalleOrdenController.js');

router.get('/orden/:ordenProduccionId', getDetallesByOrden);
router.get('/:id', getDetalleOrdenById);
router.post('/', createDetalleOrden);
router.put('/:id', updateDetalleOrden);
router.delete('/:id', deleteDetalleOrden);

module.exports = router;