// ============================================================
//  Biblioteca compartida de validación — Frontend
//  JRepuestos Medellín
//  frontend/src/shared/utils/validations.ts
// ============================================================

// ─── Tipos exportados ─────────────────────────────────────────────────────────

/** Nombres de campo del catálogo compartido */
export type FieldName =
  | 'nombres'
  | 'apellidos'
  | 'tipoDocumento'
  | 'numeroDocumento'
  | 'email'
  | 'telefono'
  | 'ciudad'
  | 'direccion'
  | 'cargo'
  | 'area'
  | 'fechaIngreso'
  | 'estado';

/** Contexto opcional para validaciones dependientes */
export interface ValidationContext {
  /** Para validar numeroDocumento según el tipo */
  tipoDocumento?: string;
  /** Para campos opcionales como ciudad/dirección */
  required?: boolean;
  /** Para cargo/área con listas dinámicas */
  allowedValues?: string[];
}

/** Regla de campo */
export interface FieldRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: string[];
  customValidator?: (value: string, ctx?: ValidationContext) => string;
}

/** Mapa campo → mensaje de error */
export type FormErrors = Partial<Record<string, string>>;

/** Resultado de validación de un campo */
export interface ValidationResult {
  valid: boolean;
  message: string;
}

// ─── Mensajes canónicos ───────────────────────────────────────────────────────

const MESSAGES = {
  required:          'Este campo es obligatorio',
  minLength:         (n: number) => `Mínimo ${n} caracteres`,
  maxLength:         (n: number) => `Máximo ${n} caracteres`,
  invalidChars:      'Solo se permiten letras, espacios y guiones',
  invalidTipoDoc:    'Tipo de documento no válido',
  requiredTipoDoc:   'Debe seleccionar un tipo de documento',
  onlyDigits:        'Solo se permiten dígitos para este tipo de documento',
  minDigits:         (n: number) => `Mínimo ${n} dígitos`,
  maxDigits:         (n: number) => `Máximo ${n} dígitos`,
  invalidEmail:      'Formato de correo inválido',
  requiredEmail:     'El correo electrónico es obligatorio',
  invalidPhone:      'Formato de teléfono inválido',
  requiredPhone:     'El teléfono es obligatorio',
  minPhoneDigits:    'Mínimo 10 dígitos',
  maxPhoneChars:     'Máximo 13 caracteres',
  requiredCiudad:    'La ciudad es obligatoria',
  requiredDireccion: 'La dirección es obligatoria',
  invalidDireccion:  'La dirección contiene caracteres no permitidos',
  requiredCargo:     'Debe seleccionar un cargo',
  requiredArea:      'Debe seleccionar un área',
  requiredFecha:     'La fecha de ingreso es obligatoria',
  invalidFecha:      'Formato de fecha inválido',
  futuraFecha:       'La fecha de ingreso no puede ser futura',
  antiguaFecha:      'La fecha de ingreso no puede ser mayor a 50 años atrás',
  invalidEstado:     'El estado solo puede ser activo o inactivo',
  requiredNumDoc:    'El número de documento es obligatorio',
  invalidNIT:        'Formato NIT inválido (ej: 900123456-7)',
} as const;

// ─── Regex compartidas ────────────────────────────────────────────────────────

const REGEX_SOLO_LETRAS  = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/;
const REGEX_SOLO_DIGITOS = /^\d+$/;
const REGEX_ALFANUM      = /^[a-zA-Z0-9]+$/;
const REGEX_NIT          = /^\d{9,10}(-\d)?$/;
const REGEX_EMAIL        = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_TELEFONO_CHARS = /^[+\d\s\-(). ]+$/;
const REGEX_CIUDAD       = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/;
const REGEX_DIRECCION    = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s#\-.,]+$/;

const TIPOS_DOCUMENTO_PERMITIDOS = ['CC', 'TI', 'CE', 'Pasaporte', 'NIT', 'RUT'] as const;

// ─── Sanitización ─────────────────────────────────────────────────────────────

/**
 * Elimina etiquetas HTML (<tag>) y atributos de evento (on*=) de una cadena.
 * Preserva tildes, ñ, ü y demás caracteres válidos del español.
 * Aplica trim al resultado.
 * Backend equivalent: sanitizeString
 */
export function sanitizeXSS(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')          // elimina <tags>
    .replace(/\bon\w+\s*=/gi, '')     // elimina on*=
    .trim();
}

/**
 * Filtra caracteres no permitidos para nombres (letras, espacios, guiones, apóstrofes).
 * Capitaliza la primera letra de cada palabra.
 * Backend equivalent: validateNombres sanitizer
 */
export function sanitizarNombre(value: string): string {
  if (typeof value !== 'string') return '';
  const limpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]/g, '');
  return limpio.replace(/(^|\s)([a-záéíóúñü])/g, (_, sep, letra) => sep + letra.toUpperCase());
}

/**
 * Igual que sanitizarNombre — filtra y capitaliza apellidos.
 */
export function sanitizarApellido(value: string): string {
  return sanitizarNombre(value);
}

/**
 * Sanitiza número de documento según el tipo:
 * - CC / TI / CE: solo dígitos
 * - Pasaporte: alfanumérico en mayúsculas
 * - NIT / RUT: dígitos y guión
 * Backend equivalent: validateNumeroDocumento sanitizer
 */
export function sanitizarDocumento(value: string, tipo: string): string {
  if (typeof value !== 'string') return '';
  const t = tipo?.trim().toUpperCase();
  if (t === 'CC' || t === 'TI' || t === 'CE') {
    return value.replace(/\D/g, '');
  }
  if (t === 'PASAPORTE') {
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }
  // NIT / RUT: dígitos y guión
  return value.replace(/[^0-9\-]/g, '');
}

/**
 * Sanitiza teléfono: solo dígitos, +, -, (), espacios.
 * Backend equivalent: validateTelefono sanitizer
 */
export function sanitizarTelefono(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[^\d+\s\-(). ]/g, '');
}

/**
 * Sanitiza ciudad: solo letras (con tildes, ñ), espacios, guiones.
 * Capitaliza la primera letra de cada palabra.
 * Backend equivalent: validateCiudad sanitizer
 */
export function sanitizarCiudad(value: string): string {
  if (typeof value !== 'string') return '';
  const limpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]/g, '');
  return limpio.replace(/(^|\s)([a-záéíóúñü])/g, (_, sep, letra) => sep + letra.toUpperCase());
}

/**
 * Sanitiza dirección: letras, números, espacios, #, -, ., ,
 * Backend equivalent: validateDireccion sanitizer
 */
export function sanitizarDireccion(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s#\-.,]/g, '');
}

/**
 * Sanitiza email: trim + toLowerCase.
 * Backend equivalent: validateEmail sanitizer
 */
export function sanitizarEmail(value: string): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

// ─── Validaciones individuales ────────────────────────────────────────────────
// Cada función retorna '' si válido, mensaje de error si inválido.
// Ninguna función lanza excepciones.
// Backend equivalent: validateNombres, validateApellidos, etc. (retornan string[])

/**
 * Valida nombres: obligatorio, 2-50 chars, solo letras/espacios/guiones.
 * Req: 3.1–3.4
 */
export function validateNombres(value: string): string {
  const v = sanitizeXSS(value);
  if (!v) return MESSAGES.required;
  if (v.length < 2) return MESSAGES.minLength(2);
  if (v.length > 50) return MESSAGES.maxLength(50);
  if (!REGEX_SOLO_LETRAS.test(v)) return MESSAGES.invalidChars;
  return '';
}

/**
 * Valida apellidos: igual que nombres.
 * Req: 3.1–3.4
 */
export function validateApellidos(value: string): string {
  return validateNombres(value);
}

/**
 * Valida tipo de documento: obligatorio, debe estar en el catálogo.
 * Req: 4.1–4.2
 */
export function validateTipoDocumento(value: string, allowedTypes?: string[]): string {
  const v = sanitizeXSS(value);
  if (!v) return MESSAGES.requiredTipoDoc;
  const lista = allowedTypes ?? [...TIPOS_DOCUMENTO_PERMITIDOS];
  if (!lista.includes(v)) return MESSAGES.invalidTipoDoc;
  return '';
}

/**
 * Valida número de documento según el tipo.
 * Req: 5.1–5.6
 */
export function validateNumeroDocumento(value: string, tipoDocumento: string): string {
  const v = sanitizeXSS(value);
  if (!v) return MESSAGES.requiredNumDoc;

  const tipo = tipoDocumento?.trim().toUpperCase();

  if (tipo === 'CC' || tipo === 'TI' || tipo === 'CE') {
    if (!REGEX_SOLO_DIGITOS.test(v)) return MESSAGES.onlyDigits;
    if (v.length < 6) return MESSAGES.minDigits(6);
    if (v.length > 12) return MESSAGES.maxDigits(12);
    return '';
  }

  if (tipo === 'PASAPORTE') {
    if (!REGEX_ALFANUM.test(v)) return MESSAGES.onlyDigits;
    if (v.length < 6) return MESSAGES.minLength(6);
    if (v.length > 12) return MESSAGES.maxLength(12);
    return '';
  }

  if (tipo === 'NIT') {
    if (!REGEX_NIT.test(v)) return MESSAGES.invalidNIT;
    return '';
  }

  // RUT u otros: solo dígitos 6-12
  if (!REGEX_SOLO_DIGITOS.test(v)) return MESSAGES.onlyDigits;
  if (v.length < 6) return MESSAGES.minDigits(6);
  if (v.length > 12) return MESSAGES.maxDigits(12);
  return '';
}

/**
 * Valida email: obligatorio, formato válido, máx 100 chars.
 * Req: 6.1–6.3
 */
export function validateEmail(value: string): string {
  const v = sanitizarEmail(value);
  if (!v) return MESSAGES.requiredEmail;
  if (!REGEX_EMAIL.test(v)) return MESSAGES.invalidEmail;
  if (v.length > 100) return MESSAGES.maxLength(100);
  return '';
}

/**
 * Valida teléfono: obligatorio, solo chars permitidos, mínimo 10 dígitos significativos, máx 13 chars significativos.
 * Dígitos significativos = solo dígitos (sin +, espacios, guiones, paréntesis).
 * Req: 7.1–7.4
 */
export function validateTelefono(value: string): string {
  const v = sanitizeXSS(value);
  if (!v) return MESSAGES.requiredPhone;
  if (!REGEX_TELEFONO_CHARS.test(v)) return MESSAGES.invalidPhone;

  // Contar solo dígitos significativos
  const soloDigitos = v.replace(/[^\d]/g, '');
  if (soloDigitos.length < 10) return MESSAGES.minPhoneDigits;

  // Chars significativos = sin espacios internos (pero contando todo lo demás)
  const significativos = v.replace(/\s/g, '');
  if (significativos.length > 13) return MESSAGES.maxPhoneChars;

  return '';
}

/**
 * Valida ciudad: opcional por defecto, solo letras, máx 50 chars.
 * Req: 8.1–8.3
 */
export function validateCiudad(value: string, required = false): string {
  const v = sanitizeXSS(value);
  if (!v) {
    if (required) return MESSAGES.requiredCiudad;
    return '';
  }
  if (v.length > 50) return MESSAGES.maxLength(50);
  if (!REGEX_CIUDAD.test(v)) return MESSAGES.invalidChars;
  return '';
}

/**
 * Valida dirección: opcional por defecto, 5-100 chars, chars permitidos.
 * Req: 9.1–9.4
 */
export function validateDireccion(value: string, required = false): string {
  const v = sanitizeXSS(value);
  if (!v) {
    if (required) return MESSAGES.requiredDireccion;
    return '';
  }
  if (v.length < 5) return MESSAGES.minLength(5);
  if (v.length > 100) return MESSAGES.maxLength(100);
  if (!REGEX_DIRECCION.test(v)) return MESSAGES.invalidDireccion;
  return '';
}

/**
 * Valida cargo: obligatorio, no vacío, máx 100 chars; si se pasa allowedValues verificar lista.
 * Req: 10.1
 */
export function validateCargo(value: string, allowedValues?: string[]): string {
  const v = sanitizeXSS(value);
  if (!v) return MESSAGES.requiredCargo;
  if (v.length > 100) return MESSAGES.maxLength(100);
  if (allowedValues && allowedValues.length > 0 && !allowedValues.includes(v)) {
    return MESSAGES.requiredCargo;
  }
  return '';
}

/**
 * Valida área: obligatorio; si se pasa allowedValues verificar lista.
 * Req: 10.2
 */
export function validateArea(value: string, allowedValues?: string[]): string {
  const v = sanitizeXSS(value);
  if (!v) return MESSAGES.requiredArea;
  if (allowedValues && allowedValues.length > 0 && !allowedValues.includes(v)) {
    return MESSAGES.requiredArea;
  }
  return '';
}

/**
 * Valida fecha de ingreso: obligatorio, ISO válida, no futura, no más de 50 años atrás.
 * Req: 11.1–11.4
 */
export function validateFechaIngreso(value: string): string {
  const v = sanitizeXSS(value);
  if (!v) return MESSAGES.requiredFecha;

  // Verificar formato ISO YYYY-MM-DD
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(v)) return MESSAGES.invalidFecha;

  const fecha = new Date(v + 'T00:00:00');
  if (isNaN(fecha.getTime())) return MESSAGES.invalidFecha;

  // Verificar que la fecha sea coherente (ej: 2024-02-30 no existe)
  const [year, month, day] = v.split('-').map(Number);
  if (
    fecha.getFullYear() !== year ||
    fecha.getMonth() + 1 !== month ||
    fecha.getDate() !== day
  ) {
    return MESSAGES.invalidFecha;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha > hoy) return MESSAGES.futuraFecha;

  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 50);
  limite.setHours(0, 0, 0, 0);
  if (fecha < limite) return MESSAGES.antiguaFecha;

  return '';
}

/**
 * Valida estado: acepta 'activo', 'inactivo', true, false.
 * Req: 12.1, 12.3
 */
export function validateEstado(value: string | boolean): string {
  if (value === true || value === false) return '';
  if (value === 'activo' || value === 'inactivo') return '';
  return MESSAGES.invalidEstado;
}

// ─── API genérica ─────────────────────────────────────────────────────────────

/**
 * Valida cualquier campo del catálogo.
 * Si fieldName no está en el catálogo, retorna '' (sin error).
 * Req: 1.7
 */
export function validateField(
  fieldName: FieldName,
  value: string,
  context?: ValidationContext
): string {
  try {
    switch (fieldName) {
      case 'nombres':
        return validateNombres(value);
      case 'apellidos':
        return validateApellidos(value);
      case 'tipoDocumento':
        return validateTipoDocumento(value, context?.allowedValues);
      case 'numeroDocumento':
        return validateNumeroDocumento(value, context?.tipoDocumento ?? '');
      case 'email':
        return validateEmail(value);
      case 'telefono':
        return validateTelefono(value);
      case 'ciudad':
        return validateCiudad(value, context?.required);
      case 'direccion':
        return validateDireccion(value, context?.required);
      case 'cargo':
        return validateCargo(value, context?.allowedValues);
      case 'area':
        return validateArea(value, context?.allowedValues);
      case 'fechaIngreso':
        return validateFechaIngreso(value);
      case 'estado':
        return validateEstado(value);
      default:
        return '';
    }
  } catch {
    return '';
  }
}

/**
 * Sanitiza cualquier campo del catálogo.
 * Si fieldName no está en el catálogo, retorna valor con trim + XSS strip.
 * Req: 1.8
 */
export function sanitizeField(fieldName: FieldName, value: string): string {
  try {
    switch (fieldName) {
      case 'nombres':
        return sanitizarNombre(value);
      case 'apellidos':
        return sanitizarApellido(value);
      case 'tipoDocumento':
        return sanitizeXSS(value);
      case 'numeroDocumento':
        return sanitizeXSS(value);
      case 'email':
        return sanitizarEmail(value);
      case 'telefono':
        return sanitizarTelefono(value);
      case 'ciudad':
        return sanitizarCiudad(value);
      case 'direccion':
        return sanitizarDireccion(value);
      case 'cargo':
        return sanitizeXSS(value);
      case 'area':
        return sanitizeXSS(value);
      case 'fechaIngreso':
        return sanitizeXSS(value);
      case 'estado':
        return sanitizeXSS(value);
      default:
        return sanitizeXSS(value);
    }
  } catch {
    return typeof value === 'string' ? value.trim() : '';
  }
}

/**
 * Valida todos los campos de un objeto de formulario.
 * Acumula TODOS los errores sin early return.
 * Req: 1.7
 */
export function validateForm(
  data: Record<string, string>,
  fields: FieldName[],
  context?: ValidationContext
): FormErrors {
  const errors: FormErrors = {};
  for (const field of fields) {
    const value = data[field] ?? '';
    const error = validateField(field, value, context);
    if (error) {
      errors[field] = error;
    }
  }
  return errors;
}

/**
 * Sanitiza todos los campos de texto de un objeto de formulario.
 * Preserva las mismas claves del objeto original.
 * Solo sanitiza valores de tipo string.
 * Req: 1.8, 13.3
 */
export function sanitizeAll<T extends Record<string, unknown>>(formData: T): T {
  const result = {} as T;
  for (const key of Object.keys(formData) as (keyof T)[]) {
    const val = formData[key];
    if (typeof val === 'string') {
      (result as Record<string, unknown>)[key as string] = sanitizeXSS(val);
    } else {
      (result as Record<string, unknown>)[key as string] = val;
    }
  }
  return result;
}

/**
 * Convierte true/false ↔ 'activo'/'inactivo'.
 * Req: 12.4
 */
export function normalizeEstado(value: boolean | string): 'activo' | 'inactivo' {
  if (value === true || value === 'activo') return 'activo';
  if (value === false || value === 'inactivo') return 'inactivo';
  return 'activo';
}
