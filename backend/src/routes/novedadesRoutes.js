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

router.get('/', getNovedades);
router.get('/estado/:estado', getNovedadesByEstado);
router.get('/:id', getNovedadById);
router.post('/', createNovedad);
router.put('/:id', updateNovedad);
router.patch('/:id/estado', cambiarEstadoNovedad);
router.delete('/:id', deleteNovedad);

module.exports = router;