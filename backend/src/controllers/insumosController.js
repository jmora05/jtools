const { Insumos } = require('../models/index.js');
const { validarInsumo } = require('../validators/insumosValidator.js');

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
        const errores = validarInsumo(req.body, false);
        if (errores.length > 0) {
            return res.status(400).json({ message: 'Error de validación', errores });
        }

        const {
            nombreInsumo,
            descripcion,
            precioUnitario,
            unidadMedida,
            estado,
        } = req.body;

        const insumo = await Insumos.create({
            nombreInsumo,
            descripcion:    descripcion    ?? null,
            precioUnitario: precioUnitario ?? 0.00,
            unidadMedida,
            estado:         estado         ?? 'disponible',
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
            nombreInsumo,
            descripcion,
            precioUnitario,
            unidadMedida,
            estado,
        } = req.body;

        await insumo.update({
            ...(nombreInsumo   !== undefined && { nombreInsumo }),
            ...(descripcion    !== undefined && { descripcion }),
            ...(precioUnitario !== undefined && { precioUnitario }),
            ...(unidadMedida   !== undefined && { unidadMedida }),
            ...(estado         !== undefined && { estado }),
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

// PATCH - cambiar estado del insumo (disponible / agotado)
const cambiarEstadoInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['disponible', 'agotado'].includes(estado)) {
            return res.status(400).json({
                message: 'Estado inválido. Use "disponible" o "agotado"'
            });
        }

        const insumo = await Insumos.findByPk(id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        await insumo.update({ estado });
        res.status(200).json({ message: `Insumo marcado como ${estado}`, insumo });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado del insumo', error: error.message });
    }
};

// DELETE - soft delete → marca como agotado
const deleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        await insumo.update({ estado: 'agotado' });
        res.status(200).json({ message: 'Insumo marcado como agotado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar el insumo', error: error.message });
    }
};

// DELETE /force - eliminar físicamente
const forceDeleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await Insumos.findByPk(id);

        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        if (insumo.estado === 'disponible') {
            return res.status(400).json({
                message: 'No se puede eliminar un insumo disponible. Márcalo como agotado primero.'
            });
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
    getInsumosDisponibles,
    createInsumo,
    updateInsumo,
    cambiarEstadoInsumo,
    deleteInsumo,
    forceDeleteInsumo,
};