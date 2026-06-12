const bcrypt = require('bcryptjs');
const { Clientes, Ventas, Usuarios, Roles } = require('../models/index.js');
const { sequelize } = require('../config/jtools_db');
const { validarCliente } = require('../validators/clientesValidator.js');

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

async function resolverRolCliente() {
  return Roles.findOne({
    where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'cliente'),
  });
}

// GET - listar todos los clientes
const getClientes = async (req, res) => {
    try {
        const clientes = await Clientes.findAll();
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los clientes', error: error.message });
    }
};

// GET - obtener cliente por ID
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

// GET - historial de ventas y pedidos del cliente
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

// GET - listar clientes activos
const getClientesActivos = async (req, res) => {
    try {
        const clientes = await Clientes.findAll({ where: { estado: 'activo' } });
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los clientes activos', error: error.message });
    }
};

// POST - crear cliente
const createCliente = async (req, res) => {
    try {
        // ← await obligatorio: el validador ahora es async
        const errores = await validarCliente(req.body, false, null);
        if (errores.length > 0)
            return res.status(400).json({ message: 'Error de validación', errores });

        const {
            razon_social, tipo_documento, numero_documento,
            direccion, ciudad, telefono, email, estado,
            nombres, apellidos, contacto, password,
        } = req.body;

        const emailNorm = email?.trim().toLowerCase();

        const cliente = await Clientes.create({
            razon_social, tipo_documento, numero_documento,
            direccion, ciudad, telefono, email: emailNorm, estado,
            nombres, apellidos, contacto,
        });

        // Vincular o crear Usuario si se proporcionó contraseña
        if (password && String(password).trim() !== '') {
            const usuarioExistente = await Usuarios.findOne({ where: { email: emailNorm } });
            if (!usuarioExistente) {
                const rol = await resolverRolCliente();
                if (rol) {
                    const hash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
                    await Usuarios.create({ rolesId: rol.id, email: emailNorm, password: hash });
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

// PUT - actualizar cliente
const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);
        if (!cliente)
            return res.status(404).json({ message: 'Cliente no encontrado' });

        // ← idExcluir = Number(id) para no comparar el cliente consigo mismo
        const errores = await validarCliente(req.body, true, Number(id));
        if (errores.length > 0)
            return res.status(400).json({ message: 'Error de validación', errores });

        const {
            razon_social, tipo_documento, numero_documento,
            direccion, ciudad, telefono, email, estado,
            nombres, apellidos, contacto, password,
        } = req.body;

        await cliente.update({
            razon_social, tipo_documento, numero_documento,
            direccion, ciudad, telefono, email, estado,
            nombres, apellidos, contacto,
        });

        // Actualizar contraseña del Usuario vinculado si se proporciona
        if (password && String(password).trim() !== '') {
            const emailBuscar = (email?.trim().toLowerCase()) || cliente.email;
            let usuario = await Usuarios.findOne({ where: { email: emailBuscar } });
            if (!usuario) {
                const rol = await resolverRolCliente();
                if (rol) {
                    const hash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
                    await Usuarios.create({ rolesId: rol.id, email: emailBuscar, password: hash });
                }
            } else {
                const hash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);
                await usuario.update({ password: hash });
            }
        }

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

// DELETE - desactivar cliente
const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);
        if (!cliente)
            return res.status(404).json({ message: 'Cliente no encontrado' });

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

// DELETE - eliminar permanentemente
const forceDeleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Clientes.findByPk(id);
        if (!cliente)
            return res.status(404).json({ message: 'Cliente no encontrado' });

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

module.exports = {
    getClientes,
    getClienteById,
    getHistorialCliente,
    getClientesActivos,
    createCliente,
    updateCliente,
    deleteCliente,
    forceDeleteCliente,
};