// ============================================================
//  Validaciones de negocio — Módulo Ficha Técnica
//  JRepuestos Medellín
// ============================================================

const ESTADOS_VALIDOS = ['Activa', 'Inactiva'];

// ── Expresiones regulares ──────────────────────────────────────────────────────

// Nombres de insumos: letras, números, tildes, ñ, espacios, guion, coma y punto
const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 \-.,()]+$/;

// Unidades: letras, números, /, ., espacio y símbolos métricos (ej: kg, m², cm/s)
const REGEX_UNIDAD = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 /.²³µ°]+$/;

// Descripciones de proceso: texto libre sin caracteres de inyección
const REGEX_DESCRIPCION = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 .,;:\-()\\/°%&'"!?¿¡]+$/;

// Duración: alfanumérico + unidades de tiempo y separadores básicos
const REGEX_DURACION = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 :.,\-/]+$/;

// Parámetro y valor de medida
const REGEX_PARAMETRO = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 .,;:\-()°²³µ%/]+$/;

// Notas: texto libre con saltos de línea, sin caracteres de inyección
const REGEX_NOTAS = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 .,;:\-()\\/°%&'"!?¿¡\n\r\t]+$/;

// ── Helpers internos ──────────────────────────────────────────────────────────

function validarNombreItem(val, etiqueta, errores, maxLen = 100) {
    if (!val || typeof val !== 'string' || val.trim() === '') {
        errores.push(`${etiqueta}: el nombre es obligatorio`);
        return;
    }
    const str = val.trim();
    if (str.length > maxLen) {
        errores.push(`${etiqueta}: el nombre no puede superar ${maxLen} caracteres (actualmente ${str.length})`);
    } else if (!REGEX_NOMBRE.test(str)) {
        errores.push(`${etiqueta}: el nombre solo permite letras, números, espacios, guion, coma y punto`);
    }
}

function validarUnidad(val, etiqueta, errores, maxLen = 30) {
    if (!val || typeof val !== 'string' || val.trim() === '') {
        errores.push(`${etiqueta}: la unidad es obligatoria`);
        return;
    }
    const str = val.trim();
    if (str.length > maxLen) {
        errores.push(`${etiqueta}: la unidad no puede superar ${maxLen} caracteres`);
    } else if (!REGEX_UNIDAD.test(str)) {
        errores.push(`${etiqueta}: la unidad solo permite letras, números, /, . y °`);
    }
}

function validarCantidadItem(val, etiqueta, errores) {
    if (val === undefined || val === null || isNaN(Number(val))) {
        errores.push(`${etiqueta}: la cantidad debe ser un número`);
        return;
    }
    const n = Number(val);
    if (n <= 0) {
        errores.push(`${etiqueta}: la cantidad debe ser mayor a 0`);
    }
    if (!isFinite(n)) {
        errores.push(`${etiqueta}: la cantidad debe ser un número finito`);
    }
}

// ── Validadores de secciones ──────────────────────────────────────────────────

/**
 * Valida un array de procesos.
 */
function validarProcesos(procesos, errores, obligatorio = true) {
    if (!Array.isArray(procesos) || procesos.length === 0) {
        if (obligatorio) errores.push('Debe incluir al menos un proceso de fabricación');
        return;
    }
    if (procesos.length > 30) {
        errores.push('No puede agregar más de 30 procesos por ficha');
    }
    procesos.forEach((p, i) => {
        const idx = `Proceso [${i + 1}]`;

        if (!p.description || typeof p.description !== 'string' || p.description.trim() === '') {
            errores.push(`${idx}: la descripción es obligatoria`);
        } else {
            const desc = p.description.trim();
            if (desc.length > 300) {
                errores.push(`${idx}: la descripción no puede superar 300 caracteres (actualmente ${desc.length})`);
            } else if (!REGEX_DESCRIPCION.test(desc)) {
                errores.push(`${idx}: la descripción contiene caracteres no permitidos`);
            }
        }

        if (!p.duration || typeof p.duration !== 'string' || p.duration.trim() === '') {
            errores.push(`${idx}: la duración es obligatoria (ej: "15 min", "2 horas")`);
        } else {
            const dur = p.duration.trim();
            if (dur.length > 50) {
                errores.push(`${idx}: la duración no puede superar 50 caracteres`);
            } else if (!REGEX_DURACION.test(dur)) {
                errores.push(`${idx}: la duración solo permite letras, números, espacios, :, ., , y -`);
            }
        }

        // Validar responsableId (obligatorio)
        if (!p.responsableId || !Number.isInteger(p.responsableId) || p.responsableId <= 0) {
            errores.push(`${idx}: el responsable es obligatorio`);
        }
    });
}

/**
 * Valida un array de medidas (opcional).
 * Esquema real: { parameter, value } — tolerance no se usa.
 */
function validarMedidas(medidas, errores) {
    if (!Array.isArray(medidas) || medidas.length === 0) return;
    if (medidas.length > 30) {
        errores.push('No puede agregar más de 30 medidas por ficha');
    }
    medidas.forEach((m, i) => {
        const idx = `Medida [${i + 1}]`;

        if (!m.parameter || typeof m.parameter !== 'string' || m.parameter.trim() === '') {
            errores.push(`${idx}: el parámetro es obligatorio`);
        } else {
            const param = m.parameter.trim();
            if (param.length > 100) {
                errores.push(`${idx}: el parámetro no puede superar 100 caracteres`);
            } else if (!REGEX_PARAMETRO.test(param)) {
                errores.push(`${idx}: el parámetro contiene caracteres no permitidos`);
            }
        }

        if (!m.value || typeof m.value !== 'string' || m.value.trim() === '') {
            errores.push(`${idx}: el valor es obligatorio`);
        } else {
            const val = m.value.trim();
            if (val.length > 100) {
                errores.push(`${idx}: el valor no puede superar 100 caracteres`);
            } else if (!REGEX_PARAMETRO.test(val)) {
                errores.push(`${idx}: el valor contiene caracteres no permitidos`);
            }
        }
    });
}

/**
 * Valida un array de insumos (obligatorio en creación, opcional en actualización).
 */
function validarInsumos(insumos, errores, obligatorio = false) {
    if (!Array.isArray(insumos) || insumos.length === 0) {
        if (obligatorio) errores.push('Debe incluir al menos un insumo');
        return;
    }
    if (insumos.length > 50) {
        errores.push('No puede agregar más de 50 insumos por ficha');
    }
    insumos.forEach((ins, i) => {
        const idx = `Insumo [${i + 1}]`;
        validarNombreItem(ins.name, idx, errores);
        validarCantidadItem(ins.quantity, idx, errores);
        validarUnidad(ins.unit, idx, errores);
    });
}

/**
 * Valida el campo notas (opcional).
 */
function validarNotas(notas, errores) {
    if (notas === undefined || notas === null || typeof notas !== 'string' || notas.trim() === '') return;
    const notasStr = notas.trim();
    if (notasStr.length > 1000) {
        errores.push(`Las notas no pueden superar 1.000 caracteres (actualmente ${notasStr.length})`);
    } else if (!REGEX_NOTAS.test(notasStr)) {
        errores.push('Las notas contienen caracteres no permitidos (evita <, >, {, }, |, \\, ^, `)');
    }
}

// ── Validadores principales ───────────────────────────────────────────────────

/**
 * Valida el body para CREAR una ficha técnica (POST).
 */
function validarCrearFichaTecnica(data) {
    const errores = [];
    const { productoId, procesos, medidas, insumos, notas } = data;

    // ── 1. productoId ──────────────────────────────────────────────────────────
    if (productoId === undefined || productoId === null || productoId === '') {
        errores.push('El productoId es obligatorio');
    } else if (!Number.isInteger(Number(productoId)) || Number(productoId) <= 0) {
        errores.push('El productoId debe ser un número entero positivo');
    }

    // ── 2. Procesos (obligatorio) ──────────────────────────────────────────────
    validarProcesos(procesos, errores, true);

    // ── 3. Medidas (opcional) ──────────────────────────────────────────────────
    if (medidas !== undefined && medidas !== null) {
        validarMedidas(medidas, errores);
    }

    // ── 4. Insumos (obligatorio) ───────────────────────────────────────────────
    validarInsumos(insumos, errores, true);

    // ── 5. Notas (opcional) ────────────────────────────────────────────────────
    validarNotas(notas, errores);

    return errores;
}

/**
 * Valida el body para ACTUALIZAR una ficha técnica (PUT).
 */
function validarActualizarFichaTecnica(data) {
    const errores = [];
    const { procesos, medidas, insumos, notas, estado } = data;

    // ── 1. Debe enviar al menos un campo ──────────────────────────────────────
    if (Object.keys(data).length === 0) {
        errores.push('Debe enviar al menos un campo para actualizar');
        return errores;
    }

    // ── 2. Procesos (si se envían) ─────────────────────────────────────────────
    if (procesos !== undefined) {
        validarProcesos(procesos, errores, true);
    }

    // ── 3. Medidas (si se envían) ──────────────────────────────────────────────
    if (medidas !== undefined && medidas !== null) {
        validarMedidas(medidas, errores);
    }

    // ── 4. Insumos (si se envían) ──────────────────────────────────────────────
    if (insumos !== undefined && insumos !== null) {
        validarInsumos(insumos, errores, true);
    }

    // ── 5. Notas (si se envían) ────────────────────────────────────────────────
    validarNotas(notas, errores);

    // ── 6. Estado (si se envía) ────────────────────────────────────────────────
    if (estado !== undefined) {
        if (!ESTADOS_VALIDOS.includes(estado)) {
            errores.push(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
        }
    }

    return errores;
}

// ── Middlewares Express ───────────────────────────────────────────────────────

function middlewareCrear(req, res, next) {
    const errores = validarCrearFichaTecnica(req.body);
    if (errores.length > 0) {
        return res.status(400).json({ message: 'Error de validación', errores });
    }
    next();
}

function middlewareActualizar(req, res, next) {
    const errores = validarActualizarFichaTecnica(req.body);
    if (errores.length > 0) {
        return res.status(400).json({ message: 'Error de validación', errores });
    }
    next();
}

module.exports = {
    validarCrearFichaTecnica,
    validarActualizarFichaTecnica,
    middlewareCrear,
    middlewareActualizar,
};