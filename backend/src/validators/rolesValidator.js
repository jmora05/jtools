// Validaciones de negocio — Módulo Roles
const { Op }        = require('sequelize');
const { sequelize } = require('../config/jtools_db');
const { Roles }     = require('../models/index.js');

// Nombres reservados que no pueden usarse como nombre de rol personalizado
const PROTECTED_ROLES = ['administrador', 'cliente'];

// Solo letras, números, espacios, guiones y paréntesis (acentos incluidos)
const NAME_REGEX = /^[\w\sáéíóúÁÉÍÓÚñÑüÜ\-()+]+$/;

/**
 * Valida los datos para crear un rol.
 * @param {object} body - Cuerpo de la petición (req.body)
 * @returns {Promise<string[]>} Array de mensajes de error.
 */
async function validateCreateRol(body) {
    const errores = [];

    // ── 1. Campos obligatorios ──────────────────────────────────────────
    if (!body?.name || !String(body.name).trim()) {
        errores.push('El nombre del rol es obligatorio');
        return errores;
    }

    // ── 2. Nombre ───────────────────────────────────────────────────────
    const nombre = String(body.name).trim();
    if (nombre.length < 2 || nombre.length > 50)
        errores.push('El nombre del rol debe tener entre 2 y 50 caracteres');
    else if (!NAME_REGEX.test(nombre))
        errores.push('El nombre solo puede contener letras, números, espacios y guiones');
    else if (PROTECTED_ROLES.includes(nombre.toLowerCase()))
        errores.push(`El nombre "${nombre}" está reservado para roles del sistema y no puede usarse`);

    // ── 3. Descripción (opcional) ───────────────────────────────────────
    if (body?.description && String(body.description).trim().length > 200)
        errores.push('La descripción no puede superar los 200 caracteres');

    // ── 4. Permisos — al menos uno requerido, cada elemento entero positivo ──
    if (!Array.isArray(body?.permisosIds) || body.permisosIds.length === 0) {
        errores.push('Debes asignar al menos un permiso al rol');
    } else {
        const idsInvalidos = body.permisosIds.filter(
            (id) => !Number.isInteger(Number(id)) || Number(id) <= 0
        );
        if (idsInvalidos.length > 0)
            errores.push('Todos los permisos deben ser identificadores numéricos válidos');
    }

    // ── 5. Duplicado de nombre (case-insensitive) — solo si no hay errores ─
    if (errores.length === 0) {
        const existe = await Roles.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('name')),
                nombre.toLowerCase()
            ),
        });
        if (existe)
            errores.push('Ya existe un rol registrado con ese nombre');
    }

    return errores;
}

/**
 * Valida los datos para actualizar un rol.
 * @param {object}     body       - Cuerpo de la petición (req.body)
 * @param {number|null} idExcluir - ID del rol que se está editando
 * @returns {Promise<string[]>} Array de mensajes de error.
 */
async function validateUpdateRol(body, idExcluir = null) {
    const errores = [];

    // ── 1. Nombre (opcional en update) ─────────────────────────────────
    if (body?.name !== undefined && body?.name !== null) {
        if (!String(body.name).trim()) {
            errores.push('El nombre del rol no puede estar vacío');
        } else {
            const nombre = String(body.name).trim();
            if (nombre.length < 2 || nombre.length > 50)
                errores.push('El nombre del rol debe tener entre 2 y 50 caracteres');
            else if (!NAME_REGEX.test(nombre))
                errores.push('El nombre solo puede contener letras, números, espacios y guiones');
            else if (PROTECTED_ROLES.includes(nombre.toLowerCase()))
                errores.push(`El nombre "${nombre}" está reservado para roles del sistema y no puede usarse`);
        }
    }

    // ── 2. Descripción (opcional en update) ────────────────────────────
    if (body?.description !== undefined && body?.description !== null) {
        if (String(body.description).trim().length > 200)
            errores.push('La descripción no puede superar los 200 caracteres');
    }

    // ── 3. Duplicado de nombre (case-insensitive) — si viene y sin errores ─
    if (errores.length === 0 && body?.name !== undefined && body?.name !== null) {
        const nombre = String(body.name).trim();
        if (nombre) {
            const condicionNombre = sequelize.where(
                sequelize.fn('LOWER', sequelize.col('name')),
                nombre.toLowerCase()
            );
            const existe = await Roles.findOne({
                where: idExcluir
                    ? { [Op.and]: [condicionNombre, { id: { [Op.ne]: idExcluir } }] }
                    : condicionNombre,
            });
            if (existe)
                errores.push('Ya existe un rol registrado con ese nombre');
        }
    }

    return errores;
}

/**
 * Valida el array de permisos para asignar/reemplazar en un rol.
 * @param {object} body - Cuerpo de la petición (req.body)
 * @returns {string[]} Array de mensajes de error.
 */
function validateSetPermisos(body) {
    const errores = [];
    if (!Array.isArray(body?.permisosIds)) {
        errores.push('permisosIds debe ser un array');
    } else if (body.permisosIds.length === 0) {
        errores.push('Debes asignar al menos un permiso al rol');
    } else {
        const idsInvalidos = body.permisosIds.filter(
            (id) => !Number.isInteger(Number(id)) || Number(id) <= 0
        );
        if (idsInvalidos.length > 0)
            errores.push('Todos los permisos deben ser identificadores numéricos válidos');
    }
    return errores;
}

module.exports = { validateCreateRol, validateUpdateRol, validateSetPermisos };
