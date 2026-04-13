const { Op } = require('sequelize');
const { FichaTecnica, Productos, CategoriaProductos } = require('../models/index.js');
const {
    middlewareCrear,
    middlewareActualizar,
} = require('../validators/fichaTecnicaValidator.js');

// ── Generador de código único tipo FT-2025-001 ───────────────────────────────
const generarCodigoFicha = async () => {
    const year = new Date().getFullYear();
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

// ── Include estándar para relaciones ─────────────────────────────────────────
const includeRelaciones = [
    {
        model: Productos,
        as: 'producto',
        attributes: ['id', 'nombreProducto', 'referencia', 'estado'],
        include: [
            { model: CategoriaProductos, as: 'categoria', attributes: ['id', 'nombreCategoria'] }
        ]
    }
];

// ────────────────────────────────────────────────────────────
//  GET /fichas-tecnicas  —  listar todas
// ────────────────────────────────────────────────────────────
const getFichasTecnicas = async (req, res) => {
    try {
        const fichas = await FichaTecnica.findAll({
            include: includeRelaciones,
            order: [['id', 'DESC']]
        });
        res.status(200).json(fichas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las fichas técnicas', error: error.message });
    }
};

// ────────────────────────────────────────────────────────────
//  GET /fichas-tecnicas/:id  —  obtener por ID
// ────────────────────────────────────────────────────────────
const getFichaTecnicaById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'El ID proporcionado no es válido' });
        }

        const ficha = await FichaTecnica.findByPk(id, { include: includeRelaciones });

        if (!ficha) {
            return res.status(404).json({ message: 'Ficha técnica no encontrada' });
        }

        res.status(200).json(ficha);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la ficha técnica', error: error.message });
    }
};

// ────────────────────────────────────────────────────────────
//  GET /fichas-tecnicas/producto/:productoId  —  fichas por producto
// ────────────────────────────────────────────────────────────
const getFichasByProducto = async (req, res) => {
    try {
        const { productoId } = req.params;

        if (!productoId || isNaN(productoId)) {
            return res.status(400).json({ message: 'El productoId proporcionado no es válido' });
        }

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

// ────────────────────────────────────────────────────────────
//  POST /fichas-tecnicas  —  crear
// ────────────────────────────────────────────────────────────
const createFichaTecnica = async (req, res) => {
    try {
        const { productoId, materiales, procesos, medidas, insumos, notas } = req.body;

        // 1. Verificar que el producto existe y está activo
        const producto = await Productos.findByPk(productoId);
        if (!producto) {
            return res.status(404).json({ message: 'El producto especificado no existe' });
        }
        if (producto.estado === 'inactivo') {
            return res.status(400).json({ message: 'No se puede crear una ficha para un producto inactivo' });
        }

        // 2. ✅ Verificar que no exista ya una ficha Activa para este producto
        const fichaActivaExistente = await FichaTecnica.findOne({
            where: { productoId, estado: 'Activa' }
        });
        if (fichaActivaExistente) {
            return res.status(400).json({
                message: `El producto ya tiene una ficha técnica activa (${fichaActivaExistente.codigoFicha}). Inactívala antes de crear una nueva.`
            });
        }

        // 3. Generar código y crear
        const codigoFicha = await generarCodigoFicha();

        const ficha = await FichaTecnica.create({
            codigoFicha,
            productoId,
            estado: 'Activa',
            materiales,
            procesos: procesos.map((p, i) => ({ ...p, step: i + 1 })),
            medidas:  medidas  || [],
            insumos:  insumos  || [],
            notas:    notas    || null
        });

        const fichaCompleta = await FichaTecnica.findByPk(ficha.id, { include: includeRelaciones });
        res.status(201).json({ message: 'Ficha técnica creada correctamente', ficha: fichaCompleta });

    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la ficha técnica', error: error.message });
    }
};

// ────────────────────────────────────────────────────────────
//  PUT /fichas-tecnicas/:id  —  actualizar
// ────────────────────────────────────────────────────────────
const updateFichaTecnica = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'El ID proporcionado no es válido' });
        }

        const ficha = await FichaTecnica.findByPk(id);
        if (!ficha) {
            return res.status(404).json({ message: 'Ficha técnica no encontrada' });
        }

        const { materiales, procesos, medidas, insumos, notas, estado } = req.body;

        // 1. ✅ Bloquear edición de contenido en fichas Inactivas
        //    (solo se permite cambiar el estado para reactivarla)
        const intentaCambiarContenido = [materiales, procesos, medidas, insumos, notas]
            .some(v => v !== undefined);

        if (ficha.estado === 'Inactiva' && intentaCambiarContenido) {
            return res.status(400).json({
                message: 'No puedes editar una ficha inactiva. Actívala primero cambiando su estado a Activa.'
            });
        }

        // 2. ✅ Si se intenta activar esta ficha, verificar que no haya otra Activa para el mismo producto
        if (estado === 'Activa' && ficha.estado === 'Inactiva') {
            const otraFichaActiva = await FichaTecnica.findOne({
                where: {
                    productoId: ficha.productoId,
                    estado: 'Activa',
                    id: { [Op.ne]: parseInt(id) }
                }
            });
            if (otraFichaActiva) {
                return res.status(400).json({
                    message: `Ya existe una ficha activa para este producto (${otraFichaActiva.codigoFicha}). Inactívala antes de activar esta.`
                });
            }
        }

        // 3. Construir objeto de actualización (solo campos enviados)
        const updates = {};
        if (materiales !== undefined) updates.materiales = materiales;
        if (procesos  !== undefined) updates.procesos  = procesos.map((p, i) => ({ ...p, step: i + 1 }));
        if (medidas   !== undefined) updates.medidas   = medidas;
        if (insumos   !== undefined) updates.insumos   = insumos;
        if (notas     !== undefined) updates.notas     = notas;
        if (estado    !== undefined) updates.estado    = estado;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'Debe enviar al menos un campo para actualizar' });
        }

        await ficha.update(updates);

        const fichaActualizada = await FichaTecnica.findByPk(id, { include: includeRelaciones });
        res.status(200).json({ message: 'Ficha técnica actualizada correctamente', ficha: fichaActualizada });

    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la ficha técnica', error: error.message });
    }
};

// ────────────────────────────────────────────────────────────
//  DELETE /fichas-tecnicas/:id  —  eliminar (solo si Inactiva)
// ────────────────────────────────────────────────────────────
const deleteFichaTecnica = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'El ID proporcionado no es válido' });
        }

        const ficha = await FichaTecnica.findByPk(id);
        if (!ficha) {
            return res.status(404).json({ message: 'Ficha técnica no encontrada' });
        }

        if (ficha.estado === 'Activa') {
            return res.status(400).json({
                message: 'No se puede eliminar una ficha técnica activa. Cámbiala a Inactiva primero.'
            });
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