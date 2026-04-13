const { Op } = require('sequelize');
const { Empleados } = require('../models/index.js');
const { validarEmpleado } = require('../validators/empleadosValidator');

// ────────────────────────────────────────────────────────────
//  GET /empleados  —  listar todos
// ────────────────────────────────────────────────────────────
const getEmpleados = async (req, res) => {
  try {
    const empleados = await Empleados.findAll();
    res.status(200).json(empleados);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los empleados', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  GET /empleados/:id  —  obtener por ID
// ────────────────────────────────────────────────────────────
const getEmpleadoById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const empleado = await Empleados.findByPk(id);
    if (!empleado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.status(200).json(empleado);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el empleado', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  POST /empleados  —  crear
// ────────────────────────────────────────────────────────────
const createEmpleado = async (req, res) => {
  try {
    // 1. Validaciones de formato y negocio
    const errores = validarEmpleado(req.body, false);
    if (errores.length > 0) {
      return res.status(400).json({ message: 'Error de validación', errores });
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
      estado,
    } = req.body;

    const docNorm   = numeroDocumento.trim();
    const emailNorm = email.trim().toLowerCase();

    // 2. Verificar documento duplicado (cualquier estado)
    const docExistente = await Empleados.findOne({
      where: { numeroDocumento: docNorm },
    });
    if (docExistente) {
      return res.status(400).json({
        message: 'Error de validación',
        errores: ['Ya existe un empleado registrado con ese número de documento'],
      });
    }

    // 3. ✅ Verificar email duplicado (cualquier estado)
    const emailExistente = await Empleados.findOne({
      where: { email: emailNorm },
    });
    if (emailExistente) {
      return res.status(400).json({
        message: 'Error de validación',
        errores: ['Ya existe un empleado registrado con ese correo electrónico'],
      });
    }

    // 4. Crear el registro
    const empleado = await Empleados.create({
      tipoDocumento,
      numeroDocumento:  docNorm,
      nombres:          nombres.trim(),
      apellidos:        apellidos.trim(),
      telefono:         telefono.trim(),
      email:            emailNorm,
      cargo,
      area,
      direccion:        direccion?.trim()  || null,
      ciudad:           ciudad?.trim()     || null,
      fechaIngreso,
      estado:           estado             || 'activo',
    });

    res.status(201).json({ message: 'Empleado creado correctamente', empleado });

  } catch (error) {
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const mensajes = error.errors.map((e) => e.message);
      return res.status(400).json({ message: 'Error de validación', errores: mensajes });
    }
    res.status(500).json({ message: 'Error al crear el empleado', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  PUT /empleados/:id  —  actualizar
// ────────────────────────────────────────────────────────────
const updateEmpleado = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const empleado = await Empleados.findByPk(id);
    if (!empleado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    // 1. Validaciones de formato (modo actualización: campos opcionales)
    const errores = validarEmpleado(req.body, true);
    if (errores.length > 0) {
      return res.status(400).json({ message: 'Error de validación', errores });
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
      estado,
    } = req.body;

    // 2. Verificar que el nuevo documento no pertenezca a otro empleado (activo o inactivo)
    if (numeroDocumento) {
      const docNorm = numeroDocumento.trim();
      const duplicadoDoc = await Empleados.findOne({
        where: {
          numeroDocumento: docNorm,
          id: { [Op.ne]: parseInt(id) },
        },
      });
      if (duplicadoDoc) {
        return res.status(400).json({
          message: 'Error de validación',
          errores: ['Ese número de documento ya pertenece a otro empleado'],
        });
      }
    }

    // 3. ✅ Verificar que el nuevo email no pertenezca a otro empleado
    if (email) {
      const emailNorm = email.trim().toLowerCase();
      const duplicadoEmail = await Empleados.findOne({
        where: {
          email: emailNorm,
          id: { [Op.ne]: parseInt(id) },
        },
      });
      if (duplicadoEmail) {
        return res.status(400).json({
          message: 'Error de validación',
          errores: ['Ese correo electrónico ya pertenece a otro empleado'],
        });
      }
    }

    // 4. Actualizar (solo los campos enviados en el body)
    await empleado.update({
      tipoDocumento,
      numeroDocumento: numeroDocumento?.trim(),
      nombres:         nombres?.trim(),
      apellidos:       apellidos?.trim(),
      telefono:        telefono?.trim(),
      email:           email?.trim().toLowerCase(),
      cargo,
      area,
      direccion:       direccion?.trim()  || null,
      ciudad:          ciudad?.trim()     || null,
      fechaIngreso,
      estado,
    });

    res.status(200).json({ message: 'Empleado actualizado correctamente', empleado });

  } catch (error) {
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const mensajes = error.errors.map((e) => e.message);
      return res.status(400).json({ message: 'Error de validación', errores: mensajes });
    }
    res.status(500).json({ message: 'Error al actualizar el empleado', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  DELETE /empleados/:id  —  desactivar (soft delete)
// ────────────────────────────────────────────────────────────
const deleteEmpleado = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const empleado = await Empleados.findByPk(id);
    if (!empleado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    if (empleado.estado === 'inactivo') {
      return res.status(400).json({ message: 'El empleado ya se encuentra inactivo' });
    }

    await empleado.update({ estado: 'inactivo' });
    res.status(200).json({ message: 'Empleado desactivado correctamente' });

  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar el empleado', error: error.message });
  }
};

module.exports = {
  getEmpleados,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
};