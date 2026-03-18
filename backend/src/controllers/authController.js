const { Usuarios, Roles } = require('../models/index.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_SECRET = process.env.JWT_SECRET || '';
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
const RESET_CODE_TTL_MS = Number(process.env.RESET_CODE_TTL_MS || 10 * 60 * 1000); // 10 horas

// Al no tener tabla/campos para recuperar contraseña, guardamos códigos en memoria.
// Nota: se pierden al reiniciar el servidor. Para producción: persistir en BD y enviar por email/SMS.
const resetCodesByEmail = new Map(); // email -> { code, expiresAtMs }

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function generateNumericCode(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function safeUser(usuarioInstance) {
  if (!usuarioInstance) return null;
  const { id, rolesId, email, createdAt, updatedAt } = usuarioInstance;
  return { id, rolesId, email, createdAt, updatedAt };
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ message: 'Falta configurar JWT_SECRET' });
    }

    const usuario = await Usuarios.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rolesId: usuario.rolesId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'Login exitoso',
      token,
      usuario: safeUser(usuario)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const rolesId = req.body?.rolesId;
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!rolesId || !email || !password) {
      return res.status(400).json({ message: 'rolesId, email y password son requeridos' });
    }

    const rol = await Roles.findByPk(rolesId);
    if (!rol) {
      return res.status(404).json({ message: 'El rol especificado no existe' });
    }

    const existing = await Usuarios.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const usuario = await Usuarios.create({ rolesId, email, password: passwordHash });

    return res.status(201).json({ message: 'Usuario creado correctamente', usuario: safeUser(usuario) });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const mensajes = error.errors.map(e => e.message);
      return res.status(400).json({ message: 'Error de validación', errores: mensajes });
    }
    return res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// POST /api/auth/logout
// Con JWT stateless, "logout" es del lado del cliente (borrar token).
const logout = async (_req, res) => {
  return res.status(200).json({ message: 'Logout exitoso' });
};

// POST /api/auth/forgot-password
// Body: { email }
const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    const usuario = await Usuarios.findOne({ where: { email } });
    if (!usuario) {
      // Respuesta neutra para no filtrar si el email existe
      return res.status(200).json({ message: 'Si el email existe, se enviará un código de recuperación' });
    }

    const code = generateNumericCode(6);
    resetCodesByEmail.set(email, { code, expiresAtMs: Date.now() + RESET_CODE_TTL_MS });

    // En un entorno real: enviar `code` por email/SMS.
    // Para desarrollo lo devolvemos en la respuesta.
    return res.status(200).json({
      message: 'Código de recuperación generado',
      devCode: code,
      expiresInMs: RESET_CODE_TTL_MS
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al iniciar recuperación', error: error.message });
  }
};

// POST /api/auth/verify-code
// Body: { email, code }
const verifyCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ message: 'Email y code son requeridos' });
    }

    const entry = resetCodesByEmail.get(email);
    if (!entry) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    if (Date.now() > entry.expiresAtMs) {
      resetCodesByEmail.delete(email);
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    if (code !== entry.code) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    return res.status(200).json({ message: 'Código válido' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al verificar el código', error: error.message });
  }
};

// POST /api/auth/resend-code
// Body: { email }
const resendCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    const usuario = await Usuarios.findOne({ where: { email } });
    if (!usuario) {
      return res.status(200).json({ message: 'Si el email existe, se reenviará un código de recuperación' });
    }

    const code = generateNumericCode(6);
    resetCodesByEmail.set(email, { code, expiresAtMs: Date.now() + RESET_CODE_TTL_MS });

    return res.status(200).json({
      message: 'Código reenviado',
      devCode: code,
      expiresInMs: RESET_CODE_TTL_MS
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al reenviar el código', error: error.message });
  }
};

// POST /api/auth/reset-password
// Body: { email, code, newPassword }
const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'email, code y newPassword son requeridos' });
    }

    const entry = resetCodesByEmail.get(email);
    if (!entry || Date.now() > entry.expiresAtMs || code !== entry.code) {
      if (entry && Date.now() > entry.expiresAtMs) resetCodesByEmail.delete(email);
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    const usuario = await Usuarios.findOne({ where: { email } });
    if (!usuario) {
      resetCodesByEmail.delete(email);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await usuario.update({ password: passwordHash });

    resetCodesByEmail.delete(email);

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const mensajes = error.errors.map(e => e.message);
      return res.status(400).json({ message: 'Error de validación', errores: mensajes });
    }
    return res.status(500).json({ message: 'Error al actualizar la contraseña', error: error.message });
  }
};

module.exports = {
  login,
  register,
  logout,
  forgotPassword,
  resetPassword,
  verifyCode,
  resendCode
};
