require('dotenv').config();

const bcrypt = require('bcryptjs');

const {
    Usuarios,
    Roles,
    Permisos,
} = require('./src/models/index.js');

const { sequelize }   = require('./src/config/jtools_db');
const { SYSTEM_MODULES } = require('./src/controllers/permisosController.js');

/**
 * =========================================================
 * SEED PRINCIPAL DEL SISTEMA
 * =========================================================
 * Roles protegidos (isSystem = true):
 *   Administrador → acceso total
 *   Asistente     → acceso intermedio (sin usuarios/roles)
 *   Cliente       → acceso restringido al portal
 * =========================================================
 */

const PERMISOS_EXCLUIDOS_ASISTENTE = ['users', 'roles'];
const PERMISOS_CLIENTE             = ['catalog', 'orders', 'sales', 'dashboard'];

/**
 * Busca un rol por nombre de forma CASE-INSENSITIVE.
 * Si lo encuentra → actualiza nombre canónico + flags de sistema.
 * Si no existe   → lo crea.
 * Devuelve la instancia final.
 */
async function upsertSystemRole({ canonicalName, description }) {
    const existing = await Roles.findOne({
        where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('name')),
            canonicalName.toLowerCase()
        ),
    });

    if (existing) {
        await existing.update({
            name:        canonicalName,
            description,
            isSystem:    true,
            isActive:    true,
        });
        return existing;
    }

    return Roles.create({
        name:        canonicalName,
        description,
        isSystem:    true,
        isActive:    true,
    });
}

async function seed() {
    try {
        console.log('\n===================================');
        console.log('INICIANDO SEED DEL SISTEMA');
        console.log('===================================\n');

        // ── 1. Sincronizar permisos del sistema ──────────────────────────
        console.log('Sincronizando permisos del sistema...\n');
        const permisosCreados = [];

        for (const mod of SYSTEM_MODULES) {
            const [permiso, created] = await Permisos.findOrCreate({
                where: { moduleKey: mod.moduleKey },
                defaults: {
                    name:        mod.name,
                    description: mod.description,
                    moduleKey:   mod.moduleKey,
                    isSystem:    true,
                },
            });
            if (!created && !permiso.isSystem) {
                await permiso.update({ isSystem: true });
            }
            if (created) permisosCreados.push(permiso.name);
        }

        console.log(
            permisosCreados.length > 0
                ? `Permisos creados: ${permisosCreados.join(', ')}\n`
                : 'Todos los permisos del sistema ya existen.\n'
        );

        // ── 2. Obtener todos los permisos del sistema ────────────────────
        const todosLosPermisos = await Permisos.findAll({ where: { isSystem: true } });

        // ── 3. ROL: Administrador ────────────────────────────────────────
        const rolAdmin = await upsertSystemRole({
            canonicalName: 'Administrador',
            description:   'Acceso total al sistema',
        });
        await rolAdmin.setPermisos(todosLosPermisos.map(p => p.id));
        console.log(`Rol Administrador configurado con ${todosLosPermisos.length} permisos.\n`);

        // ── 4. ROL: Asistente ────────────────────────────────────────────
        const permisosAsistente = todosLosPermisos.filter(
            p => !PERMISOS_EXCLUIDOS_ASISTENTE.includes(p.moduleKey)
        );
        const rolAsistente = await upsertSystemRole({
            canonicalName: 'Asistente',
            description:   'Acceso intermedio sin gestión de usuarios ni roles',
        });
        await rolAsistente.setPermisos(permisosAsistente.map(p => p.id));
        console.log(`Rol Asistente configurado con ${permisosAsistente.length} permisos.\n`);

        // ── 5. ROL: Cliente ──────────────────────────────────────────────
        const permisosCliente = await Permisos.findAll({
            where: { moduleKey: PERMISOS_CLIENTE },
        });
        const rolCliente = await upsertSystemRole({
            canonicalName: 'Cliente',
            description:   'Acceso restringido para clientes del portal',
        });
        await rolCliente.setPermisos(permisosCliente.map(p => p.id));
        console.log(`Rol Cliente configurado con ${permisosCliente.length} permisos.\n`);

        // ── 6. Usuario Administrador principal ───────────────────────────
        const existingAdmin = await Usuarios.findOne({
            where: { email: 'admin@jrepuestos.com' },
        });
        if (!existingAdmin) {
            const hash = await bcrypt.hash('Admin123!', 10);
            await Usuarios.create({
                rolesId:  rolAdmin.id,
                email:    'admin@jrepuestos.com',
                password: hash,
            });
            console.log('Usuario Administrador creado: admin@jrepuestos.com / Admin123!\n');
        } else {
            if (existingAdmin.rolesId !== rolAdmin.id) {
                await existingAdmin.update({ rolesId: rolAdmin.id });
            }
            console.log('El usuario Administrador ya existe.\n');
        }

        // ── 7. Usuario Asistente de ejemplo ─────────────────────────────
        const existingAsistente = await Usuarios.findOne({
            where: { email: 'asistente@jrepuestos.com' },
        });
        if (!existingAsistente) {
            const hash = await bcrypt.hash('Asistente123!', 10);
            await Usuarios.create({
                rolesId:  rolAsistente.id,
                email:    'asistente@jrepuestos.com',
                password: hash,
            });
            console.log('Usuario Asistente creado: asistente@jrepuestos.com / Asistente123!\n');
        } else {
            console.log('El usuario Asistente ya existe.\n');
        }

        console.log('===================================');
        console.log('SEED COMPLETADO CORRECTAMENTE');
        console.log('===================================\n');

        process.exit(0);
    } catch (error) {
        console.error('\nERROR EN EL SEED:\n');
        console.error(error);
        process.exit(1);
    }
}

module.exports = seed;

if (require.main === module) {
    seed();
}
