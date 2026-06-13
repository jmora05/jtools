const { Productos, CategoriaProductos, DetalleVentas, DetallePedidos } = require('../models/index.js');

// ─── GET - listar todos los productos ─────────────────────────────────────────
const getProductos = async (req, res) => {
    try {
        const productos = await Productos.findAll({
            include: [
                { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria', 'descripcion'] }
            ]
        });
        res.status(200).json(productos);
    } catch (error) {
        console.error('ERROR LISTAR PRODUCTOS:', error);
        res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
    }
};

// ─── GET - obtener producto por ID ────────────────────────────────────────────
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
        console.error('ERROR OBTENER PRODUCTO:', error);
        res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
    }
};

// ─── GET - listar productos con stock bajo (menor o igual a 5) ────────────────
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
        console.error('ERROR STOCK BAJO:', error);
        res.status(500).json({ message: 'Error al obtener productos con stock bajo', error: error.message });
    }
};

// ─── POST - crear producto ────────────────────────────────────────────────────
// El frontend siempre envía estado='activo' y stock=0 al crear.
const createProducto = async (req, res) => {
    try {
        const {
            nombreProducto,
            referencia,
            categoriaProductoId,
            descripcion,
            precio,
            stock,
            estado,
            imagenUrl,
        } = req.body;

        // Verificar que la categoría existe
        const categoria = await CategoriaProductos.findByPk(categoriaProductoId);
        if (!categoria) {
            return res.status(404).json({ message: 'La categoría especificada no existe' });
        }

        const producto = await Productos.create({
            nombreProducto: nombreProducto.trim(),
            referencia:     referencia.trim(),
            categoriaProductoId,
            descripcion:    descripcion ? descripcion.trim() : null,
            precio,
            stock,
            estado,
            imagenUrl:      imagenUrl ? imagenUrl.trim() : null,
        });

        res.status(201).json({ message: 'Producto creado correctamente', producto });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => ({ campo: e.path, mensaje: e.message }));
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        console.error('ERROR CREAR PRODUCTO:', error);
        res.status(500).json({ message: 'Error al crear el producto', error: error.message });
    }
};

// ─── PUT - actualizar producto ────────────────────────────────────────────────
// Desde el formulario de edición NO se envían stock ni estado: se preservan.
// El estado se cambia desde el switch del listado (también pasa por aquí).
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
            estado,
            imagenUrl,
        } = req.body;

        // Verificar que la categoría existe si se está actualizando
        if (categoriaProductoId) {
            const categoria = await CategoriaProductos.findByPk(categoriaProductoId);
            if (!categoria) {
                return res.status(404).json({ message: 'La categoría especificada no existe' });
            }
        }

        await producto.update({
            nombreProducto:      nombreProducto ? nombreProducto.trim() : producto.nombreProducto,
            referencia:          referencia ? referencia.trim() : producto.referencia,
            categoriaProductoId: categoriaProductoId ?? producto.categoriaProductoId,
            descripcion:         descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : producto.descripcion,
            precio:              precio ?? producto.precio,
            stock:               stock ?? producto.stock,
            estado:              estado ?? producto.estado,
            imagenUrl:           imagenUrl !== undefined ? (imagenUrl ? imagenUrl.trim() : null) : producto.imagenUrl,
        });

        res.status(200).json({ message: 'Producto actualizado correctamente', producto });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => ({ campo: e.path, mensaje: e.message }));
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        console.error('ERROR ACTUALIZAR PRODUCTO:', error);
        res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
    }
};

// ─── DELETE - eliminar producto físicamente ───────────────────────────────────
// Si tiene ventas/pedidos asociados, se devuelve 409 para que se desactive en lugar de eliminar.
const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Productos.findByPk(id);

        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        await producto.destroy();
        res.status(200).json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            (error.original && error.original.code === 'ER_ROW_IS_REFERENCED_2')
        ) {
            return res.status(409).json({
                message: 'No se puede eliminar: el producto tiene ventas o pedidos asociados. Desactívalo en su lugar.',
            });
        }
        console.error('ERROR ELIMINAR PRODUCTO:', error);
        res.status(500).json({ message: 'Error al eliminar el producto', error: error.message });
    }
};

module.exports = {
    getProductos,
    getProductoById,
    getProductosStockBajo,
    createProducto,
    updateProducto,
    deleteProducto,
};