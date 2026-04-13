
// validators/pedidosValidator.js
 
const validateCreatePedido = (req, res, next) => {
    const errors = [];
    const {
        clienteId,
        fecha_pedido,
        total,
        direccion,
        ciudad,
        instrucciones_entrega,
        notas_observaciones
    } = req.body;
 
    // clienteId
    if (!clienteId) {
        errors.push('El cliente es obligatorio');
    } else if (!Number.isInteger(Number(clienteId)) || Number(clienteId) <= 0) {
        errors.push('El clienteId debe ser un número entero positivo');
    }
 
    // fecha_pedido
    if (!fecha_pedido) {
        errors.push('La fecha del pedido es obligatoria');
    } else if (isNaN(Date.parse(fecha_pedido))) {
        errors.push('La fecha del pedido debe ser una fecha válida');
    }
 
    // total
    if (total === undefined || total === null || total === '') {
        errors.push('El total es obligatorio');
    } else if (isNaN(Number(total))) {
        errors.push('El total debe ser un número válido');
    } else if (Number(total) < 0) {
        errors.push('El total no puede ser negativo');
    }
 
    // direccion
    if (!direccion || direccion.trim() === '') {
        errors.push('La dirección no puede estar vacía');
    } else if (direccion.trim().length < 5 || direccion.trim().length > 150) {
        errors.push('La dirección debe tener entre 5 y 150 caracteres');
    }
 
    // ciudad
    if (!ciudad || ciudad.trim() === '') {
        errors.push('La ciudad no puede estar vacía');
    } else if (ciudad.trim().length < 2 || ciudad.trim().length > 100) {
        errors.push('La ciudad debe tener entre 2 y 100 caracteres');
    }
 
    // instrucciones_entrega (opcional)
    if (instrucciones_entrega && instrucciones_entrega.length > 500) {
        errors.push('Las instrucciones no pueden superar 500 caracteres');
    }
 
    // notas_observaciones (opcional)
    if (notas_observaciones && notas_observaciones.length > 500) {
        errors.push('Las notas no pueden superar 500 caracteres');
    }
 
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Error de validación', errores: errors });
    }
 
    next();
};
 
const validateUpdatePedido = (req, res, next) => {
    const errors = [];
    const {
        clienteId,
        fecha_pedido,
        total,
        direccion,
        ciudad,
        instrucciones_entrega,
        notas_observaciones
    } = req.body;
 
    // Validar solo los campos que llegan (update parcial)
 
    if (clienteId !== undefined) {
        if (!Number.isInteger(Number(clienteId)) || Number(clienteId) <= 0) {
            errors.push('El clienteId debe ser un número entero positivo');
        }
    }
 
    if (fecha_pedido !== undefined) {
        if (!fecha_pedido || isNaN(Date.parse(fecha_pedido))) {
            errors.push('La fecha del pedido debe ser una fecha válida');
        }
    }
 
    if (total !== undefined) {
        if (total === null || total === '') {
            errors.push('El total no puede estar vacío');
        } else if (isNaN(Number(total))) {
            errors.push('El total debe ser un número válido');
        } else if (Number(total) < 0) {
            errors.push('El total no puede ser negativo');
        }
    }
 
    if (direccion !== undefined) {
        if (!direccion || direccion.trim() === '') {
            errors.push('La dirección no puede estar vacía');
        } else if (direccion.trim().length < 5 || direccion.trim().length > 150) {
            errors.push('La dirección debe tener entre 5 y 150 caracteres');
        }
    }
 
    if (ciudad !== undefined) {
        if (!ciudad || ciudad.trim() === '') {
            errors.push('La ciudad no puede estar vacía');
        } else if (ciudad.trim().length < 2 || ciudad.trim().length > 100) {
            errors.push('La ciudad debe tener entre 2 y 100 caracteres');
        }
    }
 
    if (instrucciones_entrega !== undefined && instrucciones_entrega.length > 500) {
        errors.push('Las instrucciones no pueden superar 500 caracteres');
    }
 
    if (notas_observaciones !== undefined && notas_observaciones.length > 500) {
        errors.push('Las notas no pueden superar 500 caracteres');
    }
 
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Error de validación', errores: errors });
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
    validateCreatePedido,
    validateUpdatePedido,
    validateParamId
};