/**
 * Validadores para el módulo de usuarios (CRUD admin).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateCreateUsuario(body) {
  const errors = [];

  // Email
  if (!body?.email || !String(body.email).trim()) {
    errors.push('El email es obligatorio');
  } else if (!EMAIL_REGEX.test(String(body.email).trim())) {
    errors.push('El email no tiene un formato válido');
  } else if (String(body.email).length > 255) {
    errors.push('El email no puede superar los 255 caracteres');
  }

  // Contraseña (requerida al crear)
  if (!body?.password || !String(body.password).trim()) {
    errors.push('La contraseña es obligatoria');
  } else if (String(body.password).length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  } else if (String(body.password).length > 255) {
    errors.push('La contraseña no puede superar los 255 caracteres');
  }

  // Rol
  if (body?.rolesId === undefined || body?.rolesId === null || body?.rolesId === '') {
    errors.push('El rol es obligatorio');
  } else if (!Number.isInteger(Number(body.rolesId)) || Number(body.rolesId) <= 0) {
    errors.push('El rol debe ser un identificador numérico válido');
  }

  return errors;
}

function validateUpdateUsuario(body) {
  const errors = [];

  // Email (opcional en update, pero si viene debe ser válido)
  if (body?.email !== undefined && body?.email !== null) {
    if (!String(body.email).trim()) {
      errors.push('El email no puede estar vacío');
    } else if (!EMAIL_REGEX.test(String(body.email).trim())) {
      errors.push('El email no tiene un formato válido');
    } else if (String(body.email).length > 255) {
      errors.push('El email no puede superar los 255 caracteres');
    }
  }

  // Contraseña (opcional en update, pero si viene debe cumplir mínimo)
  if (body?.password !== undefined && body?.password !== null && String(body.password).length > 0) {
    if (String(body.password).length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    } else if (String(body.password).length > 255) {
      errors.push('La contraseña no puede superar los 255 caracteres');
    }
  }

  // Rol (opcional en update, pero si viene debe ser válido)
  if (body?.rolesId !== undefined && body?.rolesId !== null) {
    if (!Number.isInteger(Number(body.rolesId)) || Number(body.rolesId) <= 0) {
      errors.push('El rol debe ser un identificador numérico válido');
    }
  }

  return errors;
}

module.exports = { validateCreateUsuario, validateUpdateUsuario };
