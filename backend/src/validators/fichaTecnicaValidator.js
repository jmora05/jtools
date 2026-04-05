// ============================================================
//  Validaciones de negocio — Módulo Ficha Técnica
//  JRepuestos Medellín
// ============================================================

const ESTADOS_VALIDOS = ['Activa', 'Inactiva'];

// ── Helpers internos ──────────────────────────────────────────────────────────

/**
 * Valida un array de materiales.
 * Reglas: cada item debe tener name (string no vacío), quantity (> 0), unit (string no vacío).
 */
function validarMateriales(materiales, errores, obligatorio = true) {
  if (!Array.isArray(materiales) || materiales.length === 0) {
    if (obligatorio) errores.push('Debe incluir al menos un material');
    return;
  }
  materiales.forEach((m, i) => {
    const idx = `Material [${i + 1}]`;
    if (!m.name || typeof m.name !== 'string' || m.name.trim() === '') {
      errores.push(`${idx}: el nombre es obligatorio`);
    } else if (m.name.trim().length > 100) {
      errores.push(`${idx}: el nombre no puede superar 100 caracteres`);
    }
    if (m.quantity === undefined || m.quantity === null || isNaN(Number(m.quantity))) {
      errores.push(`${idx}: la cantidad debe ser un número`);
    } else if (Number(m.quantity) <= 0) {
      errores.push(`${idx}: la cantidad debe ser mayor a 0`);
    }
    if (!m.unit || typeof m.unit !== 'string' || m.unit.trim() === '') {
      errores.push(`${idx}: la unidad es obligatoria`);
    } else if (m.unit.trim().length > 30) {
      errores.push(`${idx}: la unidad no puede superar 30 caracteres`);
    }
  });
}

/**
 * Valida un array de procesos.
 * Reglas: cada item debe tener description (string no vacío) y duration (string no vacío).
 */
function validarProcesos(procesos, errores, obligatorio = true) {
  if (!Array.isArray(procesos) || procesos.length === 0) {
    if (obligatorio) errores.push('Debe incluir al menos un proceso de fabricación');
    return;
  }
  procesos.forEach((p, i) => {
    const idx = `Proceso [${i + 1}]`;
    if (!p.description || typeof p.description !== 'string' || p.description.trim() === '') {
      errores.push(`${idx}: la descripción es obligatoria`);
    } else if (p.description.trim().length > 300) {
      errores.push(`${idx}: la descripción no puede superar 300 caracteres`);
    }
    if (!p.duration || typeof p.duration !== 'string' || p.duration.trim() === '') {
      errores.push(`${idx}: la duración es obligatoria (ej: "15 min", "2 horas")`);
    } else if (p.duration.trim().length > 50) {
      errores.push(`${idx}: la duración no puede superar 50 caracteres`);
    }
  });
}

/**
 * Valida un array de medidas (opcional).
 * Reglas: cada item debe tener parameter (string no vacío) y value (string no vacío).
 * El campo tolerance ha sido eliminado.
 */
function validarMedidas(medidas, errores) {
  if (!Array.isArray(medidas) || medidas.length === 0) return; // es opcional
  medidas.forEach((m, i) => {
    const idx = `Medida [${i + 1}]`;
    if (!m.parameter || typeof m.parameter !== 'string' || m.parameter.trim() === '') {
      errores.push(`${idx}: el parámetro es obligatorio`);
    } else if (m.parameter.trim().length > 100) {
      errores.push(`${idx}: el parámetro no puede superar 100 caracteres`);
    }
    if (!m.value || typeof m.value !== 'string' || m.value.trim() === '') {
      errores.push(`${idx}: el valor es obligatorio`);
    } else if (m.value.trim().length > 100) {
      errores.push(`${idx}: el valor no puede superar 100 caracteres`);
    }
  });
}

/**
 * Valida un array de insumos (opcional).
 * Mismas reglas que materiales.
 */
function validarInsumos(insumos, errores) {
  if (!Array.isArray(insumos) || insumos.length === 0) return; // es opcional
  insumos.forEach((ins, i) => {
    const idx = `Insumo [${i + 1}]`;
    if (!ins.name || typeof ins.name !== 'string' || ins.name.trim() === '') {
      errores.push(`${idx}: el nombre es obligatorio`);
    } else if (ins.name.trim().length > 100) {
      errores.push(`${idx}: el nombre no puede superar 100 caracteres`);
    }
    if (ins.quantity === undefined || ins.quantity === null || isNaN(Number(ins.quantity))) {
      errores.push(`${idx}: la cantidad debe ser un número`);
    } else if (Number(ins.quantity) <= 0) {
      errores.push(`${idx}: la cantidad debe ser mayor a 0`);
    }
    if (!ins.unit || typeof ins.unit !== 'string' || ins.unit.trim() === '') {
      errores.push(`${idx}: la unidad es obligatoria`);
    } else if (ins.unit.trim().length > 30) {
      errores.push(`${idx}: la unidad no puede superar 30 caracteres`);
    }
  });
}

// ── Validadores principales ───────────────────────────────────────────────────

/**
 * Valida el body para CREAR una ficha técnica (POST).
 * @param {object} data - req.body
 * @returns {string[]} Array de mensajes de error. Vacío = sin errores.
 */
function validarCrearFichaTecnica(data) {
  const errores = [];
  const { productoId, materiales, procesos, medidas, insumos, notas } = data;

  // ── 1. productoId ──────────────────────────────────────────────────────────
  if (productoId === undefined || productoId === null || productoId === '') {
    errores.push('El productoId es obligatorio');
  } else if (!Number.isInteger(Number(productoId)) || Number(productoId) <= 0) {
    errores.push('El productoId debe ser un número entero positivo');
  }

  // ── 2. Materiales (obligatorio) ────────────────────────────────────────────
  validarMateriales(materiales, errores, true);

  // ── 3. Procesos (obligatorio) ──────────────────────────────────────────────
  validarProcesos(procesos, errores, true);

  // ── 4. Medidas (opcional) ──────────────────────────────────────────────────
  if (medidas !== undefined && medidas !== null) {
    validarMedidas(medidas, errores);
  }

  // ── 5. Insumos (opcional) ──────────────────────────────────────────────────
  if (insumos !== undefined && insumos !== null) {
    validarInsumos(insumos, errores);
  }

  // ── 6. Notas (opcional) ───────────────────────────────────────────────────
  if (notas !== undefined && notas !== null && typeof notas === 'string' && notas.length > 1000) {
    errores.push('Las notas no pueden superar 1000 caracteres');
  }

  return errores;
}

/**
 * Valida el body para ACTUALIZAR una ficha técnica (PUT).
 * Todos los campos son opcionales, pero si se envían deben ser válidos.
 * @param {object} data - req.body
 * @returns {string[]} Array de mensajes de error. Vacío = sin errores.
 */
function validarActualizarFichaTecnica(data) {
  const errores = [];
  const { materiales, procesos, medidas, insumos, notas, estado } = data;

  if (Object.keys(data).length === 0) {
    errores.push('Debe enviar al menos un campo para actualizar');
    return errores;
  }

  // ── 1. Materiales (si se envían) ───────────────────────────────────────────
  if (materiales !== undefined) {
    validarMateriales(materiales, errores, true);
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
    validarInsumos(insumos, errores);
  }

  // ── 5. Notas (si se envían) ────────────────────────────────────────────────
  if (notas !== undefined && notas !== null && typeof notas === 'string' && notas.length > 1000) {
    errores.push('Las notas no pueden superar 1000 caracteres');
  }

  // ── 6. Estado (si se envía) ────────────────────────────────────────────────
  if (estado !== undefined) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      errores.push(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
    }
  }

  return errores;
}

// ── Middlewares Express ───────────────────────────────────────────────────────

/**
 * Middleware para validar POST /fichas-tecnicas
 */
function middlewareCrear(req, res, next) {
  const errores = validarCrearFichaTecnica(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ message: 'Error de validación', errores });
  }
  next();
}

/**
 * Middleware para validar PUT /fichas-tecnicas/:id
 */
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