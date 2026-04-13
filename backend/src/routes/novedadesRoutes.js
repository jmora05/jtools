const express = require('express');
const router = express.Router();
const {
    getNovedades,
    getNovedadById,
    getNovedadesByEstado,
    createNovedad,
    updateNovedad,
    cambiarEstadoNovedad,
    deleteNovedad
} = require('../controllers/novedadesController.js');
const {
    validateCreateNovedad,
    validateUpdateNovedad,
    validateCambiarEstado,
    validateParamId,
    validateParamEstado
} = require('../validators/novedadesValidator.js');
 
router.get('/', getNovedades);
router.get('/estado/:estado', validateParamEstado, getNovedadesByEstado);
router.get('/:id', validateParamId, getNovedadById);
router.post('/', validateCreateNovedad, createNovedad);
router.put('/:id', validateParamId, validateUpdateNovedad, updateNovedad);
router.patch('/:id/estado', validateParamId, validateCambiarEstado, cambiarEstadoNovedad);
router.delete('/:id', validateParamId, deleteNovedad);
 
module.exports = router;
 