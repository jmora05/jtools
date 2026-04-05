// ============================================================
//  Validaciones de negocio — Módulo Órdenes de Producción
//  JRepuestos Medellín
// ============================================================

const ESTADOS_VALIDOS = ['Pendiente', 'En Proceso', 'Pausada', 'Finalizada', 'Anulada'];

// Transiciones de estado permitidas
// Una orden solo puede avanzar o retroceder según este mapa
const TRANSICIONES_PERMITIDAS = {
  'Pendiente':   ['En Proceso', 'Pausada', 'Anulada'],
  'En Proceso':  ['Pausada', 'Finalizada', 'Anulada'],
  'Pausada':     ['En Proceso', 'Anulada'],
  'Finalizada':  [],   // estado final — no se puede cambiar
  'Anulada':     [],   // estado final — no se puede cambiar
};

/**
 * Valida los campos para CREAR una orden de producción.
 * @param {object} data - req.body
 * @returns {string[]} Array de errores. Vacío = válido.
 */
function validarCrearOrden(data) {
  const errores = [];
  const { productoId, cantidad, responsableId, fechaEntrega, nota } = data;

  // ── 1. Campos obligatorios ─────────────────────────────────────────
  if (!productoId) errores.push('El producto es obligatorio');
  if (!cantidad && cantidad !== 0) errores.push('La cantidad es obligatoria');
  if (!responsableId) errores.push('El responsable es obligatorio');
  if (!fechaEntrega) errores.push('La fecha de entrega es obligatoria');

  if (errores.length > 0) return errores;

  // ── 2. productoId ──────────────────────────────────────────────────
  if (!Number.isInteger(Number(productoId)) || Number(productoId) <= 0) {
    errores.push('El productoId debe ser un número entero positivo');
  }

  // ── 3. Cantidad ────────────────────────────────────────────────────
  const cant = Number(cantidad);
  if (!Number.isInteger(cant) || cant <= 0) {
    errores.push('La cantidad debe ser un número entero mayor a 0');
  } else if (cant > 100000) {
    errores.push('La cantidad no puede superar las 100.000 unidades por orden');
  }

  // ── 4. responsableId ───────────────────────────────────────────────
  if (!Number.isInteger(Number(responsableId)) || Number(responsableId) <= 0) {
    errores.push('El responsableId debe ser un número entero positivo');
  }

  // ── 5. pedidoId (opcional) ─────────────────────────────────────────
  if (data.pedidoId !== undefined && data.pedidoId !== null && data.pedidoId !== '') {
    if (!Number.isInteger(Number(data.pedidoId)) || Number(data.pedidoId) <= 0) {
      errores.push('El pedidoId debe ser un número entero positivo');
    }
  }

  // ── 6. Fecha de entrega ────────────────────────────────────────────
  if (fechaEntrega) {
    const fecha = new Date(fechaEntrega);
    if (isNaN(fecha.getTime())) {
      errores.push('La fecha de entrega no tiene un formato válido (YYYY-MM-DD)');
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        errores.push('La fecha de entrega no puede ser una fecha pasada');
      }
      // No puede ser más de 5 años en el futuro
      const limiteMax = new Date();
      limiteMax.setFullYear(limiteMax.getFullYear() + 5);
      if (fecha > limiteMax) {
        errores.push('La fecha de entrega no puede ser mayor a 5 años en el futuro');
      }
    }
  }

  // ── 7. Nota (opcional, límite de longitud) ─────────────────────────
  if (nota && String(nota).trim().length > 1000) {
    errores.push('Las notas no pueden superar los 1000 caracteres');
  }

  return errores;
}

/**
 * Valida los campos para ACTUALIZAR una orden de producción.
 * @param {object} data       - req.body
 * @param {string} estadoActual - Estado actual de la orden en BD
 * @returns {string[]} Array de errores. Vacío = válido.
 */
function validarActualizarOrden(data, estadoActual) {
  const errores = [];
  const { responsableId, fechaEntrega, nota, estado } = data;

  // ── 1. No se puede modificar una orden Anulada o Finalizada ────────
  if (estadoActual === 'Anulada') {
    errores.push('No se puede modificar una orden anulada');
    return errores;
  }
  if (estadoActual === 'Finalizada') {
    errores.push('No se puede modificar una orden finalizada');
    return errores;
  }

  // ── 2. responsableId (si se envía) ─────────────────────────────────
  if (responsableId !== undefined && responsableId !== '') {
    if (!Number.isInteger(Number(responsableId)) || Number(responsableId) <= 0) {
      errores.push('El responsableId debe ser un número entero positivo');
    }
  }

  // ── 3. Fecha de entrega (si se envía) ──────────────────────────────
  if (fechaEntrega) {
    const fecha = new Date(fechaEntrega);
    if (isNaN(fecha.getTime())) {
      errores.push('La fecha de entrega no tiene un formato válido (YYYY-MM-DD)');
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        errores.push('La fecha de entrega no puede ser una fecha pasada');
      }
      const limiteMax = new Date();
      limiteMax.setFullYear(limiteMax.getFullYear() + 5);
      if (fecha > limiteMax) {
        errores.push('La fecha de entrega no puede ser mayor a 5 años en el futuro');
      }
    }
  }

  // ── 4. Estado (si se envía) ────────────────────────────────────────
  if (estado !== undefined) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
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

  // ── 5. Nota (si se envía) ──────────────────────────────────────────
  if (nota && String(nota).trim().length > 1000) {
    errores.push('Las notas no pueden superar los 1000 caracteres');
  }

  return errores;
}

/**
 * Valida los datos para ANULAR una orden.
 * @param {object} data       - req.body
 * @param {string} estadoActual - Estado actual de la orden en BD
 * @returns {string[]} Array de errores. Vacío = válido.
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

  if (!motivoAnulacion || String(motivoAnulacion).trim() === '') {
    errores.push('El motivo de anulación es obligatorio');
  } else if (String(motivoAnulacion).trim().length < 10) {
    errores.push('El motivo de anulación debe tener al menos 10 caracteres');
  } else if (String(motivoAnulacion).trim().length > 500) {
    errores.push('El motivo de anulación no puede superar los 500 caracteres');
  }

  return errores;
}

module.exports = {
  validarCrearOrden,
  validarActualizarOrden,
  validarAnularOrden,
};