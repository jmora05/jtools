const { Permisos } = require('../models/index.js');

// GET - listar permisos
const getPermisos = async (req, res) => {
    try {
        const permisos = await Permisos.findAll();
        res.status(200).json(permisos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los permisos', error: error.message });
    }
};

// GET - obtener permiso por ID
const getPermisosById = async (req, res) => {
    try {
        const { id } = req.params;
        const permiso = await Permisos.findByPk(id);

        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }

        res.status(200).json(permiso);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el permiso', error: error.message });
    }
};

// POST - crear permiso
const createPermisos = async (req, res) => {
    try {
        const { name, description } = req.body;
        const permiso = await Permisos.create({ name, description });
        res.status(201).json({ message: 'Permiso creado correctamente', permiso });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el permiso', error: error.message });
    }
};

// PUT - actualizar permiso
const updatePermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const permiso = await Permisos.findByPk(id);

        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }

        const { name, description } = req.body;
        await permiso.update({ name, description });

        res.status(200).json({ message: 'Permiso actualizado correctamente', permiso });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el permiso', error: error.message });
    }
};

// DELETE - eliminar permiso
const deletePermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const permiso = await Permisos.findByPk(id);

        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }

        await permiso.destroy();
        res.status(200).json({ message: 'Permiso eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el permiso', error: error.message });
    }
};

module.exports = {
    getPermisos,
    getPermisosById,
    createPermisos,
    updatePermisos,
    deletePermisos
};
