const { Clientes, Ventas, Pedidos } = require('../models/index.js');

// GET - listar todos los clientes
const getClientes = async (req, res) => {
    try {
        const clientes = await Clientes.findAll();
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los clientes', error: error.message });
    }
};

// GET - obtener cliente por ID
const getClienteById = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el cliente', error: error.message });
    }
};

// GET - historial de ventas y pedidos del cliente
const getHistorialCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id, {
            include: [
                { model: Ventas, as: 'ventas', attributes: ['id', 'fecha', 'metodoPago', 'tipoVenta', 'total'] },
                { model: Pedidos, as: 'pedidos', attributes: ['id', 'fecha_pedido', 'total', 'ciudad', 'direccion'] }
            ]
        });

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el historial del cliente', error: error.message });
    }
};

// GET - listar clientes activos
const getClientesActivos = async (req, res) => {
    try {
        const clientes = await Clientes.findAll({
            where: { estado: 'activo' }
        });
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los clientes activos', error: error.message });
    }
};

// POST - crear cliente
const createCliente = async (req, res) => {
    try {
        const {
            razon_social,
            tipo_documento,
            numero_documento,
            direccion,
            ciudad,
            telefono,
            email,
            estado,
            foto,
            nombres,
            apellidos
        } = req.body;

        const cliente = await Clientes.create({
            razon_social,
            tipo_documento,
            numero_documento,
            direccion,
            ciudad,
            telefono,
            email,
            estado,
            foto,
            nombres,
            apellidos
        });

        res.status(201).json({ message: 'Cliente creado correctamente', cliente });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el cliente', error: error.message });
    }
};

// PUT - actualizar cliente
const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        const {
            razon_social,
            tipo_documento,
            numero_documento,
            direccion,
            ciudad,
            telefono,
            email,
            estado,
            foto,
            nombres,
            apellidos
        } = req.body;

        await cliente.update({
            razon_social,
            tipo_documento,
            numero_documento,
            direccion,
            ciudad,
            telefono,
            email,
            estado,
            foto,
            nombres,
            apellidos
        });

        res.status(200).json({ message: 'Cliente actualizado correctamente', cliente });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el cliente', error: error.message });
    }
};

// DELETE - desactivar cliente (no se borra físicamente por historial de ventas y pedidos)
const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // verificar si tiene ventas o pedidos activos
        const ventasActivas = await Ventas.findOne({ where: { clientesId: id } });
        const pedidosActivos = await Pedidos.findOne({ where: { clienteId: id } });

        if (ventasActivas || pedidosActivos) {
            // desactivar en vez de borrar para preservar historial
            await cliente.update({ estado: 'inactivo' });
            return res.status(200).json({ message: 'Cliente desactivado correctamente (tiene historial de ventas o pedidos)' });
        }

        await cliente.update({ estado: 'inactivo' });
        res.status(200).json({ message: 'Cliente desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar el cliente', error: error.message });
    }
};

module.exports = {
    getClientes,
    getClienteById,
    getHistorialCliente,
    getClientesActivos,
    createCliente,
    updateCliente,
    deleteCliente
};