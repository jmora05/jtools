const { Productos, CategoriaProductos, DetalleVentas, DetallePedidos } = require('../models/index.js');

// GET - listar todos los productos
const getProductos = async (req, res) => {
    try {
        const productos = await Productos.findAll({
            include: [
                { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria', 'descripcion'] }
            ]
        });
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
    }
};

// GET - obtener producto por ID
const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Productos.findByPk(id, {
            include: [
                { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria', 'descripcion'] }
            ]
        });

        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
    }
};

// GET - listar productos con stock bajo (menor o igual a 5)
const getProductosStockBajo = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const productos = await Productos.findAll({
            where: {
                stock: { [Op.lte]: 5 },
                estado: 'activo'
            },
            include: [
                { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria'] }
            ]
        });
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos con stock bajo', error: error.message });
    }
};

// POST - crear producto
const createProducto = async (req, res) => {
    try {
        const {
            nombreProducto,
            referencia,
            categoriaProductoId,
            descripcion,
            precio,
            stock,
            estado
        } = req.body;

        // Verificar que la categoría existe
        const categoria = await CategoriaProductos.findByPk(categoriaProductoId);
        if (!categoria) {
            return res.status(404).json({ message: 'La categoría especificada no existe' });
        }

        const producto = await Productos.create({
            nombreProducto: nombreProducto.trim(),
            referencia: referencia.trim(),
            categoriaProductoId,
            descripcion: descripcion ? descripcion.trim() : null,
            precio,
            stock,
            estado
        });

        res.status(201).json({ message: 'Producto creado correctamente', producto });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    const mensajes = error.errors.map(e => ({ campo: e.path, mensaje: e.message }));
    return res.status(400).json({ message: 'Error de validación', errores: mensajes });
}
        res.status(500).json({ message: 'Error al crear el producto', error: error.message });
    }
};


// PUT - actualizar producto
const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Productos.findByPk(id);

        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const {
            nombreProducto,
            referencia,
            categoriaProductoId,
            descripcion,
            precio,
            stock,
            estado
        } = req.body;

        // Verificar que la categoría existe si se está actualizando
        if (categoriaProductoId) {
            const categoria = await CategoriaProductos.findByPk(categoriaProductoId);
            if (!categoria) {
                return res.status(404).json({ message: 'La categoría especificada no existe' });
            }
        }

        await producto.update({
            nombreProducto: nombreProducto ? nombreProducto.trim() : producto.nombreProducto,
            referencia: referencia ? referencia.trim() : producto.referencia,
            categoriaProductoId: categoriaProductoId ?? producto.categoriaProductoId,
            descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : producto.descripcion,
            precio: precio ?? producto.precio,
            stock: stock ?? producto.stock,
            estado: estado ?? producto.estado,
        });

        res.status(200).json({ message: 'Producto actualizado correctamente', producto });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => ({ campo: e.path, mensaje: e.message }));
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
    }
};

// DELETE - desactivar producto (no se borra físicamente por historial de ventas y pedidos)
const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Productos.findByPk(id);

        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        await producto.update({ estado: 'inactivo' });
        res.status(200).json({ message: 'Producto desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar el producto', error: error.message });
    }
};


module.exports = {
    getProductos,
    getProductoById,
    getProductosStockBajo,
    createProducto,
    updateProducto,
    deleteProducto
};