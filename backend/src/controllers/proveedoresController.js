const { Op }               = require('sequelize');
const { Proveedores, Insumos } = require('../models/index.js');
const { validarProveedor } = require('../validators/proveedor.validator.js');

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
        const proveedor = await Proveedores.findByPk(id);

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        res.status(200).json(proveedor);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el proveedor', error: error.message });
    }
};

// GET - insumos asociados al proveedor
const getInsumosProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedores.findByPk(id, {
            include: [
                {
                    model: Insumos,
                    as: 'insumos',
                    attributes: ['id', 'nombre', 'descripcion', 'precio_unitario', 'stock', 'unidad_medida', 'estado'],
                },
            ],
        });

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        res.status(200).json(proveedor);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos del proveedor', error: error.message });
    }
};

// GET - listar proveedores activos
const getProveedoresActivos = async (req, res) => {
    try {
        const proveedores = await Proveedores.findAll({ where: { estado: 'activo' } });
        res.status(200).json(proveedores);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los proveedores activos', error: error.message });
    }
};

// POST - crear proveedor
const createProveedor = async (req, res) => {
    try {
        const errores = validarProveedor(req.body, false);
        if (errores.length > 0) {
            return res.status(400).json({ message: 'Error de validación', errores });
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
            estado,
        } = req.body;

        // ── Validación de unicidad ────────────────────────────────────────────
        const [emailExiste, docExiste] = await Promise.all([
            Proveedores.findOne({ where: { email } }),
            Proveedores.findOne({ where: { numeroDocumento } }),
        ]);

        const erroresUnicos = [];
        if (emailExiste)  erroresUnicos.push('El correo electrónico ya está registrado');
        if (docExiste)    erroresUnicos.push('El número de documento ya está registrado');
        if (erroresUnicos.length > 0) {
            return res.status(400).json({ message: 'Error de validación', errores: erroresUnicos });
        }
        // ─────────────────────────────────────────────────────────────────────

        const proveedor = await Proveedores.create({
            nombreEmpresa,
            tipoDocumento,
            numeroDocumento,
            personaContacto,
            telefono,
            email,
            direccion,
            ciudad,
            estado,
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

        const errores = validarProveedor(req.body, true);
        if (errores.length > 0) {
            return res.status(400).json({ message: 'Error de validación', errores });
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
            estado,
        } = req.body;

        // ── Validación de unicidad (excluye el propio registro) ───────────────
        const [emailExiste, docExiste] = await Promise.all([
            email           ? Proveedores.findOne({ where: { email,           id: { [Op.ne]: id } } }) : null,
            numeroDocumento ? Proveedores.findOne({ where: { numeroDocumento, id: { [Op.ne]: id } } }) : null,
        ]);

        const erroresUnicos = [];
        if (emailExiste) erroresUnicos.push('El correo electrónico ya está registrado');
        if (docExiste)   erroresUnicos.push('El número de documento ya está registrado');
        if (erroresUnicos.length > 0) {
            return res.status(400).json({ message: 'Error de validación', errores: erroresUnicos });
        }
        // ─────────────────────────────────────────────────────────────────────

        await proveedor.update({
            nombreEmpresa,
            tipoDocumento,
            numeroDocumento,
            personaContacto,
            telefono,
            email,
            direccion,
            ciudad,
            estado,
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

// DELETE - eliminar proveedor físicamente (bloquea si tiene insumos asociados)
const deleteProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedores.findByPk(id);

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        const insumosAsociados = await Insumos.findOne({ where: { proveedoresId: id } });
        if (insumosAsociados) {
            return res.status(400).json({
                message: 'No se puede eliminar el proveedor porque tiene insumos asociados',
                errores: ['No se puede eliminar el proveedor porque tiene insumos asociados'],
            });
        }

        await proveedor.destroy();
        res.status(200).json({ message: 'Proveedor eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el proveedor', error: error.message });
    }
};

// DELETE (force) - eliminar físicamente sin verificación adicional (uso interno/admin)
const forceDeleteProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedores.findByPk(id);

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        const insumosAsociados = await Insumos.findOne({ where: { proveedoresId: id } });
        if (insumosAsociados) {
            return res.status(400).json({
                message: 'No se puede eliminar el proveedor porque tiene insumos asociados',
            });
        }

        await proveedor.destroy();
        res.status(200).json({ message: 'Proveedor eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el proveedor', error: error.message });
    }
};

module.exports = {
    getProveedores,
    getProveedorById,
    getInsumosProveedor,
    getProveedoresActivos,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    forceDeleteProveedor,
};