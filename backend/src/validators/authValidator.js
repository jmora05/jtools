/**
 * Validadores para el módulo de autenticación.
 * Cada función retorna un array de mensajes de error.
 * Si el array está vacío, la validación pasó.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Contraseña: mínimo 8 chars, 1 mayúscula, 2 números, 1 especial
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8,                              msg: 'La contraseña debe tener al menos 8 caracteres' },
  { test: (p) => /[A-Z]/.test(p),                            msg: 'La contraseña debe contener al menos una letra mayúscula' },
  { test: (p) => (p.match(/\d/g) || []).length >= 2,         msg: 'La contraseña debe contener al menos 2 números' },
  { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),          msg: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' },
];

function validateEmail(email) {
  const errors = [];
  if (!email || !String(email).trim()) {
    errors.push('El email es obligatorio');
  } else if (!EMAIL_REGEX.test(String(email).trim())) {
    errors.push('El email no tiene un formato válido');
  } else if (String(email).length > 255) {
    errors.push('El email no puede superar los 255 caracteres');
  }
  return errors;
}

function validatePassword(password, fieldLabel = 'La contraseña') {
  const errors = [];
  if (!password || !String(password)) {
    errors.push(`${fieldLabel} es obligatoria`);
    return errors;
  }
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(String(password))) errors.push(rule.msg);
  }
  return errors;
}

function validateLoginBody(body) {
  const errors = [];
  errors.push(...validateEmail(body?.email));
  if (!body?.password || !String(body.password).trim()) {
    errors.push('La contraseña es obligatoria');
  }
  return errors;
}

function validateRegisterBody(body) {
  const errors = [];

  errors.push(...validateEmail(body?.email));
  errors.push(...validatePassword(body?.password));

  // Nombres / apellidos
  if (!body?.nombres || !String(body.nombres).trim()) {
    errors.push('El nombre es obligatorio');
  } else if (String(body.nombres).trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  } else if (String(body.nombres).trim().length > 100) {
    errors.push('El nombre no puede superar los 100 caracteres');
  }

  if (!body?.apellidos || !String(body.apellidos).trim()) {
    // apellidos es opcional para empresas
    if (!body?.razon_social || !String(body.razon_social).trim()) {
      errors.push('Los apellidos son obligatorios para personas naturales');
    }
  } else if (String(body.apellidos).trim().length < 2) {
    errors.push('Los apellidos deben tener al menos 2 caracteres');
  } else if (String(body.apellidos).trim().length > 100) {
    errors.push('Los apellidos no pueden superar los 100 caracteres');
  }

  // Razón social (empresa)
  if (body?.razon_social !== undefined && body.razon_social !== null && String(body.razon_social).trim().length > 200) {
    errors.push('La razón social no puede superar los 200 caracteres');
  }

  // Documento
  if (!body?.numero_documento || !String(body.numero_documento).trim()) {
    errors.push('El número de documento es obligatorio');
  } else if (!/^[\w\-]{4,20}$/.test(String(body.numero_documento).trim())) {
    errors.push('El número de documento debe tener entre 4 y 20 caracteres alfanuméricos');
  }

  // Teléfono
  if (!body?.telefono || !String(body.telefono).trim()) {
    errors.push('El teléfono es obligatorio');
  } else if (!/^\+?[\d\s\-]{7,20}$/.test(String(body.telefono).trim())) {
    errors.push('El teléfono no tiene un formato válido (7-20 dígitos)');
  }

  // Ciudad
  if (!body?.ciudad || !String(body.ciudad).trim()) {
    errors.push('La ciudad es obligatoria');
  } else if (String(body.ciudad).trim().length < 2 || String(body.ciudad).trim().length > 100) {
    errors.push('La ciudad debe tener entre 2 y 100 caracteres');
  }

  // Dirección (opcional pero con límite)
  if (body?.direccion && String(body.direccion).trim().length > 200) {
    errors.push('La dirección no puede superar los 200 caracteres');
  }

  return errors;
}

function validateResetPasswordBody(body) {
  const errors = [];
  errors.push(...validateEmail(body?.email));

  const code = String(body?.code || '').trim();
  if (!code) {
    errors.push('El código de verificación es obligatorio');
  } else if (!/^\d{6}$/.test(code)) {
    errors.push('El código debe ser de 6 dígitos numéricos');
  }

  errors.push(...validatePassword(body?.newPassword, 'La nueva contraseña'));
  return errors;
}

function validateVerifyCodeBody(body) {
  const errors = [];
  errors.push(...validateEmail(body?.email));
  const code = String(body?.code || '').trim();
  if (!code) {
    errors.push('El código de verificación es obligatorio');
  } else if (!/^\d{6}$/.test(code)) {
    errors.push('El código debe ser de 6 dígitos numéricos');
  }
  return errors;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateLoginBody,
  validateRegisterBody,
  validateResetPasswordBody,
  validateVerifyCodeBody,
  PASSWORD_RULES,
};
