// Validaciones de negocio — Módulo Usuarios
const { Op }             = require('sequelize');
const { Usuarios, Roles } = require('../models/index.js');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Mismas reglas que authValidator.js para consistencia
const PASSWORD_RULES = [
    { test: (p) => p.length >= 8,                             msg: 'La contraseña debe tener al menos 8 caracteres' },
    { test: (p) => /[A-Z]/.test(p),                           msg: 'La contraseña debe contener al menos una letra mayúscula' },
    { test: (p) => /\d/.test(p),                              msg: 'La contraseña debe contener al menos un número' },
    { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),         msg: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' },
];

/**
 * Valida los datos para crear un usuario.
 * @param {object} body - Cuerpo de la petición (req.body)
 * @returns {Promise<string[]>} Array de mensajes de error.
 */
async function validateCreateUsuario(body) {
    const errores = [];

    // ── 1. Campos obligatorios ──────────────────────────────────────────
    const requeridos = { email: body?.email, password: body?.password, rolesId: body?.rolesId };
    for (const [campo, valor] of Object.entries(requeridos)) {
        if (valor === undefined || valor === null || String(valor).trim() === '') {
            errores.push(`El campo "${campo}" es obligatorio`);
        }
    }
    if (errores.length > 0) return errores;

    // ── 2. Email ────────────────────────────────────────────────────────
    const mail = String(body.email).trim().toLowerCase();
    if (mail.length > 100)
        errores.push('El email no puede superar los 100 caracteres');
    else if (!EMAIL_REGEX.test(mail))
        errores.push('El email no tiene un formato válido (ej: usuario@dominio.com)');
    else if (mail.includes('..'))
        errores.push('El email no puede contener puntos consecutivos');
    else if (mail.split('@')[0].startsWith('.') || mail.split('@')[0].endsWith('.'))
        errores.push('El nombre de usuario del email no puede empezar ni terminar con punto');

    // ── 3. Contraseña ───────────────────────────────────────────────────
    const pass = String(body.password);
    if (pass.length > 255)
        errores.push('La contraseña no puede superar los 255 caracteres');
    else
        for (const rule of PASSWORD_RULES)
            if (!rule.test(pass)) errores.push(rule.msg);

    // ── 4. Rol ──────────────────────────────────────────────────────────
    if (!Number.isInteger(Number(body.rolesId)) || Number(body.rolesId) <= 0) {
        errores.push('El rol debe ser un identificador numérico válido');
    } else if (errores.length === 0) {
        const rol = await Roles.findByPk(Number(body.rolesId));
        if (!rol)
            errores.push('El rol especificado no existe');
        else if (rol.isActive === false)
            errores.push('No se puede asignar un rol inactivo a un usuario');
    }

    // ── 5. Estado (si viene) ────────────────────────────────────────────
    if (body?.estado !== undefined && body?.estado !== null) {
        if (!['activo', 'inactivo'].includes(body.estado))
            errores.push('El estado solo puede ser "activo" o "inactivo"');
    }

    // ── 6. Duplicado email — solo si no hay errores previos ─────────────
    if (errores.length === 0) {
        const emailExiste = await Usuarios.findOne({
            where: { email: mail.toLowerCase() },
        });
        if (emailExiste)
            errores.push('Ya existe un usuario registrado con ese correo electrónico');
    }

    return errores;
}

/**
 * Valida los datos para actualizar un usuario.
 * @param {object}     body       - Cuerpo de la petición (req.body)
 * @param {number|null} idExcluir - ID del usuario que se está editando (para excluir de la búsqueda de duplicados)
 * @returns {Promise<string[]>} Array de mensajes de error.
 */
async function validateUpdateUsuario(body, idExcluir = null) {
    const errores = [];

    // ── 1. Email (opcional en update) ───────────────────────────────────
    if (body?.email !== undefined && body?.email !== null) {
        if (!String(body.email).trim()) {
            errores.push('El email no puede estar vacío');
        } else {
            const mail = String(body.email).trim().toLowerCase();
            if (mail.length > 100)
                errores.push('El email no puede superar los 100 caracteres');
            else if (!EMAIL_REGEX.test(mail))
                errores.push('El email no tiene un formato válido (ej: usuario@dominio.com)');
            else if (mail.includes('..'))
                errores.push('El email no puede contener puntos consecutivos');
            else if (mail.split('@')[0].startsWith('.') || mail.split('@')[0].endsWith('.'))
                errores.push('El nombre de usuario del email no puede empezar ni terminar con punto');
        }
    }

    // ── 2. Contraseña (opcional en update) ─────────────────────────────
    if (body?.password !== undefined && body?.password !== null && String(body.password).length > 0) {
        const pass = String(body.password);
        if (pass.length > 255)
            errores.push('La contraseña no puede superar los 255 caracteres');
        else
            for (const rule of PASSWORD_RULES)
                if (!rule.test(pass)) errores.push(rule.msg);
    }

    // ── 3. Rol (opcional en update) ─────────────────────────────────────
    if (body?.rolesId !== undefined && body?.rolesId !== null) {
        if (!Number.isInteger(Number(body.rolesId)) || Number(body.rolesId) <= 0) {
            errores.push('El rol debe ser un identificador numérico válido');
        } else if (errores.length === 0) {
            const rol = await Roles.findByPk(Number(body.rolesId));
            if (!rol)
                errores.push('El rol especificado no existe');
            else if (rol.isActive === false)
                errores.push('No se puede asignar un rol inactivo a un usuario');
        }
    }

    // ── 4. Estado (opcional en update) ─────────────────────────────────
    if (body?.estado !== undefined && body?.estado !== null) {
        if (!['activo', 'inactivo'].includes(body.estado))
            errores.push('El estado solo puede ser "activo" o "inactivo"');
    }

    // ── 5. Duplicado email — si viene y no hay errores previos ──────────
    if (errores.length === 0 && body?.email !== undefined && body?.email !== null) {
        const mail = String(body.email).trim();
        if (mail) {
            const whereExcluir = idExcluir ? { id: { [Op.ne]: idExcluir } } : {};
            const emailExiste = await Usuarios.findOne({
                where: { ...whereExcluir, email: mail.toLowerCase() },
            });
            if (emailExiste)
                errores.push('Ya existe un usuario registrado con ese correo electrónico');
        }
    }

    return errores;
}

module.exports = { validateCreateUsuario, validateUpdateUsuario };
