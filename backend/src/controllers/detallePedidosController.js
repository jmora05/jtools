const { DetallePedidos, Pedidos, Productos } = require('../models/index.js');

// GET - listar detalles por pedido
const getDetallesByPedido = async (req, res) => {
    try {
        const { pedidosId } = req.params;

        const pedido = await Pedidos.findByPk(pedidosId);
        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const detalles = await DetallePedidos.findAll({
            where: { pedidosId },
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio', 'stock'] }
            ]
        });

        res.status(200).json(detalles);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los detalles del pedido', error: error.message });
    }
};

// GET - obtener detalle por ID
const getDetallePedidoById = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetallePedidos.findByPk(id, {
            include: [
                { model: Pedidos, as: 'pedido', attributes: ['id', 'fecha_pedido', 'total', 'ciudad'] },
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }
            ]
        });

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de pedido no encontrado' });
        }

        res.status(200).json(detalle);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el detalle del pedido', error: error.message });
    }
};

// POST - agregar producto a un pedido
const createDetallePedido = async (req, res) => {
    try {
        const { pedidosId, productosId, cantidad, precioUnitario } = req.body;

        // verificar que el pedido existe
        const pedido = await Pedidos.findByPk(pedidosId);
        if (!pedido) {
            return res.status(404).json({ message: 'El pedido especificado no existe' });
        }

        // verificar que el producto existe y está activo
        const producto = await Productos.findByPk(productosId);
        if (!producto) {
            return res.status(404).json({ message: 'El producto especificado no existe' });
        }
        if (producto.estado === 'inactivo') {
            return res.status(400).json({ message: 'El producto está inactivo' });
        }

        // verificar stock suficiente
        if (producto.stock < cantidad) {
            return res.status(400).json({ message: `Stock insuficiente. Stock disponible: ${producto.stock}` });
        }

        // calcular total del detalle automáticamente
        const total = cantidad * precioUnitario;

        const detalle = await DetallePedidos.create({
            pedidosId,
            productosId,
            cantidad,
            precioUnitario,
            total
        });

        // descontar stock del producto
        await producto.update({ stock: producto.stock - cantidad });

        // recalcular total del pedido
        const todosLosDetalles = await DetallePedidos.findAll({ where: { pedidosId } });
        const nuevoTotal = todosLosDetalles.reduce((sum, d) => sum + parseFloat(d.total), 0);
        await pedido.update({ total: nuevoTotal });

        res.status(201).json({ message: 'Producto agregado al pedido correctamente', detalle });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al agregar el producto al pedido', error: error.message });
    }
};

// PUT - actualizar detalle del pedido
const updateDetallePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetallePedidos.findByPk(id);

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de pedido no encontrado' });
        }

        const { cantidad, precioUnitario } = req.body;

        // verificar stock si se actualiza la cantidad
        if (cantidad) {
            const producto = await Productos.findByPk(detalle.productosId);
            const diferencia = cantidad - detalle.cantidad;

            if (diferencia > 0 && producto.stock < diferencia) {
                return res.status(400).json({ message: `Stock insuficiente. Stock disponible: ${producto.stock}` });
            }

            // ajustar stock según diferencia
            await producto.update({ stock: producto.stock - diferencia });
        }

        const nuevoTotal = (cantidad || detalle.cantidad) * (precioUnitario || detalle.precioUnitario);
        await detalle.update({ cantidad, precioUnitario, total: nuevoTotal });

        // recalcular total del pedido
        const pedido = await Pedidos.findByPk(detalle.pedidosId);
        const todosLosDetalles = await DetallePedidos.findAll({ where: { pedidosId: detalle.pedidosId } });
        const nuevoTotalPedido = todosLosDetalles.reduce((sum, d) => sum + parseFloat(d.total), 0);
        await pedido.update({ total: nuevoTotalPedido });

        res.status(200).json({ message: 'Detalle del pedido actualizado correctamente', detalle });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el detalle del pedido', error: error.message });
    }
};

// DELETE - eliminar detalle del pedido y restaurar stock
const deleteDetallePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetallePedidos.findByPk(id);

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de pedido no encontrado' });
        }

        // restaurar stock del producto
        const producto = await Productos.findByPk(detalle.productosId);
        if (producto) {
            await producto.update({ stock: producto.stock + detalle.cantidad });
        }

        const pedidosId = detalle.pedidosId;
        await detalle.destroy();

        // recalcular total del pedido
        const pedido = await Pedidos.findByPk(pedidosId);
        const todosLosDetalles = await DetallePedidos.findAll({ where: { pedidosId } });
        const nuevoTotal = todosLosDetalles.reduce((sum, d) => sum + parseFloat(d.total), 0);
        await pedido.update({ total: nuevoTotal });

        res.status(200).json({ message: 'Detalle del pedido eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el detalle del pedido', error: error.message });
    }
};

module.exports = {
    getDetallesByPedido,
    getDetallePedidoById,
    createDetallePedido,
    updateDetallePedido,
    deleteDetallePedido
};