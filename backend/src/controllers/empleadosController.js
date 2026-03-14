const { Empleados } = require('../models/index.js');

// GET - listar todos los empleados
const getEmpleados = async (req, res) => {
    try {
        const empleados = await Empleados.findAll();
        res.status(200).json(empleados);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los empleados', error: error.message });
    }
};

// GET - obtener empleado por ID
const getEmpleadoById = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await Empleados.findByPk(id);

        if (!empleado) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        res.status(200).json(empleado);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el empleado', error: error.message });
    }
};

// POST - crear empleado
const createEmpleado = async (req, res) => {
    try {
        const {
            tipoDocumento,
            numeroDocumento,
            nombres,
            apellidos,
            telefono,
            email,
            cargo,
            area,
            direccion,
            ciudad,
            fechaIngreso,
            estado
        } = req.body;

        const empleado = await Empleados.create({
            tipoDocumento,
            numeroDocumento,
            nombres,
            apellidos,
            telefono,
            email,
            cargo,
            area,
            direccion,
            ciudad,
            fechaIngreso,
            estado
        });

        res.status(201).json({ message: 'Empleado creado correctamente', empleado });
    } catch (error) {
        // errores de validación de Sequelize
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear el empleado', error: error.message });
    }
};

// PUT - actualizar empleado
const updateEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await Empleados.findByPk(id);

        if (!empleado) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        const {
            tipoDocumento,
            numeroDocumento,
            nombres,
            apellidos,
            telefono,
            email,
            cargo,
            area,
            direccion,
            ciudad,
            fechaIngreso,
            estado
        } = req.body;

        await empleado.update({
            tipoDocumento,
            numeroDocumento,
            nombres,
            apellidos,
            telefono,
            email,
            cargo,
            area,
            direccion,
            ciudad,
            fechaIngreso,
            estado
        });

        res.status(200).json({ message: 'Empleado actualizado correctamente', empleado });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el empleado', error: error.message });
    }
};

// DELETE - eliminar empleado (cambia estado a inactivo)
const deleteEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await Empleados.findByPk(id);

        if (!empleado) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        await empleado.update({ estado: 'inactivo' });
        res.status(200).json({ message: 'Empleado desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el empleado', error: error.message });
    }
};

module.exports = {
    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado
};