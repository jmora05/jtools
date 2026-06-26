// ============================================================
//  Validaciones de negocio — Módulo Empleados
//  JRepuestos Medellín
// ============================================================

const TIPOS_DOCUMENTO = ['CC', 'CE', 'PPT'];
const AREAS = [
  'Producción',
  'Administración',
];

// ── Expresiones regulares (alineadas con el frontend) ──────────────────────────
// Solo letras (incluye tildes, ñ), espacios, guiones y apóstrofes
const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/;

// Teléfono: solo dígitos, entre 7 y 11 caracteres
const REGEX_TELEFONO = /^\d{7,11}$/;

// Solo letras, números, espacios y guiones (para ciudad)
const REGEX_CIUDAD = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-]+$/;
const REGEX_SALARIO = /^\d+(?:\.\d{1,2})?$/;

/**
 * Valida los datos de un empleado.
 * @param {object}  data            - Cuerpo de la petición (req.body)
 * @param {boolean} esActualizacion - Si es PUT, los campos obligatorios son opcionales
 * @returns {string[]} Array de mensajes de error. Si está vacío, no hay errores.
 */
// Regex de seguridad para contraseña
const REGEX_PASSWORD_UPPER   = /[A-Z]/;
const REGEX_PASSWORD_NUMBER  = /[0-9]/;
const REGEX_PASSWORD_SPECIAL = /[!@#$%^&*()\-_=+\[\]{};':",.<>?/\\|`~]/;

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
    departamento,
    salario,
    password,
    confirmPassword,
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
      salario,
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
    
    if (doc.length < 6 || doc.length > 11) {
      errores.push('El número de documento debe tener entre 6 y 11 dígitos');
    } else if (!/^\d+$/.test(doc)) {
      errores.push('El número de documento solo puede contener dígitos');
    }
  }

  // ── 4. Nombres ─────────────────────────────────────────────────────────────
  if (nombres) {
    const n = nombres.trim();
    if (n.length < 2 || n.length > 30) {
      errores.push('Los nombres deben tener entre 2 y 30 caracteres');
    } else if (!REGEX_NOMBRE.test(n)) {
      errores.push('Los nombres solo pueden contener letras, espacios, guiones y apóstrofes');
    }
  }

  // ── 5. Apellidos ───────────────────────────────────────────────────────────
  if (apellidos) {
    const a = apellidos.trim();
    if (a.length < 2 || a.length > 30) {
      errores.push('Los apellidos deben tener entre 2 y 30 caracteres');
    } else if (!REGEX_NOMBRE.test(a)) {
      errores.push('Los apellidos solo pueden contener letras, espacios, guiones y apóstrofes');
    }
  }

  // ── 6. Teléfono ────────────────────────────────────────────────────────────
  if (telefono) {
    const tel = String(telefono).trim();
    if (!REGEX_TELEFONO.test(tel)) {
      errores.push('El teléfono debe contener entre 7 y 11 dígitos');
    }
  }

  // ── 7. Email ───────────────────────────────────────────────────────────────
  if (email) {
    const mail = email.trim();
    if (mail.length < 5 || mail.length > 100) {
      errores.push('El correo electrónico debe tener entre 5 y 100 caracteres');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      errores.push('El correo electrónico no tiene un formato válido');
    }
  }

  // ── 8. Cargo ───────────────────────────────────────────────────────────────
  if (cargo !== undefined && cargo !== null) {
    const c = String(cargo).trim();
    if (c.length === 0) {
      errores.push('El cargo no puede estar vacío');
    } else if (c.length > 30) {
      errores.push('El cargo no puede superar los 30 caracteres');
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

  // ── 11. Salario ────────────────────────────────────────────────────────────
  if (salario !== undefined && salario !== null && salario !== '') {
    const salString = String(salario).trim();
    if (!REGEX_SALARIO.test(salString)) {
      errores.push('El salario debe ser un número válido sin signos ni símbolos');
    } else {
      const sal = parseFloat(salString);
      if (isNaN(sal) || sal < 1423500) {
        errores.push('El salario no puede ser menor al SMMLV ($1.423.500)');
      }
    }
  }

  // ── 12. Estado ─────────────────────────────────────────────────────────────
  if (estado !== undefined && estado !== null && estado !== '') {
    if (!['activo', 'inactivo'].includes(estado)) {
      errores.push('El estado solo puede ser "activo" o "inactivo"');
    }
  }

  // ── 13. Contraseña (opcional — solo si se proporciona) ─────────────────────
  if (password !== undefined && password !== null && String(password).trim() !== '') {
    const pwd = String(password);
    if (pwd.length < 8) {
      errores.push('La contraseña debe tener al menos 8 caracteres');
    } else {
      if (!REGEX_PASSWORD_UPPER.test(pwd))
        errores.push('La contraseña debe contener al menos una letra mayúscula');
      if (!REGEX_PASSWORD_NUMBER.test(pwd))
        errores.push('La contraseña debe contener al menos un número');
      if (!REGEX_PASSWORD_SPECIAL.test(pwd))
        errores.push('La contraseña debe contener al menos un carácter especial (!@#$%...)');
      if (confirmPassword !== undefined && confirmPassword !== null && password !== confirmPassword)
        errores.push('Las contraseñas no coinciden');
    }
  } else if (confirmPassword !== undefined && confirmPassword !== null && String(confirmPassword).trim() !== '') {
    errores.push('Debes ingresar la contraseña antes de confirmarla');
  }

  // ── 14. Dirección (opcional) ───────────────────────────────────────────────
  if (direccion !== undefined && direccion !== null && String(direccion).trim() !== '') {
    const dir = String(direccion).trim();
    if (dir.length > 200) {
      errores.push('La dirección no puede superar los 200 caracteres');
    }
  }

  // ── 14. Ciudad (opcional) ──────────────────────────────────────────────────
  if (ciudad !== undefined && ciudad !== null && String(ciudad).trim() !== '') {
    const ciu = String(ciudad).trim();
    if (ciu.length < 2 || ciu.length > 50) {
      errores.push('La ciudad debe tener entre 2 y 50 caracteres');
    } else if (!REGEX_CIUDAD.test(ciu)) {
      errores.push('La ciudad solo puede contener letras, números, espacios y guiones');
    }
  }

  // ── 15. Departamento (opcional) ─────────────────────────────────────────────
  if (departamento !== undefined && departamento !== null && String(departamento).trim() !== '') {
    const dep = String(departamento).trim();
    if (dep.length < 2 || dep.length > 50) {
      errores.push('El departamento debe tener entre 2 y 50 caracteres');
    } else if (!REGEX_CIUDAD.test(dep)) {
      errores.push('El departamento solo puede contener letras, números, espacios y guiones');
    }
  }

  return errores;
}

module.exports = { validarEmpleado };