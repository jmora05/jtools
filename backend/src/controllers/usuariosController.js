const { Usuarios, Roles } = require('../models/index.js');
const bcrypt = require('bcryptjs');
const { validateCreateUsuario, validateUpdateUsuario } = require('../validators/usuariosValidator');

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const includeBase = [
    { model: Roles,    as: 'rol',     attributes: ['id', 'name'] },
    {
        model: Clientes, as: 'cliente',
        attributes: ['id', 'nombres', 'apellidos', 'razon_social', 'telefono', 'ciudad', 'tipo_documento', 'numero_documento'],
        required: false }
    ];

    function resolveDisplayName(usuario) {
    const c = usuario.cliente;
    if (!c) return usuario.email.split('@')[0];
    if (c.nombres && c.nombres !== 'N/A') {
        return `${c.nombres} ${c.apellidos || ''}`.trim();
    }
    if (c.razon_social) return c.razon_social;
    return usuario.email.split('@')[0];
}

function safeUser(u) {
    return {
        id:          u.id,
        email:       u.email,
        rolesId:     u.rolesId,
        rolNombre:   u.rol?.name    ?? null,
        displayName: resolveDisplayName(u),
        cliente:     u.cliente ?? null,
        createdAt:   u.createdAt,
        updatedAt:   u.updatedAt,
    };
}

// GET - listar usuarios
const getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuarios.findAll({ include: includeBase });
        res.status(200).json(usuarios.map(safeUser));
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
        const errors = validateCreateUsuario(req.body);
        if (errors.length) return res.status(400).json({ message: 'Error de validación', errores: errors });

        const { rolesId, email, password } = req.body;

        const existing = await Usuarios.findOne({ where: { email: String(email).trim().toLowerCase() } });
        if (existing) return res.status(409).json({ message: 'Ya existe un usuario con ese email' });

        const rol = await Roles.findByPk(rolesId);
        if (!rol) return res.status(404).json({ message: 'El rol especificado no existe' });

        const passwordHash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
        const usuario = await Usuarios.create({
            rolesId,
            email: String(email).trim().toLowerCase(),
            password: passwordHash
        });

        // Recargar con includes para devolver displayName
        const usuarioCompleto = await Usuarios.findByPk(usuario.id, { include: includeBase });
        res.status(201).json({ message: 'Usuario creado correctamente', usuario: safeUser(usuarioCompleto) });
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
        const errors = validateUpdateUsuario(req.body);
        if (errors.length) return res.status(400).json({ message: 'Error de validación', errores: errors });

        const { id } = req.params;
        const usuario = await Usuarios.findByPk(id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

        const { rolesId, email, password } = req.body;

        if (email !== undefined && email !== null) {
            const normalizedEmail = String(email).trim().toLowerCase();
            const duplicate = await Usuarios.findOne({ where: { email: normalizedEmail } });
            if (duplicate && duplicate.id !== Number(id)) {
                return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
            }
        }

        if (rolesId !== undefined && rolesId !== null) {
            const rol = await Roles.findByPk(rolesId);
            if (!rol) return res.status(404).json({ message: 'El rol especificado no existe' });
        }

        let passwordHash;
        if (password !== undefined && password !== null && String(password).length > 0) {
            passwordHash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
        }

        await usuario.update({
            ...(rolesId !== undefined ? { rolesId } : {}),
            ...(email   !== undefined ? { email: String(email).trim().toLowerCase() } : {}),
            ...(passwordHash           ? { password: passwordHash } : {})
        });

        const usuarioActualizado = await Usuarios.findByPk(id, { include: includeBase });
        res.status(200).json({ message: 'Usuario actualizado correctamente', usuario: safeUser(usuarioActualizado) });
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
