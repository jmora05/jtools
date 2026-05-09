const { HorasExtra, Empleados } = require('../models/index.js');

const INCLUDE_EMPLEADO = [
  { model: Empleados, as: 'empleado', attributes: ['id', 'nombres', 'apellidos', 'cargo'] },
];

const getHorasExtra = async (req, res) => {
  try {
    const data = await HorasExtra.findAll({
      include: INCLUDE_EMPLEADO,
      order: [['id', 'DESC']],
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los registros', error: error.message });
  }
};

const getHoraExtraById = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await HorasExtra.findByPk(id, { include: INCLUDE_EMPLEADO });
    if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });
    res.status(200).json(registro);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el registro', error: error.message });
  }
};

const createHoraExtra = async (req, res) => {
  try {
    const { empleadoId, tipo, fecha, horas, observaciones } = req.body;

    const empleado = await Empleados.findByPk(empleadoId);
    if (!empleado)
      return res.status(404).json({ message: 'El empleado no existe' });
    if (empleado.estado === 'inactivo')
      return res.status(400).json({ message: 'El empleado está inactivo' });

    const registro = await HorasExtra.create({
      empleadoId: Number(empleadoId),
      tipo,
      fecha,
      horas:        parseFloat(horas),
      observaciones: observaciones?.trim() || null,
    });

    await registro.reload({ include: INCLUDE_EMPLEADO });
    res.status(201).json(registro);
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Error de validación', errores: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error al crear el registro', error: error.message });
  }
};

const updateHoraExtra = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await HorasExtra.findByPk(id);
    if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });
    if (registro.estado === 'aprobada')
      return res.status(400).json({ message: 'No se puede modificar un registro aprobado' });

    const { empleadoId, tipo, fecha, horas, observaciones, estado } = req.body;

    if (empleadoId !== undefined) {
      const empleado = await Empleados.findByPk(empleadoId);
      if (!empleado)
        return res.status(404).json({ message: 'El empleado no existe' });
      if (empleado.estado === 'inactivo')
        return res.status(400).json({ message: 'El empleado está inactivo' });
    }

    const updates = {};
    if (empleadoId    !== undefined) updates.empleadoId    = Number(empleadoId);
    if (tipo          !== undefined) updates.tipo          = tipo;
    if (fecha         !== undefined) updates.fecha         = fecha;
    if (horas         !== undefined) updates.horas         = parseFloat(horas);
    if (observaciones !== undefined) updates.observaciones = observaciones?.trim() || null;
    if (estado        !== undefined) updates.estado        = estado;

    await registro.update(updates);
    await registro.reload({ include: INCLUDE_EMPLEADO });
    res.status(200).json(registro);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Error de validación', errores: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Error al actualizar el registro', error: error.message });
  }
};

const cambiarEstadoHoraExtra = async (req, res) => {
  try {
    const { id }     = req.params;
    const { estado } = req.body;
    const registro   = await HorasExtra.findByPk(id);
    if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });
    await registro.update({ estado });
    await registro.reload({ include: INCLUDE_EMPLEADO });
    res.status(200).json(registro);
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar el estado', error: error.message });
  }
};

const deleteHoraExtra = async (req, res) => {
  try {
    const { id }   = req.params;
    const registro = await HorasExtra.findByPk(id);
    if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });
    if (registro.estado === 'aprobada')
      return res.status(400).json({ message: 'No se puede eliminar un registro aprobado' });
    await registro.destroy();
    res.status(200).json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el registro', error: error.message });
  }
};

module.exports = {
  getHorasExtra,
  getHoraExtraById,
  createHoraExtra,
  updateHoraExtra,
  cambiarEstadoHoraExtra,
  deleteHoraExtra,
};
