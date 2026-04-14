const { Roles } = require('../models/index.js');

// GET - listar roles (incluye permisos de cada rol)
const getRoles = async (_req, res) => {
    try {
        const roles = await Roles.findAll({
            include: [{ association: 'permisos', attributes: ['id', 'name'] }]
        });
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los roles', error: error.message });
    }
};

// GET - obtener rol por ID
const getRolesById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Roles.findByPk(id);
        if (!role) {
            return res.status(404).json({ message: 'Rol no encontrado'});
        }
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el rol', error:error.message});
    }
};

// POST - crear rol
const createRoles = async (req, res) => {
    try {
        const { name, description } = req.body;
        const role = await Roles.create({ name, description });
        res.status(201).json({ message: 'Rol creado correctamente', role });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el rol', error: error.message });
    }
};

// PUT - actualizar rol
const updateRoles = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Roles.findByPk(id);
        if (!role) {
            return res.status(404).json({ message: 'Rol no encontrado'});
        }
        const { name, description } = req.body;
        await role.update({ name, description });
        return res.status(200).json({ message: 'Rol actualizado correctamente', role });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        return res.status(500).json({ message: 'Error al actualizar el rol', error: error.message });
    }
};

// DELETE - eliminar rol
const deleteRoles = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Roles.findByPk(id);

        if (!role) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        await role.destroy();
        res.status(200).json({ message: 'Rol eliminado correctamente' });

    } catch (error) {
        // Restricción de llave foránea: el rol tiene usuarios asignados
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            (error.parent && error.parent.code === '23503') // PostgreSQL FK violation
        ) {
            return res.status(409).json({
                message: 'No se puede eliminar el rol porque tiene usuarios asignados. Reasigna o elimina esos usuarios primero.'
            });
        }
        res.status(500).json({ message: 'Error al eliminar el rol', error: error.message });
    }
};

// GET - obtener permisos de un rol
const getRolPermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Roles.findByPk(id, {
            include: [{ association: 'permisos' }]
        });

        if (!role) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        return res.status(200).json(role.permisos);
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error al obtener permisos del rol', 
            error: error.message 
        });
    }
};

// PUT - reemplazar permisos de un rol
const setRolPermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const { permisosIds } = req.body;
        // permisosIds es un array de IDs: [1, 2, 3]

        if (!Array.isArray(permisosIds)) {
            return res.status(400).json({ message: 'permisosIds debe ser un array' });
        }

        const role = await Roles.findByPk(id);
        if (!role) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        // setPermisos reemplaza toda la lista de una vez
        // Sequelize elimina los anteriores e inserta los nuevos automáticamente
        await role.setPermisos(permisosIds);

        // Devolver el rol con sus permisos actualizados
        const updated = await Roles.findByPk(id, {
            include: [{ association: 'permisos' }]
        });

        return res.status(200).json({ 
            message: 'Permisos actualizados correctamente', 
            role: updated 
        });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error al actualizar permisos del rol', 
            error: error.message 
        });
    }
};

// PATCH - toggle estado activo/inactivo de un rol
const toggleRolActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Roles.findByPk(id);
        if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
        await role.update({ isActive: !role.isActive });
        return res.status(200).json({ message: `Rol ${role.isActive ? 'activado' : 'desactivado'}`, role });
    } catch (error) {
        return res.status(500).json({ message: 'Error al cambiar estado del rol', error: error.message });
    }
};

module.exports = {
    getRoles,
    getRolesById,
    createRoles,
    updateRoles,
    deleteRoles,
    getRolPermisos,
    setRolPermisos,
    toggleRolActivo
};