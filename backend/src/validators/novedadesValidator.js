// validators/novedadesValidator.js

const ESTADOS_VALIDOS = ['registrada', 'aprobada', 'rechazada'];

const validateCreateNovedad = (req, res, next) => {
    const errors = [];
    const {
        titulo,
        descripcion_detallada,
        estado,
        fecha_registro,
        empleado_responsable,
        empleado_afectado
    } = req.body;

    // titulo
    if (!titulo || titulo.trim() === '') {
        errors.push('El título es obligatorio');
    } else if (titulo.trim().length < 3 || titulo.trim().length > 50) {
        errors.push('El título debe tener entre 3 y 50 caracteres');
    }

    // descripcion_detallada
    if (!descripcion_detallada || descripcion_detallada.trim() === '') {
        errors.push('La descripción detallada es obligatoria');
    }

    // estado (opcional en create, tiene defaultValue)
    if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
        errors.push('El estado debe ser: registrada, aprobada o rechazada');
    }

    // fecha_registro (opcional, tiene defaultValue NOW)
    if (fecha_registro !== undefined && isNaN(Date.parse(fecha_registro))) {
        errors.push('La fecha de registro debe ser una fecha válida');
    }

    // empleado_responsable (opcional)
    if (empleado_responsable !== undefined && empleado_responsable !== null) {
        if (!Number.isInteger(Number(empleado_responsable)) || Number(empleado_responsable) <= 0) {
            errors.push('El empleado_responsable debe ser un número entero positivo');
        }
    }

    // empleado_afectado (opcional)
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
    const { titulo, descripcion_detallada, empleado_responsable, empleado_afectado } = req.body;

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

    if (empleado_responsable !== undefined && empleado_responsable !== null) {
        if (!Number.isInteger(Number(empleado_responsable)) || Number(empleado_responsable) <= 0) {
            errors.push('El empleado_responsable debe ser un número entero positivo');
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
    validateParamEstado
};