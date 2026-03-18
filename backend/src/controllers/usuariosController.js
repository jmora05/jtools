const { Usuarios, Roles } = require('../models/index.js');

// GET - listar usuarios
const getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuarios.findAll();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
    }
};

// GET - obtener usuario por ID
const getUsuariosById = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuarios.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
    }
};

// POST - crear usuario
const createUsuarios = async (req, res) => {
    try {
        const { rolesId, email, password } = req.body;

        // validar rol existente
        const rol = await Roles.findByPk(rolesId);
        if (!rol) {
            return res.status(404).json({ message: 'El rol especificado no existe' });
        }

        const usuario = await Usuarios.create({ rolesId, email, password });
        res.status(201).json({ message: 'Usuario creado correctamente', usuario });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
    }
};

// PUT - actualizar usuario
const updateUsuarios = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuarios.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const { rolesId, email, password } = req.body;

        if (rolesId !== undefined && rolesId !== null) {
            const rol = await Roles.findByPk(rolesId);
            if (!rol) {
                return res.status(404).json({ message: 'El rol especificado no existe' });
            }
        }

        await usuario.update({ rolesId, email, password });
        res.status(200).json({ message: 'Usuario actualizado correctamente', usuario });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
    }
};

// DELETE - eliminar usuario
const deleteUsuarios = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuarios.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        await usuario.destroy();
        res.status(200).json({ message: 'Usuario eliminado correctamente' });
        
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
    }
};

module.exports = {
    getUsuarios,
    getUsuariosById,
    createUsuarios,
    updateUsuarios,
    deleteUsuarios
};
