// ============================================================
//  Validaciones frontend — Módulo Órdenes de Producción
//  JRepuestos Medellín
// ============================================================

import type { EstadoOrden } from '../services/ordenesproduccionservice';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FormCreate = {
  productoId: string;
  cantidad: string;
  responsableId: string;
  pedidoId: string;
  fechaEntrega: string;
  nota: string;
};

export type FormEdit = {
  responsableId: string;
  fechaEntrega: string;
  nota: string;
  estado: EstadoOrden;
};

export type CreateErrors = Partial<Record<keyof FormCreate, string>>;
export type EditErrors   = Partial<Record<keyof FormEdit, string>>;
export type AnularErrors = { motivoAnulacion?: string };

// Transiciones de estado válidas (espejo del backend)
const TRANSICIONES_PERMITIDAS: Record<EstadoOrden, EstadoOrden[]> = {
  'Pendiente':   ['En Proceso', 'Pausada'],
  'En Proceso':  ['Pausada', 'Finalizada'],
  'Pausada':     ['En Proceso'],
  'Finalizada':  [],
  'Anulada':     [],
};

// ─── Validación: formulario de creación ───────────────────────────────────────

export function validarCrearOrden(form: FormCreate): CreateErrors {
  const errores: CreateErrors = {};

  // Producto
  if (!form.productoId) {
    errores.productoId = 'Debe seleccionar un producto';
  }

  // Cantidad
  if (!form.cantidad) {
    errores.cantidad = 'La cantidad es obligatoria';
  } else {
    const cant = Number(form.cantidad);
    if (!Number.isInteger(cant) || cant <= 0) {
      errores.cantidad = 'La cantidad debe ser un número entero mayor a 0';
    } else if (cant > 100000) {
      errores.cantidad = 'La cantidad no puede superar las 100.000 unidades';
    }
  }

  // Responsable
  if (!form.responsableId) {
    errores.responsableId = 'Debe seleccionar un responsable';
  }

  // Fecha de entrega
  if (!form.fechaEntrega) {
    errores.fechaEntrega = 'La fecha de entrega es obligatoria';
  } else {
    const fecha = new Date(form.fechaEntrega);
    if (isNaN(fecha.getTime())) {
      errores.fechaEntrega = 'Formato de fecha inválido';
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        errores.fechaEntrega = 'La fecha de entrega no puede ser una fecha pasada';
      } else {
        const limiteMax = new Date();
        limiteMax.setFullYear(limiteMax.getFullYear() + 5);
        if (fecha > limiteMax) {
          errores.fechaEntrega = 'La fecha no puede ser mayor a 5 años en el futuro';
        }
      }
    }
  }

  // pedidoId (opcional — solo validar si se ingresó algo)
  if (form.pedidoId && (isNaN(Number(form.pedidoId)) || Number(form.pedidoId) <= 0)) {
    errores.pedidoId = 'El ID de pedido debe ser un número válido';
  }

  // Nota (opcional, límite)
  if (form.nota && form.nota.trim().length > 1000) {
    errores.nota = 'Las notas no pueden superar los 1000 caracteres';
  }

  return errores;
}

// ─── Validación: formulario de edición ───────────────────────────────────────

export function validarEditarOrden(form: FormEdit, estadoActual: EstadoOrden): EditErrors {
  const errores: EditErrors = {};

  // Responsable
  if (!form.responsableId) {
    errores.responsableId = 'Debe seleccionar un responsable';
  }

  // Fecha de entrega
  if (!form.fechaEntrega) {
    errores.fechaEntrega = 'La fecha de entrega es obligatoria';
  } else {
    const fecha = new Date(form.fechaEntrega);
    if (isNaN(fecha.getTime())) {
      errores.fechaEntrega = 'Formato de fecha inválido';
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        errores.fechaEntrega = 'La fecha de entrega no puede ser una fecha pasada';
      } else {
        const limiteMax = new Date();
        limiteMax.setFullYear(limiteMax.getFullYear() + 5);
        if (fecha > limiteMax) {
          errores.fechaEntrega = 'La fecha no puede ser mayor a 5 años en el futuro';
        }
      }
    }
  }

  // Transición de estado
  if (form.estado !== estadoActual) {
    const permitidos = TRANSICIONES_PERMITIDAS[estadoActual] ?? [];
    if (!permitidos.includes(form.estado)) {
      errores.estado =
        `No se puede pasar de "${estadoActual}" a "${form.estado}". ` +
        (permitidos.length > 0
          ? `Permitidos: ${permitidos.join(', ')}`
          : 'Este estado es final y no admite cambios');
    }
  }

  // Nota (opcional, límite)
  if (form.nota && form.nota.trim().length > 1000) {
    errores.nota = 'Las notas no pueden superar los 1000 caracteres';
  }

  return errores;
}

// ─── Validación: motivo de anulación ─────────────────────────────────────────

export function validarAnulacion(motivo: string): AnularErrors {
  const errores: AnularErrors = {};

  if (!motivo.trim()) {
    errores.motivoAnulacion = 'El motivo de anulación es obligatorio';
  } else if (motivo.trim().length < 10) {
    errores.motivoAnulacion = 'El motivo debe tener al menos 10 caracteres';
  } else if (motivo.trim().length > 500) {
    errores.motivoAnulacion = 'El motivo no puede superar los 500 caracteres';
  }

  return errores;
}

// ─── Utilidad ─────────────────────────────────────────────────────────────────

export function hayErrores(errores: object): boolean {
  return Object.keys(errores).length > 0;
}

/** Estados a los que puede pasar una orden desde su estado actual */
export function estadosPermitidos(estadoActual: EstadoOrden): EstadoOrden[] {
  return TRANSICIONES_PERMITIDAS[estadoActual] ?? [];
}