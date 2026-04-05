const { FichaTecnica, Productos, CategoriaProductos } = require('../models/index.js');

// Genera código único tipo FT-2025-001
const generarCodigoFicha = async () => {
    const year = new Date().getFullYear();
    const { Op } = require('sequelize');
    const lastFicha = await FichaTecnica.findOne({
        where: { codigoFicha: { [Op.like]: `FT-${year}-%` } },
        order: [['id', 'DESC']]
    });
    let nextNum = 1;
    if (lastFicha) {
        const parts = lastFicha.codigoFicha.split('-');
        nextNum = parseInt(parts[2]) + 1;
    }
    return `FT-${year}-${String(nextNum).padStart(3, '0')}`;
};

// GET - listar todas las fichas técnicas
const getFichasTecnicas = async (req, res) => {
    try {
        const fichas = await FichaTecnica.findAll({
            include: [
                {
                    model: Productos,
                    as: 'producto',
                    attributes: ['id', 'nombreProducto', 'referencia', 'estado'],
                    include: [
                        { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria'] }
                    ]
                }
            ],
            order: [['id', 'DESC']]
        });
        res.status(200).json(fichas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las fichas técnicas', error: error.message });
    }
};

// GET - obtener ficha por ID
const getFichaTecnicaById = async (req, res) => {
    try {
        const { id } = req.params;
        const ficha = await FichaTecnica.findByPk(id, {
            include: [
                {
                    model: Productos,
                    as: 'producto',
                    attributes: ['id', 'nombreProducto', 'referencia', 'estado'],
                    include: [
                        { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria'] }
                    ]
                }
            ]
        });

        if (!ficha) {
            return res.status(404).json({ message: 'Ficha técnica no encontrada' });
        }

        res.status(200).json(ficha);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la ficha técnica', error: error.message });
    }
};

// GET - fichas por producto
const getFichasByProducto = async (req, res) => {
    try {
        const { productoId } = req.params;

        const producto = await Productos.findByPk(productoId);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const fichas = await FichaTecnica.findAll({
            where: { productoId },
            order: [['id', 'DESC']]
        });

        res.status(200).json(fichas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las fichas del producto', error: error.message });
    }
};

// POST - crear ficha técnica
const createFichaTecnica = async (req, res) => {
    try {
        const { productoId, materiales, procesos, medidas, insumos, notas } = req.body;

        // Verificar producto
        const producto = await Productos.findByPk(productoId);
        if (!producto) {
            return res.status(404).json({ message: 'El producto especificado no existe' });
        }
        if (producto.estado === 'inactivo') {
            return res.status(400).json({ message: 'No se puede crear una ficha para un producto inactivo' });
        }

        // Validar materiales y procesos
        if (!materiales || !Array.isArray(materiales) || materiales.length === 0) {
            return res.status(400).json({ message: 'Debe incluir al menos un material' });
        }
        if (!procesos || !Array.isArray(procesos) || procesos.length === 0) {
            return res.status(400).json({ message: 'Debe incluir al menos un proceso de fabricación' });
        }

        const codigoFicha = await generarCodigoFicha();

        const ficha = await FichaTecnica.create({
            codigoFicha,
            productoId,
            estado: 'Activa',
            materiales,
            procesos: procesos.map((p, i) => ({ ...p, step: i + 1 })),
            medidas: medidas || [],
            insumos: insumos || [],
            notas
        });

        // Devolver con relaciones
        const fichaCompleta = await FichaTecnica.findByPk(ficha.id, {
            include: [
                {
                    model: Productos,
                    as: 'producto',
                    attributes: ['id', 'nombreProducto', 'referencia'],
                    include: [
                        { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria'] }
                    ]
                }
            ]
        });

        res.status(201).json({ message: 'Ficha técnica creada correctamente', ficha: fichaCompleta });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la ficha técnica', error: error.message });
    }
};

// PUT - actualizar ficha técnica
const updateFichaTecnica = async (req, res) => {
    try {
        const { id } = req.params;
        const ficha = await FichaTecnica.findByPk(id);

        if (!ficha) {
            return res.status(404).json({ message: 'Ficha técnica no encontrada' });
        }

        const { materiales, procesos, medidas, insumos, notas, estado } = req.body;

        // Validar si se están actualizando materiales/procesos
        if (materiales !== undefined && (!Array.isArray(materiales) || materiales.length === 0)) {
            return res.status(400).json({ message: 'Debe incluir al menos un material' });
        }
        if (procesos !== undefined && (!Array.isArray(procesos) || procesos.length === 0)) {
            return res.status(400).json({ message: 'Debe incluir al menos un proceso de fabricación' });
        }

        const updates = {};
        if (materiales !== undefined) updates.materiales = materiales;
        if (procesos !== undefined) updates.procesos = procesos.map((p, i) => ({ ...p, step: i + 1 }));
        if (medidas !== undefined) updates.medidas = medidas;
        if (insumos !== undefined) updates.insumos = insumos;
        if (notas !== undefined) updates.notas = notas;
        if (estado !== undefined) updates.estado = estado;

        await ficha.update(updates);

        const fichaActualizada = await FichaTecnica.findByPk(id, {
            include: [
                {
                    model: Productos,
                    as: 'producto',
                    attributes: ['id', 'nombreProducto', 'referencia'],
                    include: [
                        { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria'] }
                    ]
                }
            ]
        });

        res.status(200).json({ message: 'Ficha técnica actualizada correctamente', ficha: fichaActualizada });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la ficha técnica', error: error.message });
    }
};

// DELETE - eliminar ficha (solo si está Inactiva)
const deleteFichaTecnica = async (req, res) => {
    try {
        const { id } = req.params;
        const ficha = await FichaTecnica.findByPk(id);

        if (!ficha) {
            return res.status(404).json({ message: 'Ficha técnica no encontrada' });
        }

        if (ficha.estado === 'Activa') {
            return res.status(400).json({ message: 'No se puede eliminar una ficha técnica activa. Cámbiala a Inactiva primero.' });
        }

        await ficha.destroy();
        res.status(200).json({ message: 'Ficha técnica eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la ficha técnica', error: error.message });
    }
};

module.exports = {
    getFichasTecnicas,
    getFichaTecnicaById,
    getFichasByProducto,
    createFichaTecnica,
    updateFichaTecnica,
    deleteFichaTecnica
    

};