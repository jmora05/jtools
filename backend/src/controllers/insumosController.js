const { Insumos } = require('../models/index.js');

// GET - listar todos los insumos
const getInsumos = async (req, res) => {
    try {
        const insumos = await Insumos.findAll();
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos', error: error.message });
    }
};

// GET - obtener insumo por ID
const getInsumoById = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        res.status(200).json(insumo);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el insumo', error: error.message });
    }
};

// GET - listar insumos agotados
const getInsumosAgotados = async (req, res) => {
    try {
        const insumos = await Insumos.findAll({
            where: { estado: 'agotado' }
        });
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos agotados', error: error.message });
    }
};

// GET - listar insumos disponibles
const getInsumosDisponibles = async (req, res) => {
    try {
        const insumos = await Insumos.findAll({
            where: { estado: 'disponible' }
        });
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos disponibles', error: error.message });
    }
};

// POST - crear insumo
const createInsumo = async (req, res) => {
    try {
        const {
            nombreInsumo,
            descripcion,
            precioUnitario,
            unidadMedida,
            estado
        } = req.body;

        const insumo = await Insumos.create({
            nombreInsumo,
            descripcion,
            precioUnitario,
            unidadMedida,
            estado
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

        const {
            nombreInsumo,
            descripcion,
            precioUnitario,
            unidadMedida,
            estado
        } = req.body;

        await insumo.update({
            nombreInsumo,
            descripcion,
            precioUnitario,
            unidadMedida,
            estado
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

// PATCH - cambiar estado del insumo
const cambiarEstadoInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const insumo = await Insumos.findByPk(id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        const estadosValidos = ['disponible', 'agotado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido. Use: disponible o agotado' });
        }

        await insumo.update({ estado });
        res.status(200).json({ message: `Insumo marcado como ${estado}`, insumo });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado del insumo', error: error.message });
    }
};

// DELETE - eliminar insumo (solo si está agotado y no tiene compras asociadas)
const deleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        if (insumo.estado === 'disponible') {
            return res.status(400).json({ message: 'No se puede eliminar un insumo disponible. Primero márcalo como agotado' });
        }

        await insumo.destroy();
        res.status(200).json({ message: 'Insumo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el insumo', error: error.message });
    }
};

module.exports = {
    getInsumos,
    getInsumoById,
    getInsumosAgotados,
    getInsumosDisponibles,
    createInsumo,
    updateInsumo,
    cambiarEstadoInsumo,
    deleteInsumo
};