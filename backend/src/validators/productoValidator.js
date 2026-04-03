const { body, validationResult } = require('express-validator');

// ─── Regex reutilizables ──────────────────────────────────────────────────────
const SOLO_TEXTO       = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]+$/;
const SOLO_REFERENCIA  = /^[a-zA-Z0-9\-_./]+$/;
const SOLO_DESCRIPCION = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]+$/;

// ─── Mensajes de error ────────────────────────────────────────────────────────
const MSG = {
    nombreReq:    'El nombre del producto es obligatorio.',
    nombreCarEsp: 'El nombre no puede contener caracteres especiales como $, %, @, #, &, *, etc.',
    nombreMin:    'El nombre debe tener al menos 2 caracteres.',
    nombreMax:    'El nombre no puede superar los 100 caracteres.',

    refReq:       'La referencia es obligatoria.',
    refCarEsp:    'La referencia solo puede contener letras, números, guiones (-), guión bajo (_), punto (.) y barra (/).',
    refMin:       'La referencia debe tener al menos 2 caracteres.',
    refMax:       'La referencia no puede superar los 50 caracteres.',

    catReq:       'Debes seleccionar una categoría.',
    catInt:       'El ID de categoría debe ser un número entero válido.',
    catPos:       'El ID de categoría debe ser mayor a 0.',

    descCarEsp:   'La descripción contiene caracteres no permitidos (como $, %, @, #, &, *, etc.).',
    descMax:      'La descripción no puede superar los 255 caracteres.',

    precioReq:    'El precio es obligatorio.',
    precioNum:    'El precio debe ser un número válido.',
    precioPos:    'El precio debe ser mayor a 0.',
    precioMax:    'El precio no puede superar 999,999,999.99.',

    stockReq:     'El stock es obligatorio.',
    stockInt:     'El stock debe ser un número entero válido.',
    stockMin:     'El stock no puede ser negativo.',
    stockMax:     'El stock no puede superar 999,999 unidades.',

    estadoInvalido: 'El estado solo puede ser "activo" o "inactivo".',
};

// ─── Reglas para CREAR producto ───────────────────────────────────────────────
const validarCrearProducto = [
    body('nombreProducto')
        .trim()
        .notEmpty().withMessage(MSG.nombreReq)
        .isLength({ min: 2 }).withMessage(MSG.nombreMin)
        .isLength({ max: 100 }).withMessage(MSG.nombreMax)
        .matches(SOLO_TEXTO).withMessage(MSG.nombreCarEsp),

    body('referencia')
        .trim()
        .notEmpty().withMessage(MSG.refReq)
        .isLength({ min: 2 }).withMessage(MSG.refMin)
        .isLength({ max: 50 }).withMessage(MSG.refMax)
        .matches(SOLO_REFERENCIA).withMessage(MSG.refCarEsp),

    body('categoriaProductoId')
        .notEmpty().withMessage(MSG.catReq)
        .isInt().withMessage(MSG.catInt)
        .toInt()
        .custom((val) => val > 0).withMessage(MSG.catPos),

    body('descripcion')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage(MSG.descMax)
        .matches(SOLO_DESCRIPCION).withMessage(MSG.descCarEsp),

    body('precio')
        .notEmpty().withMessage(MSG.precioReq)
        .isNumeric().withMessage(MSG.precioNum)
        .toFloat()
        .custom((val) => val > 0).withMessage(MSG.precioPos)
        .custom((val) => val <= 999999999.99).withMessage(MSG.precioMax),

    body('stock')
        .notEmpty().withMessage(MSG.stockReq)
        .isInt().withMessage(MSG.stockInt)
        .toInt()
        .custom((val) => val >= 0).withMessage(MSG.stockMin)
        .custom((val) => val <= 999999).withMessage(MSG.stockMax),

    body('estado')
        .optional()
        .isIn(['activo', 'inactivo']).withMessage(MSG.estadoInvalido),
];

// ─── Reglas para ACTUALIZAR producto ─────────────────────────────────────────
const validarActualizarProducto = [
    body('nombreProducto')
        .optional()
        .trim()
        .notEmpty().withMessage(MSG.nombreReq)
        .isLength({ min: 2 }).withMessage(MSG.nombreMin)
        .isLength({ max: 100 }).withMessage(MSG.nombreMax)
        .matches(SOLO_TEXTO).withMessage(MSG.nombreCarEsp),

    body('referencia')
        .optional()
        .trim()
        .notEmpty().withMessage(MSG.refReq)
        .isLength({ min: 2 }).withMessage(MSG.refMin)
        .isLength({ max: 50 }).withMessage(MSG.refMax)
        .matches(SOLO_REFERENCIA).withMessage(MSG.refCarEsp),

    body('categoriaProductoId')
        .optional()
        .isInt().withMessage(MSG.catInt)
        .toInt()
        .custom((val) => val > 0).withMessage(MSG.catPos),

    body('descripcion')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage(MSG.descMax)
        .matches(SOLO_DESCRIPCION).withMessage(MSG.descCarEsp),

    body('precio')
        .optional()
        .isDecimal({ decimal_digits: '0,2' }).withMessage(MSG.precioNum)
        .toFloat()
        .custom((val) => val > 0).withMessage(MSG.precioPos)
        .custom((val) => val <= 999999999.99).withMessage(MSG.precioMax),

    body('stock')
        .optional()
        .isInt().withMessage(MSG.stockInt)
        .toInt()
        .custom((val) => val >= 0).withMessage(MSG.stockMin)
        .custom((val) => val <= 999999).withMessage(MSG.stockMax),

    body('estado')
        .optional()
        .isIn(['activo', 'inactivo']).withMessage(MSG.estadoInvalido),
];

// ─── Middleware que procesa errores y responde con JSON claro ─────────────────
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
    validarCrearProducto,
    validarActualizarProducto,
    manejarErrores,
};