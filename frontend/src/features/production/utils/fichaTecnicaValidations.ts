// ============================================================
//  Validaciones de UI — Módulo Ficha Técnica
//  JRepuestos Medellín
// ============================================================

import type { Material, Proceso, Medida, InsumoFT } from '../services/fichaTecnicaService';

// ─── Tipos de resultado ───────────────────────────────────────────────────────

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

// Errores por campo para un item de formulario (material, proceso, medida, insumo)
export type ItemErrors = {
  name?: string;
  quantity?: string;
  unit?: string;
  description?: string;
  duration?: string;
  parameter?: string;
  value?: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_NOMBRE    = 100;
const MAX_UNIDAD    = 30;
const MAX_DESC      = 300;
const MAX_DURACION  = 50;
const MAX_PARAMETRO = 100;
const MAX_VALOR     = 100;
const MAX_NOTAS     = 1000;

// ─── Expresiones regulares ────────────────────────────────────────────────────

// Nombres: letras, números, tildes, ñ, espacios, guion, coma, punto
const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 \-.,()]*$/;

// Unidades: letras, números, /, ., espacio, símbolos de medida
const REGEX_UNIDAD = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 /.²³µ°]*$/;

// Descripciones: texto libre sin caracteres de inyección
const REGEX_DESCRIPCION = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 .,;:\-()\\/°%&'"!?¿¡]*$/;

// Duración: alfanumérico + separadores de tiempo
const REGEX_DURACION = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 :.,\-/]*$/;

// Parámetro / valor de medida
const REGEX_PARAMETRO = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 .,;:\-()°²³µ%/]*$/;

// Notas: texto libre amplio, permite saltos de línea
const REGEX_NOTAS = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ0-9 .,;:\-()\\/°%&'"!?¿¡\n\r\t]*$/;

// Caracteres prohibidos (para filtrado en tiempo real)
const CHARS_PROHIBIDOS_NOMBRE      = /[<>{}|\\^`[\]@#$!?¿¡'"+=%&*]/g;
const CHARS_PROHIBIDOS_UNIDAD      = /[<>{}|\\^`[\]@#$!?¿¡'"+=&*\-,;:()]/g;
const CHARS_PROHIBIDOS_DESCRIPCION = /[<>{}|^`[\]@#$]/g;
const CHARS_PROHIBIDOS_DURACION    = /[<>{}|\\^`[\]@#$!?¿¡'"+=&*;()]/g;
const CHARS_PROHIBIDOS_PARAMETRO   = /[<>{}|\\^`[\]@#$!?¿¡'"+&*]/g;
const CHARS_PROHIBIDOS_NOTAS       = /[<>{}|\\^`[\]]/g;

// ─── Helpers de filtrado en tiempo real ──────────────────────────────────────

/**
 * Filtra caracteres no permitidos de un nombre de material/insumo.
 * Úsalo en el onChange del input.
 */
export function filtrarNombre(valor: string): string {
  return valor.replace(CHARS_PROHIBIDOS_NOMBRE, '');
}

/**
 * Filtra caracteres no permitidos de una unidad de medida.
 */
export function filtrarUnidad(valor: string): string {
  return valor.replace(CHARS_PROHIBIDOS_UNIDAD, '');
}

/**
 * Filtra caracteres no permitidos de una descripción de proceso.
 */
export function filtrarDescripcion(valor: string): string {
  return valor.replace(CHARS_PROHIBIDOS_DESCRIPCION, '');
}

/**
 * Filtra caracteres no permitidos de una duración.
 */
export function filtrarDuracion(valor: string): string {
  return valor.replace(CHARS_PROHIBIDOS_DURACION, '');
}

/**
 * Filtra caracteres no permitidos de un parámetro o valor de medida.
 */
export function filtrarParametro(valor: string): string {
  return valor.replace(CHARS_PROHIBIDOS_PARAMETRO, '');
}

/**
 * Filtra caracteres no permitidos de las notas.
 */
export function filtrarNotas(valor: string): string {
  return valor.replace(CHARS_PROHIBIDOS_NOTAS, '');
}

/**
 * Permite solo números positivos (enteros y decimales) en campos de cantidad.
 */
export function filtrarCantidad(valor: string): string {
  // Permite dígitos y un solo punto decimal
  return valor.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

// ─── Validadores de items individuales ───────────────────────────────────────

/**
 * Valida un único material.
 */
export function validarMaterial(mat: Partial<Material>): ValidationResult {
  const errors: string[] = [];

  if (!mat.name || mat.name.trim() === '') {
    errors.push('El nombre del material es obligatorio');
  } else if (mat.name.trim().length > MAX_NOMBRE) {
    errors.push(`El nombre no puede superar ${MAX_NOMBRE} caracteres (${mat.name.trim().length}/${MAX_NOMBRE})`);
  } else if (!REGEX_NOMBRE.test(mat.name.trim())) {
    errors.push('El nombre solo permite letras, números, espacios, guion, coma y punto');
  }

  if (mat.quantity === undefined || mat.quantity === null || isNaN(mat.quantity)) {
    errors.push('La cantidad debe ser un número');
  } else if (mat.quantity <= 0) {
    errors.push('La cantidad debe ser mayor a 0');
  }

  if (!mat.unit || mat.unit.trim() === '') {
    errors.push('La unidad es obligatoria (ej: kg, unidades, litros)');
  } else if (mat.unit.trim().length > MAX_UNIDAD) {
    errors.push(`La unidad no puede superar ${MAX_UNIDAD} caracteres`);
  } else if (!REGEX_UNIDAD.test(mat.unit.trim())) {
    errors.push('La unidad solo permite letras, números, /, . y °');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida errores campo por campo de un material (para tiempo real).
 */
export function validarMaterialCampos(mat: Partial<Material>): ItemErrors {
  const e: ItemErrors = {};

  if (!mat.name || mat.name.trim() === '') {
    e.name = 'El nombre es obligatorio';
  } else if (mat.name.trim().length > MAX_NOMBRE) {
    e.name = `Máximo ${MAX_NOMBRE} caracteres (${mat.name.trim().length}/${MAX_NOMBRE})`;
  } else if (!REGEX_NOMBRE.test(mat.name.trim())) {
    e.name = 'Solo letras, números, espacios, guion, coma y punto';
  }

  if (mat.quantity === undefined || mat.quantity === null || isNaN(mat.quantity)) {
    e.quantity = 'Debe ser un número';
  } else if (mat.quantity <= 0) {
    e.quantity = 'Debe ser mayor a 0';
  }

  if (!mat.unit || mat.unit.trim() === '') {
    e.unit = 'La unidad es obligatoria';
  } else if (mat.unit.trim().length > MAX_UNIDAD) {
    e.unit = `Máximo ${MAX_UNIDAD} caracteres`;
  } else if (!REGEX_UNIDAD.test(mat.unit.trim())) {
    e.unit = 'Solo letras, números, /, . y °';
  }

  return e;
}

/**
 * Valida un único proceso.
 */
export function validarProceso(proc: Partial<Proceso>): ValidationResult {
  const errors: string[] = [];

  if (!proc.description || proc.description.trim() === '') {
    errors.push('La descripción del proceso es obligatoria');
  } else if (proc.description.trim().length > MAX_DESC) {
    errors.push(`La descripción no puede superar ${MAX_DESC} caracteres (${proc.description.trim().length}/${MAX_DESC})`);
  } else if (!REGEX_DESCRIPCION.test(proc.description.trim())) {
    errors.push('La descripción contiene caracteres no permitidos (evita <, >, {, }, |, ^, `)');
  }

  if (!proc.duration || proc.duration.trim() === '') {
    errors.push('La duración es obligatoria (ej: "15 min", "2 horas")');
  } else if (proc.duration.trim().length > MAX_DURACION) {
    errors.push(`La duración no puede superar ${MAX_DURACION} caracteres`);
  } else if (!REGEX_DURACION.test(proc.duration.trim())) {
    errors.push('La duración solo permite letras, números, espacios, :, ., , y -');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida errores campo por campo de un proceso (para tiempo real).
 */
export function validarProcesoCampos(proc: { description: string; duration: string }): ItemErrors {
  const e: ItemErrors = {};

  if (!proc.description || proc.description.trim() === '') {
    e.description = 'La descripción es obligatoria';
  } else if (proc.description.trim().length > MAX_DESC) {
    e.description = `Máximo ${MAX_DESC} caracteres (${proc.description.trim().length}/${MAX_DESC})`;
  } else if (!REGEX_DESCRIPCION.test(proc.description.trim())) {
    e.description = 'Contiene caracteres no permitidos';
  }

  if (!proc.duration || proc.duration.trim() === '') {
    e.duration = 'La duración es obligatoria';
  } else if (proc.duration.trim().length > MAX_DURACION) {
    e.duration = `Máximo ${MAX_DURACION} caracteres`;
  } else if (!REGEX_DURACION.test(proc.duration.trim())) {
    e.duration = 'Solo letras, números, espacios, :, ., , y -';
  }

  return e;
}

/**
 * Valida una única medida.
 */
export function validarMedida(med: Partial<Medida>): ValidationResult {
  const errors: string[] = [];

  if (!med.parameter || med.parameter.trim() === '') {
    errors.push('El parámetro de la medida es obligatorio');
  } else if (med.parameter.trim().length > MAX_PARAMETRO) {
    errors.push(`El parámetro no puede superar ${MAX_PARAMETRO} caracteres`);
  } else if (!REGEX_PARAMETRO.test(med.parameter.trim())) {
    errors.push('El parámetro contiene caracteres no permitidos');
  }

  if (!med.value || med.value.trim() === '') {
    errors.push('El valor de la medida es obligatorio');
  } else if (med.value.trim().length > MAX_VALOR) {
    errors.push(`El valor no puede superar ${MAX_VALOR} caracteres`);
  } else if (!REGEX_PARAMETRO.test(med.value.trim())) {
    errors.push('El valor contiene caracteres no permitidos');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida errores campo por campo de una medida (para tiempo real).
 */
export function validarMedidaCampos(med: Partial<Medida>): ItemErrors {
  const e: ItemErrors = {};

  if (!med.parameter || med.parameter.trim() === '') {
    e.parameter = 'El parámetro es obligatorio';
  } else if (med.parameter.trim().length > MAX_PARAMETRO) {
    e.parameter = `Máximo ${MAX_PARAMETRO} caracteres`;
  } else if (!REGEX_PARAMETRO.test(med.parameter.trim())) {
    e.parameter = 'Contiene caracteres no permitidos';
  }

  if (!med.value || med.value.trim() === '') {
    e.value = 'El valor es obligatorio';
  } else if (med.value.trim().length > MAX_VALOR) {
    e.value = `Máximo ${MAX_VALOR} caracteres`;
  } else if (!REGEX_PARAMETRO.test(med.value.trim())) {
    e.value = 'Contiene caracteres no permitidos';
  }

  return e;
}

/**
 * Valida un único insumo.
 */
export function validarInsumo(ins: Partial<InsumoFT>): ValidationResult {
  const errors: string[] = [];

  if (!ins.name || ins.name.trim() === '') {
    errors.push('El nombre del insumo es obligatorio');
  } else if (ins.name.trim().length > MAX_NOMBRE) {
    errors.push(`El nombre no puede superar ${MAX_NOMBRE} caracteres (${ins.name.trim().length}/${MAX_NOMBRE})`);
  } else if (!REGEX_NOMBRE.test(ins.name.trim())) {
    errors.push('El nombre solo permite letras, números, espacios, guion, coma y punto');
  }

  if (ins.quantity === undefined || ins.quantity === null || isNaN(ins.quantity)) {
    errors.push('La cantidad debe ser un número');
  } else if (ins.quantity <= 0) {
    errors.push('La cantidad debe ser mayor a 0');
  }

  if (!ins.unit || ins.unit.trim() === '') {
    errors.push('La unidad es obligatoria');
  } else if (ins.unit.trim().length > MAX_UNIDAD) {
    errors.push(`La unidad no puede superar ${MAX_UNIDAD} caracteres`);
  } else if (!REGEX_UNIDAD.test(ins.unit.trim())) {
    errors.push('La unidad solo permite letras, números, /, . y °');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida errores campo por campo de un insumo (para tiempo real).
 */
export function validarInsumoCampos(ins: Partial<InsumoFT>): ItemErrors {
  const e: ItemErrors = {};

  if (!ins.name || ins.name.trim() === '') {
    e.name = 'El nombre es obligatorio';
  } else if (ins.name.trim().length > MAX_NOMBRE) {
    e.name = `Máximo ${MAX_NOMBRE} caracteres (${ins.name.trim().length}/${MAX_NOMBRE})`;
  } else if (!REGEX_NOMBRE.test(ins.name.trim())) {
    e.name = 'Solo letras, números, espacios, guion, coma y punto';
  }

  if (ins.quantity === undefined || ins.quantity === null || isNaN(ins.quantity)) {
    e.quantity = 'Debe ser un número';
  } else if (ins.quantity <= 0) {
    e.quantity = 'Debe ser mayor a 0';
  }

  if (!ins.unit || ins.unit.trim() === '') {
    e.unit = 'La unidad es obligatoria';
  } else if (ins.unit.trim().length > MAX_UNIDAD) {
    e.unit = `Máximo ${MAX_UNIDAD} caracteres`;
  } else if (!REGEX_UNIDAD.test(ins.unit.trim())) {
    e.unit = 'Solo letras, números, /, . y °';
  }

  return e;
}

// ─── Validadores de formulario completo ──────────────────────────────────────

export type FormFichaTecnica = {
  productoId: string;
  notas: string;
};

/**
 * Valida las notas campo por campo (para tiempo real).
 */
export function validarNotasCampo(notas: string): string | undefined {
  if (!notas || notas.trim() === '') return undefined; // es opcional
  if (notas.trim().length > MAX_NOTAS)
    return `Las notas no pueden superar ${MAX_NOTAS} caracteres (${notas.trim().length}/${MAX_NOTAS})`;
  if (!REGEX_NOTAS.test(notas))
    return 'Las notas contienen caracteres no permitidos (evita <, >, {, }, |, \\, ^, `)';
  return undefined;
}

/**
 * Valida el formulario completo para CREAR una ficha técnica.
 */
export function validarFormCrear(
  form: FormFichaTecnica,
  materiales: Material[],
  procesos: Proceso[],
  medidas: Medida[],
  insumos: InsumoFT[]
): ValidationResult {
  const errors: string[] = [];

  if (!form.productoId || form.productoId.trim() === '') {
    errors.push('Debes seleccionar un producto');
  }

  if (materiales.length === 0) {
    errors.push('Debes agregar al menos un material');
  } else {
    materiales.forEach((m, i) => {
      const r = validarMaterial(m);
      r.errors.forEach(e => errors.push(`Material [${i + 1}]: ${e}`));
    });
  }

  if (procesos.length === 0) {
    errors.push('Debes agregar al menos un proceso de fabricación');
  } else {
    procesos.forEach((p, i) => {
      const r = validarProceso(p);
      r.errors.forEach(e => errors.push(`Proceso [${i + 1}]: ${e}`));
    });
  }

  medidas.forEach((m, i) => {
    const r = validarMedida(m);
    r.errors.forEach(e => errors.push(`Medida [${i + 1}]: ${e}`));
  });

  insumos.forEach((ins, i) => {
    const r = validarInsumo(ins);
    r.errors.forEach(e => errors.push(`Insumo [${i + 1}]: ${e}`));
  });

  const errNotas = validarNotasCampo(form.notas);
  if (errNotas) errors.push(errNotas);

  return { valid: errors.length === 0, errors };
}

/**
 * Valida el formulario completo para EDITAR una ficha técnica.
 */
export function validarFormEditar(
  materiales: Material[],
  procesos: Proceso[],
  medidas: Medida[],
  insumos: InsumoFT[],
  notas: string
): ValidationResult {
  const errors: string[] = [];

  if (materiales.length === 0) {
    errors.push('Debes mantener al menos un material');
  } else {
    materiales.forEach((m, i) => {
      const r = validarMaterial(m);
      r.errors.forEach(e => errors.push(`Material [${i + 1}]: ${e}`));
    });
  }

  if (procesos.length === 0) {
    errors.push('Debes mantener al menos un proceso de fabricación');
  } else {
    procesos.forEach((p, i) => {
      const r = validarProceso(p);
      r.errors.forEach(e => errors.push(`Proceso [${i + 1}]: ${e}`));
    });
  }

  medidas.forEach((m, i) => {
    const r = validarMedida(m);
    r.errors.forEach(e => errors.push(`Medida [${i + 1}]: ${e}`));
  });

  insumos.forEach((ins, i) => {
    const r = validarInsumo(ins);
    r.errors.forEach(e => errors.push(`Insumo [${i + 1}]: ${e}`));
  });

  const errNotas = validarNotasCampo(notas);
  if (errNotas) errors.push(errNotas);

  return { valid: errors.length === 0, errors };
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Retorna info del contador de caracteres para mostrar visualmente en el campo.
 */
export function contadorTexto(valor: string, limite: number) {
  const actual = (valor ?? '').trim().length;
  const porcentaje = Math.round((actual / limite) * 100);
  return {
    actual,
    limite,
    texto: `${actual}/${limite}`,
    enPeligro: porcentaje >= 80 && actual <= limite,
    excedido: actual > limite,
  };
}
