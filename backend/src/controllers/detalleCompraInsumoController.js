const { DetalleCompraInsumo, Compras, Insumos } = require('../models/index.js');

// GET - listar detalles por compra
const getDetallesByCompra = async (req, res) => {
    try {
        const { comprasId } = req.params;

        const compra = await Compras.findByPk(comprasId);
        if (!compra) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        const detalles = await DetalleCompraInsumo.findAll({
            where: { comprasId },
            include: [
                { model: Insumos, as: 'insumo', attributes: ['id', 'nombreInsumo', 'precioUnitario', 'unidadMedida', 'estado'] }
            ]
        });

        res.status(200).json(detalles);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los detalles de la compra', error: error.message });
    }
};

// GET - obtener detalle por ID
const getDetalleCompraInsumoById = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetalleCompraInsumo.findByPk(id, {
            include: [
                { model: Compras, as: 'compra', attributes: ['id', 'fecha', 'metodoPago', 'estado'] },
                { model: Insumos, as: 'insumo', attributes: ['id', 'nombreInsumo', 'precioUnitario', 'unidadMedida'] }
            ]
        });

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de compra no encontrado' });
        }

        res.status(200).json(detalle);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el detalle de compra', error: error.message });
    }
};

// POST - agregar insumo a una compra
const createDetalleCompraInsumo = async (req, res) => {
    try {
        const { comprasId, insumosId, cantidad, precioUnitario } = req.body;

        // verificar que la compra existe y no está completada
        const compra = await Compras.findByPk(comprasId);
        if (!compra) {
            return res.status(404).json({ message: 'La compra especificada no existe' });
        }
        if (compra.estado === 'completada') {
            return res.status(400).json({ message: 'No se pueden agregar insumos a una compra ya completada' });
        }

        // verificar que el insumo existe
        const insumo = await Insumos.findByPk(insumosId);
        if (!insumo) {
            return res.status(404).json({ message: 'El insumo especificado no existe' });
        }

        // verificar que el insumo no está ya en esta compra
        const detalleExistente = await DetalleCompraInsumo.findOne({
            where: { comprasId, insumosId }
        });
        if (detalleExistente) {
            return res.status(400).json({ message: 'Este insumo ya está registrado en esta compra' });
        }

        const detalle = await DetalleCompraInsumo.create({
            comprasId,
            insumosId,
            cantidad,
            precioUnitario
        });

        // si el insumo estaba agotado, marcarlo como disponible
        if (insumo.estado === 'agotado') {
            await insumo.update({ estado: 'disponible' });
        }

        res.status(201).json({ message: 'Insumo agregado a la compra correctamente', detalle });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al agregar el insumo a la compra', error: error.message });
    }
};

// PUT - actualizar cantidad o precio del detalle
const updateDetalleCompraInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetalleCompraInsumo.findByPk(id);

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de compra no encontrado' });
        }

        // no permitir editar si la compra ya está completada
        const compra = await Compras.findByPk(detalle.comprasId);
        if (compra.estado === 'completada') {
            return res.status(400).json({ message: 'No se puede editar el detalle de una compra ya completada' });
        }

        const { cantidad, precioUnitario } = req.body;
        await detalle.update({ cantidad, precioUnitario });

        res.status(200).json({ message: 'Detalle de compra actualizado correctamente', detalle });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el detalle de compra', error: error.message });
    }
};

// DELETE - eliminar detalle de compra
const deleteDetalleCompraInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetalleCompraInsumo.findByPk(id);

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de compra no encontrado' });
        }

        // no permitir eliminar si la compra ya está completada
        const compra = await Compras.findByPk(detalle.comprasId);
        if (compra.estado === 'completada') {
            return res.status(400).json({ message: 'No se puede eliminar el detalle de una compra ya completada' });
        }

        await detalle.destroy();
        res.status(200).json({ message: 'Detalle de compra eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el detalle de compra', error: error.message });
    }
};

module.exports = {
    getDetallesByCompra,
    getDetalleCompraInsumoById,
    createDetalleCompraInsumo,
    updateDetalleCompraInsumo,
    deleteDetalleCompraInsumo
};