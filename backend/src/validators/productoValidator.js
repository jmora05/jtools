const { body, validationResult } = require('express-validator');

// ─── Manejador de errores ─────────────────────────────────────────────────────
const manejarErrores = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Error de validación',
            errores: errors.array().map(e => ({ campo: e.path ?? e.param, mensaje: e.msg })),
        });
    }
    next();
};

// ─── Validador de imagen (URL o data URL) ─────────────────────────────────────
const validarImagen = body('imagenUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
        if (!value) return true;
        const isDataUrl = /^data:image\/(png|jpe?g|webp|gif|avif|svg\+xml);base64,/.test(value);
        const isHttpUrl = (() => {
            try {
                const u = new URL(value);
                return u.protocol === 'http:' || u.protocol === 'https:';
            } catch { return false; }
        })();
        if (!isDataUrl && !isHttpUrl) {
            throw new Error('La imagen debe ser una URL válida (https://...) o una imagen en base64.');
        }
        return true;
    });

// ─── Crear producto ───────────────────────────────────────────────────────────
const validarCrearProducto = [
    body('nombreProducto')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]+$/)
        .withMessage('El nombre no puede contener caracteres especiales.'),

    body('referencia')
        .trim()
        .notEmpty().withMessage('La referencia es obligatoria.')
        .isLength({ min: 2, max: 50 }).withMessage('La referencia debe tener entre 2 y 50 caracteres.')
        .matches(/^[a-zA-Z0-9\-_./]+$/)
        .withMessage('La referencia solo puede contener letras, números, guiones, _, . y /.'),

    body('categoriaProductoId')
        .notEmpty().withMessage('La categoría es obligatoria.')
        .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un entero mayor a 0.')
        .toInt(),

    body('descripcion')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage('La descripción no puede superar 255 caracteres.')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]*$/)
        .withMessage('La descripción contiene caracteres no permitidos.'),

    body('precio')
        .notEmpty().withMessage('El precio es obligatorio.')
        .isFloat({ min: 0.01, max: 99999999.99 })
        .withMessage('El precio debe ser un número entre 0.01 y 99,999,999.99.')
        .toFloat(),

    body('stock')
        .notEmpty().withMessage('El stock es obligatorio.')
        .isInt({ min: 0, max: 999999 })
        .withMessage('El stock debe ser un entero entre 0 y 999,999.')
        .toInt(),

    body('estado')
        .optional()
        .isIn(['activo', 'inactivo'])
        .withMessage('El estado solo puede ser "activo" o "inactivo".'),

    validarImagen,
];

// ─── Actualizar producto ──────────────────────────────────────────────────────
const validarActualizarProducto = [
    body('nombreProducto')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]+$/)
        .withMessage('El nombre no puede contener caracteres especiales.'),

    body('referencia')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('La referencia debe tener entre 2 y 50 caracteres.')
        .matches(/^[a-zA-Z0-9\-_./]+$/)
        .withMessage('La referencia solo puede contener letras, números, guiones, _, . y /.'),

    body('categoriaProductoId')
        .optional()
        .isInt({ min: 1 }).withMessage('El ID de categoría debe ser un entero mayor a 0.')
        .toInt(),

    body('descripcion')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage('La descripción no puede superar 255 caracteres.')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]*$/)
        .withMessage('La descripción contiene caracteres no permitidos.'),

    body('precio')
        .optional()
        .isFloat({ min: 0.01, max: 99999999.99 })
        .withMessage('El precio debe ser un número entre 0.01 y 99,999,999.99.')
        .toFloat(),

    body('stock')
        .optional()
        .isInt({ min: 0, max: 999999 })
        .withMessage('El stock debe ser un entero entre 0 y 999,999.')
        .toInt(),

    body('estado')
        .optional()
        .isIn(['activo', 'inactivo'])
        .withMessage('El estado solo puede ser "activo" o "inactivo".'),

    validarImagen,
];

module.exports = { validarCrearProducto, validarActualizarProducto, manejarErrores };