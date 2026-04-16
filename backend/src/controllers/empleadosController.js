const { Op } = require('sequelize');
const { Empleados, Novedades, OrdenesProduccion, FichaTecnica } = require('../models/index.js');
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
//  GET /empleados/:id/puede-eliminarse  —  verificar si puede ser eliminado
// ────────────────────────────────────────────────────────────
const puedeEliminarse = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== puedeEliminarse - ID:', id);

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const empleado = await Empleados.findByPk(id);
    if (!empleado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    console.log('Empleado encontrado:', empleado.nombres);

    // Verificar referencias en Novedades
    let novedadesRegistradas = 0;
    let novedadesResponsable = 0;
    let novedadesAfectado = 0;
    
    try {
      novedadesRegistradas = await Novedades.count({
        where: { registrado_por: id }
      });
      console.log('novedadesRegistradas:', novedadesRegistradas);
    } catch (err) {
      console.error('Error contando novedadesRegistradas:', err.message);
    }

    try {
      novedadesResponsable = await Novedades.count({
        where: { empleado_responsable: id }
      });
      console.log('novedadesResponsable:', novedadesResponsable);
    } catch (err) {
      console.error('Error contando novedadesResponsable:', err.message);
    }

    try {
      novedadesAfectado = await Novedades.count({
        where: { empleado_afectado: id }
      });
      console.log('novedadesAfectado:', novedadesAfectado);
    } catch (err) {
      console.error('Error contando novedadesAfectado:', err.message);
    }

    // Verificar referencias en OrdenesProduccion
    let ordenesProduccion = 0;
    try {
      ordenesProduccion = await OrdenesProduccion.count({
        where: { responsableId: id }
      });
      console.log('ordenesProduccion:', ordenesProduccion);
    } catch (err) {
      console.error('Error contando ordenesProduccion:', err.message);
    }

    // Verificar referencias en FichaTecnica (TODAS, activas e inactivas)
    let fichaTecnicaCount = 0;
    try {
      const fichasTecnicas = await FichaTecnica.findAll({
        attributes: ['id', 'procesos']
      });
      console.log('Fichas técnicas encontradas:', fichasTecnicas.length);

      for (const ficha of fichasTecnicas) {
        if (ficha.procesos && Array.isArray(ficha.procesos)) {
          const procesosConEmpleado = ficha.procesos.filter(p => p.responsableId === parseInt(id));
          if (procesosConEmpleado.length > 0) {
            fichaTecnicaCount++;
          }
        }
      }
      console.log('fichaTecnicaCount:', fichaTecnicaCount);
    } catch (fichaError) {
      console.error('Error al verificar fichas técnicas:', fichaError.message);
      // Continuar sin contar fichas técnicas si hay error
    }

    const totalReferencias = novedadesRegistradas + novedadesResponsable + novedadesAfectado + ordenesProduccion + fichaTecnicaCount;

    const referencias = {
      novedadesRegistradas,
      novedadesResponsable,
      novedadesAfectado,
      ordenesProduccion,
      fichaTecnicaCount,
      total: totalReferencias
    };

    console.log('Total referencias:', totalReferencias);

    res.status(200).json({
      puedeEliminarse: totalReferencias === 0,
      referencias,
      mensaje: totalReferencias === 0 
        ? 'El empleado puede ser eliminado'
        : `El empleado tiene ${totalReferencias} referencia(s) en el sistema y no puede ser eliminado`
    });

  } catch (error) {
    console.error('=== ERROR en puedeEliminarse:', error);
    res.status(500).json({ message: 'Error al verificar si puede eliminarse', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  DELETE /empleados/:id  —  eliminar permanentemente
// ────────────────────────────────────────────────────────────
const deleteEmpleadoPermanente = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const empleado = await Empleados.findByPk(id);
    if (!empleado) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    // Verificar que no tenga referencias
    const novedadesRegistradas = await Novedades.count({
      where: { registrado_por: id }
    });

    const novedadesResponsable = await Novedades.count({
      where: { empleado_responsable: id }
    });

    const novedadesAfectado = await Novedades.count({
      where: { empleado_afectado: id }
    });

    const ordenesProduccion = await OrdenesProduccion.count({
      where: { responsableId: id }
    });

    // Verificar referencias en FichaTecnica (TODAS, activas e inactivas)
    const fichasTecnicas = await FichaTecnica.findAll();

    let fichaTecnicaCount = 0;
    for (const ficha of fichasTecnicas) {
      if (ficha.procesos && Array.isArray(ficha.procesos)) {
        const procesosConEmpleado = ficha.procesos.filter(p => p.responsableId === parseInt(id));
        if (procesosConEmpleado.length > 0) {
          fichaTecnicaCount++;
        }
      }
    }

    const totalReferencias = novedadesRegistradas + novedadesResponsable + novedadesAfectado + ordenesProduccion + fichaTecnicaCount;

    if (totalReferencias > 0) {
      return res.status(409).json({
        message: 'No se puede eliminar el empleado',
        razon: 'El empleado está vinculado a otros registros en el sistema (incluyendo fichas técnicas inactivas)',
        referencias: {
          novedadesRegistradas,
          novedadesResponsable,
          novedadesAfectado,
          ordenesProduccion,
          fichaTecnicaCount,
          total: totalReferencias
        }
      });
    }

    // Eliminar permanentemente
    await empleado.destroy();
    res.status(200).json({ message: 'Empleado eliminado permanentemente' });

  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el empleado', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  PUT /empleados/:id/desactivar  —  desactivar (soft delete)
// ────────────────────────────────────────────────────────────
const desactivarEmpleado = async (req, res) => {
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

// ────────────────────────────────────────────────────────────
//  DELETE /empleados/:id  —  desactivar (soft delete) - DEPRECATED
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
  desactivarEmpleado,
  puedeEliminarse,
  deleteEmpleadoPermanente,
};