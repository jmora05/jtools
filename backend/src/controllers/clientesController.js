/**
 * clientesController.js
 * Controlador principal del módulo Clientes.
 *
 * Gestiona el ciclo de vida completo de los clientes: creación, lectura,
 * actualización, desactivación y eliminación física. Los clientes pueden ser
 * Persona Natural o Empresa y, opcionalmente, tienen un Usuario vinculado
 * (por email) que les permite acceder al portal de pedidos.
 *
 * Política de borrado:
 *   - Con historial en Ventas → desactivación lógica (estado='inactivo')
 *   - Sin historial            → eliminación física vía /force
 */
const bcrypt = require('bcryptjs');
const { Clientes, Ventas, Usuarios, Roles } = require('../models/index.js');
const { sequelize } = require('../config/jtools_db');
const { validarCliente } = require('../validators/clientesValidator.js');
const { sincronizarEmailEnTablasRelacionadas } = require('../services/emailSyncService');

// Número de rondas de hash configurable por entorno; 12 es el mínimo recomendado
// para producción: aumenta el costo computacional y dificulta ataques de fuerza bruta.
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

/**
 * Busca el rol 'cliente' en la tabla Roles usando comparación insensible a
 * mayúsculas, para evitar dependencia del casing exacto almacenado en BD.
 * Se centraliza aquí porque tanto createCliente como updateCliente lo necesitan
 * al vincular un Usuario de portal al cliente recién creado/modificado.
 */
async function resolverRolCliente() {
  return Roles.findOne({
    where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'cliente'),
  });
}

/**
 * GET /clientes
 * Devuelve todos los clientes sin filtrar, incluyendo activos e inactivos.
 * Usado por el panel de administración donde se necesita visibilidad total.
 */
const getClientes = async (req, res) => {
    try {
        const clientes = await Clientes.findAll();
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los clientes', error: error.message });
    }
};

/**
 * GET /clientes/:id
 * Recupera un cliente específico por clave primaria.
 * Retorna 404 explícito para que el frontend pueda distinguir entre
 * "cliente no existe" y un error de servidor inesperado.
 */
const getClienteById = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);
        if (!cliente)
            return res.status(404).json({ message: 'Cliente no encontrado' });
        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el cliente', error: error.message });
    }
};

/**
 * GET /clientes/:id/historial
 * Retorna el cliente con su historial de transacciones asociadas en la tabla
 * Ventas. Incluye tanto ventas directas como pedidos (tipoVenta: 'pedido'),
 * lo que permite al portal mostrar el estado de cada solicitud del cliente.
 * Solo se exponen los campos esenciales de cada venta para minimizar el payload.
 */
const getHistorialCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id, {
            include: [
                { model: Ventas, as: 'ventas', attributes: ['id', 'fecha', 'metodoPago', 'tipoVenta', 'total'] },
            ],
        });
        if (!cliente)
            return res.status(404).json({ message: 'Cliente no encontrado' });
        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el historial del cliente', error: error.message });
    }
};

/**
 * GET /clientes/activos
 * Filtra únicamente clientes con estado='activo'.
 * Se usa en los selectores de otros módulos (ventas, pedidos) para evitar
 * que se asignen transacciones a clientes fuera de servicio.
 */
const getClientesActivos = async (req, res) => {
    try {
        const clientes = await Clientes.findAll({ where: { estado: 'activo' } });
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los clientes activos', error: error.message });
    }
};

/**
 * POST /clientes
 * Crea un nuevo cliente (Persona Natural o Empresa) y, si se proporcionó
 * contraseña, vincula o crea el Usuario de portal correspondiente.
 *
 * El vínculo Usuario↔Cliente se realiza por email compartido: si ya existe
 * un Usuario con ese correo no se crea uno duplicado, pero sí se reutiliza.
 * El email se normaliza (trim + lowercase) antes de persistir para garantizar
 * unicidad sin importar el casing que ingrese el operador.
 */
const createCliente = async (req, res) => {
    try {
        // El validador es async porque consulta BD para verificar unicidad de campos.
        const errores = await validarCliente(req.body, false, null);
        if (errores.length > 0)
            return res.status(400).json({ message: 'Error de validación', errores });

        const {
            razon_social, tipo_documento, numero_documento,
            direccion, ciudad, departamento, telefono, email, estado,
            nombres, apellidos, contacto, password,
        } = req.body;

        const emailNorm = email?.trim().toLowerCase();

        const cliente = await Clientes.create({
            razon_social, tipo_documento, numero_documento,
            direccion, ciudad, departamento, telefono, email: emailNorm, estado,
            nombres, apellidos, contacto,
        });

        // Solo se crea el Usuario de portal si se envió contraseña y el email
        // aún no tiene cuenta: permite registrar clientes sin acceso al portal
        // y habilitarlos después sin duplicar registros en Usuarios.
        if (password && String(password).trim() !== '') {
            const usuarioExistente = await Usuarios.findOne({ where: { email: emailNorm } });
            if (!usuarioExistente) {
                const rol = await resolverRolCliente();
                if (rol) {
                    const hash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
                    await Usuarios.create({ rolesId: rol.id, email: emailNorm, password: hash, creadoPorAdmin: true });
                }
            }
        }

        res.status(201).json({ message: 'Cliente creado correctamente', cliente });
    } catch (error) {
        if (
            error.name === 'SequelizeValidationError' ||
            error.name === 'SequelizeUniqueConstraintError'
        ) {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el cliente', error: error.message });
    }
};

/**
 * PUT /clientes/:id
 * Actualiza los datos de un cliente existente.
 *
 * Si se envía una contraseña nueva, se actualiza el hash del Usuario vinculado
 * por email; si ese Usuario aún no existe, se crea en este momento.
 * Esto permite habilitar el acceso al portal en cualquier edición posterior
 * sin necesidad de eliminar y volver a crear al cliente.
 */
const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);
        if (!cliente)
            return res.status(404).json({ message: 'Cliente no encontrado' });

        // Se pasa el id numérico para que el validador excluya este registro al
        // comprobar unicidad: un cliente debe poder conservar su propio email/doc.
        const errores = await validarCliente(req.body, true, Number(id));
        if (errores.length > 0)
            return res.status(400).json({ message: 'Error de validación', errores });

        const {
            razon_social, tipo_documento, numero_documento,
            direccion, ciudad, departamento, telefono, email, estado,
            nombres, apellidos, contacto, password,
        } = req.body;

        const emailAnterior  = cliente.email;
        const emailNuevoNorm = email ? String(email).trim().toLowerCase() : cliente.email;

        await sequelize.transaction(async (t) => {
            await cliente.update({
                razon_social, tipo_documento, numero_documento,
                direccion, ciudad, departamento, telefono, email: emailNuevoNorm, estado,
                nombres, apellidos, contacto,
            }, { transaction: t });

            // Propagar el cambio de email a Usuarios/Empleados antes de tocar
            // contraseñas, para no buscar/crear un Usuario con el email viejo.
            if (emailNuevoNorm !== emailAnterior) {
                await sincronizarEmailEnTablasRelacionadas(emailAnterior, emailNuevoNorm, t, { skip: ['clientes'] });
            }

            if (password && String(password).trim() !== '') {
                let usuario = await Usuarios.findOne({ where: { email: emailNuevoNorm }, transaction: t });
                if (!usuario) {
                    // Primera vez que se asigna contraseña: crear cuenta de portal
                    const rol = await resolverRolCliente();
                    if (rol) {
                        const hash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
                        await Usuarios.create({ rolesId: rol.id, email: emailNuevoNorm, password: hash, creadoPorAdmin: true }, { transaction: t });
                    }
                } else {
                    // Rotación de contraseña: reemplaza el hash existente
                    const hash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
                    await usuario.update({ password: hash }, { transaction: t });
                }
            }
        });

        res.status(200).json({ message: 'Cliente actualizado correctamente', cliente });
    } catch (error) {
        if (
            error.name === 'SequelizeValidationError' ||
            error.name === 'SequelizeUniqueConstraintError'
        ) {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el cliente', error: error.message });
    }
};

/**
 * DELETE /clientes/:id
 * Desactivación lógica: cambia estado a 'inactivo' sin eliminar el registro.
 * Se aplica en ambos casos (con o sin historial de ventas) para preservar la
 * trazabilidad; la diferencia en el mensaje informa al frontend sobre la razón.
 *
 * La desactivación impide que el cliente reciba nuevos pedidos o ventas,
 * pero mantiene intacto el historial para auditoría y reportes históricos.
 */
const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);
        if (!cliente)
            return res.status(404).json({ message: 'Cliente no encontrado' });

        // Verificar si existen ventas o pedidos asociados antes de desactivar,
        // para devolver un mensaje contextual adecuado al operador.
        const ventasActivas = await Ventas.findOne({ where: { clientesId: id } });

        if (ventasActivas) {
            await cliente.update({ estado: 'inactivo' });
            return res.status(200).json({
                message: 'Cliente desactivado correctamente (tiene historial de ventas o pedidos)',
            });
        }

        await cliente.update({ estado: 'inactivo' });
        res.status(200).json({ message: 'Cliente desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar el cliente', error: error.message });
    }
};

/**
 * DELETE /clientes/:id/force
 * Eliminación física del registro solo cuando el cliente no tiene ninguna
 * transacción (venta o pedido) asociada. Si existen registros en Ventas,
 * se rechaza con 400 para preservar la integridad referencial y el historial
 * contable; en ese caso el operador debe usar la desactivación lógica.
 *
 * Solo accesible para administradores (restringido a nivel de ruta/middleware).
 */
const forceDeleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);
        if (!cliente)
            return res.status(404).json({ message: 'Cliente no encontrado' });

        // Bloquear eliminación si hay ventas o pedidos; clientesId es la FK en Ventas.
        const ventasActivas = await Ventas.findOne({ where: { clientesId: id } });

        if (ventasActivas) {
            return res.status(400).json({
                message: 'No se puede eliminar el cliente porque tiene historial de ventas o pedidos asociados',
            });
        }

        await cliente.destroy();
        res.status(200).json({ message: 'Cliente eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el cliente', error: error.message });
    }
};

/**
 * GET /clientes/verificar?campo=&valor=&excluirId=
 * Endpoint de validación de unicidad en tiempo real, consumido por el hook
 * useUniquenessCheck del frontend mientras el usuario escribe.
 *
 * La comparación usa LOWER + TRIM para ignorar diferencias de casing y espacios
 * accidentales, garantizando la misma regla que aplica el validador al guardar.
 * El parámetro excluirId permite que un cliente en edición conserve sus propios
 * valores sin disparar un falso positivo de duplicado.
 *
 * En caso de error de BD se responde { existe: false } para no bloquear el
 * formulario por una falla de conectividad transitoria.
 */
const verificarCampo = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const { campo, valor, excluirId } = req.query;

        // Lista blanca explícita para prevenir inyección de nombres de columna
        // arbitrarios que podrían exponer datos de otras columnas sensibles.
        const camposPermitidos = ['telefono', 'email', 'numero_documento'];
        if (!camposPermitidos.includes(campo)) {
            return res.status(400).json({ existe: false, mensaje: 'Campo no válido' });
        }
        // Valor vacío no es duplicado; evita consultas innecesarias al BD.
        if (!valor || valor.trim() === '') {
            return res.json({ existe: false });
        }

        // Comparación normalizada: elimina diferencias de casing y espacios
        // para que "cliente@Email.COM " y "cliente@email.com" se traten igual.
        const where = sequelize.where(
            sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col(campo))),
            valor.trim().toLowerCase(),
        );

        const condiciones = { where };
        if (excluirId) {
            // Al editar, se excluye el propio registro para que el cliente pueda
            // conservar su email/documento sin recibir error de duplicado.
            condiciones.where = { [Op.and]: [where, { id: { [Op.ne]: parseInt(excluirId) } }] };
        }

        const existe = await Clientes.findOne(condiciones);

        // Mensajes orientados al negocio, no técnicos, para mostrar directamente en UI.
        const mensajes = {
            telefono: 'Este teléfono ya está registrado en el sistema',
            email: 'Este correo ya está registrado en el sistema',
            numero_documento: 'Este número de documento ya está registrado',
        };

        res.json({
            existe: !!existe,
            mensaje: existe ? (mensajes[campo] || 'Este valor ya está registrado') : null,
        });
    } catch (error) {
        console.error('Error en verificarCampo (clientes):', error);
        // Falla silenciosa: no bloquear el formulario ante errores transitorios de BD.
        res.json({ existe: false });
    }
};

module.exports = {
    getClientes,
    getClienteById,
    getHistorialCliente,
    getClientesActivos,
    createCliente,
    updateCliente,
    deleteCliente,
    forceDeleteCliente,
    verificarCampo,
};