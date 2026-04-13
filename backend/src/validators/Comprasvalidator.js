const { body, param, query, validationResult } = require('express-validator');
const { Compras, Proveedores, DetalleCompraInsumo, Insumos } = require('../models/index.js');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Enviar errores estandarizados
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────
const ESTADOS_VALIDOS   = ['pendiente', 'en transito', 'completada'];
const METODOS_PAGO_VALIDOS = ['efectivo', 'transferencia'];
const FLUJO_ESTADO      = { pendiente: 0, 'en transito': 1, completada: 2 };

// Fecha mínima razonable para el negocio (año 2000)
const FECHA_MIN = new Date('2000-01-01');

// Número de factura: solo enteros positivos
const esNumeroFacturaValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES — CREAR COMPRA  (POST /)
// ─────────────────────────────────────────────────────────────────────────────
const validarCrearCompra = [

    // ── id / N° factura (opcional) ────────────────────────────────────────────
    body('id')
        .optional()
        .notEmpty().withMessage('El número de factura no puede ser un string vacío')
        .bail()
        .isInt({ min: 1 }).withMessage('El número de factura debe ser un entero positivo')
        .bail()
        .toInt()
        .custom(async (id) => {
            // Unicidad: no puede existir otra compra con ese id
            const existe = await Compras.findByPk(id);
            if (existe) throw new Error(`Ya existe una compra con el número de factura ${id}`);
            return true;
        }),

    // ── proveedoresId ─────────────────────────────────────────────────────────
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

    // ── fecha ─────────────────────────────────────────────────────────────────
    body('fecha')
        .notEmpty().withMessage('La fecha es obligatoria')
        .bail()
        .isISO8601({ strict: true }).withMessage('La fecha debe estar en formato ISO 8601 válido (YYYY-MM-DD)')
        .bail()
        .toDate()
        .custom((fecha) => {
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999); // fin del día actual

            if (fecha < FECHA_MIN)
                throw new Error('La fecha no puede ser anterior al año 2000');

            if (fecha > hoy)
                throw new Error('La fecha no puede ser futura');

            return true;
        }),

    // ── metodoPago ────────────────────────────────────────────────────────────
    body('metodoPago')
        .notEmpty().withMessage('El método de pago es obligatorio')
        .bail()
        .trim()
        .isIn(METODOS_PAGO_VALIDOS)
        .withMessage(`El método de pago debe ser uno de: ${METODOS_PAGO_VALIDOS.join(', ')}`),

    // ── estado ────────────────────────────────────────────────────────────────
    body('estado')
        .optional()
        .trim()
        .isIn(ESTADOS_VALIDOS)
        .withMessage(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`),

    // ── notas (campo opcional extra que podría venir del front) ───────────────
    body('notas')
        .optional()
        .isString().withMessage('Las notas deben ser texto')
        .trim()
        .isLength({ max: 500 }).withMessage('Las notas no pueden superar los 500 caracteres'),

    // ── campos no permitidos / inyección ─────────────────────────────────────
    body('creadoEn').not().exists().withMessage('El campo "creadoEn" no puede ser enviado manualmente'),
    body('actualizadoEn').not().exists().withMessage('El campo "actualizadoEn" no puede ser enviado manualmente'),

    handleValidationErrors,
];

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES — ACTUALIZAR COMPRA  (PUT /:id)
// ─────────────────────────────────────────────────────────────────────────────
const validarActualizarCompra = [

    // ── param id ──────────────────────────────────────────────────────────────
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

    // ── proveedoresId (opcional en PUT) ───────────────────────────────────────
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

    // ── fecha ─────────────────────────────────────────────────────────────────
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

    // ── metodoPago ────────────────────────────────────────────────────────────
    body('metodoPago')
        .optional()
        .trim()
        .isIn(METODOS_PAGO_VALIDOS)
        .withMessage(`El método de pago debe ser: ${METODOS_PAGO_VALIDOS.join(', ')}`),

    // ── no se permite cambiar el estado por esta ruta ─────────────────────────
    body('estado')
        .not().exists()
        .withMessage('Para cambiar el estado use el endpoint PATCH /:id/estado'),

    // ── no se permite cambiar el ID de la compra ──────────────────────────────
    body('id')
        .not().exists()
        .withMessage('No se puede modificar el número de factura de una compra existente'),

    // ── notas ─────────────────────────────────────────────────────────────────
    body('notas')
        .optional()
        .isString().withMessage('Las notas deben ser texto')
        .trim()
        .isLength({ max: 500 }).withMessage('Las notas no pueden superar 500 caracteres'),

    // ── body no puede estar vacío ─────────────────────────────────────────────
    body()
        .custom((body) => {
            const camposPermitidos = ['proveedoresId', 'fecha', 'metodoPago', 'notas'];
            const camposEnviados   = Object.keys(body);
            if (camposEnviados.length === 0)
                throw new Error('El cuerpo de la petición no puede estar vacío');
            const camposInvalidos = camposEnviados.filter(c => !camposPermitidos.includes(c));
            if (camposInvalidos.length > 0)
                throw new Error(`Campos no permitidos: ${camposInvalidos.join(', ')}`);
            return true;
        }),

    handleValidationErrors,
];

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES — CAMBIAR ESTADO  (PATCH /:id/estado)
// ─────────────────────────────────────────────────────────────────────────────
const validarCambiarEstado = [

    // ── param id ──────────────────────────────────────────────────────────────
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

    // ── estado ────────────────────────────────────────────────────────────────
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
            if (!compra) return true; // ya manejado arriba

            // No retroceder estado
            if (FLUJO_ESTADO[nuevoEstado] < FLUJO_ESTADO[compra.estado])
                throw new Error(
                    `No se puede retroceder el estado de "${compra.estado}" a "${nuevoEstado}"`
                );

            // No asignar el mismo estado
            if (nuevoEstado === compra.estado)
                throw new Error(`La compra ya se encuentra en estado "${compra.estado}"`);

            // Saltos no permitidos: solo avance de un paso
            if (FLUJO_ESTADO[nuevoEstado] - FLUJO_ESTADO[compra.estado] > 1)
                throw new Error(
                    `No se puede saltar de "${compra.estado}" a "${nuevoEstado}" sin pasar por el estado intermedio`
                );

            // Una compra completada no puede cambiar de estado
            if (compra.estado === 'completada')
                throw new Error('Una compra completada no puede cambiar de estado');

            return true;
        }),

    // ── no se permiten otros campos ───────────────────────────────────────────
    body()
        .custom((body) => {
            const camposExtra = Object.keys(body).filter(k => k !== 'estado');
            if (camposExtra.length > 0)
                throw new Error(`Solo se permite el campo "estado". Campos no permitidos: ${camposExtra.join(', ')}`);
            return true;
        }),

    handleValidationErrors,
];

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES — ELIMINAR COMPRA  (DELETE /:id)
// ─────────────────────────────────────────────────────────────────────────────
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
            if (compra.estado !== 'pendiente')
                throw new Error('Solo se pueden eliminar compras en estado pendiente');

            // Verificar que no tiene detalles registrados
            const tieneDetalles = await DetalleCompraInsumo.findOne({ where: { comprasId: id } });
            if (tieneDetalles)
                throw new Error('No se puede eliminar una compra que ya tiene insumos registrados');

            return true;
        }),

    handleValidationErrors,
];

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES — OBTENER COMPRA POR ID  (GET /:id)
// ─────────────────────────────────────────────────────────────────────────────
const validarObtenerPorId = [

    param('id')
        .notEmpty().withMessage('El ID es obligatorio')
        .bail()
        .isInt({ min: 1 }).withMessage('El ID debe ser un entero positivo')
        .bail()
        .toInt(),

    handleValidationErrors,
];

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES — OBTENER COMPRAS POR ESTADO  (GET /estado/:estado)
// ─────────────────────────────────────────────────────────────────────────────
const validarObtenerPorEstado = [

    param('estado')
        .notEmpty().withMessage('El estado es obligatorio en la URL')
        .bail()
        .trim()
        .isIn(ESTADOS_VALIDOS)
        .withMessage(`Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`),

    handleValidationErrors,
];

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES — QUERY PARAMS PARA LISTAR  (GET /)
// ─────────────────────────────────────────────────────────────────────────────
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
        .isIn(ESTADOS_VALIDOS)
        .withMessage(`Filtro de estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`),

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

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAR
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    validarCrearCompra,
    validarActualizarCompra,
    validarCambiarEstado,
    validarEliminarCompra,
    validarObtenerPorId,
    validarObtenerPorEstado,
    validarQueryListar,
    handleValidationErrors,
};