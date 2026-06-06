// src/validators/productoValidator.js
const { body, validationResult } = require('express-validator');
const { Op }        = require('sequelize');
const { sequelize } = require('../config/jtools_db');
const { Productos } = require('../models/index.js');

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

// ─── Extensiones de imagen permitidas ────────────────────────────────────────
const EXTENSIONES_IMAGEN = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const MSG_IMAGEN_INVALIDA = 'Solo se permiten links directos de imágenes válidas (.png, .jpg, .jpeg, .webp...)';

/**
 * Validador de imagen.
 * Acepta:
 *   a) data URL base64  →  data:image/png;base64,...
 *   b) URL HTTP/HTTPS cuya RUTA termine en extensión de imagen válida
 *      p.ej. https://cdn.site.com/foto.webp  ✓
 *            https://google.com              ✗
 *            https://chatgpt.com            ✗
 *            https://flamingo.com           ✗
 */
const validarImagen = body('imagenUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
        if (!value) return true;

        // ── a) Data URL base64 ────────────────────────────────────────────────
        if (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(value)) return true;

        // ── b) URL HTTP/HTTPS ─────────────────────────────────────────────────
        let url;
        try {
            url = new URL(value);
        } catch {
            throw new Error(MSG_IMAGEN_INVALIDA);
        }

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error(MSG_IMAGEN_INVALIDA);
        }

        // Evaluar solo el pathname (ignorar query params y fragmentos)
        const pathname = url.pathname.toLowerCase().split('?')[0];
        if (!EXTENSIONES_IMAGEN.some(ext => pathname.endsWith(ext))) {
            throw new Error(MSG_IMAGEN_INVALIDA);
        }

        return true;
    });

// ─── Crear producto ───────────────────────────────────────────────────────────
const validarCrearProducto = [
    body('nombreProducto')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ min: 2, max: 30 }).withMessage('El nombre debe tener entre 2 y 30 caracteres.')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]+$/)
        .withMessage('El nombre no puede contener caracteres especiales.')
        .custom((v) => {
            if ((v.match(/[0-9]/g) || []).length > 2) throw new Error('El nombre no puede contener más de 2 números.');
            if ((v.match(/[-.,()]/g) || []).length > 1) throw new Error('El nombre no puede contener más de 1 carácter especial (-, ., ,, paréntesis).');
            return true;
        }),

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

    // ── Duplicado nombre (case-insensitive) ───────────────────────────────────
    body('nombreProducto').custom(async (value) => {
        if (!value) return true;
        const existe = await Productos.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('nombreProducto')),
                String(value).trim().toLowerCase()
            ),
        });
        if (existe) throw new Error('Ya existe un producto con ese nombre');
        return true;
    }),

    // ── Duplicado referencia (case-insensitive) ───────────────────────────────
    body('referencia').custom(async (value) => {
        if (!value) return true;
        const existe = await Productos.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('referencia')),
                String(value).trim().toLowerCase()
            ),
        });
        if (existe) throw new Error('Ya existe un producto con esa referencia');
        return true;
    }),
];

// ─── Actualizar producto ──────────────────────────────────────────────────────
const validarActualizarProducto = [
    body('nombreProducto')
        .optional()
        .trim()
        .isLength({ min: 2, max: 30 }).withMessage('El nombre debe tener entre 2 y 30 caracteres.')
        .custom((v) => {
            if ((v.match(/[0-9]/g) || []).length > 2) throw new Error('El nombre no puede contener más de 2 números.');
            if ((v.match(/[-.,()]/g) || []).length > 1) throw new Error('El nombre no puede contener más de 1 carácter especial (-, ., ,, paréntesis).');
            return true;
        })
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

    // ── Duplicado nombre (case-insensitive, excluyendo el producto actual) ────
    body('nombreProducto').optional().custom(async (value, { req }) => {
        if (!value) return true;
        const idActual = Number(req.params?.id);
        const where = sequelize.where(
            sequelize.fn('LOWER', sequelize.col('nombreProducto')),
            String(value).trim().toLowerCase()
        );
        const existe = await Productos.findOne({
            where: idActual
                ? { [Op.and]: [where, { id: { [Op.ne]: idActual } }] }
                : where,
        });
        if (existe) throw new Error('Ya existe un producto con ese nombre');
        return true;
    }),

    // ── Duplicado referencia (case-insensitive, excluyendo el producto actual) ─
    body('referencia').optional().custom(async (value, { req }) => {
        if (!value) return true;
        const idActual = Number(req.params?.id);
        const where = sequelize.where(
            sequelize.fn('LOWER', sequelize.col('referencia')),
            String(value).trim().toLowerCase()
        );
        const existe = await Productos.findOne({
            where: idActual
                ? { [Op.and]: [where, { id: { [Op.ne]: idActual } }] }
                : where,
        });
        if (existe) throw new Error('Ya existe un producto con esa referencia');
        return true;
    }),
];

module.exports = { validarCrearProducto, validarActualizarProducto, manejarErrores };