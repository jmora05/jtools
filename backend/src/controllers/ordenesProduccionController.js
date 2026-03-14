const { OrdenesProduccion, Productos, Empleados, Pedidos } = require('../models/index.js');

// GET - listar todas las órdenes de producción
const getOrdenesProduccion = async (req, res) => {
    try {
        const ordenes = await OrdenesProduccion.findAll({
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia'] },
                { model: Empleados, as: 'responsable', attributes: ['id', 'nombres', 'apellidos', 'cargo'] },
                { model: Pedidos, as: 'pedido', attributes: ['id', 'fecha_pedido', 'total', 'ciudad'] }
            ]
        });
        res.status(200).json(ordenes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las órdenes de producción', error: error.message });
    }
};

// GET - obtener orden de producción por ID
const getOrdenProduccionById = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await OrdenesProduccion.findByPk(id, {
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia'] },
                { model: Empleados, as: 'responsable', attributes: ['id', 'nombres', 'apellidos', 'cargo'] },
                { model: Pedidos, as: 'pedido', attributes: ['id', 'fecha_pedido', 'total', 'ciudad'] }
            ]
        });

        if (!orden) {
            return res.status(404).json({ message: 'Orden de producción no encontrada' });
        }

        res.status(200).json(orden);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la orden de producción', error: error.message });
    }
};

// POST - crear orden de producción
const createOrdenProduccion = async (req, res) => {
    try {
        const { productoId, cantidad, responsableId, pedidoId, fechaEntrega, nota } = req.body;

        // verificar que el producto existe
        const producto = await Productos.findByPk(productoId);
        if (!producto) {
            return res.status(404).json({ message: 'El producto especificado no existe' });
        }

        // verificar que el empleado existe y está activo
        const empleado = await Empleados.findByPk(responsableId);
        if (!empleado) {
            return res.status(404).json({ message: 'El empleado responsable no existe' });
        }
        if (empleado.estado === 'inactivo') {
            return res.status(400).json({ message: 'El empleado responsable está inactivo' });
        }

        // verificar que el pedido existe
        const pedido = await Pedidos.findByPk(pedidoId);
        if (!pedido) {
            return res.status(404).json({ message: 'El pedido especificado no existe' });
        }

        const orden = await OrdenesProduccion.create({
            productoId,
            cantidad,
            responsableId,
            pedidoId,
            fechaEntrega,
            nota
        });

        res.status(201).json({ message: 'Orden de producción creada correctamente', orden });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la orden de producción', error: error.message });
    }
};

// PUT - actualizar orden de producción
const updateOrdenProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await OrdenesProduccion.findByPk(id);

        if (!orden) {
            return res.status(404).json({ message: 'Orden de producción no encontrada' });
        }

        const { productoId, cantidad, responsableId, pedidoId, fechaEntrega, nota } = req.body;

        // verificar que el producto existe si se está actualizando
        if (productoId) {
            const producto = await Productos.findByPk(productoId);
            if (!producto) {
                return res.status(404).json({ message: 'El producto especificado no existe' });
            }
        }

        // verificar que el empleado existe si se está actualizando
        if (responsableId) {
            const empleado = await Empleados.findByPk(responsableId);
            if (!empleado) {
                return res.status(404).json({ message: 'El empleado responsable no existe' });
            }
            if (empleado.estado === 'inactivo') {
                return res.status(400).json({ message: 'El empleado responsable está inactivo' });
            }
        }

        // verificar que el pedido existe si se está actualizando
        if (pedidoId) {
            const pedido = await Pedidos.findByPk(pedidoId);
            if (!pedido) {
                return res.status(404).json({ message: 'El pedido especificado no existe' });
            }
        }

        await orden.update({ productoId, cantidad, responsableId, pedidoId, fechaEntrega, nota });

        res.status(200).json({ message: 'Orden de producción actualizada correctamente', orden });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la orden de producción', error: error.message });
    }
};

// DELETE - eliminar orden de producción
const deleteOrdenProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await OrdenesProduccion.findByPk(id);

        if (!orden) {
            return res.status(404).json({ message: 'Orden de producción no encontrada' });
        }

        await orden.destroy();
        res.status(200).json({ message: 'Orden de producción eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la orden de producción', error: error.message });
    }
};

module.exports = {
    getOrdenesProduccion,
    getOrdenProduccionById,
    createOrdenProduccion,
    updateOrdenProduccion,
    deleteOrdenProduccion
};