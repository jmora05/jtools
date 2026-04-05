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

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_NOMBRE    = 100;
const MAX_UNIDAD    = 30;
const MAX_DESC      = 300;
const MAX_DURACION  = 50;
const MAX_PARAMETRO = 100;
const MAX_VALOR     = 100;
const MAX_NOTAS     = 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(val: unknown): boolean {
  return val === undefined || val === null || String(val).trim() === '';
}

// ─── Validadores de items ─────────────────────────────────────────────────────

/**
 * Valida un único material antes de agregarlo al listado.
 */
export function validarMaterial(mat: Partial<Material>): ValidationResult {
  const errors: string[] = [];

  if (isEmpty(mat.name)) {
    errors.push('El nombre del material es obligatorio');
  } else if ((mat.name ?? '').trim().length > MAX_NOMBRE) {
    errors.push(`El nombre no puede superar ${MAX_NOMBRE} caracteres`);
  }

  if (mat.quantity === undefined || mat.quantity === null || isNaN(mat.quantity)) {
    errors.push('La cantidad debe ser un número');
  } else if (mat.quantity <= 0) {
    errors.push('La cantidad debe ser mayor a 0');
  }

  if (isEmpty(mat.unit)) {
    errors.push('La unidad es obligatoria');
  } else if ((mat.unit ?? '').trim().length > MAX_UNIDAD) {
    errors.push(`La unidad no puede superar ${MAX_UNIDAD} caracteres`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida un único proceso antes de agregarlo al listado.
 */
export function validarProceso(proc: Partial<Proceso>): ValidationResult {
  const errors: string[] = [];

  if (isEmpty(proc.description)) {
    errors.push('La descripción del proceso es obligatoria');
  } else if ((proc.description ?? '').trim().length > MAX_DESC) {
    errors.push(`La descripción no puede superar ${MAX_DESC} caracteres`);
  }

  if (isEmpty(proc.duration)) {
    errors.push('La duración es obligatoria (ej: "15 min", "2 horas")');
  } else if ((proc.duration ?? '').trim().length > MAX_DURACION) {
    errors.push(`La duración no puede superar ${MAX_DURACION} caracteres`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida una única medida antes de agregarla al listado.
 * El campo tolerancia ha sido eliminado.
 */
export function validarMedida(med: Partial<Medida>): ValidationResult {
  const errors: string[] = [];

  if (isEmpty(med.parameter)) {
    errors.push('El parámetro de la medida es obligatorio');
  } else if ((med.parameter ?? '').trim().length > MAX_PARAMETRO) {
    errors.push(`El parámetro no puede superar ${MAX_PARAMETRO} caracteres`);
  }

  if (isEmpty(med.value)) {
    errors.push('El valor de la medida es obligatorio');
  } else if ((med.value ?? '').trim().length > MAX_VALOR) {
    errors.push(`El valor no puede superar ${MAX_VALOR} caracteres`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida un único insumo antes de agregarlo al listado.
 */
export function validarInsumo(ins: Partial<InsumoFT>): ValidationResult {
  const errors: string[] = [];

  if (isEmpty(ins.name)) {
    errors.push('El nombre del insumo es obligatorio');
  } else if ((ins.name ?? '').trim().length > MAX_NOMBRE) {
    errors.push(`El nombre no puede superar ${MAX_NOMBRE} caracteres`);
  }

  if (ins.quantity === undefined || ins.quantity === null || isNaN(ins.quantity)) {
    errors.push('La cantidad debe ser un número');
  } else if (ins.quantity <= 0) {
    errors.push('La cantidad debe ser mayor a 0');
  }

  if (isEmpty(ins.unit)) {
    errors.push('La unidad es obligatoria');
  } else if ((ins.unit ?? '').trim().length > MAX_UNIDAD) {
    errors.push(`La unidad no puede superar ${MAX_UNIDAD} caracteres`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Validadores de formulario completo ──────────────────────────────────────

export type FormFichaTecnica = {
  productoId: string;
  notas: string;
};

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

  // Producto
  if (!form.productoId || form.productoId.trim() === '') {
    errors.push('Debes seleccionar un producto');
  }

  // Materiales
  if (materiales.length === 0) {
    errors.push('Debes agregar al menos un material');
  } else {
    materiales.forEach((m, i) => {
      const r = validarMaterial(m);
      r.errors.forEach(e => errors.push(`Material [${i + 1}]: ${e}`));
    });
  }

  // Procesos
  if (procesos.length === 0) {
    errors.push('Debes agregar al menos un proceso de fabricación');
  } else {
    procesos.forEach((p, i) => {
      const r = validarProceso(p);
      r.errors.forEach(e => errors.push(`Proceso [${i + 1}]: ${e}`));
    });
  }

  // Medidas (opcionales — solo se validan si hay)
  medidas.forEach((m, i) => {
    const r = validarMedida(m);
    r.errors.forEach(e => errors.push(`Medida [${i + 1}]: ${e}`));
  });

  // Insumos (opcionales — solo se validan si hay)
  insumos.forEach((ins, i) => {
    const r = validarInsumo(ins);
    r.errors.forEach(e => errors.push(`Insumo [${i + 1}]: ${e}`));
  });

  // Notas
  if (form.notas && form.notas.length > MAX_NOTAS) {
    errors.push(`Las notas no pueden superar ${MAX_NOTAS} caracteres`);
  }

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

  if (notas && notas.length > MAX_NOTAS) {
    errors.push(`Las notas no pueden superar ${MAX_NOTAS} caracteres`);
  }

  return { valid: errors.length === 0, errors };
}