const { Proveedores, Compras } = require('../models/index.js');

// GET - listar todos los proveedores
const getProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedores.findAll();
        res.status(200).json(proveedores);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los proveedores', error: error.message });
    }
};

// GET - obtener proveedor por ID
const getProveedorById = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedores.findByPk(id, {
            include: [
                { model: Compras, as: 'compras', attributes: ['id', 'fecha', 'metodoPago', 'estado'] }
            ]
        });

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        res.status(200).json(proveedor);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el proveedor', error: error.message });
    }
};

// POST - crear proveedor
const createProveedor = async (req, res) => {
    try {
        const {
            nombreEmpresa,
            tipoDocumento,
            numeroDocumento,
            personaContacto,
            telefono,
            email,
            direccion,
            ciudad,
            estado
        } = req.body;

        const proveedor = await Proveedores.create({
            nombreEmpresa,
            tipoDocumento,
            numeroDocumento,
            personaContacto,
            telefono,
            email,
            direccion,
            ciudad,
            estado
        });

        res.status(201).json({ message: 'Proveedor creado correctamente', proveedor });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el proveedor', error: error.message });
    }
};

// PUT - actualizar proveedor
const updateProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedores.findByPk(id);

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        const {
            nombreEmpresa,
            tipoDocumento,
            numeroDocumento,
            personaContacto,
            telefono,
            email,
            direccion,
            ciudad,
            estado
        } = req.body;

        await proveedor.update({
            nombreEmpresa,
            tipoDocumento,
            numeroDocumento,
            personaContacto,
            telefono,
            email,
            direccion,
            ciudad,
            estado
        });

        res.status(200).json({ message: 'Proveedor actualizado correctamente', proveedor });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el proveedor', error: error.message });
    }
};

// DELETE - desactivar proveedor (no se borra físicamente por historial de compras)
const deleteProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedores.findByPk(id);

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        // verificar si tiene compras activas antes de desactivar
        const comprasActivas = await Compras.findOne({
            where: { proveedoresId: id, estado: 'pendiente' }
        });

        if (comprasActivas) {
            return res.status(400).json({ message: 'No se puede desactivar el proveedor porque tiene compras pendientes' });
        }

        await proveedor.update({ estado: 'inactivo' });
        res.status(200).json({ message: 'Proveedor desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar el proveedor', error: error.message });
    }
};

module.exports = {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
};