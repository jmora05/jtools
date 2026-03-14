const { CategoriaProductos, Productos } = require('../models/index.js');

// GET - listar todas las categorías
const getCategorias = async (req, res) => {
    try {
        const categorias = await CategoriaProductos.findAll();
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las categorías', error: error.message });
    }
};

// GET - obtener categoría por ID con sus productos
const getCategoriaById = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await CategoriaProductos.findByPk(id, {
            include: [
                { model: Productos, as: 'productos', attributes: ['id', 'nombreProducto', 'referencia', 'precio', 'stock', 'estado'] }
            ]
        });

        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        res.status(200).json(categoria);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la categoría', error: error.message });
    }
};

// POST - crear categoría
const createCategoria = async (req, res) => {
    try {
        const { nombreCategoria, descripcion } = req.body;

        const categoria = await CategoriaProductos.create({
            nombreCategoria,
            descripcion
        });

        res.status(201).json({ message: 'Categoría creada correctamente', categoria });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la categoría', error: error.message });
    }
};

// PUT - actualizar categoría
const updateCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await CategoriaProductos.findByPk(id);

        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        const { nombreCategoria, descripcion } = req.body;

        await categoria.update({ nombreCategoria, descripcion });

        res.status(200).json({ message: 'Categoría actualizada correctamente', categoria });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la categoría', error: error.message });
    }
};

// DELETE - eliminar categoría (solo si no tiene productos asociados)
const deleteCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await CategoriaProductos.findByPk(id);

        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        // verificar si tiene productos asociados
        const productosAsociados = await Productos.findOne({
            where: { categoriaProductoId: id }
        });

        if (productosAsociados) {
            return res.status(400).json({ message: 'No se puede eliminar la categoría porque tiene productos asociados' });
        }

        await categoria.destroy();
        res.status(200).json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la categoría', error: error.message });
    }
};

module.exports = {
    getCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria
};