const SMMLV = 1423500;

function validarNomina(body, esActualizacion = false) {
    const errores = [];
    const {
        empleado_id,
        fecha_inicio_periodo,
        fecha_fin_periodo,
        fecha_pago,
        dias_trabajados,
        salario_base,
        auxilio_transporte,
        total_horas_extras,
        deducciones,
        pago_neto,
    } = body;

    if (!esActualizacion) {
        if (!empleado_id)          errores.push('El empleado es obligatorio');
        if (!fecha_inicio_periodo) errores.push('La fecha de inicio del periodo es obligatoria');
        if (!fecha_fin_periodo)    errores.push('La fecha de fin del periodo es obligatoria');
        if (!fecha_pago)           errores.push('La fecha de pago es obligatoria');
        if (dias_trabajados === undefined || dias_trabajados === null)
            errores.push('Los días trabajados son obligatorios');
        if (!salario_base)         errores.push('El salario base es obligatorio');
        if (pago_neto === undefined || pago_neto === null)
            errores.push('El pago neto es obligatorio');
    }

    if (empleado_id !== undefined && (isNaN(empleado_id) || parseInt(empleado_id) < 1))
        errores.push('El ID del empleado no es válido');

    if (dias_trabajados !== undefined) {
        const d = parseInt(dias_trabajados);
        if (isNaN(d) || d < 0 || d > 7)
            errores.push('Los días trabajados deben estar entre 0 y 7');
    }

    if (salario_base !== undefined) {
        const s = parseFloat(salario_base);
        if (isNaN(s) || s < SMMLV)
            errores.push(`El salario base no puede ser menor al SMMLV ($${SMMLV.toLocaleString('es-CO')})`);
    }

    const numericos = { auxilio_transporte, total_horas_extras, deducciones, pago_neto };
    for (const [campo, valor] of Object.entries(numericos)) {
        if (valor !== undefined && (isNaN(parseFloat(valor)) || parseFloat(valor) < 0))
            errores.push(`El campo ${campo} debe ser un número mayor o igual a 0`);
    }

    if (fecha_inicio_periodo && fecha_fin_periodo) {
        if (new Date(fecha_fin_periodo) < new Date(fecha_inicio_periodo))
            errores.push('La fecha de fin no puede ser anterior a la fecha de inicio');
    }

    return errores;
}

module.exports = { validarNomina };
