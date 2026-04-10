const { Permisos } = require('../models/index.js');
const { validateCreatePermiso, validateUpdatePermiso } = require('../validators/permisosValidator');

// Lista canónica de módulos del sistema
const SYSTEM_MODULES = [
  { moduleKey: 'dashboard',                   name: 'Dashboard',                  description: 'Panel principal del sistema' },
  { moduleKey: 'catalog',                     name: 'Catálogo de Productos',       description: 'Gestión del catálogo de productos' },
  { moduleKey: 'product-categories',          name: 'Categorías de Productos',     description: 'Gestión de categorías de productos' },
  { moduleKey: 'clients',                     name: 'Clientes',                    description: 'Gestión de clientes' },
  { moduleKey: 'suppliers',                   name: 'Proveedores',                 description: 'Gestión de proveedores' },
  { moduleKey: 'supplies',                    name: 'Insumos',                     description: 'Gestión de insumos' },
  { moduleKey: 'purchases',                   name: 'Compras de Insumos',          description: 'Módulo de compras de insumos' },
  { moduleKey: 'sales',                       name: 'Ventas',                      description: 'Módulo de ventas' },
  { moduleKey: 'orders',                      name: 'Pedidos',                     description: 'Módulo de pedidos' },
  { moduleKey: 'news',                        name: 'Novedades',                   description: 'Novedades y comunicados' },
  { moduleKey: 'users',                       name: 'Usuarios',                    description: 'Gestión de usuarios del sistema' },
  { moduleKey: 'roles',                       name: 'Roles',                       description: 'Gestión de roles' },
  { moduleKey: 'permissions',                 name: 'Permisos',                    description: 'Gestión de permisos' },
  { moduleKey: 'production-employees',        name: 'Empleados de Producción',     description: 'Gestión de empleados de producción' },
  { moduleKey: 'production-orders-sub',       name: 'Órdenes de Producción',       description: 'Gestión de órdenes de producción' },
  { moduleKey: 'production-technical-sheets', name: 'Fichas Técnicas',             description: 'Gestión de fichas técnicas' },
];

// GET - listar permisos
const getPermisos = async (req, res) => {
    try {
        const permisos = await Permisos.findAll({ order: [['isSystem', 'DESC'], ['name', 'ASC']] });
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
        if (!permiso) return res.status(404).json({ message: 'Permiso no encontrado' });
        res.status(200).json(permiso);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el permiso', error: error.message });
    }
};

// POST - crear permiso
const createPermisos = async (req, res) => {
    try {
        const errors = validateCreatePermiso(req.body);
        if (errors.length) return res.status(400).json({ message: 'Error de validación', errores: errors });

        const { name, description } = req.body;
        const permiso = await Permisos.create({ name: String(name).trim(), description: description || null, isSystem: false });
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
        if (!permiso) return res.status(404).json({ message: 'Permiso no encontrado' });

        const errors = validateUpdatePermiso(req.body, permiso.isSystem);
        if (errors.length) return res.status(400).json({ message: 'Error de validación', errores: errors });

        const { name, description } = req.body;
        if (permiso.isSystem) {
            await permiso.update({ description: description !== undefined ? description : permiso.description });
        } else {
            await permiso.update({
                ...(name !== undefined ? { name: String(name).trim() } : {}),
                ...(description !== undefined ? { description } : {}),
            });
        }

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
        if (!permiso) return res.status(404).json({ message: 'Permiso no encontrado' });

        if (permiso.isSystem) {
            return res.status(403).json({ message: 'No se puede eliminar un permiso del sistema' });
        }

        await permiso.destroy();
        res.status(200).json({ message: 'Permiso eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el permiso', error: error.message });
    }
};

// POST - sincronizar módulos del sistema como permisos
const syncSystemModules = async (req, res) => {
    try {
        const results = { created: [], updated: [] };

        for (const mod of SYSTEM_MODULES) {
            const [permiso, created] = await Permisos.findOrCreate({
                where: { moduleKey: mod.moduleKey },
                defaults: { name: mod.name, description: mod.description, isSystem: true, moduleKey: mod.moduleKey }
            });

            if (created) {
                results.created.push(permiso.name);
            } else if (!permiso.isSystem) {
                await permiso.update({ isSystem: true });
                results.updated.push(permiso.name);
            }
        }

        res.status(200).json({
            message: 'Módulos sincronizados correctamente',
            created: results.created,
            updated: results.updated
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al sincronizar módulos', error: error.message });
    }
};

// GET - obtener lista de módulos del sistema
const getSystemModules = async (req, res) => {
    try {
        res.status(200).json(SYSTEM_MODULES);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener módulos del sistema', error: error.message });
    }
};

module.exports = {
    getPermisos,
    getPermisosById,
    createPermisos,
    updatePermisos,
    deletePermisos,
    syncSystemModules,
    getSystemModules,
    SYSTEM_MODULES
};
