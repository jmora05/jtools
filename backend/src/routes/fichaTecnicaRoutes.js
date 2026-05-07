const express = require('express');
const router = express.Router();
const {
    getFichasTecnicas,
    getFichaTecnicaById,
    getFichasByProducto,
    createFichaTecnica,
    updateFichaTecnica,
    deleteFichaTecnica,
    puedeEliminarFichaTecnica
} = require('../controllers/fichaTecnicaController.js');
const {
    middlewareCrear,
    middlewareActualizar
} = require('../validators/fichaTecnicaValidator.js');

router.get('/', getFichasTecnicas);
router.get('/producto/:productoId', getFichasByProducto);
router.get('/:id/puede-eliminarse', puedeEliminarFichaTecnica);
router.get('/:id', getFichaTecnicaById);
router.post('/', middlewareCrear, createFichaTecnica);
router.put('/:id', middlewareActualizar, updateFichaTecnica);
router.delete('/:id', deleteFichaTecnica);

module.exports = router;