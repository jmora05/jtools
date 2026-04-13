const { Insumos, Proveedores } = require('../models/index.js');
const { validarInsumo } = require('../validators/insumosValidator.js');
const { Op } = require('sequelize');

// GET - listar todos los insumos
const getInsumos = async (req, res) => {
    try {
        const insumos = await Insumos.findAll({
            include: [{ model: Proveedores, as: 'proveedor', attributes: ['id', 'razon_social'] }]
        });
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos', error: error.message });
    }
};

// GET - obtener insumo por ID
const getInsumoById = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id, {
            include: [{ model: Proveedores, as: 'proveedor', attributes: ['id', 'razon_social'] }]
        });

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        res.status(200).json(insumo);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el insumo', error: error.message });
    }
};

// GET - listar insumos activos
const getInsumosActivos = async (req, res) => {
    try {
        const insumos = await Insumos.findAll({
            where: { estado: 'activo' },
            include: [{ model: Proveedores, as: 'proveedor', attributes: ['id', 'razon_social'] }]
        });
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos activos', error: error.message });
    }
};

// GET - listar insumos con stock bajo (stock <= stock_minimo)
const getInsumosBajoStock = async (req, res) => {
    try {
        const insumos = await Insumos.findAll({
            where: {
                estado: 'activo',
                stock: { [Op.lte]: sequelize.col('stock_minimo') }
            },
            include: [{ model: Proveedores, as: 'proveedor', attributes: ['id', 'razon_social'] }]
        });
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener insumos con bajo stock', error: error.message });
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
            nombre,
            descripcion,
            precio_unitario,
            stock,
            stock_minimo,
            unidad_medida,
            categoria,
            estado,
            foto,
            proveedorId,
        } = req.body;

        // Verificar que el proveedor existe si se envió
        if (proveedorId) {
            const proveedor = await Proveedores.findByPk(proveedorId);
            if (!proveedor) {
                return res.status(404).json({ message: 'Proveedor no encontrado' });
            }
        }

        const insumo = await Insumos.create({
            nombre,
            descripcion,
            precio_unitario,
            stock:        stock        ?? 0,
            stock_minimo: stock_minimo ?? 0,
            unidad_medida,
            categoria,
            estado:       estado       ?? 'activo',
            foto,
            proveedorId:  proveedorId  ?? null,
        });

        res.status(201).json({ message: 'Insumo creado correctamente', insumo });
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
            nombre,
            descripcion,
            precio_unitario,
            stock,
            stock_minimo,
            unidad_medida,
            categoria,
            estado,
            foto,
            proveedorId,
        } = req.body;

        if (proveedorId) {
            const proveedor = await Proveedores.findByPk(proveedorId);
            if (!proveedor) {
                return res.status(404).json({ message: 'Proveedor no encontrado' });
            }
        }

        await insumo.update({
            nombre,
            descripcion,
            precio_unitario,
            stock,
            stock_minimo,
            unidad_medida,
            categoria,
            estado,
            foto,
            proveedorId: proveedorId ?? null,
        });

        res.status(200).json({ message: 'Insumo actualizado correctamente', insumo });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el insumo', error: error.message });
    }
};

// DELETE - desactivar insumo (soft delete)
const deleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        await insumo.update({ estado: 'inactivo' });
        res.status(200).json({ message: 'Insumo desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar el insumo', error: error.message });
    }
};

// DELETE (force) - eliminar físicamente
const forceDeleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
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
    getInsumosActivos,
    getInsumosBajoStock,
    createInsumo,
    updateInsumo,
    deleteInsumo,
    forceDeleteInsumo,
};