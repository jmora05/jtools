const { Permisos } = require('../models/index.js');

// ─── Lista canónica de módulos del sistema ────────────────────────────────────
// Cada módulo del sistema tiene un permiso correspondiente en la BD.
// Esta lista es la fuente de verdad — no se crean permisos manualmente.
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
  { moduleKey: 'roles',                       name: 'Roles y Permisos',            description: 'Gestión de roles y permisos' },
  { moduleKey: 'production-employees',        name: 'Empleados de Producción',     description: 'Gestión de empleados de producción' },
  { moduleKey: 'production-orders-sub',       name: 'Órdenes de Producción',       description: 'Gestión de órdenes de producción' },
  { moduleKey: 'production-technical-sheets', name: 'Fichas Técnicas',             description: 'Gestión de fichas técnicas' },
];

// GET /api/permisos — listar todos los permisos del sistema
// Usado por RoleManagement para mostrar los checkboxes al crear/editar un rol
const getPermisos = async (_req, res) => {
    try {
        const permisos = await Permisos.findAll({
            where: { isSystem: true },
            order: [['name', 'ASC']]
        });
        res.status(200).json(permisos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los permisos', error: error.message });
    }
};

// POST /api/permisos/sync-modules — sincronizar módulos del sistema como permisos
// Crea en BD los permisos que no existan todavía. Usado por seed.js y por el botón de sincronización.
const syncSystemModules = async (_req, res) => {
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
        res.status(200).json({ message: 'Módulos sincronizados correctamente', created: results.created, updated: results.updated });
    } catch (error) {
        res.status(500).json({ message: 'Error al sincronizar módulos', error: error.message });
    }
};

module.exports = { getPermisos, syncSystemModules, SYSTEM_MODULES };
