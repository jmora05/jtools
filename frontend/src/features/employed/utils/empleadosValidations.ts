// ============================================================
//  Validaciones frontend — Módulo Empleados
//  JRepuestos Medellín
// ============================================================

export type FormState = {
  tipoDocumento: 'CC' | 'CE' | 'Pasaporte';
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  cargo: string;
  area: string;
  direccion: string;
  ciudad: string;
  fechaIngreso: string;
  estado: 'activo' | 'inactivo';
};

/** Mapa de campo → mensaje de error */
export type FormErrors = Partial<Record<keyof FormState, string>>;

// ─── Regex compartidas ────────────────────────────────────────────────────
const SOLO_LETRAS    = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/;
const SOLO_DIGITOS   = /^\d+$/;
const ALFANUM        = /^[a-zA-Z0-9]+$/;
const REGEX_EMAIL    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[+]?[\d\s\-(). ]{7,20}$/;

// ─── Sanitizadores en tiempo real ────────────────────────────────────────

/**
 * Filtra caracteres inválidos para nombres y apellidos.
 * Bloquea números y caracteres especiales (excepto ' y -).
 * Capitaliza automáticamente la primera letra de cada palabra.
 */
export function sanitizarNombre(valor: string): string {
  const limpio = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]/g, '');
  return limpio.replace(/(^|\s)([a-záéíóúñü])/g, (_, sep, letra) => sep + letra.toUpperCase());
}

/**
 * Filtra el número de documento según el tipo:
 * - CC / CE: solo dígitos, sin espacios
 * - Pasaporte: alfanumérico en mayúsculas
 */
export function sanitizarDocumento(valor: string, tipo: FormState['tipoDocumento']): string {
  if (tipo === 'CC' || tipo === 'CE') {
    return valor.replace(/\D/g, '');
  }
  return valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Filtra el teléfono: solo dígitos, +, espacios, guiones y paréntesis.
 */
export function sanitizarTelefono(valor: string): string {
  return valor.replace(/[^\d+\s\-(). ]/g, '');
}

/**
 * Filtra ciudad: solo letras y espacios (sin números ni especiales).
 * Capitaliza la primera letra de cada palabra.
 */
export function sanitizarCiudad(valor: string): string {
  const limpio = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]/g, '');
  return limpio.replace(/(^|\s)([a-záéíóúñü])/g, (_, sep, letra) => sep + letra.toUpperCase());
}

// ─── Validación campo por campo (tiempo real) ─────────────────────────────

/** Valida un campo individual. Retorna string con el error o '' si es válido. */
export function validarCampo(campo: keyof FormState, form: FormState): string {
  const v = (form[campo] as string)?.trim?.() ?? '';

  switch (campo) {

    case 'nombres':
      if (!v)                       return 'Los nombres son obligatorios';
      if (v.length < 2)             return 'Mínimo 2 caracteres';
      if (v.length > 100)           return 'Máximo 100 caracteres';
      if (!SOLO_LETRAS.test(v))     return 'Solo letras, espacios, guiones y apóstrofes';
      return '';

    case 'apellidos':
      if (!v)                       return 'Los apellidos son obligatorios';
      if (v.length < 2)             return 'Mínimo 2 caracteres';
      if (v.length > 100)           return 'Máximo 100 caracteres';
      if (!SOLO_LETRAS.test(v))     return 'Solo letras, espacios, guiones y apóstrofes';
      return '';

    case 'numeroDocumento': {
      if (!v) return 'El número de documento es obligatorio';
      if (v.length < 2 || v.length > 20) return 'Debe tener entre 2 y 20 caracteres';
      const tipo = form.tipoDocumento;
      if ((tipo === 'CC' || tipo === 'CE') && !SOLO_DIGITOS.test(v))
        return 'Para CC y CE solo se permiten dígitos';
      if (tipo === 'Pasaporte' && !ALFANUM.test(v))
        return 'El pasaporte solo puede contener letras y números';
      return '';
    }

    case 'email':
      if (!v)                       return 'El correo electrónico es obligatorio';
      if (!REGEX_EMAIL.test(v))     return 'Formato inválido (ej: nombre@empresa.com)';
      if (v.length > 50)            return 'Máximo 50 caracteres';
      return '';

    case 'telefono':
      if (!v)                       return 'El teléfono es obligatorio';
      if (!REGEX_TELEFONO.test(v))  return 'Formato inválido (ej: 3001234567 o +57 300 123 4567)';
      return '';

    case 'cargo':
      if (!form.cargo) return 'Debe seleccionar un cargo';
      return '';

    case 'area':
      if (!form.area) return 'Debe seleccionar un área';
      return '';

    case 'fechaIngreso': {
      if (!v) return 'La fecha de ingreso es obligatoria';
      const fecha = new Date(v);
      if (isNaN(fecha.getTime())) return 'Formato de fecha inválido';
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      if (fecha > hoy) return 'La fecha de ingreso no puede ser futura';
      const limite = new Date(); limite.setFullYear(limite.getFullYear() - 50);
      if (fecha < limite) return 'La fecha no puede ser mayor a 50 años atrás';
      return '';
    }

    case 'ciudad':
      if (v && v.length > 50)       return 'Máximo 50 caracteres';
      if (v && !SOLO_LETRAS.test(v)) return 'Solo letras, espacios y guiones';
      return '';

    case 'direccion':
      if (v && v.length > 200) return 'Máximo 200 caracteres';
      return '';

    default:
      return '';
  }
}

/**
 * Valida todos los campos y retorna un mapa de errores.
 * Si el mapa está vacío → formulario válido.
 */
export function validarFormEmpleado(form: FormState): FormErrors {
  const campos: (keyof FormState)[] = [
    'nombres', 'apellidos', 'numeroDocumento', 'email',
    'telefono', 'cargo', 'area', 'fechaIngreso', 'ciudad', 'direccion',
  ];
  const errores: FormErrors = {};
  for (const campo of campos) {
    const msg = validarCampo(campo, form);
    if (msg) errores[campo] = msg;
  }
  return errores;
}

/** Retorna true si hay al menos un error */
export function hayErrores(errores: FormErrors): boolean {
  return Object.keys(errores).length > 0;
}

// ─── Validación de campos únicos (duplicados) ─────────────────────────────────

/**
 * Verifica que los campos críticos no estén ya en uso por otro empleado.
 * Campos verificados: numeroDocumento, email, telefono
 *
 * @param form       Datos del formulario actual
 * @param empleados  Lista completa de empleados cargada desde el servidor
 * @param editandoId ID del empleado que se está editando (null si es nuevo)
 * @returns          FormErrors con los campos duplicados encontrados
 */
export function validarUnicidad(
  form: FormState,
  empleados: {
    id?: number;
    numeroDocumento: string;
    email: string;
    telefono: string;
  }[],
  editandoId: number | null
): FormErrors {
  const errores: FormErrors = {};

  // Excluye al propio empleado cuando es edición
  const otros = empleados.filter(e => e.id !== editandoId);

  const docNorm   = form.numeroDocumento.trim().toLowerCase();
  const emailNorm = form.email.trim().toLowerCase();
  const teleNorm  = form.telefono.replace(/[\s\-(). ]/g, '');

  if (docNorm && otros.some(e => e.numeroDocumento.trim().toLowerCase() === docNorm)) {
    errores.numeroDocumento = 'Ya existe un empleado con este número de documento';
  }

  if (emailNorm && otros.some(e => e.email.trim().toLowerCase() === emailNorm)) {
    errores.email = 'Este correo electrónico ya está registrado';
  }

  if (teleNorm && otros.some(e => e.telefono.replace(/[\s\-(). ]/g, '') === teleNorm)) {
    errores.telefono = 'Este número de teléfono ya está registrado';
  }

  return errores;
}