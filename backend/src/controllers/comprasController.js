const { Compras, Proveedores, DetalleCompraInsumo, Insumos } = require('../models/index.js');

// GET - listar todas las compras
const getCompras = async (req, res) => {
    try {
        const compras = await Compras.findAll({
            include: [
                { model: Proveedores, as: 'proveedor', attributes: ['id', 'nombreEmpresa', 'personaContacto', 'telefono', 'email'] },
                {
                    model: DetalleCompraInsumo, as: 'detalles',
                    include: [{ model: Insumos, as: 'insumo', attributes: ['id', 'nombreInsumo', 'unidadMedida'] }]
                }
            ]
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
                { model: Proveedores, as: 'proveedor', attributes: ['id', 'nombreEmpresa', 'personaContacto', 'telefono', 'email'] },
                {
                    model: DetalleCompraInsumo, as: 'detalles',
                    include: [{ model: Insumos, as: 'insumo', attributes: ['id', 'nombreInsumo', 'unidadMedida', 'precioUnitario'] }]
                }
            ]
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
        const estadosValidos = ['pendiente', 'en transito', 'completada'];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido. Use: pendiente, en transito o completada' });
        }

        const compras = await Compras.findAll({
            where: { estado },
            include: [
                { model: Proveedores, as: 'proveedor', attributes: ['id', 'nombreEmpresa', 'telefono'] }
            ]
        });

        res.status(200).json(compras);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las compras por estado', error: error.message });
    }
};

// POST - crear compra
const createCompra = async (req, res) => {
    try {
        const { id, proveedoresId, fecha, metodoPago, estado } = req.body;

        // verificar que el proveedor existe y está activo
        const proveedor = await Proveedores.findByPk(proveedoresId);
        if (!proveedor) {
            return res.status(404).json({ message: 'El proveedor especificado no existe' });
        }
        if (proveedor.estado === 'inactivo') {
            return res.status(400).json({ message: 'El proveedor está inactivo' });
        }

        // verificar que el número de factura no existe ya
        if (id) {
            const facturaExistente = await Compras.findByPk(id);
            if (facturaExistente) {
                return res.status(400).json({ message: 'Este número de factura ya existe' });
            }
        }

        const compra = await Compras.create({
            id,
            proveedoresId,
            fecha,
            metodoPago,
            estado
        });

        res.status(201).json({ message: 'Compra creada correctamente', compra });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
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

        if (compra.estado === 'completada') {
            return res.status(400).json({ message: 'No se puede editar una compra ya completada' });
        }

        const { proveedoresId, fecha, metodoPago } = req.body;

        // verificar que el proveedor existe si se está actualizando
        if (proveedoresId) {
            const proveedor = await Proveedores.findByPk(proveedoresId);
            if (!proveedor) {
                return res.status(404).json({ message: 'El proveedor especificado no existe' });
            }
            if (proveedor.estado === 'inactivo') {
                return res.status(400).json({ message: 'El proveedor está inactivo' });
            }
        }

        await compra.update({ proveedoresId, fecha, metodoPago });

        res.status(200).json({ message: 'Compra actualizada correctamente', compra });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la compra', error: error.message });
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

        const estadosValidos = ['pendiente', 'en transito', 'completada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido. Use: pendiente, en transito o completada' });
        }

        // no permitir retroceder el estado
        const flujo = { 'pendiente': 0, 'en transito': 1, 'completada': 2 };
        if (flujo[estado] < flujo[compra.estado]) {
            return res.status(400).json({ message: `No se puede cambiar de "${compra.estado}" a "${estado}"` });
        }

        await compra.update({ estado });
        res.status(200).json({ message: `Estado de compra actualizado a "${estado}"`, compra });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado de la compra', error: error.message });
    }
};

// DELETE - eliminar compra (solo si está pendiente y no tiene detalles)
const deleteCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const compra = await Compras.findByPk(id);

        if (!compra) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        if (compra.estado !== 'pendiente') {
            return res.status(400).json({ message: 'Solo se pueden eliminar compras en estado pendiente' });
        }

        // verificar que no tiene detalles registrados
        const detalles = await DetalleCompraInsumo.findOne({ where: { comprasId: id } });
        if (detalles) {
            return res.status(400).json({ message: 'No se puede eliminar una compra que ya tiene insumos registrados' });
        }

        await compra.destroy();
        res.status(200).json({ message: 'Compra eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la compra', error: error.message });
    }
};

module.exports = {
    getCompras,
    getCompraById,
    getComprasByEstado,
    createCompra,
    updateCompra,
    cambiarEstadoCompra,
    deleteCompra
};
