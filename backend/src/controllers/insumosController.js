const {
    Insumos, Proveedores,
    DetalleCompraInsumo, Compras,
    InsumoProducto, Productos,
    FichaTecnica,
} = require('../models/index.js');
const { validarInsumo } = require('../validators/insumosValidator.js');

const includeProveedores = [
    {
        model:      Proveedores,
        as:         'proveedor',
        attributes: ['id', 'nombreEmpresa'],
    },
    {
        model:      Proveedores,
        as:         'proveedores',
        attributes: ['id', 'nombreEmpresa'],
        through:    { attributes: [] },
    },
];

// ─── Helper: verificar todas las dependencias de un insumo ────────────────────
async function getDependenciasDeInsumo(id, nombreInsumo) {
    // 1. Compras que usan este insumo (via DetalleCompraInsumo)
    const detalles = await DetalleCompraInsumo.findAll({
        where:   { insumosId: id },
        include: [{ model: Compras, as: 'compra', attributes: ['id', 'fecha', 'estado'] }],
    });
    const comprasMap = new Map();
    for (const d of detalles) {
        if (d.compra && !comprasMap.has(d.compra.id)) {
            comprasMap.set(d.compra.id, {
                id:     d.compra.id,
                fecha:  d.compra.fecha,
                estado: d.compra.estado,
            });
        }
    }
    const compras = [...comprasMap.values()];

    // 2. Productos que usan este insumo (via InsumoProducto)
    const insumosProducto = await InsumoProducto.findAll({
        where:   { insumosId: id },
        include: [{ model: Productos, attributes: ['id', 'nombreProducto'] }],
    });
    const productos = insumosProducto.map(ip => ({
        id:             ip.Producto?.id         ?? ip.productosId,
        nombreProducto: ip.Producto?.nombreProducto ?? `Producto #${ip.productosId}`,
    }));

    // 3. Fichas técnicas que mencionan este insumo por nombre (campo JSON)
    const todasFichas = await FichaTecnica.findAll({
        attributes: ['id', 'codigoFicha', 'estado', 'insumos'],
    });
    const fichasTecnicas = [];
    for (const ficha of todasFichas) {
        try {
            const arr = typeof ficha.insumos === 'string'
                ? JSON.parse(ficha.insumos)
                : (ficha.insumos || []);
            if (Array.isArray(arr) && arr.some(i => i.name === nombreInsumo)) {
                fichasTecnicas.push({
                    id:          ficha.id,
                    codigoFicha: ficha.codigoFicha,
                    estado:      ficha.estado,
                });
            }
        } catch { /* ignorar fichas con JSON malformado */ }
    }

    return {
        enUso: compras.length > 0 || productos.length > 0 || fichasTecnicas.length > 0,
        compras,
        productos,
        fichasTecnicas,
    };
}

// GET - listar todos los insumos
const getInsumos = async (req, res) => {
    try {
        const insumos = await Insumos.findAll({ include: includeProveedores });
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos', error: error.message });
    }
};

// GET - obtener insumo por ID
const getInsumoById = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        res.status(200).json(insumo);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el insumo', error: error.message });
    }
};

// GET - listar insumos disponibles
const getInsumosDisponibles = async (req, res) => {
    try {
        const insumos = await Insumos.findAll({
            where: { estado: 'disponible' }
        });
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos disponibles', error: error.message });
    }
};

// GET - verificar todas las dependencias de un insumo antes de eliminar
const getInsumosDependencias = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        const dependencias = await getDependenciasDeInsumo(id, insumo.nombreInsumo);
        res.status(200).json(dependencias);
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar dependencias', error: error.message });
    }
};

// POST - crear insumo
const createInsumo = async (req, res) => {
    try {
        const errores = validarInsumo(req.body, false);
        if (errores.length > 0) {
            return res.status(400).json({ message: 'Error de validación', errores });
        }

        const {
            nombreInsumo,
            descripcion,
            precioUnitario,
            unidadMedida,
            cantidad,
            proveedoresIds,
            estado,
        } = req.body;

        const ids = Array.isArray(proveedoresIds) ? proveedoresIds.map(Number).filter(Boolean) : [];

        const insumo = await Insumos.create({
            nombreInsumo,
            descripcion:    descripcion    ?? null,
            precioUnitario: precioUnitario ?? 0.00,
            unidadMedida,
            cantidad:       cantidad       ?? null,
            proveedoresId:  ids[0]         ?? null,
            estado:         estado         ?? 'disponible',
        });

        if (ids.length > 0) await insumo.setProveedores(ids);

        const insumoConProveedores = await Insumos.findByPk(insumo.id, { include: includeProveedores });
        res.status(201).json({ message: 'Insumo creado correctamente', insumo: insumoConProveedores });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el insumo', error: error.message });
    }
};

// PUT - actualizar insumo
const updateInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        const errores = validarInsumo(req.body, true);
        if (errores.length > 0) {
            return res.status(400).json({ message: 'Error de validación', errores });
        }

        const {
            nombreInsumo,
            descripcion,
            precioUnitario,
            unidadMedida,
            cantidad,
            proveedoresIds,
            estado,
        } = req.body;

        const ids = Array.isArray(proveedoresIds) ? proveedoresIds.map(Number).filter(Boolean) : undefined;

        await insumo.update({
            ...(nombreInsumo   !== undefined && { nombreInsumo }),
            ...(descripcion    !== undefined && { descripcion }),
            ...(precioUnitario !== undefined && { precioUnitario }),
            ...(unidadMedida   !== undefined && { unidadMedida }),
            ...(cantidad       !== undefined && { cantidad }),
            ...(ids            !== undefined && { proveedoresId: ids[0] ?? null }),
            ...(estado         !== undefined && { estado }),
        });

        if (ids !== undefined) await insumo.setProveedores(ids);

        const insumoActualizado = await Insumos.findByPk(insumo.id, { include: includeProveedores });
        res.status(200).json({ message: 'Insumo actualizado correctamente', insumo: insumoActualizado });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el insumo', error: error.message });
    }
};

// PATCH - cambiar estado del insumo (disponible / agotado)
const cambiarEstadoInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['disponible', 'agotado'].includes(estado)) {
            return res.status(400).json({
                message: 'Estado inválido. Use "disponible" o "agotado"'
            });
        }

        const insumo = await Insumos.findByPk(id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        await insumo.update({ estado });
        res.status(200).json({ message: `Insumo marcado como ${estado}`, insumo });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado del insumo', error: error.message });
    }
};

// DELETE - soft delete → marca como agotado
const deleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        await insumo.update({ estado: 'agotado' });
        res.status(200).json({ message: 'Insumo marcado como agotado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar el insumo', error: error.message });
    }
};

// DELETE /force - eliminar físicamente con validación estricta de dependencias
const forceDeleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        // Regla 1: solo se puede eliminar si está agotado
        if (insumo.estado === 'disponible') {
            return res.status(400).json({
                message: 'No se puede eliminar un insumo disponible. Márcalo como agotado primero.'
            });
        }

        // Regla 2: no se puede eliminar si está en uso en el sistema
        const dependencias = await getDependenciasDeInsumo(id, insumo.nombreInsumo);
        if (dependencias.enUso) {
            const partes = [];
            if (dependencias.compras.length > 0)
                partes.push(`${dependencias.compras.length} compra(s)`);
            if (dependencias.productos.length > 0)
                partes.push(`${dependencias.productos.length} producto(s)`);
            if (dependencias.fichasTecnicas.length > 0)
                partes.push(`${dependencias.fichasTecnicas.length} ficha(s) técnica(s)`);

            return res.status(409).json({
                message: `No se puede eliminar: el insumo está en uso en ${partes.join(', ')}.`,
                enUso:          dependencias.enUso,
                compras:        dependencias.compras,
                productos:      dependencias.productos,
                fichasTecnicas: dependencias.fichasTecnicas,
            });
        }

        await insumo.destroy();
        res.status(200).json({ message: 'Insumo eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el insumo', error: error.message });
    }
};

module.exports = {
    getInsumos,
    getInsumoById,
    getInsumosDisponibles,
    getInsumosDependencias,
    createInsumo,
    updateInsumo,
    cambiarEstadoInsumo,
    deleteInsumo,
    forceDeleteInsumo,
};
