/**
 * authService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de servicio para todas las operaciones de autenticación.
 *
 * RESPONSABILIDAD ÚNICA: este archivo solo se comunica con la API REST.
 * No maneja estado global (eso es trabajo del store/context), no redirige
 * rutas (eso es trabajo del componente), no muestra mensajes (eso es trabajo
 * de la UI). Solo envía peticiones y devuelve datos o lanza errores tipados.
 *
 * Stack: React + TypeScript | Backend: Node.js/Express + JWT + Bcrypt
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getApiBaseUrl, handleResponse, buildAuthHeaders } from '../../../services/http';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

/** Versión "segura" del usuario: nunca incluye el hash de contraseña. */
export type SafeUser = {
  id: number;
  rolesId: number;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  usuario: SafeUser;
};

/**
 * Valores que el backend acepta para tipo_documento.
 * Usar un union type en lugar de `string` evita que el formulario
 * envíe un valor inválido sin que TypeScript lo detecte en compilación.
 */
export type TipoDocumento =
  | 'cedula'
  | 'nit'
  | 'cedula de extranjeria'
  | 'pasaporte'
  | 'rut';

export type RegisterPayload = {
  email:            string;
  password:         string;
  nombres:          string;
  apellidos:        string;
  tipo_documento:   TipoDocumento;
  numero_documento: string;
  telefono:         string;
  ciudad:           string;
  razon_social?:    string;   // opcional: solo para NIT/RUT (empresas)
  direccion?:       string;   // opcional
  contacto?:        string;   // opcional: persona de contacto en empresas
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES INTERNAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapeo de abreviaciones comunes del formulario al valor exacto del backend.
 *
 * ¿Por qué aquí y no en el componente?
 * Centralizar la transformación en el servicio garantiza que CUALQUIER
 * componente que llame a register() siempre envíe el formato correcto,
 * sin depender de que cada formulario implemente su propio mapeo.
 */
const TIPO_DOCUMENTO_MAP: Record<string, TipoDocumento> = {
  CC:  'cedula',
  NIT: 'nit',
  CE:  'cedula de extranjeria',
  PA:  'pasaporte',
  RUT: 'rut',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS PRIVADOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normaliza el tipo de documento sin importar cómo venga del formulario.
 * Acepta tanto abreviaciones ("CC") como valores completos ("cedula").
 *
 * Ejemplos:
 *   "CC"     → "cedula"
 *   "cedula" → "cedula"   (ya es válido, pasa directo)
 *   "cc"     → "cedula"   (minúsculas también)
 */
function normalizeTipoDocumento(value: string): TipoDocumento {
  const upper = value.trim().toUpperCase();
  if (TIPO_DOCUMENTO_MAP[upper]) return TIPO_DOCUMENTO_MAP[upper];

  const lower = value.trim().toLowerCase() as TipoDocumento;
  const validos: TipoDocumento[] = ['cedula', 'nit', 'cedula de extranjeria', 'pasaporte', 'rut'];
  if (validos.includes(lower)) return lower;

  // Si llega aquí, el valor no es reconocible. Se devuelve tal cual y el
  // backend retornará el error de validación con el mensaje apropiado.
  return lower;
}

/**
 * Limpia un string opcional: si es vacío o solo espacios, devuelve undefined.
 * Esto evita que el backend reciba razon_social: "" y lo rechace por vacío.
 */
function cleanOptional(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES EXPORTADAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LOGIN
 * ─────
 * Envía credenciales al backend y recibe un JWT + datos básicos del usuario.
 *
 * LÓGICA INTERNA:
 *   1. Hace POST a /auth/login con { email, password }.
 *   2. handleResponse lanza un error si el status no es 2xx.
 *   3. Devuelve { token, usuario } que el llamador guardará en su store/context.
 *
 * CONEXIÓN CON EL SISTEMA:
 *   El token JWT devuelto debe almacenarse (localStorage o memoria) y adjuntarse
 *   a todas las peticiones privadas mediante buildAuthHeaders().
 *
 * SEGURIDAD:
 *   - La contraseña viaja en el body (no en la URL), cifrada por HTTPS.
 *   - El backend compara con bcrypt.compare(), nunca con texto plano.
 *   - El JWT tiene expiración (JWT_EXPIRES_IN en el backend).
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  if (!email?.trim() || !password) {
    throw new Error('Email y contraseña son requeridos');
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  return handleResponse<LoginResponse>(response);
}

/**
 * REGISTER
 * ────────
 * Crea un nuevo usuario y su perfil de cliente en una sola operación transaccional.
 *
 * LÓGICA INTERNA:
 *   1. Sanitiza el payload: normaliza tipo_documento y limpia opcionales vacíos.
 *   2. Hace POST a /auth/register.
 *   3. El backend crea Usuario + Cliente dentro de una transacción SQL,
 *      garantizando que si algo falla, nada queda a medias.
 *
 * CONEXIÓN CON EL SISTEMA:
 *   Tras un registro exitoso, el usuario debe hacer login por separado
 *   (el backend no devuelve token aquí, solo confirma la creación).
 *
 * POR QUÉ SE SANITIZA AQUÍ:
 *   Centralizar la transformación en el servicio desacopla el formulario
 *   del contrato de la API. El formulario puede usar "CC", "NIT", etc.
 *   sin preocuparse por el formato exacto del backend.
 */
export async function register(
  payload: RegisterPayload,
): Promise<{ message: string; usuario: SafeUser }> {

  // Sanitización del payload antes de enviarlo
  const payloadLimpio: RegisterPayload = {
    ...payload,
    email:          payload.email.trim().toLowerCase(),
    nombres:        payload.nombres.trim(),
    apellidos:      payload.apellidos.trim(),
    tipo_documento: normalizeTipoDocumento(payload.tipo_documento),
    razon_social:   cleanOptional(payload.razon_social),
    direccion:      cleanOptional(payload.direccion),
    contacto:       cleanOptional(payload.contacto),
  };

  // Solo en desarrollo — eliminar en producción para no exponer datos sensibles en consola
  if (process.env.NODE_ENV === 'development') {
    console.log('Payload enviado:', JSON.stringify(payloadLimpio, null, 2));
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(payloadLimpio),
  });

  return handleResponse<{ message: string; usuario: SafeUser }>(response);
}

/**
 * FORGOT PASSWORD
 * ───────────────
 * Inicia el flujo de recuperación de contraseña enviando un código al email.
 *
 * LÓGICA INTERNA:
 *   El backend genera un código numérico de 6 dígitos, lo guarda en memoria
 *   con TTL y lo devuelve en la respuesta (solo en desarrollo).
 *   En producción debería enviarlo por email/SMS sin devolverlo en la API.
 *
 * SEGURIDAD:
 *   - El backend responde igual si el email existe o no (respuesta neutra),
 *     evitando que un atacante pueda enumerar emails registrados.
 *   - devCode solo debe usarse en entornos de desarrollo/testing.
 */
export async function forgotPassword(
  email: string,
): Promise<{ message: string; devCode?: string; expiresInMs?: number }> {
  if (!email?.trim()) {
    throw new Error('El email es requerido');
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  return handleResponse<{ message: string; devCode?: string; expiresInMs?: number }>(response);
}

/**
 * VERIFY CODE
 * ───────────
 * Valida que el código de 6 dígitos ingresado por el usuario sea correcto y
 * no haya expirado, antes de permitir el cambio de contraseña.
 *
 * LÓGICA INTERNA:
 *   El backend busca el código en su mapa en memoria asociado al email,
 *   verifica que no haya expirado (TTL) y que los dígitos coincidan.
 *
 * CONEXIÓN CON EL SISTEMA:
 *   Este paso es obligatorio antes de llamar a resetPassword().
 *   El flujo completo es: forgotPassword → verifyCode → resetPassword.
 */
export async function verifyCode(
  email: string,
  code: string,
): Promise<{ message: string }> {
  if (!email?.trim() || !code?.trim()) {
    throw new Error('Email y código son requeridos');
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/verify-code`, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
  });

  return handleResponse<{ message: string }>(response);
}

/**
 * RESEND CODE
 * ───────────
 * Regenera y reenvía el código de recuperación para el email indicado.
 *
 * LÓGICA INTERNA:
 *   Genera un nuevo código (invalidando el anterior) y reinicia el TTL.
 *   Útil cuando el código expiró o el usuario no lo recibió.
 *
 * CUÁNDO USARLO:
 *   Mostrar un botón "Reenviar código" en la pantalla de verificación,
 *   idealmente con un cooldown de ~60 segundos para evitar spam.
 */
export async function resendCode(
  email: string,
): Promise<{ message: string; devCode?: string; expiresInMs?: number }> {
  if (!email?.trim()) {
    throw new Error('El email es requerido');
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/resend-code`, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  return handleResponse<{ message: string; devCode?: string; expiresInMs?: number }>(response);
}

/**
 * RESET PASSWORD
 * ──────────────
 * Cambia la contraseña del usuario después de verificar el código de recuperación.
 *
 * LÓGICA INTERNA:
 *   1. El backend re-verifica el código (por si alguien llama al endpoint directo).
 *   2. Hashea la nueva contraseña con bcrypt.
 *   3. Actualiza el campo password en la BD y elimina el código del mapa en memoria.
 *
 * SEGURIDAD:
 *   - El backend nunca acepta la nueva contraseña sin validar el código primero.
 *   - La contraseña se hashea siempre del lado del servidor, nunca se guarda en plano.
 *   - El código se elimina tras usarse (uso único), evitando reutilización.
 *
 * CONEXIÓN CON EL SISTEMA:
 *   Tras un reset exitoso, redirigir al usuario al login para que inicie
 *   sesión con su nueva contraseña.
 */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  if (!email?.trim() || !code?.trim() || !newPassword) {
    throw new Error('Email, código y nueva contraseña son requeridos');
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({
      email:       email.trim().toLowerCase(),
      code:        code.trim(),
      newPassword,
    }),
  });

  return handleResponse<{ message: string }>(response);
}