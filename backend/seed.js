const bcrypt = require('bcryptjs');
const { Usuarios, Roles, Permisos } = require('./src/models/index.js');
const { SYSTEM_MODULES } = require('./src/controllers/permisosController.js');

async function seed() {
    // 1. Sincronizar permisos de módulos del sistema
    console.log('Sincronizando permisos de módulos del sistema...');
    const permisosCreados = [];
    for (const mod of SYSTEM_MODULES) {
        const [permiso, created] = await Permisos.findOrCreate({
            where: { moduleKey: mod.moduleKey },
            defaults: { name: mod.name, description: mod.description, isSystem: true, moduleKey: mod.moduleKey }
        });
        if (created) {
            permisosCreados.push(permiso.name);
        } else if (!permiso.isSystem) {
            await permiso.update({ isSystem: true });
        }
    }
    if (permisosCreados.length > 0) {
        console.log(`Permisos creados: ${permisosCreados.join(', ')}`);
    } else {
        console.log('Todos los permisos del sistema ya existen.');
    }

    // 2. Crear rol Administrador si no existe
    const [rolAdmin] = await Roles.findOrCreate({
        where: { name: 'Administrador' },
        defaults: { name: 'Administrador', description: 'Acceso total al sistema' }
    });

    // 3. Asignar todos los permisos del sistema al rol Administrador
    const todosLosPermisos = await Permisos.findAll({ where: { isSystem: true } });
    await rolAdmin.setPermisos(todosLosPermisos.map(p => p.id));
    console.log(`Rol "Administrador" (id: ${rolAdmin.id}) con ${todosLosPermisos.length} permisos del sistema.`);

    // 4. Crear usuario admin si no existe
    const existingUser = await Usuarios.findOne({ where: { email: 'admin@example.com' } });
    if (!existingUser) {
        const hash = await bcrypt.hash('123456', 10);
        await Usuarios.create({ rolesId: rolAdmin.id, email: 'admin@example.com', password: hash });
        console.log('Usuario admin@example.com creado correctamente.');
    } else {
        console.log('Usuario admin@example.com ya existe.');
    }

    // 5. Crear SUPERADMIN con acceso total
    const [rolSuper] = await Roles.findOrCreate({
        where: { name: 'admin' },
        defaults: { name: 'admin', description: 'Superusuario con acceso total sin restricciones' }
    });
    await rolSuper.setPermisos(todosLosPermisos.map(p => p.id));
    console.log(`Rol "admin" (id: ${rolSuper.id}) con ${todosLosPermisos.length} permisos.`);

    const existingSuper = await Usuarios.findOne({ where: { email: 'admin@jrepuestos.com' } });
    if (!existingSuper) {
        const hash = await bcrypt.hash('123456', 10);
        await Usuarios.create({ rolesId: rolSuper.id, email: 'admin@jrepuestos.com', password: hash });
        console.log('Superadmin creado: admin@jrepuestos.com / 123456');
    } else {
        console.log('Superadmin ya existe.');
    }

    console.log('Seed completado.');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Error en seed:', err.message);
    process.exit(1);
});
