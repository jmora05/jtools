// GET - obtener categoría por ID
const getCategoriaById = async (req, res) => {
    const { id } = req.params;
    const categoria = await CategoriaProductos.findByPk(id, {
        include: [
            {
                model: Productos,
                as: 'productos',
                attributes: ['id', 'nombreProducto', 'referencia', 'precio', 'stock', 'estado'],
            }
        ]
    });

    // ... resto del código sin cambios
};

// POST - crear categoría
const createCategoria = async (req, res) => {
    try {
        const { nombreCategoria, descripcion, estado } = req.body;

        // Convertir el valor del toggle (true/false) al ENUM ('activo'/'inactivo')
        const estadoValido = (estado === true || estado === 'true' || estado === 'activo')
            ? 'activo'
            : 'inactivo';

        const categoria = await CategoriaProductos.create({
            nombreCategoria: nombreCategoria.trim(),
            descripcion: descripcion ? descripcion.trim() : null,
            estado: estadoValido,
        });

        res.status(201).json({ message: 'Categoría creada correctamente', categoria });
    } catch (error) {
        console.error('❌ ERROR COMPLETO:', error.message);
        console.error('❌ ERROR NOMBRE:', error.name);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => ({ campo: e.path, mensaje: e.message }));
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la categoría', error: error.message });
    }
};

// PUT - actualizar categoría
const updateCategoria = async (req, res) => {
    try {
        // ... buscar categoría por id

        const { nombreCategoria, descripcion, estado } = req.body;

        // Convertir el valor del toggle (true/false) al ENUM ('activo'/'inactivo')
        const estadoValido = (estado === true || estado === 'true' || estado === 'activo')
            ? 'activo'
            : 'inactivo';

        await categoria.update({
            nombreCategoria: nombreCategoria ? nombreCategoria.trim() : categoria.nombreCategoria,
            descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : categoria.descripcion,
            estado: estadoValido,
        });

        res.status(200).json({ message: 'Categoría actualizada correctamente', categoria });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => ({ campo: e.path, mensaje: e.message }));
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la categoría', error: error.message });
    }
};

// DELETE - eliminar categoría
const deleteCategoria = async (req, res) => {
    try {
        // ... buscar categoría por id

        // Verificar si tiene productos asociados
        const productosAsociados = await Productos.findOne({
            where: { categoriaProductoId: id }
        });

        if (productosAsociados) {
            return res.status(400).json({
                message: 'No se puede eliminar la categoría porque tiene productos asociados.',
            });
        }

        await categoria.destroy();

        // ... respuesta
    } catch (error) {
        // ...
    }
};

module.exports = {
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria,
};