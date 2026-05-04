const { Usuarios, Roles, Clientes, PasswordResetOtp } = require('../models');
const { sequelize } = require('../config/jtools_db');
const bcrypt        = require('bcryptjs');
const jwt           = require('jsonwebtoken');
const { Op }        = require('sequelize');
const { sendOtpEmail } = require('../services/emailService');
const {
    validateLoginBody,
    validateRegisterBody,
    validateResetPasswordBody,
    validateVerifyCodeBody,
    validateEmail,
    validatePassword,
} = require('../validators/authValidator');

// ─── Constantes ───────────────────────────────────────────────────────────────
const JWT_EXPIRES_IN         = process.env.JWT_EXPIRES_IN         || '12h';
const JWT_SECRET             = process.env.JWT_SECRET             || '';
const RESET_TOKEN_SECRET     = process.env.RESET_TOKEN_SECRET     || 'reset_secret';
const RESET_TOKEN_EXPIRES    = process.env.RESET_TOKEN_EXPIRES    || '15m';
const BCRYPT_SALT_ROUNDS     = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const OTP_EXPIRATION_MINUTES = Number(process.env.OTP_EXPIRATION_MINUTES || 10);
const MAX_OTP_ATTEMPTS       = 5;   // intentos fallidos antes de bloquear

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function generateNumericCode(length = 6) {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function safeUser(u) {
    if (!u) return null;
    const { id, rolesId, email, createdAt, updatedAt } = u;
    return { id, rolesId, email, createdAt, updatedAt };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const errors = validateLoginBody(req.body);
        if (errors.length) return res.status(400).json({ message: 'Error de validación', errores: errors });

        const email    = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || '');

        if (!JWT_SECRET) return res.status(500).json({ message: 'Falta configurar JWT_SECRET' });

        const usuario = await Usuarios.findOne({
            where: { email },
            include: [{ model: Roles, as: 'rol', attributes: ['name'] }],
        });
        if (!usuario) return res.status(401).json({ message: 'Credenciales inválidas' });

        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) return res.status(401).json({ message: 'Credenciales inválidas' });

        const rolName  = usuario.rol?.name || '';
        const userType = rolName.toLowerCase() === 'cliente' ? 'client' : 'admin';

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rolesId: usuario.rolesId, userType },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(200).json({
            message: 'Login exitoso',
            token,
            usuario: { ...safeUser(usuario), rolName, userType },
        });
    } catch (error) {
        console.error('ERROR LOGIN:', error);
        return res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const errors = validateRegisterBody(req.body);
        if (errors.length) return res.status(400).json({ message: 'Error de validación', errores: errors });

        const email          = normalizeEmail(req.body?.email);
        const password       = String(req.body?.password || '');
        const nombres        = req.body?.nombres;
        const apellidos      = req.body?.apellidos;
        const razon_social   = req.body?.razon_social;
        const numero_documento = req.body?.numero_documento;
        const ciudad         = req.body?.ciudad;
        const telefono       = req.body?.telefono;
        const tipo_documento = req.body?.tipo_documento || null;
        const direccion      = req.body?.direccion || null;
        const contacto       = req.body?.contacto || null;

        const rolCliente = await Roles.findOne({
            where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'cliente'),
        });
        if (!rolCliente) return res.status(500).json({ message: 'El rol Cliente no existe en la base de datos' });

        const existing = await Usuarios.findOne({ where: { email } });
        if (existing) return res.status(409).json({ message: 'Ya existe un usuario con ese email' });

        const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        const resultado = await sequelize.transaction(async (t) => {
            const usuario = await Usuarios.create(
                { rolesId: rolCliente.id, email, password: passwordHash },
                { transaction: t }
            );
            const cliente = await Clientes.create(
                { email, nombres, apellidos, razon_social, numero_documento, ciudad, telefono, tipo_documento, direccion, contacto, estado: 'activo' },
                { transaction: t }
            );
            return { usuario, cliente };
        });

        return res.status(201).json({
            message: 'Usuario y cliente creados correctamente',
            usuario: safeUser(resultado.usuario),
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        return res.status(500).json({ message: 'Error al crear usuario', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Body: { email }
// Genera OTP, lo hashea, lo guarda en BD y lo envía por email.
// Siempre responde 200 para no revelar si el email existe (anti-enumeration).
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
    const GENERIC_MSG = 'Si el email está registrado, recibirás un código en los próximos minutos.';
    try {
        const emailErrors = validateEmail(req.body?.email);
        if (emailErrors.length) return res.status(400).json({ message: 'Error de validación', errores: emailErrors });

        const email   = normalizeEmail(req.body?.email);
        const usuario = await Usuarios.findOne({ where: { email } });

        // Respuesta neutra — no revelar si el email existe
        if (!usuario) return res.status(200).json({ message: GENERIC_MSG });

        // Limpiar OTPs anteriores de este usuario (evitar acumulación)
        await PasswordResetOtp.destroy({ where: { usuarioId: usuario.id } });

        // Generar OTP y hashearlo
        const otp     = generateNumericCode(6);
        const otpHash = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);
        const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

        await PasswordResetOtp.create({ usuarioId: usuario.id, otpHash, expiresAt });

        // Enviar email (si falla el envío, no bloqueamos — logueamos el error)
        try {
            const userName = email.split('@')[0];
            await sendOtpEmail({ to: email, otp, userName });
        } catch (emailErr) {
            console.error('Error al enviar email OTP:', emailErr.message);
            // En desarrollo, devolvemos el código para poder probar sin email real
            if (process.env.NODE_ENV !== 'production') {
                return res.status(200).json({ message: GENERIC_MSG, devCode: otp });
            }
        }

        return res.status(200).json({ message: GENERIC_MSG });
    } catch (error) {
        return res.status(500).json({ message: 'Error al iniciar recuperación', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-code
// Body: { email, code }
// Valida el OTP contra el hash en BD.
// Bloquea después de MAX_OTP_ATTEMPTS intentos fallidos.
// Si es válido: marca como usado y devuelve un resetToken JWT de un solo uso.
// ─────────────────────────────────────────────────────────────────────────────
const verifyCode = async (req, res) => {
    try {
        const errors = validateVerifyCodeBody(req.body);
        if (errors.length) return res.status(400).json({ message: 'Error de validación', errores: errors });

        const email = normalizeEmail(req.body?.email);
        const code  = String(req.body?.code || '').trim();

        const usuario = await Usuarios.findOne({ where: { email } });
        if (!usuario) return res.status(400).json({ message: 'Código inválido o expirado' });

        // Buscar el OTP más reciente no usado y no expirado
        const otpRecord = await PasswordResetOtp.findOne({
            where: {
                usuarioId: usuario.id,
                used:      false,
                expiresAt: { [Op.gt]: new Date() },
            },
            order: [['createdAt', 'DESC']],
        });

        if (!otpRecord) return res.status(400).json({ message: 'Código inválido o expirado' });

        // Verificar bloqueo por intentos fallidos
        if (otpRecord.failedAttempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({
                message: 'Demasiados intentos fallidos. Solicita un nuevo código.',
            });
        }

        // Comparar OTP con el hash
        const isValid = await bcrypt.compare(code, otpRecord.otpHash);
        if (!isValid) {
            await otpRecord.increment('failedAttempts');
            const remaining = MAX_OTP_ATTEMPTS - (otpRecord.failedAttempts + 1);
            return res.status(400).json({
                message: `Código incorrecto. Te quedan ${Math.max(0, remaining)} intento(s).`,
                remainingAttempts: Math.max(0, remaining),
            });
        }

        // OTP válido — marcarlo como usado
        await otpRecord.update({ used: true });

        // Emitir resetToken JWT de un solo uso (15 min)
        const resetToken = jwt.sign(
            { userId: usuario.id, email: usuario.email, purpose: 'password_reset' },
            RESET_TOKEN_SECRET,
            { expiresIn: RESET_TOKEN_EXPIRES }
        );

        return res.status(200).json({ message: 'Código verificado correctamente', resetToken });
    } catch (error) {
        return res.status(500).json({ message: 'Error al verificar el código', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-code
// Body: { email }
// Genera un nuevo OTP (invalida el anterior) y lo envía por email.
// ─────────────────────────────────────────────────────────────────────────────
const resendCode = async (req, res) => {
    const GENERIC_MSG = 'Si el email está registrado, recibirás un nuevo código.';
    try {
        const emailErrors = validateEmail(req.body?.email);
        if (emailErrors.length) return res.status(400).json({ message: 'Error de validación', errores: emailErrors });

        const email   = normalizeEmail(req.body?.email);
        const usuario = await Usuarios.findOne({ where: { email } });
        if (!usuario) return res.status(200).json({ message: GENERIC_MSG });

        // Invalidar OTPs anteriores
        await PasswordResetOtp.destroy({ where: { usuarioId: usuario.id } });

        const otp       = generateNumericCode(6);
        const otpHash   = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);
        const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

        await PasswordResetOtp.create({ usuarioId: usuario.id, otpHash, expiresAt });

        try {
            const userName = email.split('@')[0];
            await sendOtpEmail({ to: email, otp, userName });
        } catch (emailErr) {
            console.error('Error al reenviar email OTP:', emailErr.message);
            if (process.env.NODE_ENV !== 'production') {
                return res.status(200).json({ message: GENERIC_MSG, devCode: otp });
            }
        }

        return res.status(200).json({ message: GENERIC_MSG });
    } catch (error) {
        return res.status(500).json({ message: 'Error al reenviar el código', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Body: { resetToken, newPassword }
// Verifica el resetToken JWT, valida la contraseña y la actualiza.
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'resetToken y newPassword son requeridos' });
        }

        // Validar fortaleza de la contraseña
        const pwdErrors = validatePassword(newPassword, 'La nueva contraseña');
        if (pwdErrors.length) return res.status(400).json({ message: 'Error de validación', errores: pwdErrors });

        // Verificar el resetToken
        let payload;
        try {
            payload = jwt.verify(resetToken, RESET_TOKEN_SECRET);
        } catch {
            return res.status(400).json({ message: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.' });
        }

        if (payload.purpose !== 'password_reset') {
            return res.status(400).json({ message: 'Token inválido' });
        }

        const usuario = await Usuarios.findByPk(payload.userId);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Hashear y guardar la nueva contraseña
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        await usuario.update({ password: passwordHash });

        // Limpiar todos los OTPs del usuario (ya no son necesarios)
        await PasswordResetOtp.destroy({ where: { usuarioId: usuario.id } });

        return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        return res.status(500).json({ message: 'Error al actualizar la contraseña', error: error.message });
    }
};

const logout = (_req, res) => res.status(200).json({ message: 'Sesión cerrada correctamente' });

module.exports = { login, register, logout, forgotPassword, resetPassword, verifyCode, resendCode };
