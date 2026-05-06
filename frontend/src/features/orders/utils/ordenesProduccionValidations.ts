import type { EstadoOrden, TipoOrden } from '../services/ordenesproduccionservice';

export type FormCreate = {
  responsableId: string;
  tipoOrden: TipoOrden | '';
  fechaEntrega: string;
};

export type ProductoOrdenInput = {
  productoId: string;
  cantidad: string;
};

export type ProductoOrdenInputErrors = {
  productoId?: string;
  cantidad?: string;
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

const TRANSICIONES_PERMITIDAS: Record<EstadoOrden, EstadoOrden[]> = {
  'Pendiente':   ['En Proceso', 'Pausada'],
  'En Proceso':  ['Pausada', 'Finalizada'],
  'Pausada':     ['En Proceso'],
  'Finalizada':  [],
  'Anulada':     [],
};

const REGEX_TEXTO = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 .,;:\-()\\/°%&'"!?¿¡\n\r]*$/;
const CHARS_PROHIBIDOS_TEXTO  = /[<>{}|\\^`[\]]/g;
const CHARS_PROHIBIDOS_MOTIVO = /[<>{}|\\^`[\]]/g;

export function filtrarTextoLibre(valor: string): string {
  return valor.replace(CHARS_PROHIBIDOS_TEXTO, '');
}

export function filtrarSoloEnteros(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function filtrarMotivo(valor: string): string {
  return valor.replace(CHARS_PROHIBIDOS_MOTIVO, '');
}

export function validarCampoCrear<K extends keyof FormCreate>(
  campo: K,
  valor: string,
  _form?: FormCreate
): string | undefined {
  switch (campo) {
    case 'tipoOrden':
      if (!valor || (valor !== 'Pedido' && valor !== 'Venta'))
        return 'Debe seleccionar el tipo de orden';
      break;

    case 'responsableId':
      if (!valor) return 'Debe seleccionar un responsable';
      break;

    case 'fechaEntrega': {
      if (!valor) return 'La fecha de entrega es obligatoria';
      const fecha = new Date(valor);
      if (isNaN(fecha.getTime())) return 'Formato de fecha inválido';
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) return 'La fecha de entrega no puede ser una fecha pasada';
      const limiteMax = new Date(); limiteMax.setFullYear(limiteMax.getFullYear() + 5);
      if (fecha > limiteMax) return 'La fecha no puede ser mayor a 5 años en el futuro';
      break;
    }
  }
  return undefined;
}

export function validarProductoOrdenInput(input: ProductoOrdenInput): ProductoOrdenInputErrors {
  const errors: ProductoOrdenInputErrors = {};
  if (!input.productoId) {
    errors.productoId = 'Debe seleccionar un producto';
  }
  if (!input.cantidad) {
    errors.cantidad = 'La cantidad es obligatoria';
  } else if (!/^\d+$/.test(input.cantidad)) {
    errors.cantidad = 'Solo se permiten números enteros';
  } else {
    const n = parseInt(input.cantidad, 10);
    if (n <= 0) errors.cantidad = 'La cantidad debe ser mayor a 0';
    else if (n > 100000) errors.cantidad = 'No puede superar 100.000 unidades';
  }
  return errors;
}

export function validarCampoEditar<K extends keyof FormEdit>(
  campo: K,
  valor: string,
  estadoActual: EstadoOrden
): string | undefined {
  switch (campo) {
    case 'responsableId':
      if (!valor) return 'Debe seleccionar un responsable';
      break;

    case 'fechaEntrega': {
      if (!valor) return 'La fecha de entrega es obligatoria';
      const fecha = new Date(valor);
      if (isNaN(fecha.getTime())) return 'Formato de fecha inválido';
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) return 'La fecha de entrega no puede ser una fecha pasada';
      const limiteMax = new Date(); limiteMax.setFullYear(limiteMax.getFullYear() + 5);
      if (fecha > limiteMax) return 'La fecha no puede ser mayor a 5 años en el futuro';
      break;
    }

    case 'estado': {
      const nuevoEstado = valor as EstadoOrden;
      if (nuevoEstado !== estadoActual) {
        const permitidos = TRANSICIONES_PERMITIDAS[estadoActual] ?? [];
        if (!permitidos.includes(nuevoEstado)) {
          return (
            `No se puede pasar de "${estadoActual}" a "${nuevoEstado}". ` +
            (permitidos.length > 0
              ? `Permitidos: ${permitidos.join(', ')}`
              : 'Este estado es final y no admite cambios')
          );
        }
      }
      break;
    }

    case 'nota':
      if (valor && valor.trim().length > 1000)
        return `Las notas no pueden superar 1.000 caracteres (${valor.trim().length}/1000)`;
      if (valor && !REGEX_TEXTO.test(valor))
        return 'Las notas contienen caracteres no permitidos';
      break;
  }
  return undefined;
}

export function validarCrearOrden(form: FormCreate): CreateErrors {
  const errores: CreateErrors = {};
  const campos: (keyof FormCreate)[] = ['tipoOrden', 'responsableId', 'fechaEntrega'];
  campos.forEach(campo => {
    const err = validarCampoCrear(campo, form[campo] as string, form);
    if (err) errores[campo] = err;
  });
  return errores;
}

export function validarEditarOrden(form: FormEdit, estadoActual: EstadoOrden): EditErrors {
  const errores: EditErrors = {};
  const camposStr: (keyof FormEdit)[] = ['responsableId', 'fechaEntrega', 'nota'];
  camposStr.forEach(campo => {
    const err = validarCampoEditar(campo, form[campo] as string, estadoActual);
    if (err) errores[campo] = err;
  });
  const errEstado = validarCampoEditar('estado', form.estado, estadoActual);
  if (errEstado) errores.estado = errEstado;
  return errores;
}

export function validarCampoAnulacion(motivo: string): string | undefined {
  if (!motivo.trim()) return 'El motivo de anulación es obligatorio';
  if (motivo.trim().length < 10) return `El motivo debe tener al menos 10 caracteres (${motivo.trim().length}/10)`;
  if (motivo.trim().length > 500) return `El motivo no puede superar los 500 caracteres (${motivo.trim().length}/500)`;
  if (!REGEX_TEXTO.test(motivo)) return 'El motivo contiene caracteres no permitidos';
  return undefined;
}

export function validarAnulacion(motivo: string): AnularErrors {
  const errores: AnularErrors = {};
  const err = validarCampoAnulacion(motivo);
  if (err) errores.motivoAnulacion = err;
  return errores;
}

export function hayErrores(errores: object): boolean {
  return Object.keys(errores).length > 0;
}

export function estadosPermitidos(estadoActual: EstadoOrden): EstadoOrden[] {
  return TRANSICIONES_PERMITIDAS[estadoActual] ?? [];
}

export function contadorTexto(valor: string, limite: number): {
  actual: number;
  limite: number;
  porcentaje: number;
  enPeligro: boolean;
  excedido: boolean;
} {
  const actual = valor.trim().length;
  const porcentaje = Math.round((actual / limite) * 100);
  return {
    actual,
    limite,
    porcentaje,
    enPeligro: porcentaje >= 80,
    excedido: actual > limite,
  };
}