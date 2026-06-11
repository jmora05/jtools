const { Roles, Usuarios } = require('../models/index.js');
const { validateCreateRol, validateUpdateRol, validateSetPermisos } = require('../validators/rolesValidator');
const { registrar } = require('../services/auditoriaService');

// ── Helper: rechaza cualquier operación sobre un rol del sistema ──────────────
function guardaIsSystem(role, res) {
    if (role.isSystem) {
        res.status(403).json({
            message: `El rol "${role.name}" es un rol protegido del sistema y no puede modificarse ni eliminarse.`,
        });
        return true;
    }
    return false;
}

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
        if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el rol', error: error.message });
    }
};

// POST - crear rol (requiere al menos un permiso)
const createRoles = async (req, res) => {
    try {
        const errores = await validateCreateRol(req.body);
        if (errores.length) return res.status(400).json({ message: 'Error de validación', errores });

        const { name, description, permisosIds } = req.body;
        const role = await Roles.create({ name: String(name).trim(), description: description?.trim() || null });

        await role.setPermisos(permisosIds);

        const created = await Roles.findByPk(role.id, {
            include: [{ association: 'permisos', attributes: ['id', 'name'] }]
        });

        setImmediate(() => registrar({
            usuarioId: req.usuario?.id,
            accion:    'CREAR_ROL',
            entidad:   'Rol',
            entidadId: created.id,
            detalle:   { name: created.name, permisosIds },
            ip:        req.ip,
        }));

        res.status(201).json({ message: 'Rol creado correctamente', role: created });
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
        if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

        // ── Guardia: roles del sistema no se pueden editar ──────────────
        if (guardaIsSystem(role, res)) return;

        const errores = await validateUpdateRol(req.body, Number(id));
        if (errores.length) return res.status(400).json({ message: 'Error de validación', errores });

        const { name, description } = req.body;
        await role.update({
            ...(name        !== undefined ? { name:        String(name).trim()         } : {}),
            ...(description !== undefined ? { description: description?.trim() || null } : {}),
        });
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
        if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

        // ── Guardia: roles del sistema no se pueden eliminar ────────────
        if (guardaIsSystem(role, res)) return;

        const totalUsuarios = await Usuarios.count({ where: { rolesId: id } });
        if (totalUsuarios > 0) {
            return res.status(409).json({
                message: `No se puede eliminar el rol porque tiene ${totalUsuarios} usuario(s) asignado(s). Reasigna o elimina esos usuarios primero.`
            });
        }

        await role.setPermisos([]);
        await role.destroy();
        res.status(200).json({ message: 'Rol eliminado correctamente' });
    } catch (error) {
        if (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            (error.parent && error.parent.code === '23503')
        ) {
            return res.status(409).json({
                message: 'No se puede eliminar el rol porque tiene usuarios asignados.'
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
        if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
        return res.status(200).json(role.permisos);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener permisos del rol', error: error.message });
    }
};

// PUT - reemplazar permisos de un rol
const setRolPermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Roles.findByPk(id);
        if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

        // ── Guardia: roles del sistema no se pueden modificar ───────────
        if (guardaIsSystem(role, res)) return;

        const erroresPermisos = validateSetPermisos(req.body);
        if (erroresPermisos.length) return res.status(400).json({ message: 'Error de validación', errores: erroresPermisos });

        await role.setPermisos(req.body.permisosIds);

        const updated = await Roles.findByPk(id, {
            include: [{ association: 'permisos' }]
        });

        setImmediate(() => registrar({
            usuarioId: req.usuario?.id,
            accion:    'MODIFICAR_PERMISOS',
            entidad:   'Rol',
            entidadId: Number(id),
            detalle:   { rolName: role.name, permisosIds: req.body.permisosIds },
            ip:        req.ip,
        }));

        return res.status(200).json({ message: 'Permisos actualizados correctamente', role: updated });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar permisos del rol', error: error.message });
    }
};

// PATCH - toggle estado activo/inactivo de un rol
const toggleRolActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Roles.findByPk(id);
        if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

        // ── Guardia: roles del sistema no se pueden desactivar ──────────
        if (guardaIsSystem(role, res)) return;

        // Si se intenta desactivar, verificar que no haya usuarios con este rol
        if (role.isActive) {
            const totalUsuarios = await Usuarios.count({ where: { rolesId: id } });
            if (totalUsuarios > 0) {
                return res.status(409).json({
                    message: `No se puede desactivar el rol porque tiene ${totalUsuarios} usuario(s) asignado(s). Reasigna esos usuarios primero.`,
                });
            }
        }

        const estadoAnterior = role.isActive;
        await role.update({ isActive: !role.isActive });

        setImmediate(() => registrar({
            usuarioId: req.usuario?.id,
            accion:    'TOGGLE_ROL',
            entidad:   'Rol',
            entidadId: Number(id),
            detalle:   { rolName: role.name, de: estadoAnterior, a: !estadoAnterior },
            ip:        req.ip,
        }));

        return res.status(200).json({
            message: `Rol ${estadoAnterior ? 'desactivado' : 'activado'} correctamente`,
            role,
        });
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
