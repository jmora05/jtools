// ============================================================
//  Validaciones de negocio — Módulo Órdenes de Producción
//  JRepuestos Medellín
// ============================================================

const ESTADOS_VALIDOS = ['Pendiente', 'En Proceso', 'Pausada', 'Finalizada', 'Anulada'];
const TIPOS_VALIDOS   = ['Pedido', 'Venta'];

// Transiciones de estado permitidas (máquina de estados)
const TRANSICIONES_PERMITIDAS = {
  'Pendiente':  ['En Proceso', 'Pausada'],   // ✅ Anulada solo por /anular
  'En Proceso': ['Pausada', 'Finalizada'],   // ✅ Anulada solo por /anular
  'Pausada':    ['En Proceso'],              // ✅ Anulada solo por /anular
  'Finalizada': [],
  'Anulada':    [],
};

// ── Expresiones regulares ──────────────────────────────────────────────────────
// Texto general: letras, números, tildes, ñ, espacios y puntuación básica
const REGEX_TEXTO_GENERAL = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑüÜ0-9 .,;:\-()\\/°%&'"]+$/;

// Motivo de anulación: igual que texto general + signos de pregunta/exclamación y saltos de línea
const REGEX_MOTIVO = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑüÜ0-9 .,;:\-()\\/°%&'"!?¿¡\n\r]+$/;

// ── Helpers ────────────────────────────────────────────────────────────────────
function esEnteroPositivo(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0;
}

/**
 * Valida una fecha de entrega: no puede ser pasada ni más de 5 años en el futuro.
 */
function validarFechaEntrega(fechaStr, errores, campo = 'La fecha de entrega') {
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) {
    errores.push(`${campo} no tiene un formato válido (YYYY-MM-DD)`);
    return;
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha < hoy) {
    errores.push(`${campo} no puede ser una fecha pasada`);
  }
  const limiteMax = new Date();
  limiteMax.setFullYear(limiteMax.getFullYear() + 5);
  if (fecha > limiteMax) {
    errores.push(`${campo} no puede ser mayor a 5 años en el futuro`);
  }
}

/**
 * Valida el campo nota/texto libre.
 */
function validarNota(nota, errores) {
  if (nota === undefined || nota === null || String(nota).trim() === '') return;
  const notaStr = String(nota).trim();
  if (notaStr.length > 1000) {
    errores.push('Las notas no pueden superar los 1.000 caracteres');
  } else if (!REGEX_TEXTO_GENERAL.test(notaStr)) {
    errores.push('Las notas contienen caracteres no permitidos (evita <, >, {, }, |, \\, ^, `)');
  }
}

// ── Validadores principales ────────────────────────────────────────────────────

/**
 * Valida los campos para CREAR una orden de producción (POST).
 */
function validarCrearOrden(data) {
  const errores = [];
  const { productoId, cantidad, responsableId, tipoOrden, fechaEntrega, nota, pedidoId } = data;

  // ── 1. Campos obligatorios ─────────────────────────────────────────────────
  if (!tipoOrden)                                                    errores.push('El tipo de orden es obligatorio (Pedido o Venta)');
  if (!productoId && productoId !== 0)                               errores.push('El producto es obligatorio');
  if (cantidad === undefined || cantidad === null || cantidad === '') errores.push('La cantidad es obligatoria');
  if (!responsableId && responsableId !== 0)                         errores.push('El responsable es obligatorio');
  if (!fechaEntrega)                                                 errores.push('La fecha de entrega es obligatoria');

  if (errores.length > 0) return errores;

  // ── 2. tipoOrden ───────────────────────────────────────────────────────────
  if (!TIPOS_VALIDOS.includes(tipoOrden)) {
    errores.push(`El tipo de orden debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`);
  }

  // ── 3. productoId ──────────────────────────────────────────────────────────
  if (!esEnteroPositivo(productoId)) {
    errores.push('El productoId debe ser un número entero positivo');
  }

  // ── 4. Cantidad ────────────────────────────────────────────────────────────
  const cant = Number(cantidad);
  if (!Number.isInteger(cant) || cant <= 0) {
    errores.push('La cantidad debe ser un número entero mayor a 0 (sin decimales)');
  } else if (cant > 100000) {
    errores.push('La cantidad no puede superar las 100.000 unidades por orden');
  }

  // ── 5. responsableId ───────────────────────────────────────────────────────
  if (!esEnteroPositivo(responsableId)) {
    errores.push('El responsableId debe ser un número entero positivo');
  }

  // ── 6. pedidoId — opcional en ambos tipos de orden ────────────────────────
  if (pedidoId !== undefined && pedidoId !== null && pedidoId !== '') {
    if (!esEnteroPositivo(pedidoId)) {
      errores.push('El pedidoId debe ser un número entero positivo');
    }
  }

  // ── 7. Fecha de entrega ────────────────────────────────────────────────────
  validarFechaEntrega(fechaEntrega, errores);

  // ── 8. Nota (opcional) ─────────────────────────────────────────────────────
  validarNota(nota, errores);

  return errores;
}

/**
 * Valida los campos para ACTUALIZAR una orden de producción (PUT).
 * Solo permite cambiar: responsableId, fechaEntrega, nota, estado.
 * El estado 'Anulada' está bloqueado aquí — usar endpoint /anular.
 */
function validarActualizarOrden(data, estadoActual) {
  const errores = [];
  const { responsableId, fechaEntrega, nota, estado } = data;

  // ── 1. Órdenes terminales no se pueden modificar ───────────────────────────
  if (estadoActual === 'Anulada') {
    errores.push('No se puede modificar una orden anulada');
    return errores;
  }
  if (estadoActual === 'Finalizada') {
    errores.push('No se puede modificar una orden finalizada');
    return errores;
  }

  // ── 2. Debe enviar al menos un campo ──────────────────────────────────────
  const camposEnviados = [responsableId, fechaEntrega, nota, estado].filter(
    v => v !== undefined
  );
  if (camposEnviados.length === 0) {
    errores.push('Debe enviar al menos un campo para actualizar');
    return errores;
  }

  // ── 3. responsableId (si se envía) ────────────────────────────────────────
  if (responsableId !== undefined && responsableId !== '') {
    if (!esEnteroPositivo(responsableId)) {
      errores.push('El responsableId debe ser un número entero positivo');
    }
  }

  // ── 4. Fecha de entrega (si se envía) ─────────────────────────────────────
  if (fechaEntrega) {
    validarFechaEntrega(fechaEntrega, errores);
  }

  // ── 5. Estado (si se envía) ───────────────────────────────────────────────
  if (estado !== undefined) {
    // ✅ Anulada no se permite por esta ruta
    if (estado === 'Anulada') {
      errores.push('Para anular una orden usa el endpoint PUT /ordenes-produccion/:id/anular');
    } else if (!ESTADOS_VALIDOS.includes(estado)) {
      errores.push(`Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`);
    } else if (estado !== estadoActual) {
      const transicionesPermitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
      if (!transicionesPermitidas.includes(estado)) {
        errores.push(
          `No se puede cambiar el estado de "${estadoActual}" a "${estado}". ` +
          `Transiciones permitidas: ${transicionesPermitidas.join(', ') || 'ninguna'}`
        );
      }
    }
  }

  // ── 6. Nota (si se envía) ─────────────────────────────────────────────────
  validarNota(nota, errores);

  return errores;
}

/**
 * Valida los datos para ANULAR una orden (PUT /anular).
 */
function validarAnularOrden(data, estadoActual) {
  const errores = [];
  const { motivoAnulacion } = data;

  if (estadoActual === 'Anulada') {
    errores.push('La orden ya está anulada');
    return errores;
  }
  if (estadoActual === 'Finalizada') {
    errores.push('No se puede anular una orden finalizada');
    return errores;
  }

  // ✅ motivoAnulacion es obligatorio y con validación de contenido
  if (!motivoAnulacion || String(motivoAnulacion).trim() === '') {
    errores.push('El motivo de anulación es obligatorio');
  } else {
    const motivo = String(motivoAnulacion).trim();
    if (motivo.length < 10) {
      errores.push('El motivo de anulación debe tener al menos 10 caracteres');
    } else if (motivo.length > 500) {
      errores.push('El motivo de anulación no puede superar los 500 caracteres');
    } else if (!REGEX_MOTIVO.test(motivo)) {
      errores.push('El motivo contiene caracteres no permitidos (evita <, >, {, }, |, \\, ^, `)');
    }
  }

  return errores;
}

module.exports = {
  validarCrearOrden,
  validarActualizarOrden,
  validarAnularOrden,
};