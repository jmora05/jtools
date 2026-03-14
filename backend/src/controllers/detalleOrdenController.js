const { DetalleOrden, OrdenesProduccion, Productos } = require('../models/index.js');

// GET - listar detalles por orden de producción
const getDetallesByOrden = async (req, res) => {
    try {
        const { ordenProduccionId } = req.params;

        const orden = await OrdenesProduccion.findByPk(ordenProduccionId);
        if (!orden) {
            return res.status(404).json({ message: 'Orden de producción no encontrada' });
        }

        const detalles = await DetalleOrden.findAll({
            where: { ordenProduccionId },
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio', 'stock'] }
            ]
        });

        res.status(200).json(detalles);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los detalles de la orden', error: error.message });
    }
};

// GET - obtener detalle por ID
const getDetalleOrdenById = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetalleOrden.findByPk(id, {
            include: [
                { model: OrdenesProduccion, as: 'ordenProduccion', attributes: ['id', 'cantidad', 'fechaEntrega', 'nota'] },
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }
            ]
        });

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de orden no encontrado' });
        }

        res.status(200).json(detalle);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el detalle de la orden', error: error.message });
    }
};

// POST - agregar detalle a una orden de producción
const createDetalleOrden = async (req, res) => {
    try {
        const { productosId, ordenProduccionId, descripcion } = req.body;

        // verificar que la orden de producción existe
        const orden = await OrdenesProduccion.findByPk(ordenProduccionId);
        if (!orden) {
            return res.status(404).json({ message: 'La orden de producción especificada no existe' });
        }

        // verificar que el producto existe y está activo
        const producto = await Productos.findByPk(productosId);
        if (!producto) {
            return res.status(404).json({ message: 'El producto especificado no existe' });
        }
        if (producto.estado === 'inactivo') {
            return res.status(400).json({ message: 'El producto está inactivo' });
        }

        const detalle = await DetalleOrden.create({
            productosId,
            ordenProduccionId,
            descripcion
        });

        res.status(201).json({ message: 'Detalle de orden creado correctamente', detalle });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el detalle de orden', error: error.message });
    }
};

// PUT - actualizar detalle de orden
const updateDetalleOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetalleOrden.findByPk(id);

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de orden no encontrado' });
        }

        const { productosId, descripcion } = req.body;

        // verificar que el producto existe si se está actualizando
        if (productosId) {
            const producto = await Productos.findByPk(productosId);
            if (!producto) {
                return res.status(404).json({ message: 'El producto especificado no existe' });
            }
            if (producto.estado === 'inactivo') {
                return res.status(400).json({ message: 'El producto está inactivo' });
            }
        }

        await detalle.update({ productosId, descripcion });

        res.status(200).json({ message: 'Detalle de orden actualizado correctamente', detalle });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el detalle de orden', error: error.message });
    }
};

// DELETE - eliminar detalle de orden
const deleteDetalleOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetalleOrden.findByPk(id);

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de orden no encontrado' });
        }

        await detalle.destroy();
        res.status(200).json({ message: 'Detalle de orden eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el detalle de orden', error: error.message });
    }
};

module.exports = {
    getDetallesByOrden,
    getDetalleOrdenById,
    createDetalleOrden,
    updateDetalleOrden,
    deleteDetalleOrden
};