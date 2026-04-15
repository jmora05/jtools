// ============================================================
//  Validaciones de negocio — Módulo Empleados
//  JRepuestos Medellín
// ============================================================

const TIPOS_DOCUMENTO = ['CC', 'CE', 'Pasaporte'];
const AREAS = [
  'Producción',
  'Calidad',
  'Logística',
  'Mantenimiento',
  'Administración',
];

// ── Expresiones regulares (alineadas con el frontend) ──────────────────────────
// Solo letras (incluye tildes, ñ), espacios, guiones y apóstrofes
const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/;

// Teléfono: debe ser +57 seguido de exactamente 10 dígitos
const REGEX_TELEFONO = /^\+57\d{10}$/;

// Solo letras, números, espacios y guiones (para ciudad)
const REGEX_CIUDAD = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-]+$/;

/**
 * Valida los datos de un empleado.
 * @param {object}  data            - Cuerpo de la petición (req.body)
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

  // ── 1. Campos obligatorios (solo en creación) ──────────────────────────────
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

  // ── 2. Tipo de documento ───────────────────────────────────────────────────
  if (tipoDocumento && !TIPOS_DOCUMENTO.includes(tipoDocumento)) {
    errores.push(
      `Tipo de documento inválido. Valores permitidos: ${TIPOS_DOCUMENTO.join(', ')}`
    );
  }

  // ── 3. Número de documento ─────────────────────────────────────────────────
  if (numeroDocumento) {
    const doc = String(numeroDocumento).trim();
    
    if (doc.length < 8 || doc.length > 10) {
      errores.push('El número de documento debe tener entre 8 y 10 dígitos');
    } else if (!/^\d+$/.test(doc)) {
      errores.push('El número de documento solo puede contener dígitos');
    }
  }

  // ── 4. Nombres ─────────────────────────────────────────────────────────────
  if (nombres) {
    const n = nombres.trim();
    if (n.length < 2 || n.length > 100) {
      errores.push('Los nombres deben tener entre 2 y 100 caracteres');
    } else if (!REGEX_NOMBRE.test(n)) {
      errores.push('Los nombres solo pueden contener letras, espacios, guiones y apóstrofes');
    }
  }

  // ── 5. Apellidos ───────────────────────────────────────────────────────────
  if (apellidos) {
    const a = apellidos.trim();
    if (a.length < 2 || a.length > 100) {
      errores.push('Los apellidos deben tener entre 2 y 100 caracteres');
    } else if (!REGEX_NOMBRE.test(a)) {
      errores.push('Los apellidos solo pueden contener letras, espacios, guiones y apóstrofes');
    }
  }

  // ── 6. Teléfono ────────────────────────────────────────────────────────────
  if (telefono) {
    const tel = String(telefono).trim();
    // Validar que sea +57 seguido de exactamente 10 dígitos
    if (!tel.startsWith('+57')) {
      errores.push('El teléfono debe comenzar con +57');
    } else {
      const digitos = tel.replace('+57', '');
      if (!/^\d{10}$/.test(digitos)) {
        errores.push('Después de +57 debe haber exactamente 10 dígitos');
      }
    }
  }

  // ── 7. Email ───────────────────────────────────────────────────────────────
  if (email) {
    const mail = email.trim();
    if (mail.length < 5 || mail.length > 50) {
      errores.push('El correo electrónico debe tener entre 5 y 50 caracteres');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      errores.push('El correo electrónico no tiene un formato válido');
    }
  }

  // ── 8. Cargo ───────────────────────────────────────────────────────────────
  if (cargo !== undefined && cargo !== null) {
    const c = String(cargo).trim();
    if (c.length === 0) {
      errores.push('El cargo no puede estar vacío');
    } else if (c.length > 100) {
      errores.push('El cargo no puede superar los 100 caracteres');
    }
  }

  // ── 9. Área ────────────────────────────────────────────────────────────────
  if (area && !AREAS.includes(area)) {
    errores.push(`Área inválida. Valores permitidos: ${AREAS.join(', ')}`);
  }

  // ── 10. Fecha de ingreso ───────────────────────────────────────────────────
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

  // ── 11. Estado ─────────────────────────────────────────────────────────────
  if (estado !== undefined && estado !== null && estado !== '') {
    if (!['activo', 'inactivo'].includes(estado)) {
      errores.push('El estado solo puede ser "activo" o "inactivo"');
    }
  }

  // ── 12. Dirección (opcional) ───────────────────────────────────────────────
  if (direccion !== undefined && direccion !== null && String(direccion).trim() !== '') {
    const dir = String(direccion).trim();
    if (dir.length > 200) {
      errores.push('La dirección no puede superar los 200 caracteres');
    }
  }

  // ── 13. Ciudad (opcional) ──────────────────────────────────────────────────
  if (ciudad !== undefined && ciudad !== null && String(ciudad).trim() !== '') {
    const ciu = String(ciudad).trim();
    if (ciu.length < 2 || ciu.length > 50) {
      errores.push('La ciudad debe tener entre 2 y 50 caracteres');
    } else if (!REGEX_CIUDAD.test(ciu)) {
      errores.push('La ciudad solo puede contener letras, números, espacios y guiones');
    }
  }

  return errores;
}

module.exports = { validarEmpleado };