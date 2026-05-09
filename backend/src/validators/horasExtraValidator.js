const TIPOS_VALIDOS = [
  'Recargo Nocturno',
  'Recargo Diurno Dominical',
  'Recargo Nocturno Dominical',
  'Hora Extra Diurna',
  'Hora Extra Nocturna',
  'Hora Extra Diurna Dominical/Festiva',
];

const ESTADOS_VALIDOS = ['pendiente', 'aprobada'];

function esEnteroPositivo(v) {
  return Number.isInteger(Number(v)) && Number(v) > 0;
}

const validateCreateHoraExtra = (req, res, next) => {
  const errors = [];
  const { empleadoId, tipo, fecha, horas, observaciones } = req.body;

  if (!empleadoId || !esEnteroPositivo(empleadoId))
    errors.push('El empleadoId debe ser un número entero positivo');

  if (!tipo || !TIPOS_VALIDOS.includes(tipo))
    errors.push(`El tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`);

  if (!fecha) {
    errors.push('La fecha es obligatoria');
  } else {
    const d   = new Date(fecha + 'T12:00:00');
    const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
    if (isNaN(d.getTime())) errors.push('La fecha no tiene un formato válido');
    else if (d > hoy)       errors.push('La fecha no puede ser futura');
  }

  if (horas === undefined || horas === null || horas === '') {
    errors.push('Las horas son obligatorias');
  } else {
    const h = parseFloat(horas);
    if (isNaN(h) || h <= 0) errors.push('Las horas deben ser un número mayor a 0');
    else if (h > 24)        errors.push('Las horas no pueden superar 24');
  }

  if (observaciones !== undefined && observaciones !== null) {
    if (String(observaciones).length > 500)
      errors.push('Las observaciones no pueden superar los 500 caracteres');
  }

  if (errors.length > 0) return res.status(400).json({ message: 'Error de validación', errores: errors });
  next();
};

const validateUpdateHoraExtra = (req, res, next) => {
  const errors = [];
  const { empleadoId, tipo, fecha, horas, observaciones, estado } = req.body;

  const enviados = [empleadoId, tipo, fecha, horas, observaciones, estado].filter(v => v !== undefined);
  if (enviados.length === 0)
    return res.status(400).json({ message: 'Debe enviar al menos un campo para actualizar' });

  if (empleadoId !== undefined && !esEnteroPositivo(empleadoId))
    errors.push('El empleadoId debe ser un número entero positivo');

  if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo))
    errors.push(`El tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`);

  if (fecha !== undefined) {
    const d   = new Date(fecha + 'T12:00:00');
    const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
    if (isNaN(d.getTime())) errors.push('La fecha no tiene un formato válido');
    else if (d > hoy)       errors.push('La fecha no puede ser futura');
  }

  if (horas !== undefined) {
    const h = parseFloat(horas);
    if (isNaN(h) || h <= 0) errors.push('Las horas deben ser un número mayor a 0');
    else if (h > 24)        errors.push('Las horas no pueden superar 24');
  }

  if (observaciones !== undefined && String(observaciones).length > 500)
    errors.push('Las observaciones no pueden superar los 500 caracteres');

  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado))
    errors.push(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);

  if (errors.length > 0) return res.status(400).json({ message: 'Error de validación', errores: errors });
  next();
};

const validateCambiarEstadoHE = (req, res, next) => {
  const { estado } = req.body;
  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`,
    });
  }
  next();
};

const validateParamId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ message: 'El ID proporcionado no es válido' });
  }
  next();
};

module.exports = {
  validateCreateHoraExtra,
  validateUpdateHoraExtra,
  validateCambiarEstadoHE,
  validateParamId,
};
