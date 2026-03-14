const { InsumoProducto, Insumos, Productos } = require('../models/index.js');

// GET - listar todos los insumos por producto
const getInsumosByProducto = async (req, res) => {
    try {
        const { productosId } = req.params;

        // verificar que el producto existe
        const producto = await Productos.findByPk(productosId);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const insumos = await InsumoProducto.findAll({
            where: { productosId },
            include: [
                { model: Insumos, as: 'insumo', attributes: ['id', 'nombreInsumo', 'precioUnitario', 'unidadMedida', 'estado'] }
            ]
        });

        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos del producto', error: error.message });
    }
};

// GET - listar todos los productos que usan un insumo
const getProductosByInsumo = async (req, res) => {
    try {
        const { insumosId } = req.params;

        // verificar que el insumo existe
        const insumo = await Insumos.findByPk(insumosId);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        const productos = await InsumoProducto.findAll({
            where: { insumosId },
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio', 'estado'] }
            ]
        });

        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos del insumo', error: error.message });
    }
};

// GET - obtener relación por ID
const getInsumoProductoById = async (req, res) => {
    try {
        const { id } = req.params;
        const insumoProducto = await InsumoProducto.findByPk(id, {
            include: [
                { model: Insumos, as: 'insumo', attributes: ['id', 'nombreInsumo', 'precioUnitario', 'unidadMedida'] },
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia'] }
            ]
        });

        if (!insumoProducto) {
            return res.status(404).json({ message: 'Relación insumo-producto no encontrada' });
        }

        res.status(200).json(insumoProducto);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la relación insumo-producto', error: error.message });
    }
};

// POST - asignar insumo a producto
const createInsumoProducto = async (req, res) => {
    try {
        const { insumosId, productosId, cantidad, unidadMedida } = req.body;

        // verificar que el insumo existe y está disponible
        const insumo = await Insumos.findByPk(insumosId);
        if (!insumo) {
            return res.status(404).json({ message: 'El insumo especificado no existe' });
        }
        if (insumo.estado === 'agotado') {
            return res.status(400).json({ message: 'El insumo está agotado' });
        }

        // verificar que el producto existe y está activo
        const producto = await Productos.findByPk(productosId);
        if (!producto) {
            return res.status(404).json({ message: 'El producto especificado no existe' });
        }
        if (producto.estado === 'inactivo') {
            return res.status(400).json({ message: 'El producto está inactivo' });
        }

        // verificar que la relación no existe ya
        const relacionExistente = await InsumoProducto.findOne({
            where: { insumosId, productosId }
        });
        if (relacionExistente) {
            return res.status(400).json({ message: 'Este insumo ya está asignado a este producto' });
        }

        const insumoProducto = await InsumoProducto.create({
            insumosId,
            productosId,
            cantidad,
            unidadMedida
        });

        res.status(201).json({ message: 'Insumo asignado al producto correctamente', insumoProducto });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al asignar el insumo al producto', error: error.message });
    }
};

// PUT - actualizar cantidad o unidad de medida
const updateInsumoProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const insumoProducto = await InsumoProducto.findByPk(id);

        if (!insumoProducto) {
            return res.status(404).json({ message: 'Relación insumo-producto no encontrada' });
        }

        const { cantidad, unidadMedida } = req.body;

        await insumoProducto.update({ cantidad, unidadMedida });

        res.status(200).json({ message: 'Relación insumo-producto actualizada correctamente', insumoProducto });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la relación insumo-producto', error: error.message });
    }
};

// DELETE - quitar insumo de un producto
const deleteInsumoProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const insumoProducto = await InsumoProducto.findByPk(id);

        if (!insumoProducto) {
            return res.status(404).json({ message: 'Relación insumo-producto no encontrada' });
        }

        await insumoProducto.destroy();
        res.status(200).json({ message: 'Insumo removido del producto correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al remover el insumo del producto', error: error.message });
    }
};

module.exports = {
    getInsumosByProducto,
    getProductosByInsumo,
    getInsumoProductoById,
    createInsumoProducto,
    updateInsumoProducto,
    deleteInsumoProducto
};