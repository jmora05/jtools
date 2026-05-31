const { body, param, query, validationResult } = require('express-validator');
const { Compras, Proveedores, DetalleCompraInsumo, Insumos } = require('../models/index.js');

// ─── HELPER — Enviar errores estandarizados ───────────────────────────────────
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Error de validación',
            errores: errors.array().map(e => ({
                campo: e.path,
                mensaje: e.msg,
                valor: e.value,
            })),
        });
    }
    next();
};

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ESTADOS_VALIDOS      = ['pendiente', 'en transito', 'completada'];
const METODOS_PAGO_VALIDOS = ['efectivo', 'transferencia'];
const FLUJO_ESTADO         = { pendiente: 0, 'en transito': 1, completada: 2 };
const FECHA_MIN            = new Date('2000-01-01');

// ─── VALIDACIONES — CREAR COMPRA  (POST /) ────────────────────────────────────
const validarCrearCompra = [
    body('id')
        .optional()
        .notEmpty().withMessage('El número de factura no puede ser un string vacío')
        .bail()
        .isInt({ min: 1 }).withMessage('El número de factura debe ser un entero positivo')
        .bail()
        .toInt()
        .custom(async (id) => {
            const existe = await Compras.findByPk(id);
            if (existe) throw new Error(`Ya existe una compra con el número de factura ${id}`);
            return true;
        }),

    body('proveedoresId')
        .notEmpty().withMessage('El proveedor es obligatorio')
        .bail()
        .isInt({ min: 1 }).withMessage('El ID de proveedor debe ser un entero positivo')
        .bail()
        .toInt()
        .custom(async (proveedoresId) => {
            const proveedor = await Proveedores.findByPk(proveedoresId);
            if (!proveedor)
                throw new Error('El proveedor especificado no existe en el sistema');
            if (proveedor.estado === 'inactivo')
                throw new Error('No se puede registrar una compra con un proveedor inactivo');
            return true;
        }),

    body('fecha')
        .notEmpty().withMessage('La fecha es obligatoria')
        .bail()
        .isISO8601({ strict: true }).withMessage('La fecha debe estar en formato ISO 8601 válido (YYYY-MM-DD)')
        .bail()
        .toDate()
        .custom((fecha) => {
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999);
            if (fecha < FECHA_MIN)
                throw new Error('La fecha no puede ser anterior al año 2000');
            if (fecha > hoy)
                throw new Error('La fecha no puede ser futura');
            return true;
        }),

    body('metodoPago')
        .notEmpty().withMessage('El método de pago es obligatorio')
        .bail()
        .trim()
        .isIn(METODOS_PAGO_VALIDOS)
        .withMessage(`El método de pago debe ser uno de: ${METODOS_PAGO_VALIDOS.join(', ')}`),

    body('estado')
        .optional()
        .trim()
        .isIn(ESTADOS_VALIDOS)
        .withMessage(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`),

    body('notas')
        .optional()
        .isString().withMessage('Las notas deben ser texto')
        .trim()
        .isLength({ max: 500 }).withMessage('Las notas no pueden superar los 500 caracteres'),

    body('creadoEn').not().exists().withMessage('El campo "creadoEn" no puede ser enviado manualmente'),
    body('actualizadoEn').not().exists().withMessage('El campo "actualizadoEn" no puede ser enviado manualmente'),

    handleValidationErrors,
];

// ─── VALIDACIONES — ACTUALIZAR COMPRA  (PUT /:id) ─────────────────────────────
const validarActualizarCompra = [
    param('id')
        .notEmpty().withMessage('El ID de la compra es obligatorio')
        .bail()
        .isInt({ min: 1 }).withMessage('El ID debe ser un entero positivo')
        .bail()
        .toInt()
        .custom(async (id) => {
            const compra = await Compras.findByPk(id);
            if (!compra)
                throw new Error('La compra especificada no existe');
            if (compra.estado === 'completada')
                throw new Error('No se puede editar una compra ya completada');
            if (compra.estado === 'en transito')
                throw new Error('No se puede editar una compra que ya está en tránsito');
            return true;
        }),

    body('proveedoresId')
        .optional()
        .isInt({ min: 1 }).withMessage('El ID de proveedor debe ser un entero positivo')
        .bail()
        .toInt()
        .custom(async (proveedoresId) => {
            const proveedor = await Proveedores.findByPk(proveedoresId);
            if (!proveedor)
                throw new Error('El proveedor especificado no existe en el sistema');
            if (proveedor.estado === 'inactivo')
                throw new Error('El proveedor está inactivo');
            return true;
        }),

    body('fecha')
        .optional()
        .isISO8601({ strict: true }).withMessage('La fecha debe estar en formato ISO 8601 (YYYY-MM-DD)')
        .bail()
        .toDate()
        .custom((fecha) => {
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999);
            if (fecha < FECHA_MIN)
                throw new Error('La fecha no puede ser anterior al año 2000');
            if (fecha > hoy)
                throw new Error('La fecha no puede ser una fecha futura');
            return true;
        }),

    body('metodoPago')
        .optional()
        .trim()
        .isIn(METODOS_PAGO_VALIDOS)
        .withMessage(`El método de pago debe ser: ${METODOS_PAGO_VALIDOS.join(', ')}`),

    body('estado')
        .not().exists()
        .withMessage('Para cambiar el estado use el endpoint PATCH /:id/estado'),

    body('id')
        .not().exists()
        .withMessage('No se puede modificar el número de factura de una compra existente'),

    body('notas')
        .optional()
        .isString().withMessage('Las notas deben ser texto')
        .trim()
        .isLength({ max: 500 }).withMessage('Las notas no pueden superar 500 caracteres'),

    body()
        .custom((body) => {
            const camposPermitidos = ['proveedoresId', 'fecha', 'metodoPago', 'notas', 'detalles'];
            const camposEnviados   = Object.keys(body);
            if (camposEnviados.length === 0)
                throw new Error('El cuerpo de la petición no puede estar vacío');
            const camposInvalidos = camposEnviados.filter(c => !camposPermitidos.includes(c));
            if (camposInvalidos.length > 0)
                throw new Error(`Campos no permitidos: ${camposInvalidos.join(', ')}`);
            return true;
        }),

    body('detalles')
        .optional()
        .isArray({ min: 1 }).withMessage('Los detalles deben ser un array con al menos un elemento'),

    body('detalles.*.insumosId')
        .isInt({ min: 1 }).withMessage('Cada detalle debe tener un insumosId válido (entero positivo)'),

    body('detalles.*.cantidad')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero positivo'),

    body('detalles.*.precioUnitario')
        .isFloat({ min: 0 }).withMessage('El precioUnitario debe ser un número positivo'),

    handleValidationErrors,
];

// ─── VALIDACIONES — CAMBIAR ESTADO  (PATCH /:id/estado) ──────────────────────
const validarCambiarEstado = [
    param('id')
        .notEmpty().withMessage('El ID de la compra es obligatorio')
        .bail()
        .isInt({ min: 1 }).withMessage('El ID debe ser un entero positivo')
        .bail()
        .toInt()
        .custom(async (id) => {
            const compra = await Compras.findByPk(id);
            if (!compra) throw new Error('La compra no existe');
            return true;
        }),

    body('estado')
        .notEmpty().withMessage('El estado es obligatorio')
        .bail()
        .trim()
        .isIn(ESTADOS_VALIDOS)
        .withMessage(`Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`)
        .bail()
        .custom(async (nuevoEstado, { req }) => {
            const id     = parseInt(req.params.id);
            const compra = await Compras.findByPk(id);
            if (!compra) return true;

            if (FLUJO_ESTADO[nuevoEstado] < FLUJO_ESTADO[compra.estado])
                throw new Error(`No se puede retroceder el estado de "${compra.estado}" a "${nuevoEstado}"`);

            if (nuevoEstado === compra.estado)
                throw new Error(`La compra ya se encuentra en estado "${compra.estado}"`);

            // Se permite saltar de pendiente a completada directamente
            if (
                FLUJO_ESTADO[nuevoEstado] - FLUJO_ESTADO[compra.estado] > 1 &&
                !(compra.estado === 'pendiente' && nuevoEstado === 'completada')
            )
                throw new Error(
                    `No se puede saltar de "${compra.estado}" a "${nuevoEstado}" sin pasar por el estado intermedio`
                );

            if (compra.estado === 'completada')
                throw new Error('Una compra completada no puede cambiar de estado');

            return true;
        }),

    body()
        .custom((body) => {
            const camposExtra = Object.keys(body).filter(k => k !== 'estado');
            if (camposExtra.length > 0)
                throw new Error(`Solo se permite el campo "estado". Campos no permitidos: ${camposExtra.join(', ')}`);
            return true;
        }),

    handleValidationErrors,
];

// ─── VALIDACIONES — ELIMINAR / ANULAR COMPRA  (DELETE /:id) ──────────────────
// Ahora permite anular compras en estado 'pendiente' o 'completada'
const validarEliminarCompra = [
    param('id')
        .notEmpty().withMessage('El ID de la compra es obligatorio')
        .bail()
        .isInt({ min: 1 }).withMessage('El ID debe ser un entero positivo')
        .bail()
        .toInt()
        .custom(async (id) => {
            const compra = await Compras.findByPk(id);
            if (!compra)
                throw new Error('La compra no existe');
            if (compra.estado === 'anulada')
                throw new Error('Esta compra ya fue anulada');
            if (compra.estado === 'en transito')
                throw new Error('No se puede anular una compra que está en tránsito');
            return true;
        }),

    handleValidationErrors,
];

// ─── VALIDACIONES — REGISTRAR MERMA  (POST /:id/merma) ────────────────────────
const validarRegistrarMerma = [
    param('id')
        .notEmpty().withMessage('El ID de la compra es obligatorio')
        .bail()
        .isInt({ min: 1 }).withMessage('El ID debe ser un entero positivo')
        .bail()
        .toInt()
        .custom(async (id) => {
            const compra = await Compras.findByPk(id);
            if (!compra)
                throw new Error('La compra no existe');
            if (compra.estado !== 'completada')
                throw new Error('Solo se pueden registrar mermas en compras completadas');
            return true;
        }),

    body('items')
        .isArray({ min: 1 }).withMessage('Debe indicar al menos un insumo defectuoso en "items"'),

    body('items.*.insumosId')
        .isInt({ min: 1 }).withMessage('Cada item debe tener un insumosId válido'),

    body('items.*.cantidad')
        .isInt({ min: 1 }).withMessage('La cantidad defectuosa debe ser un entero positivo'),

    body('motivo')
        .optional()
        .isString().withMessage('El motivo debe ser texto')
        .trim()
        .isLength({ max: 500 }).withMessage('El motivo no puede superar 500 caracteres'),

    handleValidationErrors,
];

// ─── VALIDACIONES — OBTENER POR ID  (GET /:id) ────────────────────────────────
const validarObtenerPorId = [
    param('id')
        .notEmpty().withMessage('El ID es obligatorio')
        .bail()
        .isInt({ min: 1 }).withMessage('El ID debe ser un entero positivo')
        .bail()
        .toInt(),

    handleValidationErrors,
];

// ─── VALIDACIONES — OBTENER POR ESTADO  (GET /estado/:estado) ─────────────────
const validarObtenerPorEstado = [
    param('estado')
        .notEmpty().withMessage('El estado es obligatorio en la URL')
        .bail()
        .trim()
        .isIn([...ESTADOS_VALIDOS, 'anulada'])
        .withMessage(`Estado inválido. Valores permitidos: ${[...ESTADOS_VALIDOS, 'anulada'].join(', ')}`),

    handleValidationErrors,
];

// ─── VALIDACIONES — QUERY PARAMS PARA LISTAR  (GET /) ─────────────────────────
const validarQueryListar = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('El parámetro "page" debe ser un entero mayor a 0')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('El parámetro "limit" debe ser un entero entre 1 y 100')
        .toInt(),

    query('estado')
        .optional()
        .trim()
        .isIn([...ESTADOS_VALIDOS, 'anulada'])
        .withMessage(`Filtro de estado inválido. Valores permitidos: ${[...ESTADOS_VALIDOS, 'anulada'].join(', ')}`),

    query('metodoPago')
        .optional()
        .trim()
        .isIn(METODOS_PAGO_VALIDOS)
        .withMessage(`Filtro de método de pago inválido. Valores: ${METODOS_PAGO_VALIDOS.join(', ')}`),

    query('fechaDesde')
        .optional()
        .isISO8601({ strict: true }).withMessage('"fechaDesde" debe estar en formato YYYY-MM-DD')
        .bail()
        .toDate()
        .custom((fecha) => {
            if (fecha < FECHA_MIN)
                throw new Error('"fechaDesde" no puede ser anterior al año 2000');
            return true;
        }),

    query('fechaHasta')
        .optional()
        .isISO8601({ strict: true }).withMessage('"fechaHasta" debe estar en formato YYYY-MM-DD')
        .bail()
        .toDate()
        .custom((fechaHasta, { req }) => {
            if (req.query.fechaDesde) {
                const desde = new Date(req.query.fechaDesde);
                if (fechaHasta < desde)
                    throw new Error('"fechaHasta" no puede ser anterior a "fechaDesde"');
            }
            return true;
        }),

    query('proveedoresId')
        .optional()
        .isInt({ min: 1 }).withMessage('"proveedoresId" en query debe ser un entero positivo')
        .toInt(),

    handleValidationErrors,
];

// ─── EXPORTAR ─────────────────────────────────────────────────────────────────
module.exports = {
    validarCrearCompra,
    validarActualizarCompra,
    validarCambiarEstado,
    validarEliminarCompra,
    validarRegistrarMerma,
    validarObtenerPorId,
    validarObtenerPorEstado,
    validarQueryListar,
    handleValidationErrors,
};