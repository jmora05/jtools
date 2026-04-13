const { body, validationResult } = require('express-validator');

// ─── Regex ────────────────────────────────────────────────────────────────────
const SOLO_TEXTO       = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]+$/;
const SOLO_DESCRIPCION = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]+$/;

// ─── Mensajes ─────────────────────────────────────────────────────────────────
const MSG = {
    nombreReq:    'El nombre de la categoría es obligatorio.',
    nombreCarEsp: 'El nombre no puede contener caracteres especiales como $, %, @, #, &, *, etc.',
    nombreMin:    'El nombre debe tener al menos 2 caracteres.',
    nombreMax:    'El nombre no puede superar los 50 caracteres.',

    descCarEsp:   'La descripción contiene caracteres no permitidos ($, %, @, #, &, *, etc.).',
    descMax:      'La descripción no puede superar los 255 caracteres.',

    estadoInvalido: 'El estado solo puede ser "activo" o "inactivo".',
};

// ─── Reglas para CREAR ────────────────────────────────────────────────────────
const validarCrearCategoria = [
    body('nombreCategoria')
        .trim()
        .notEmpty().withMessage(MSG.nombreReq)
        .isLength({ min: 2 }).withMessage(MSG.nombreMin)
        .isLength({ max: 50 }).withMessage(MSG.nombreMax)
        .matches(SOLO_TEXTO).withMessage(MSG.nombreCarEsp),

    body('descripcion')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage(MSG.descMax)
        .matches(SOLO_DESCRIPCION).withMessage(MSG.descCarEsp),

    body('estado')
        .optional()
        .isIn(['activo', 'inactivo']).withMessage(MSG.estadoInvalido),
];

// ─── Reglas para ACTUALIZAR ───────────────────────────────────────────────────
const validarActualizarCategoria = [
    body('nombreCategoria')
        .optional()
        .trim()
        .notEmpty().withMessage(MSG.nombreReq)
        .isLength({ min: 2 }).withMessage(MSG.nombreMin)
        .isLength({ max: 50 }).withMessage(MSG.nombreMax)
        .matches(SOLO_TEXTO).withMessage(MSG.nombreCarEsp),

    body('descripcion')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage(MSG.descMax)
        .matches(SOLO_DESCRIPCION).withMessage(MSG.descCarEsp),

    body('estado')
        .optional()
        .isIn(['activo', 'inactivo']).withMessage(MSG.estadoInvalido),
];

// ─── Middleware que procesa errores ───────────────────────────────────────────
const manejarErrores = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        const lista = errores.array().map((e) => ({
            campo: e.path,
            mensaje: e.msg,
        }));
        return res.status(400).json({
            message: 'Hay errores en los datos enviados. Por favor corrígelos e intenta de nuevo.',
            errores: lista,
        });
    }
    next();
};

module.exports = {
    validarCrearCategoria,
    validarActualizarCategoria,
    manejarErrores,
};