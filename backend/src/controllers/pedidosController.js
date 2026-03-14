const { Pedidos, Clientes, DetallePedidos, Productos, OrdenesProduccion } = require('../models/index.js');

// GET - listar todos los pedidos
const getPedidos = async (req, res) => {
    try {
        const pedidos = await Pedidos.findAll({
            include: [
                { model: Clientes, as: 'cliente', attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono'] },
                {
                    model: DetallePedidos, as: 'detalles',
                    include: [{ model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }]
                }
            ]
        });
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los pedidos', error: error.message });
    }
};

// GET - obtener pedido por ID
const getPedidoById = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await Pedidos.findByPk(id, {
            include: [
                { model: Clientes, as: 'cliente', attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono'] },
                {
                    model: DetallePedidos, as: 'detalles',
                    include: [{ model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }]
                },
                { model: OrdenesProduccion, as: 'ordenes', attributes: ['id', 'cantidad', 'fechaEntrega', 'nota'] }
            ]
        });

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        res.status(200).json(pedido);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el pedido', error: error.message });
    }
};

// POST - crear pedido
const createPedido = async (req, res) => {
    try {
        const {
            clienteId,
            fecha_pedido,
            total,
            direccion,
            ciudad,
            instrucciones_entrega,
            notas_observaciones
        } = req.body;

        // verificar que el cliente existe y está activo
        const cliente = await Clientes.findByPk(clienteId);
        if (!cliente) {
            return res.status(404).json({ message: 'El cliente especificado no existe' });
        }
        if (cliente.estado === 'inactivo') {
            return res.status(400).json({ message: 'El cliente está inactivo' });
        }

        const pedido = await Pedidos.create({
            clienteId,
            fecha_pedido,
            total,
            direccion,
            ciudad,
            instrucciones_entrega,
            notas_observaciones
        });

        res.status(201).json({ message: 'Pedido creado correctamente', pedido });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el pedido', error: error.message });
    }
};

// PUT - actualizar pedido
const updatePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await Pedidos.findByPk(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const {
            clienteId,
            fecha_pedido,
            total,
            direccion,
            ciudad,
            instrucciones_entrega,
            notas_observaciones
        } = req.body;

        // verificar que el cliente existe si se está actualizando
        if (clienteId) {
            const cliente = await Clientes.findByPk(clienteId);
            if (!cliente) {
                return res.status(404).json({ message: 'El cliente especificado no existe' });
            }
            if (cliente.estado === 'inactivo') {
                return res.status(400).json({ message: 'El cliente está inactivo' });
            }
        }

        await pedido.update({
            clienteId,
            fecha_pedido,
            total,
            direccion,
            ciudad,
            instrucciones_entrega,
            notas_observaciones
        });

        res.status(200).json({ message: 'Pedido actualizado correctamente', pedido });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el pedido', error: error.message });
    }
};

// DELETE - eliminar pedido (solo si no tiene órdenes de producción asociadas)
const deletePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await Pedidos.findByPk(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        // verificar si tiene órdenes de producción asociadas
        const ordenesAsociadas = await OrdenesProduccion.findOne({
            where: { pedidoId: id }
        });

        if (ordenesAsociadas) {
            return res.status(400).json({ message: 'No se puede eliminar el pedido porque tiene órdenes de producción asociadas' });
        }

        await pedido.destroy();
        res.status(200).json({ message: 'Pedido eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el pedido', error: error.message });
    }
};

module.exports = {
    getPedidos,
    getPedidoById,
    createPedido,
    updatePedido,
    deletePedido
};