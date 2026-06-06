// validators/novedadesValidator.js

const ESTADOS_VALIDOS = ['registrada', 'aprobada_remunera', 'aprobada_sin_remuneracion', 'rechazada', 'anulada'];
const ESTADOS_TERMINALES = ['anulada', 'rechazada'];
const DIAS_MAX_AUSENCIA = 14;

const validateCreateNovedad = (req, res, next) => {
    const errors = [];
    const {
        titulo,
        descripcion_detallada,
        estado,
        fecha_registro,
        fecha_inicio,
        fecha_finalizacion,
        empleado_afectado,
        horas_ausencia
    } = req.body;

    if (!titulo || titulo.trim() === '') {
        errors.push('El título es obligatorio');
    } else if (titulo.trim().length < 3 || titulo.trim().length > 50) {
        errors.push('El título debe tener entre 3 y 50 caracteres');
    }

    if (!descripcion_detallada || descripcion_detallada.trim() === '') {
        errors.push('La descripción detallada es obligatoria');
    }

    if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
        errors.push(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    if (fecha_registro !== undefined && isNaN(Date.parse(fecha_registro))) {
        errors.push('La fecha de registro debe ser una fecha válida');
    }

    if (fecha_inicio !== undefined && isNaN(Date.parse(fecha_inicio))) {
        errors.push('La fecha de inicio debe ser una fecha válida');
    }

    if (fecha_finalizacion !== undefined && isNaN(Date.parse(fecha_finalizacion))) {
        errors.push('La fecha de finalización debe ser una fecha válida');
    }

    if (fecha_inicio && fecha_finalizacion) {
        const inicio = new Date(fecha_inicio);
        const fin    = new Date(fecha_finalizacion);
        if (fin < inicio) {
            errors.push('La fecha de finalización no puede ser anterior a la fecha de inicio');
        } else {
            const diffDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
            if (diffDias > DIAS_MAX_AUSENCIA) {
                errors.push(`La duración de la ausencia no puede superar ${DIAS_MAX_AUSENCIA} días`);
            }
        }
    }

    if (horas_ausencia !== undefined && horas_ausencia !== null && horas_ausencia !== '') {
        const h = parseFloat(horas_ausencia);
        if (isNaN(h) || h < 0) {
            errors.push('Las horas de ausencia deben ser un número mayor o igual a 0');
        }
    }

    if (empleado_afectado !== undefined && empleado_afectado !== null) {
        if (!Number.isInteger(Number(empleado_afectado)) || Number(empleado_afectado) <= 0) {
            errors.push('El empleado_afectado debe ser un número entero positivo');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Error de validación', errores: errors });
    }

    next();
};

const validateUpdateNovedad = (req, res, next) => {
    const errors = [];
    const { titulo, descripcion_detallada, empleado_afectado, fecha_inicio, fecha_finalizacion } = req.body;

    if (titulo !== undefined) {
        if (!titulo || titulo.trim() === '') {
            errors.push('El título no puede estar vacío');
        } else if (titulo.trim().length < 3 || titulo.trim().length > 50) {
            errors.push('El título debe tener entre 3 y 50 caracteres');
        }
    }

    if (descripcion_detallada !== undefined) {
        if (!descripcion_detallada || descripcion_detallada.trim() === '') {
            errors.push('La descripción detallada no puede estar vacía');
        }
    }

    if (fecha_inicio !== undefined && isNaN(Date.parse(fecha_inicio))) {
        errors.push('La fecha de inicio debe ser una fecha válida');
    }

    if (fecha_finalizacion !== undefined && isNaN(Date.parse(fecha_finalizacion))) {
        errors.push('La fecha de finalización debe ser una fecha válida');
    }

    if (fecha_inicio && fecha_finalizacion) {
        const inicio = new Date(fecha_inicio);
        const fin    = new Date(fecha_finalizacion);
        if (fin < inicio) {
            errors.push('La fecha de finalización no puede ser anterior a la fecha de inicio');
        } else {
            const diffDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
            if (diffDias > DIAS_MAX_AUSENCIA) {
                errors.push(`La duración de la ausencia no puede superar ${DIAS_MAX_AUSENCIA} días`);
            }
        }
    }

    if (empleado_afectado !== undefined && empleado_afectado !== null) {
        if (!Number.isInteger(Number(empleado_afectado)) || Number(empleado_afectado) <= 0) {
            errors.push('El empleado_afectado debe ser un número entero positivo');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Error de validación', errores: errors });
    }

    next();
};

const validateCambiarEstado = (req, res, next) => {
    const { estado } = req.body;

    if (!estado || estado.trim() === '') {
        return res.status(400).json({ message: 'El estado es obligatorio' });
    }

    if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({
            message: 'Estado no válido',
            errores: [`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`]
        });
    }

    // No permitir solicitudes de anulación vía PATCH (es automática)
    if (estado === 'anulada') {
        return res.status(400).json({
            message: 'La anulación es automática. No se puede anular manualmente una novedad.'
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

const validateParamEstado = (req, res, next) => {
    const { estado } = req.params;
    if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({
            message: 'Estado no válido en la URL',
            errores: [`Use uno de: ${ESTADOS_VALIDOS.join(', ')}`]
        });
    }
    next();
};

module.exports = {
    validateCreateNovedad,
    validateUpdateNovedad,
    validateCambiarEstado,
    validateParamId,
    validateParamEstado,
    ESTADOS_TERMINALES,
    DIAS_MAX_AUSENCIA
};
