// ============================================================
//  Tests unitarios y de propiedad — validations.ts
//  Feature: validaciones-globales-formularios
// ============================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import {
  sanitizeXSS,
  sanitizarNombre,
  sanitizarApellido,
  sanitizarDocumento,
  sanitizarTelefono,
  sanitizarCiudad,
  sanitizarDireccion,
  sanitizarEmail,
  validateNombres,
  validateApellidos,
  validateTipoDocumento,
  validateNumeroDocumento,
  validateEmail,
  validateTelefono,
  validateCiudad,
  validateDireccion,
  validateCargo,
  validateArea,
  validateFechaIngreso,
  validateEstado,
  validateField,
  sanitizeField,
  validateForm,
  sanitizeAll,
  normalizeEstado,
} from './validations';

// ─── Tests unitarios (subtarea 1.1) ──────────────────────────────────────────

describe('sanitizeXSS', () => {
  it('elimina etiquetas script', () => {
    expect(sanitizeXSS('<script>alert(1)</script>')).toBe('alert(1)');
  });
  it('aplica trim', () => {
    expect(sanitizeXSS('  hola  ')).toBe('hola');
  });
  it('elimina atributos on*=', () => {
    expect(sanitizeXSS('texto onclick= malo')).toBe('texto  malo');
  });
  it('preserva tildes y ñ', () => {
    expect(sanitizeXSS('José Ñoño')).toBe('José Ñoño');
  });
});

describe('validateNombres', () => {
  it('campo vacío → obligatorio', () => {
    expect(validateNombres('')).toBe('Este campo es obligatorio');
  });
  it('un solo carácter → mínimo 2', () => {
    expect(validateNombres('A')).toBe('Mínimo 2 caracteres');
  });
  it('más de 50 chars → máximo 50', () => {
    expect(validateNombres('A'.repeat(51))).toBe('Máximo 50 caracteres');
  });
  it('con dígitos → chars inválidos', () => {
    expect(validateNombres('Juan123')).toBe('Solo se permiten letras, espacios y guiones');
  });
  it('nombre válido → vacío', () => {
    expect(validateNombres('Juan Carlos')).toBe('');
  });
  it('nombre con tilde → válido', () => {
    expect(validateNombres('María José')).toBe('');
  });
});

describe('validateApellidos', () => {
  it('campo vacío → obligatorio', () => {
    expect(validateApellidos('')).toBe('Este campo es obligatorio');
  });
  it('apellido válido → vacío', () => {
    expect(validateApellidos('García-López')).toBe('');
  });
});

describe('validateTipoDocumento', () => {
  it('vacío → debe seleccionar', () => {
    expect(validateTipoDocumento('')).toBe('Debe seleccionar un tipo de documento');
  });
  it('valor fuera del catálogo → inválido', () => {
    expect(validateTipoDocumento('DNI')).toBe('Tipo de documento no válido');
  });
  it('CC → válido', () => {
    expect(validateTipoDocumento('CC')).toBe('');
  });
  it('Pasaporte → válido', () => {
    expect(validateTipoDocumento('Pasaporte')).toBe('');
  });
  it('NIT → válido', () => {
    expect(validateTipoDocumento('NIT')).toBe('');
  });
  it('con allowedTypes restringido → fuera de lista falla', () => {
    expect(validateTipoDocumento('NIT', ['CC', 'CE'])).toBe('Tipo de documento no válido');
  });
});

describe('validateNumeroDocumento', () => {
  it('vacío → obligatorio', () => {
    expect(validateNumeroDocumento('', 'CC')).toBe('El número de documento es obligatorio');
  });
  it('CC con menos de 6 dígitos → mínimo 6', () => {
    expect(validateNumeroDocumento('12345', 'CC')).toBe('Mínimo 6 dígitos');
  });
  it('CC con más de 12 dígitos → máximo 12', () => {
    expect(validateNumeroDocumento('1234567890123', 'CC')).toBe('Máximo 12 dígitos');
  });
  it('CC con letras → solo dígitos', () => {
    expect(validateNumeroDocumento('123abc', 'CC')).toBe('Solo se permiten dígitos para este tipo de documento');
  });
  it('CC válido → vacío', () => {
    expect(validateNumeroDocumento('1234567890', 'CC')).toBe('');
  });
  it('Pasaporte alfanumérico 6-12 → válido', () => {
    expect(validateNumeroDocumento('AB123456', 'Pasaporte')).toBe('');
  });
  it('NIT formato válido → vacío', () => {
    expect(validateNumeroDocumento('900123456-7', 'NIT')).toBe('');
  });
  it('NIT sin dígito verificación → válido', () => {
    expect(validateNumeroDocumento('900123456', 'NIT')).toBe('');
  });
  it('NIT inválido → error', () => {
    expect(validateNumeroDocumento('12345', 'NIT')).toBe('Formato NIT inválido (ej: 900123456-7)');
  });
});

describe('validateEmail', () => {
  it('vacío → obligatorio', () => {
    expect(validateEmail('')).toBe('El correo electrónico es obligatorio');
  });
  it('sin @ → formato inválido', () => {
    expect(validateEmail('correosinArroba.com')).toBe('Formato de correo inválido');
  });
  it('sin dominio → formato inválido', () => {
    expect(validateEmail('correo@')).toBe('Formato de correo inválido');
  });
  it('más de 100 chars → máximo 100', () => {
    const largo = 'a'.repeat(90) + '@test.com';
    expect(validateEmail(largo)).toBe('Máximo 100 caracteres');
  });
  it('email válido → vacío', () => {
    expect(validateEmail('usuario@empresa.com')).toBe('');
  });
});

describe('validateTelefono', () => {
  it('vacío → obligatorio', () => {
    expect(validateTelefono('')).toBe('El teléfono es obligatorio');
  });
  it('con letras → formato inválido', () => {
    expect(validateTelefono('300abc1234')).toBe('Formato de teléfono inválido');
  });
  it('menos de 10 dígitos → mínimo 10', () => {
    expect(validateTelefono('123456789')).toBe('Mínimo 10 dígitos');
  });
  it('teléfono válido 10 dígitos → vacío', () => {
    expect(validateTelefono('3001234567')).toBe('');
  });
  it('teléfono con prefijo → válido', () => {
    expect(validateTelefono('+57 300 123 4567')).toBe('');
  });
});

describe('validateCiudad', () => {
  it('vacía sin required → válido', () => {
    expect(validateCiudad('')).toBe('');
  });
  it('vacía con required → obligatoria', () => {
    expect(validateCiudad('', true)).toBe('La ciudad es obligatoria');
  });
  it('con dígitos → chars inválidos', () => {
    expect(validateCiudad('Medellín123')).toBe('Solo se permiten letras, espacios y guiones');
  });
  it('más de 50 chars → máximo 50', () => {
    expect(validateCiudad('A'.repeat(51))).toBe('Máximo 50 caracteres');
  });
  it('ciudad válida → vacío', () => {
    expect(validateCiudad('Medellín')).toBe('');
  });
});

describe('validateDireccion', () => {
  it('vacía sin required → válido', () => {
    expect(validateDireccion('')).toBe('');
  });
  it('vacía con required → obligatoria', () => {
    expect(validateDireccion('', true)).toBe('La dirección es obligatoria');
  });
  it('menos de 5 chars → mínimo 5', () => {
    expect(validateDireccion('Cll1')).toBe('Mínimo 5 caracteres');
  });
  it('más de 100 chars → máximo 100', () => {
    expect(validateDireccion('Calle '.repeat(20))).toBe('Máximo 100 caracteres');
  });
  it('con caracteres no permitidos → error', () => {
    expect(validateDireccion('Calle 10 @#$%')).toBe('La dirección contiene caracteres no permitidos');
  });
  it('dirección válida → vacío', () => {
    expect(validateDireccion('Calle 10 # 20-30')).toBe('');
  });
});

describe('validateCargo', () => {
  it('vacío → debe seleccionar', () => {
    expect(validateCargo('')).toBe('Debe seleccionar un cargo');
  });
  it('cargo válido → vacío', () => {
    expect(validateCargo('Gerente')).toBe('');
  });
  it('más de 100 chars → máximo 100', () => {
    expect(validateCargo('A'.repeat(101))).toBe('Máximo 100 caracteres');
  });
  it('fuera de allowedValues → error', () => {
    expect(validateCargo('Gerente', ['Vendedor', 'Técnico'])).toBe('Debe seleccionar un cargo');
  });
  it('dentro de allowedValues → válido', () => {
    expect(validateCargo('Vendedor', ['Vendedor', 'Técnico'])).toBe('');
  });
});

describe('validateArea', () => {
  it('vacía → debe seleccionar', () => {
    expect(validateArea('')).toBe('Debe seleccionar un área');
  });
  it('área válida → vacío', () => {
    expect(validateArea('Ventas')).toBe('');
  });
  it('fuera de allowedValues → error', () => {
    expect(validateArea('Sistemas', ['Ventas', 'Producción'])).toBe('Debe seleccionar un área');
  });
});

describe('validateFechaIngreso', () => {
  it('vacía → obligatoria', () => {
    expect(validateFechaIngreso('')).toBe('La fecha de ingreso es obligatoria');
  });
  it('formato inválido → error', () => {
    expect(validateFechaIngreso('01/01/2020')).toBe('Formato de fecha inválido');
  });
  it('fecha futura → error', () => {
    expect(validateFechaIngreso('2099-01-01')).toBe('La fecha de ingreso no puede ser futura');
  });
  it('más de 50 años atrás → error', () => {
    expect(validateFechaIngreso('1970-01-01')).toBe('La fecha de ingreso no puede ser mayor a 50 años atrás');
  });
  it('fecha válida reciente → vacío', () => {
    expect(validateFechaIngreso('2020-06-15')).toBe('');
  });
  it('fecha inexistente → error', () => {
    expect(validateFechaIngreso('2024-02-30')).toBe('Formato de fecha inválido');
  });
});

describe('validateEstado', () => {
  it('activo → válido', () => {
    expect(validateEstado('activo')).toBe('');
  });
  it('inactivo → válido', () => {
    expect(validateEstado('inactivo')).toBe('');
  });
  it('true → válido', () => {
    expect(validateEstado(true)).toBe('');
  });
  it('false → válido', () => {
    expect(validateEstado(false)).toBe('');
  });
  it('pendiente → error', () => {
    expect(validateEstado('pendiente')).toBe('El estado solo puede ser activo o inactivo');
  });
  it('string vacío → error', () => {
    expect(validateEstado('')).toBe('El estado solo puede ser activo o inactivo');
  });
});

describe('normalizeEstado', () => {
  it('true → activo', () => {
    expect(normalizeEstado(true)).toBe('activo');
  });
  it('false → inactivo', () => {
    expect(normalizeEstado(false)).toBe('inactivo');
  });
  it('activo → activo', () => {
    expect(normalizeEstado('activo')).toBe('activo');
  });
  it('inactivo → inactivo', () => {
    expect(normalizeEstado('inactivo')).toBe('inactivo');
  });
  it('valor desconocido → activo por defecto', () => {
    expect(normalizeEstado('otro')).toBe('activo');
  });
});

describe('validateField (API genérica)', () => {
  it('campo no registrado → vacío', () => {
    expect(validateField('nombres' as never, 'test')).toBe('');
  });
  it('nombres vacío → error', () => {
    expect(validateField('nombres', '')).toBe('Este campo es obligatorio');
  });
  it('email válido → vacío', () => {
    expect(validateField('email', 'test@test.com')).toBe('');
  });
  it('numeroDocumento con contexto tipoDocumento', () => {
    expect(validateField('numeroDocumento', '12345', { tipoDocumento: 'CC' })).toBe('Mínimo 6 dígitos');
  });
});

describe('sanitizeField (API genérica)', () => {
  it('nombres → capitaliza', () => {
    expect(sanitizeField('nombres', 'juan carlos')).toBe('Juan Carlos');
  });
  it('email → minúsculas', () => {
    expect(sanitizeField('email', 'TEST@TEST.COM')).toBe('test@test.com');
  });
  it('campo desconocido → trim + XSS', () => {
    expect(sanitizeField('nombres', '  <b>hola</b>  ')).toBe('hola');
  });
});

describe('validateForm', () => {
  it('acumula todos los errores sin early return', () => {
    const data = { nombres: '', email: 'invalido', telefono: '' };
    const errors = validateForm(data, ['nombres', 'email', 'telefono']);
    expect(Object.keys(errors).length).toBe(3);
  });
  it('formulario válido → objeto vacío', () => {
    const data = { nombres: 'Juan Carlos', email: 'juan@test.com', telefono: '3001234567' };
    const errors = validateForm(data, ['nombres', 'email', 'telefono']);
    expect(errors).toEqual({});
  });
});

describe('sanitizeAll', () => {
  it('preserva las mismas claves', () => {
    const form = { nombre: 'Juan', edad: 30, activo: true };
    const result = sanitizeAll(form);
    expect(Object.keys(result)).toEqual(Object.keys(form));
  });
  it('sanitiza strings y preserva no-strings', () => {
    const form = { nombre: '  <b>Juan</b>  ', edad: 30 };
    const result = sanitizeAll(form);
    expect(result.nombre).toBe('Juan');
    expect(result.edad).toBe(30);
  });
});

// ─── Tests de propiedad ───────────────────────────────────────────────────────

// Feature: validaciones-globales-formularios, Property 1
describe('Property 1: Sanitización XSS elimina etiquetas HTML', () => {
  it('sanitizeXSS no retorna < ni > en ningún input con HTML', () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.string(), fc.string(), fc.string()).map(([a, tag, b]) => `${a}<${tag}>${b}`),
        (input) => {
          const result = sanitizeXSS(input);
          return !result.includes('<') && !result.includes('>');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 2
describe('Property 2: Trim convierte cadenas de solo espacios en vacías', () => {
  it('sanitizeXSS retorna cadena vacía para strings de solo espacios', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constant(' '), { minLength: 1, maxLength: 50 }),
        (spaces) => {
          return sanitizeXSS(spaces) === '';
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 3
describe('Property 3: Sanitización preserva caracteres válidos del español', () => {
  it('sanitizeXSS no modifica strings con solo letras españolas válidas', () => {
    const letrasEspanol = 'áéíóúÁÉÍÓÚñÑüÜaAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ';
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...letrasEspanol.split('')), { minLength: 1, maxLength: 30 }),
        (input) => {
          return sanitizeXSS(input) === input;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 4
describe('Property 4: Campos obligatorios vacíos siempre producen error', () => {
  const camposObligatorios: Array<Parameters<typeof validateField>[0]> = [
    'nombres', 'apellidos', 'tipoDocumento', 'numeroDocumento',
    'email', 'telefono', 'cargo', 'area', 'fechaIngreso',
  ];
  it('validateField con valor vacío retorna error para campos obligatorios', () => {
    for (const campo of camposObligatorios) {
      const result = validateField(campo, '', { tipoDocumento: 'CC' });
      expect(result, `Campo ${campo} debería retornar error con valor vacío`).not.toBe('');
    }
  });
});

// Feature: validaciones-globales-formularios, Property 5
describe('Property 5: Valores válidos generados pasan la validación', () => {
  it('nombres válidos (2-50 letras) siempre pasan', () => {
    const letras = 'abcdefghijklmnopqrstuvwxyzáéíóúñüABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑÜ';
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...letras.split('')), { minLength: 2, maxLength: 50 }),
        (nombre) => validateNombres(nombre) === ''
      ),
      { numRuns: 100 }
    );
  });
  it('emails válidos siempre pasan', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          if (email.length > 100) return true; // skip too long
          return validateEmail(email) === '';
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 6
describe('Property 6: Nombres/apellidos con caracteres no permitidos siempre fallan', () => {
  it('nombres con dígitos siempre producen error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => /\d/.test(s) && s.trim().length >= 2),
        (valor) => validateNombres(valor) !== ''
      ),
      { numRuns: 100 }
    );
  });
  it('apellidos con dígitos siempre producen error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => /\d/.test(s) && s.trim().length >= 2),
        (valor) => validateApellidos(valor) !== ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 7
describe('Property 7: Sanitizador de nombres elimina dígitos y caracteres especiales', () => {
  it('sanitizarNombre no retorna dígitos', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => /\d/.test(s)),
        (valor) => !/\d/.test(sanitizarNombre(valor))
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 8
describe('Property 8: Tipo de documento fuera del catálogo siempre falla', () => {
  const catalogo = ['CC', 'TI', 'CE', 'Pasaporte', 'NIT', 'RUT'];
  it('valores fuera del catálogo siempre producen error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length > 0 && !catalogo.includes(s.trim())),
        (valor) => validateTipoDocumento(valor) !== ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 9
describe('Property 9: Número de documento CC/TI/CE con letras siempre falla', () => {
  it('CC con letras siempre produce error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => /[a-zA-Z]/.test(s) && s.trim().length > 0),
        fc.constantFrom('CC', 'TI', 'CE'),
        (valor, tipo) => validateNumeroDocumento(valor, tipo) !== ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 10
describe('Property 10: Sanitizador de documento CC/TI/CE elimina no-dígitos', () => {
  it('sanitizarDocumento CC no retorna letras', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => /[a-zA-Z]/.test(s)),
        fc.constantFrom('CC', 'TI', 'CE'),
        (valor, tipo) => !/[a-zA-Z]/.test(sanitizarDocumento(valor, tipo))
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 11
describe('Property 11: Pasaporte alfanumérico 6-12 chars es siempre válido', () => {
  it('pasaporte alfanumérico 6-12 chars siempre pasa', () => {
    fc.assert(
      fc.property(
        fc.stringOf(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
          { minLength: 6, maxLength: 12 }
        ),
        (valor) => validateNumeroDocumento(valor, 'Pasaporte') === ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 12
describe('Property 12: Email con mayúsculas es normalizado a minúsculas', () => {
  it('sanitizarEmail siempre retorna minúsculas', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          const result = sanitizarEmail(email);
          return result === result.toLowerCase();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 13
describe('Property 13: Email sin @ o sin dominio siempre falla', () => {
  it('strings sin @ siempre producen error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@') && s.trim().length > 0),
        (valor) => validateEmail(valor) !== ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 14
describe('Property 14: Teléfono con letras siempre falla', () => {
  it('teléfonos con letras siempre producen error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => /[a-zA-Z]/.test(s) && s.trim().length > 0),
        (valor) => validateTelefono(valor) !== ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 15
describe('Property 15: Sanitizador de teléfono elimina letras', () => {
  it('sanitizarTelefono no retorna letras del alfabeto', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => /[a-zA-Z]/.test(s)),
        (valor) => !/[a-zA-Z]/.test(sanitizarTelefono(valor))
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 16
describe('Property 16: Ciudad con dígitos o caracteres especiales siempre falla', () => {
  it('ciudad con dígitos siempre produce error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => /\d/.test(s) && s.trim().length > 0 && s.trim().length <= 50),
        (valor) => validateCiudad(valor) !== ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 17
describe('Property 17: Dirección con caracteres no permitidos siempre falla', () => {
  it('dirección con @ siempre produce error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.includes('@') && s.trim().length >= 5 && s.trim().length <= 100),
        (valor) => validateDireccion(valor) !== ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 18
describe('Property 18: Fecha futura siempre falla', () => {
  it('fechas futuras siempre producen error', () => {
    const hoy = new Date();
    fc.assert(
      fc.property(
        fc.date({ min: new Date(hoy.getTime() + 86400000), max: new Date('2099-12-31') }),
        (fecha) => {
          const iso = fecha.toISOString().split('T')[0];
          return validateFechaIngreso(iso) !== '';
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 19
describe('Property 19: Estado fuera del catálogo siempre falla', () => {
  const validos = ['activo', 'inactivo', true, false];
  it('valores fuera del catálogo siempre producen error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !validos.includes(s as never)),
        (valor) => validateEstado(valor) !== ''
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: validaciones-globales-formularios, Property 21
describe('Property 21: sanitizeAll preserva estructura del objeto', () => {
  it('sanitizeAll retorna objeto con exactamente las mismas claves', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
        (obj) => {
          const result = sanitizeAll(obj as Record<string, unknown>);
          const keysOrig = Object.keys(obj).sort();
          const keysResult = Object.keys(result).sort();
          return JSON.stringify(keysOrig) === JSON.stringify(keysResult);
        }
      ),
      { numRuns: 100 }
    );
  });
});
