/**
 * Validadores para el módulo de permisos.
 */

// Solo letras, números, espacios, guiones y paréntesis
const NAME_REGEX = /^[\w\sáéíóúÁÉÍÓÚñÑüÜ\-()]+$/;

function validateCreatePermiso(body) {
  const errors = [];

  if (!body?.name || !String(body.name).trim()) {
    errors.push('El nombre del permiso es obligatorio');
  } else if (String(body.name).trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  } else if (String(body.name).trim().length > 50) {
    errors.push('El nombre no puede superar los 50 caracteres');
  } else if (!NAME_REGEX.test(String(body.name).trim())) {
    errors.push('El nombre solo puede contener letras, números, espacios y guiones');
  }

  if (body?.description && String(body.description).trim().length > 200) {
    errors.push('La descripción no puede superar los 200 caracteres');
  }

  return errors;
}

function validateUpdatePermiso(body, isSystem = false) {
  const errors = [];

  // Los permisos del sistema no permiten cambiar el nombre
  if (!isSystem) {
    if (body?.name !== undefined) {
      if (!String(body.name).trim()) {
        errors.push('El nombre del permiso no puede estar vacío');
      } else if (String(body.name).trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      } else if (String(body.name).trim().length > 50) {
        errors.push('El nombre no puede superar los 50 caracteres');
      } else if (!NAME_REGEX.test(String(body.name).trim())) {
        errors.push('El nombre solo puede contener letras, números, espacios y guiones');
      }
    }
  }

  if (body?.description !== undefined && body.description !== null) {
    if (String(body.description).trim().length > 200) {
      errors.push('La descripción no puede superar los 200 caracteres');
    }
  }

  return errors;
}

module.exports = { validateCreatePermiso, validateUpdatePermiso };
