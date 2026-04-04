const express = require('express');
const router = express.Router();
const {
    getFichasTecnicas,
    getFichaTecnicaById,
    getFichasByProducto,
    createFichaTecnica,
    updateFichaTecnica,
    deleteFichaTecnica
} = require('../controllers/fichaTecnicaController.js');

router.get('/', getFichasTecnicas);
router.get('/producto/:productoId', getFichasByProducto);
router.get('/:id', getFichaTecnicaById);
router.post('/', createFichaTecnica);
router.put('/:id', updateFichaTecnica);
router.delete('/:id', deleteFichaTecnica);

module.exports = router;