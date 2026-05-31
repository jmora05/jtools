const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/comprasController.js');
const validator  = require('../validators/Comprasvalidator.js');
const { param, body, validationResult } = require('express-validator');

// ─── Validación inline de merma (para no depender de versión del validator) ───
const validarMermaInline = [
    param('id')
        .isInt({ min: 1 }).withMessage('El ID debe ser un entero positivo')
        .toInt(),
    body('items')
        .isArray({ min: 1 }).withMessage('Debe indicar al menos un insumo en "items"'),
    body('items.*.insumosId')
        .isInt({ min: 1 }).withMessage('Cada item debe tener un insumosId válido'),
    body('items.*.cantidad')
        .isInt({ min: 1 }).withMessage('La cantidad defectuosa debe ser mayor a 0'),
    body('motivo')
        .optional().isString().trim().isLength({ max: 500 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Error de validación', errores: errors.array() });
        }
        next();
    },
];

// GET  /                  → listar todas
router.get('/',                 validator.validarQueryListar,      controller.getCompras);

// GET  /estado/:estado    → listar por estado  ⚠️ DEBE ir ANTES de /:id
router.get('/estado/:estado',   validator.validarObtenerPorEstado, controller.getComprasByEstado);

// GET  /:id               → obtener por ID
router.get('/:id',              validator.validarObtenerPorId,     controller.getCompraById);

// POST /                  → crear compra
router.post('/',                validator.validarCrearCompra,      controller.createCompra);

// PUT  /:id               → actualizar compra (solo pendiente)
router.put('/:id',              validator.validarActualizarCompra, controller.updateCompra);

// PATCH /:id/estado       → cambiar estado
router.patch('/:id/estado',     validator.validarCambiarEstado,    controller.cambiarEstadoCompra);

// POST /:id/merma         → registrar insumos defectuosos
router.post('/:id/merma',       validarMermaInline,                controller.registrarMerma);

// DELETE /:id             → anular compra
router.delete('/:id',           validator.validarEliminarCompra,   controller.deleteCompra);

module.exports = router;