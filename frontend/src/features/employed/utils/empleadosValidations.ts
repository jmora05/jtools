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

/** Mapa de campo → mensaje de error (solo los campos con error aparecen) */
export type FormErrors = Partial<Record<keyof FormState, string>>;

/**
 * Valida todos los campos del formulario de empleado.
 * Retorna un objeto con los errores encontrados.
 * Si el objeto está vacío, el formulario es válido.
 */
export function validarFormEmpleado(form: FormState): FormErrors {
  const errores: FormErrors = {};

  // ── 1. Nombres ──────────────────────────────────────────────────────
  if (!form.nombres.trim()) {
    errores.nombres = 'Los nombres son obligatorios';
  } else if (form.nombres.trim().length < 2) {
    errores.nombres = 'Los nombres deben tener al menos 2 caracteres';
  } else if (form.nombres.trim().length > 100) {
    errores.nombres = 'Los nombres no pueden superar los 100 caracteres';
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(form.nombres.trim())) {
    errores.nombres = 'Solo se permiten letras, espacios, guiones y apóstrofes';
  }

  // ── 2. Apellidos ────────────────────────────────────────────────────
  if (!form.apellidos.trim()) {
    errores.apellidos = 'Los apellidos son obligatorios';
  } else if (form.apellidos.trim().length < 2) {
    errores.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
  } else if (form.apellidos.trim().length > 100) {
    errores.apellidos = 'Los apellidos no pueden superar los 100 caracteres';
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(form.apellidos.trim())) {
    errores.apellidos = 'Solo se permiten letras, espacios, guiones y apóstrofes';
  }

  // ── 3. Número de documento ──────────────────────────────────────────
  if (!form.numeroDocumento.trim()) {
    errores.numeroDocumento = 'El número de documento es obligatorio';
  } else if (form.numeroDocumento.trim().length < 2 || form.numeroDocumento.trim().length > 20) {
    errores.numeroDocumento = 'Debe tener entre 2 y 20 caracteres';
  } else if (
    (form.tipoDocumento === 'CC' || form.tipoDocumento === 'CE') &&
    !/^\d+$/.test(form.numeroDocumento.trim())
  ) {
    errores.numeroDocumento = 'Para CC y CE solo se permiten dígitos';
  } else if (
    form.tipoDocumento === 'Pasaporte' &&
    !/^[a-zA-Z0-9]+$/.test(form.numeroDocumento.trim())
  ) {
    errores.numeroDocumento = 'El pasaporte solo puede contener letras y números';
  }

  // ── 4. Email ────────────────────────────────────────────────────────
  if (!form.email.trim()) {
    errores.email = 'El correo electrónico es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errores.email = 'El correo electrónico no tiene un formato válido';
  } else if (form.email.trim().length > 50) {
    errores.email = 'El correo no puede superar los 50 caracteres';
  }

  // ── 5. Teléfono ─────────────────────────────────────────────────────
  if (!form.telefono.trim()) {
    errores.telefono = 'El teléfono es obligatorio';
  } else if (!/^[+]?[\d\s\-(). ]{7,20}$/.test(form.telefono.trim())) {
    errores.telefono = 'Formato inválido (ej: 3001234567 o +57 300 123 4567)';
  }

  // ── 6. Cargo ────────────────────────────────────────────────────────
  if (!form.cargo) {
    errores.cargo = 'Debe seleccionar un cargo';
  }

  // ── 7. Área ─────────────────────────────────────────────────────────
  if (!form.area) {
    errores.area = 'Debe seleccionar un área';
  }

  // ── 8. Fecha de ingreso ─────────────────────────────────────────────
  if (!form.fechaIngreso) {
    errores.fechaIngreso = 'La fecha de ingreso es obligatoria';
  } else {
    const fecha = new Date(form.fechaIngreso);
    if (isNaN(fecha.getTime())) {
      errores.fechaIngreso = 'Formato de fecha inválido';
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha > hoy) {
        errores.fechaIngreso = 'La fecha de ingreso no puede ser futura';
      } else {
        const limite = new Date();
        limite.setFullYear(limite.getFullYear() - 50);
        if (fecha < limite) {
          errores.fechaIngreso = 'La fecha no puede ser mayor a 50 años atrás';
        }
      }
    }
  }

  // ── 9. Ciudad (opcional, con límite) ────────────────────────────────
  if (form.ciudad && form.ciudad.trim().length > 50) {
    errores.ciudad = 'La ciudad no puede superar los 50 caracteres';
  }

  // ── 10. Dirección (opcional, con límite) ────────────────────────────
  if (form.direccion && form.direccion.trim().length > 200) {
    errores.direccion = 'La dirección no puede superar los 200 caracteres';
  }

  return errores;
}

/** Retorna true si hay al menos un error */
export function hayErrores(errores: FormErrors): boolean {
  return Object.keys(errores).length > 0;
}