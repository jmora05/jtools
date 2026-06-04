require('dotenv').config();

const bcrypt = require('bcryptjs');

const {
    Usuarios,
    Roles,
    Permisos
} = require('./src/models/index.js');

const {
    SYSTEM_MODULES
} = require('./src/controllers/permisosController.js');

/**
 * =========================================================
 * SEED PRINCIPAL DEL SISTEMA
 * =========================================================
 * Este archivo:
 *
 * 1. Sincroniza permisos base del sistema
 * 2. Crea roles protegidos del sistema
 * 3. Asigna permisos automáticamente
 * 4. Crea usuarios iniciales
 * 5. Garantiza que el sistema siempre tenga
 *    roles críticos funcionales
 * =========================================================
 */

async function seed() {

    try {

        console.log('\n===================================');
        console.log('INICIANDO SEED DEL SISTEMA');
        console.log('===================================\n');

        /**
         * =========================================================
         * 1. CREAR / SINCRONIZAR PERMISOS DEL SISTEMA
         * =========================================================
         *
         * Recorremos todos los módulos definidos en
         * SYSTEM_MODULES y garantizamos que existan
         * en la base de datos.
         */

        console.log('Sincronizando permisos del sistema...\n');

        const permisosCreados = [];

        for (const mod of SYSTEM_MODULES) {

            const [permiso, created] = await Permisos.findOrCreate({

                where: {
                    moduleKey: mod.moduleKey
                },

                defaults: {
                    name: mod.name,
                    description: mod.description,
                    moduleKey: mod.moduleKey,

                    // Permiso protegido del sistema
                    isSystem: true
                }
            });

            /**
             * Si ya existía pero no era del sistema,
             * lo convertimos en permiso protegido.
             */

            if (!created && !permiso.isSystem) {

                await permiso.update({
                    isSystem: true
                });
            }

            if (created) {
                permisosCreados.push(permiso.name);
            }
        }

        if (permisosCreados.length > 0) {

            console.log(
                `Permisos creados: ${permisosCreados.join(', ')}\n`
            );

        } else {

            console.log(
                'Todos los permisos del sistema ya existen.\n'
            );
        }

        /**
         * =========================================================
         * 2. OBTENER TODOS LOS PERMISOS DEL SISTEMA
         * =========================================================
         *
         * Estos permisos serán asignados automáticamente
         * a los roles principales.
         */

        const todosLosPermisos = await Permisos.findAll({
            where: {
                isSystem: true
            }
        });

        /**
         * =========================================================
         * 3. CREAR ROL SUPER_ADMIN
         * =========================================================
         *
         * Este rol:
         * - Tiene acceso total
         * - No debe eliminarse
         * - No debe modificarse
         * - Es un rol crítico del sistema
         */

        const [rolSuperAdmin] = await Roles.findOrCreate({

            where: {
                name: 'SUPER_ADMIN'
            },

            defaults: {

                name: 'SUPER_ADMIN',

                description:
                    'Super administrador con acceso total al sistema',

                isSystem: true
            }
        });

        /**
         * Si el rol ya existía pero no era protegido,
         * lo convertimos en rol del sistema.
         */

        if (!rolSuperAdmin.isSystem) {

            await rolSuperAdmin.update({
                isSystem: true
            });
        }

        /**
         * Asignamos TODOS los permisos del sistema
         * al SUPER_ADMIN.
         */

        await rolSuperAdmin.setPermisos(
            todosLosPermisos.map(p => p.id)
        );

        console.log(
            `Rol SUPER_ADMIN configurado con ${todosLosPermisos.length} permisos.\n`
        );

        /**
         * =========================================================
         * 4. CREAR ROL ADMIN
         * =========================================================
         *
         * Rol administrativo principal.
         */

        const [rolAdmin] = await Roles.findOrCreate({

            where: {
                name: 'ADMIN'
            },

            defaults: {

                name: 'ADMIN',

                description:
                    'Administrador principal del sistema',

                isSystem: true
            }
        });

        if (!rolAdmin.isSystem) {

            await rolAdmin.update({
                isSystem: true
            });
        }

        /**
         * También recibe todos los permisos.
         * Puedes limitar permisos más adelante
         * si deseas.
         */

        await rolAdmin.setPermisos(
            todosLosPermisos.map(p => p.id)
        );

        console.log(
            `Rol ADMIN configurado con ${todosLosPermisos.length} permisos.\n`
        );

        /**
         * =========================================================
         * 5. CREAR USUARIO SUPER ADMIN
         * =========================================================
         *
         * Usuario principal del sistema.
         */

        const existingSuperAdmin = await Usuarios.findOne({

            where: {
                email: 'admin@jrepuestos.com'
            }
        });

        if (!existingSuperAdmin) {

            const hash = await bcrypt.hash('123456', 10);

            await Usuarios.create({

                rolesId: rolSuperAdmin.id,

                email: 'admin@jrepuestos.com',

                password: hash
            });

            console.log(
                'SuperAdmin creado: admin@jrepuestos.com / 123456\n'
            );

        } else {

            console.log(
                'El usuario SUPER_ADMIN ya existe.\n'
            );
        }

        /**
         * =========================================================
         * 6. CREAR USUARIO ADMIN
         * =========================================================
         */

        const existingAdmin = await Usuarios.findOne({

            where: {
                email: 'admin@example.com'
            }
        });

        if (!existingAdmin) {

            const hash = await bcrypt.hash('123456', 10);

            await Usuarios.create({

                rolesId: rolAdmin.id,

                email: 'admin@example.com',

                password: hash
            });

            console.log(
                'Usuario ADMIN creado: admin@example.com / 123456\n'
            );

        } else {

            console.log(
                'El usuario ADMIN ya existe.\n'
            );
        }

        /**
         * =========================================================
         * 7. CREAR ROL CLIENTE
         * =========================================================
         *
         * Rol normal del sistema.
         * Este sí puede modificarse.
         */

        const [rolCliente] = await Roles.findOrCreate({

            where: {
                name: 'CLIENTE'
            },

            defaults: {

                name: 'CLIENTE',

                description:
                    'Acceso restringido para clientes',

                isSystem: false
            }
        });

        /**
         * Buscar permisos específicos para clientes.
         */

        const permisosCliente = await Permisos.findAll({

            where: {

                moduleKey: [
                    'catalog',
                    'orders',
                    'sales',
                    'dashboard'
                ]
            }
        });

        /**
         * Asignar permisos al cliente.
         */

        await rolCliente.setPermisos(
            permisosCliente.map(p => p.id)
        );

        console.log(
            `Rol CLIENTE configurado con ${permisosCliente.length} permisos.\n`
        );

        /**
         * =========================================================
         * FIN DEL SEED
         * =========================================================
         */

        console.log('===================================');
        console.log('SEED COMPLETADO CORRECTAMENTE');
        console.log('===================================\n');

        process.exit(0);

    } catch (error) {

        console.error('\nERROR EN EL SEED:\n');

        console.error(error);
        throw error;
    }
}

seed();