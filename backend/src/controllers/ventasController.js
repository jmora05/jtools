const { Ventas, Clientes, DetalleVentas, Productos } = require('../models/index.js');

// GET - listar todas las ventas
const getVentas = async (req, res) => {
    try {
        const ventas = await Ventas.findAll({
            include: [
                { model: Clientes, as: 'cliente', attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono'] },
                {
                    model: DetalleVentas, as: 'detalles',
                    include: [{ model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }]
                }
            ]
        });
        res.status(200).json(ventas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las ventas', error: error.message });
    }
};

// GET - obtener venta por ID
const getVentaById = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await Ventas.findByPk(id, {
            include: [
                { model: Clientes, as: 'cliente', attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono'] },
                {
                    model: DetalleVentas, as: 'detalles',
                    include: [{ model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }]
                }
            ]
        });

        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        res.status(200).json(venta);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la venta', error: error.message });
    }
};

// POST - crear venta
const createVenta = async (req, res) => {
    try {
        const { clientesId, fecha, metodoPago, tipoVenta, total } = req.body;

        // verificar que el cliente existe
        const cliente = await Clientes.findByPk(clientesId);
        if (!cliente) {
            return res.status(404).json({ message: 'El cliente especificado no existe' });
        }
        if (cliente.estado === 'inactivo') {
            return res.status(400).json({ message: 'El cliente está inactivo' });
        }

        const venta = await Ventas.create({
            clientesId,
            fecha,
            metodoPago,
            tipoVenta,
            total
        });

        res.status(201).json({ message: 'Venta creada correctamente', venta });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la venta', error: error.message });
    }
};

// PUT - actualizar venta
const updateVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await Ventas.findByPk(id);

        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        const { clientesId, fecha, metodoPago, tipoVenta, total } = req.body;

        // verificar que el cliente existe si se está actualizando
        if (clientesId) {
            const cliente = await Clientes.findByPk(clientesId);
            if (!cliente) {
                return res.status(404).json({ message: 'El cliente especificado no existe' });
            }
            if (cliente.estado === 'inactivo') {
                return res.status(400).json({ message: 'El cliente está inactivo' });
            }
        }

        await venta.update({ clientesId, fecha, metodoPago, tipoVenta, total });

        res.status(200).json({ message: 'Venta actualizada correctamente', venta });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la venta', error: error.message });
    }
};

// DELETE - eliminar venta
const deleteVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await Ventas.findByPk(id);

        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        await venta.destroy();
        res.status(200).json({ message: 'Venta eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la venta', error: error.message });
    }
};

module.exports = {
    getVentas,
    getVentaById,
    createVenta,
    updateVenta,
    deleteVenta
};