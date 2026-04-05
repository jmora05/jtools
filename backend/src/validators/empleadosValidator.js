// ============================================================
//  Validaciones de negocio — Módulo Empleados
//  JRepuestos Medellín
// ============================================================

const TIPOS_DOCUMENTO = ['CC', 'CE', 'Pasaporte'];
const CARGOS = [
  'Supervisor de Producción',
  'Jefe de Área',
  'Operario',
  'Técnico de Calidad',
  'Asistente',
];
const AREAS = [
  'Producción',
  'Calidad',
  'Logística',
  'Mantenimiento',
  'Administración',
];

/**
 * Valida los datos de un empleado.
 * @param {object} data       - Cuerpo de la petición (req.body)
 * @param {boolean} esActualizacion - Si es PUT, los campos obligatorios son opcionales
 * @returns {string[]} Array de mensajes de error. Si está vacío, no hay errores.
 */
function validarEmpleado(data, esActualizacion = false) {
  const errores = [];
  const {
    tipoDocumento,
    numeroDocumento,
    nombres,
    apellidos,
    telefono,
    email,
    cargo,
    area,
    fechaIngreso,
    estado,
    direccion,
    ciudad,
  } = data;

  // ── 1. Campos obligatorios (solo en creación) ──────────────────────
  if (!esActualizacion) {
    const requeridos = {
      tipoDocumento,
      numeroDocumento,
      nombres,
      apellidos,
      telefono,
      email,
      cargo,
      area,
      fechaIngreso,
    };
    for (const [campo, valor] of Object.entries(requeridos)) {
      if (!valor || String(valor).trim() === '') {
        errores.push(`El campo "${campo}" es obligatorio`);
      }
    }
    // Si faltan campos obligatorios, no seguimos para evitar errores en cadena
    if (errores.length > 0) return errores;
  }

  // ── 2. Tipo de documento ───────────────────────────────────────────
  if (tipoDocumento && !TIPOS_DOCUMENTO.includes(tipoDocumento)) {
    errores.push(
      `Tipo de documento inválido. Valores permitidos: ${TIPOS_DOCUMENTO.join(', ')}`
    );
  }

  // ── 3. Número de documento ─────────────────────────────────────────
  if (numeroDocumento) {
    const doc = String(numeroDocumento).trim();
    if (doc.length < 2 || doc.length > 20) {
      errores.push('El número de documento debe tener entre 2 y 20 caracteres');
    } else if (
      (tipoDocumento === 'CC' || tipoDocumento === 'CE') &&
      !/^\d+$/.test(doc)
    ) {
      errores.push('Para CC y CE el número de documento solo puede contener dígitos');
    } else if (
      tipoDocumento === 'Pasaporte' &&
      !/^[a-zA-Z0-9]+$/.test(doc)
    ) {
      errores.push('El número de pasaporte solo puede contener letras y números');
    }
  }

  // ── 4. Nombres ─────────────────────────────────────────────────────
  if (nombres) {
    const n = nombres.trim();
    if (n.length < 2 || n.length > 100) {
      errores.push('Los nombres deben tener entre 2 y 100 caracteres');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(n)) {
      errores.push('Los nombres solo pueden contener letras, espacios, guiones y apóstrofes');
    }
  }

  // ── 5. Apellidos ───────────────────────────────────────────────────
  if (apellidos) {
    const a = apellidos.trim();
    if (a.length < 2 || a.length > 100) {
      errores.push('Los apellidos deben tener entre 2 y 100 caracteres');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(a)) {
      errores.push('Los apellidos solo pueden contener letras, espacios, guiones y apóstrofes');
    }
  }

  // ── 6. Teléfono ────────────────────────────────────────────────────
  if (telefono) {
    const tel = String(telefono).trim();
    // Acepta: 3001234567 | +57 300 123 4567 | +573001234567 | (604) 123-4567
    if (!/^[+]?[\d\s\-(). ]{7,20}$/.test(tel)) {
      errores.push(
        'El teléfono tiene un formato inválido (ej: 3001234567 o +57 300 123 4567)'
      );
    }
  }

  // ── 7. Email ───────────────────────────────────────────────────────
  if (email) {
    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      errores.push('El correo electrónico no tiene un formato válido');
    } else if (mail.length > 50) {
      errores.push('El correo electrónico no puede superar los 50 caracteres');
    }
  }

  // ── 8. Cargo ───────────────────────────────────────────────────────
  if (cargo && !CARGOS.includes(cargo)) {
    errores.push(`Cargo inválido. Valores permitidos: ${CARGOS.join(', ')}`);
  }

  // ── 9. Área ────────────────────────────────────────────────────────
  if (area && !AREAS.includes(area)) {
    errores.push(`Área inválida. Valores permitidos: ${AREAS.join(', ')}`);
  }

  // ── 10. Fecha de ingreso ───────────────────────────────────────────
  if (fechaIngreso) {
    const fecha = new Date(fechaIngreso);
    if (isNaN(fecha.getTime())) {
      errores.push('La fecha de ingreso no tiene un formato válido (YYYY-MM-DD)');
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fecha > hoy) {
        errores.push('La fecha de ingreso no puede ser una fecha futura');
      }

      const limite = new Date();
      limite.setFullYear(limite.getFullYear() - 50);
      if (fecha < limite) {
        errores.push('La fecha de ingreso no puede ser mayor a 50 años atrás');
      }
    }
  }

  // ── 11. Estado ─────────────────────────────────────────────────────
  if (estado && !['activo', 'inactivo'].includes(estado)) {
    errores.push('El estado solo puede ser "activo" o "inactivo"');
  }

  // ── 12. Campos opcionales con límite de longitud ───────────────────
  if (direccion && String(direccion).trim().length > 200) {
    errores.push('La dirección no puede superar los 200 caracteres');
  }
  if (ciudad && String(ciudad).trim().length > 50) {
    errores.push('La ciudad no puede superar los 50 caracteres');
  }

  return errores;
}

module.exports = { validarEmpleado };