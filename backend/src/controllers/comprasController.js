const { Compras, Proveedores, DetalleCompraInsumo, Insumos } = require('../models/index.js');
const { Op } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

// Busca una compra cuyo campo (trim + lower) coincida con el valor dado.
// Excluye opcionalmente un id (para updates). Devuelve la compra o null.
async function findCompraByCampoCI(campo, valor, excluirId = null) {
    const where = {
        [Op.and]: [
            sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col(campo))),
                valor.toString().trim().toLowerCase(),
            ),
            ...(excluirId != null ? [{ id: { [Op.ne]: excluirId } }] : []),
        ],
    };
    return Compras.findOne({ where });
}

// GET - listar todas las compras
const getCompras = async (req, res) => {
    try {
        const compras = await Compras.findAll({
            include: [
                {
                    model: Proveedores,
                    as: 'proveedor',
                    attributes: ['id', 'nombreEmpresa', 'personaContacto', 'telefono', 'email'],
                },
                {
                    model: DetalleCompraInsumo,
                    as: 'detalles',
                    include: [{
                        model: Insumos,
                        as: 'insumo',
                        attributes: ['id', 'nombreInsumo', 'unidadMedida'],
                    }],
                },
            ],
            order: [
                ['fecha', 'DESC'],
                ['id', 'DESC'],
            ],
        });
        res.status(200).json(compras);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las compras', error: error.message });
    }
};

// GET - obtener compra por ID
const getCompraById = async (req, res) => {
    try {
        const { id } = req.params;
        const compra = await Compras.findByPk(id, {
            include: [
                {
                    model: Proveedores,
                    as: 'proveedor',
                    attributes: ['id', 'nombreEmpresa', 'personaContacto', 'telefono', 'email'],
                },
                {
                    model: DetalleCompraInsumo,
                    as: 'detalles',
                    include: [{
                        model: Insumos,
                        as: 'insumo',
                        attributes: ['id', 'nombreInsumo', 'unidadMedida', 'precioUnitario'],
                    }],
                },
            ],
        });

        if (!compra) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        res.status(200).json(compra);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la compra', error: error.message });
    }
};

// GET - listar compras por estado
const getComprasByEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        const estadosValidos = ['pendiente', 'completada', 'anulada'];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                message: 'Estado no válido.',
            });
        }

        const compras = await Compras.findAll({
            where: { estado },
            include: [{
                model: Proveedores,
                as: 'proveedor',
                attributes: ['id', 'nombreEmpresa', 'telefono'],
            }],
        });

        res.status(200).json(compras);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las compras por estado', error: error.message });
    }
};

// POST - crear compra (solo guarda, NO toca inventario)
const createCompra = async (req, res) => {
    try {
        const { numeroFactura, numeroCompra, proveedoresId, fecha, metodoPago, estado } = req.body;

        const proveedor = await Proveedores.findByPk(proveedoresId);
        if (!proveedor) {
            return res.status(404).json({ message: 'El proveedor especificado no existe' });
        }
        if (proveedor.estado === 'inactivo') {
            return res.status(400).json({ message: 'El proveedor está inactivo' });
        }

        // IVA: leer del body, default 19, acotado a [0, 100].
        let iva = req.body.iva !== undefined && req.body.iva !== null && `${req.body.iva}`.trim() !== ''
            ? Number(req.body.iva)
            : 19;
        if (Number.isNaN(iva)) iva = 19;
        iva = Math.min(100, Math.max(0, iva));

        // numeroFactura: unicidad case-insensitive
        if (numeroFactura?.trim()) {
            const facturaExistente = await findCompraByCampoCI('numeroFactura', numeroFactura);
            if (facturaExistente) {
                return res.status(409).json({ message: 'Este número de factura ya existe' });
            }
        }

        // numeroCompra: unicidad case-insensitive
        if (numeroCompra?.trim()) {
            const compraExistente = await findCompraByCampoCI('numeroCompra', numeroCompra);
            if (compraExistente) {
                return res.status(409).json({ message: 'Ya existe una compra con ese número' });
            }
        }

        const compra = await Compras.create({
            ...(numeroFactura?.trim() ? { numeroFactura: numeroFactura.trim() } : {}),
            ...(numeroCompra?.trim() ? { numeroCompra: numeroCompra.trim() } : {}),
            proveedoresId, fecha, metodoPago, estado: estado ?? 'pendiente', iva,
        });

        const { detalles } = req.body;
        if (detalles && Array.isArray(detalles) && detalles.length > 0) {
            const registros = detalles.map((d) => ({
                comprasId:      compra.id,
                insumosId:      d.insumosId,
                cantidad:       d.cantidad,
                precioUnitario: d.precioUnitario,
            }));
            await DetalleCompraInsumo.bulkCreate(registros);
        }

        res.status(201).json({ message: 'Compra creada correctamente', compra });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map((e) => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la compra', error: error.message });
    }
};

// PUT - actualizar compra (solo si está pendiente)
const updateCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const compra = await Compras.findByPk(id);

        if (!compra) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }
        if (compra.estado !== 'pendiente') {
            return res.status(400).json({ message: 'Solo se pueden editar compras en estado pendiente' });
        }

        const { proveedoresId, fecha, metodoPago, numeroFactura, numeroCompra } = req.body;

        if (proveedoresId) {
            const proveedor = await Proveedores.findByPk(proveedoresId);
            if (!proveedor) {
                return res.status(404).json({ message: 'El proveedor especificado no existe' });
            }
            if (proveedor.estado === 'inactivo') {
                return res.status(400).json({ message: 'El proveedor está inactivo' });
            }
        }

        // numeroFactura: unicidad case-insensitive (excluyendo el propio registro)
        if (numeroFactura?.trim()) {
            const facturaExistente = await findCompraByCampoCI('numeroFactura', numeroFactura, compra.id);
            if (facturaExistente) {
                return res.status(409).json({ message: 'Este número de factura ya existe' });
            }
        }

        // numeroCompra: unicidad case-insensitive (excluyendo el propio registro)
        if (numeroCompra?.trim()) {
            const compraExistente = await findCompraByCampoCI('numeroCompra', numeroCompra, compra.id);
            if (compraExistente) {
                return res.status(409).json({ message: 'Ya existe una compra con ese número' });
            }
        }

        // IVA: recalcular si viene en el body; si no, conservar el actual.
        let iva;
        if (req.body.iva !== undefined && req.body.iva !== null && `${req.body.iva}`.trim() !== '') {
            iva = Number(req.body.iva);
            if (Number.isNaN(iva)) iva = Number(compra.iva);
            iva = Math.min(100, Math.max(0, iva));
        }

        await compra.update({
            proveedoresId, fecha, metodoPago,
            ...(numeroFactura?.trim() ? { numeroFactura: numeroFactura.trim() } : {}),
            ...(numeroCompra?.trim() ? { numeroCompra: numeroCompra.trim() } : {}),
            ...(iva !== undefined ? { iva } : {}),
        });

        const { detalles } = req.body;
        if (detalles && Array.isArray(detalles) && detalles.length > 0) {
            await DetalleCompraInsumo.destroy({ where: { comprasId: id } });
            const registros = detalles.map((d) => ({
                comprasId:      id,
                insumosId:      d.insumosId,
                cantidad:       d.cantidad,
                precioUnitario: d.precioUnitario,
            }));
            await DetalleCompraInsumo.bulkCreate(registros);
        }

        res.status(200).json({ message: 'Compra actualizada correctamente', compra });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map((e) => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la compra', error: error.message });
    }
};

// ─── Helper: sumar stock de insumos al completar una compra ───────────────────
const sumarStockDeCompra = async (compraId, proveedoresId) => {
    const detalles = await DetalleCompraInsumo.findAll({ where: { comprasId: compraId } });
    for (const d of detalles) {
        const insumo = await Insumos.findByPk(d.insumosId);
        if (!insumo) continue;

        const nuevaCantidad = (Number(insumo.cantidad) || 0) + Number(d.cantidad);

        // Regla de negocio: conservar siempre el precio más alto histórico
        const precioActual = Number(insumo.precioUnitario) || 0;
        const precioCompra = Number(d.precioUnitario) || 0;
        const precioFinal  = precioCompra > precioActual ? precioCompra : precioActual;

        await insumo.update({
            cantidad:       nuevaCantidad,
            precioUnitario: precioFinal,
            proveedoresId:  proveedoresId,
            estado:         'disponible',
        });

        // Actualizar relación many-to-many con proveedor
        try {
            await insumo.setProveedores([proveedoresId]);
        } catch (_) {
            // Si falla la relación M2M no bloqueamos el flujo principal
        }
    }
};

// PATCH - cambiar estado de la compra
const cambiarEstadoCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const compra = await Compras.findByPk(id);
        if (!compra) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }
        if (compra.estado !== 'pendiente') {
            return res.status(400).json({ message: 'Solo se puede cambiar el estado de compras pendientes.' });
        }

        const estadosValidos = ['pendiente', 'completada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido.' });
        }

        // Actualizar estado
        await compra.update({ estado });

        // Si pasa a completada → sumar stock al inventario
        if (estado === 'completada') {
            await sumarStockDeCompra(id, compra.proveedoresId);
        }

        res.status(200).json({ message: `Estado actualizado a "${estado}"`, compra });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado de la compra', error: error.message });
    }
};

// DELETE → ANULAR: cambia estado a 'anulada' y devuelve stock si estaba completada
const deleteCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const compra = await Compras.findByPk(id, {
            include: [{
                model: DetalleCompraInsumo,
                as: 'detalles',
                include: [{ model: Insumos, as: 'insumo', attributes: ['id', 'nombreInsumo', 'cantidad'] }],
            }],
        });

        if (!compra) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }
        if (compra.estado === 'anulada') {
            return res.status(400).json({ message: 'Esta compra ya fue anulada' });
        }

        // Si estaba completada, devolver el stock
        const insumosDevueltos = [];
        if (compra.estado === 'completada' && compra.detalles?.length > 0) {
            for (const d of compra.detalles) {
                const insumo = await Insumos.findByPk(d.insumosId);
                if (insumo) {
                    const cantidadAnterior = Number(insumo.cantidad) || 0;
                    const cantidadNueva = Math.max(0, cantidadAnterior - Number(d.cantidad));
                    await insumo.update({
                        cantidad: cantidadNueva,
                        estado: cantidadNueva === 0 ? 'agotado' : 'disponible',
                    });
                    insumosDevueltos.push({
                        id: insumo.id,
                        nombreInsumo: insumo.nombreInsumo,
                        cantidadDevuelta: d.cantidad,
                        cantidadAnterior,
                        cantidadNueva,
                    });
                }
            }
        }

        await compra.update({ estado: 'anulada' });

        res.status(200).json({
            message: 'Compra anulada correctamente',
            stockDevuelto: compra.estado === 'completada',
            insumosDevueltos,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al anular la compra', error: error.message });
    }
};

// POST /:id/merma — registrar insumos defectuosos
const registrarMerma = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, motivo } = req.body;

        const compra = await Compras.findByPk(id, {
            include: [{ model: DetalleCompraInsumo, as: 'detalles' }],
        });

        if (!compra) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }
        if (compra.estado !== 'completada') {
            return res.status(400).json({ message: 'Solo se pueden registrar mermas en compras completadas' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Debe indicar al menos un insumo defectuoso' });
        }

        const idsEnCompra = (compra.detalles || []).map((d) => d.insumosId);
        for (const item of items) {
            if (!idsEnCompra.includes(item.insumosId)) {
                return res.status(400).json({ message: `El insumo ID ${item.insumosId} no pertenece a esta compra` });
            }
            if (!item.cantidad || item.cantidad <= 0) {
                return res.status(400).json({ message: 'La cantidad defectuosa debe ser mayor a 0' });
            }
        }

        const mermaRegistrada = [];
        for (const item of items) {
            const insumo = await Insumos.findByPk(item.insumosId);
            if (insumo) {
                const cantidadAnterior = Number(insumo.cantidad) || 0;
                const cantidadNueva = Math.max(0, cantidadAnterior - Number(item.cantidad));
                await insumo.update({
                    cantidad: cantidadNueva,
                    estado: cantidadNueva === 0 ? 'agotado' : 'disponible',
                });

                // Registrar la merma en el detalle de compra para trazabilidad
                const detalle = await DetalleCompraInsumo.findOne({
                    where: { comprasId: id, insumosId: item.insumosId },
                });
                if (detalle) {
                    const mermaAcumulada = Number(detalle.cantidadMerma) || 0;
                    await detalle.update({
                        cantidadMerma: mermaAcumulada + Number(item.cantidad),
                    });
                }

                mermaRegistrada.push({
                    id: insumo.id,
                    nombreInsumo: insumo.nombreInsumo,
                    cantidadDefectuosa: item.cantidad,
                    cantidadAnterior,
                    cantidadNueva,
                });
            }
        }

        res.status(200).json({
            message: 'Merma registrada correctamente.',
            motivo: motivo || 'Sin motivo especificado',
            mermaRegistrada,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar la merma', error: error.message });
    }
};

module.exports = {
    getCompras,
    getCompraById,
    getComprasByEstado,
    createCompra,
    updateCompra,
    cambiarEstadoCompra,
    deleteCompra,
    registrarMerma,
};