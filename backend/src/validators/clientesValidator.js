//  Validaciones de negocio — Módulo Clientes
//  JRepuestos Medellín
// ============================================================

const { Op }       = require('sequelize');
const { sequelize } = require('../config/jtools_db');
const { Clientes }  = require('../models/index.js');

const TIPOS_DOCUMENTO = ['cedula', 'nit', 'cedula de extranjeria', 'pasaporte', 'rut'];

const REGEX_PASSWORD_UPPER   = /[A-Z]/;
const REGEX_PASSWORD_NUMBER  = /[0-9]/;
const REGEX_PASSWORD_SPECIAL = /[!@#$%^&*()\-_=+\[\]{};':",.<>?/\\|`~]/;

/**
 * Valida los datos de un cliente.
 * @param {object}   data            - Cuerpo de la petición (req.body)
 * @param {boolean}  esActualizacion - Si es PUT, los campos obligatorios son opcionales
 * @param {number|null} idExcluir    - ID a excluir en validación de duplicados (edición)
 * @returns {Promise<string[]>} Array de mensajes de error.
 */
async function validarCliente(data, esActualizacion = false, idExcluir = null) {
    const errores = [];
    const {
        nombres, apellidos, tipo_documento, numero_documento,
        telefono, email, direccion, ciudad, departamento, razon_social, estado, foto,
        password, confirmPassword,
    } = data;

    // ── 1. Campos obligatorios (solo en creación) ──────────────────────
    if (!esActualizacion) {
        const requeridos = {
            nombres, apellidos, tipo_documento,
            numero_documento, telefono, email, ciudad, departamento,
        };
        for (const [campo, valor] of Object.entries(requeridos)) {
            if (!valor || String(valor).trim() === '') {
                errores.push(`El campo "${campo}" es obligatorio`);
            }
        }
        if (errores.length > 0) return errores;
    }

    // ── 2. Nombres ─────────────────────────────────────────────────────
    if (nombres && nombres.trim() !== 'N/A') {
        const n = nombres.trim();
        if (n.length < 2 || n.length > 30)
            errores.push('Los nombres deben tener entre 2 y 30 caracteres');
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(n))
            errores.push('Los nombres solo pueden contener letras, espacios, guiones y apóstrofes');
    }

    // ── 3. Apellidos ───────────────────────────────────────────────────
    if (apellidos && apellidos.trim() !== 'N/A') {
        const a = apellidos.trim();
        if (a.length < 2 || a.length > 30)
            errores.push('Los apellidos deben tener entre 2 y 30 caracteres');
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(a))
            errores.push('Los apellidos solo pueden contener letras, espacios, guiones y apóstrofes');
    }

    // ── 4. Tipo de documento ───────────────────────────────────────────
    if (tipo_documento) {
        const tipo = tipo_documento.trim().toLowerCase();
        if (!TIPOS_DOCUMENTO.includes(tipo))
            errores.push(`Tipo de documento inválido. Valores permitidos: ${TIPOS_DOCUMENTO.join(', ')}`);
    }

    // ── 5. Número de documento ─────────────────────────────────────────
    if (numero_documento) {
        const doc = String(numero_documento).trim();
        if (doc.length < 5 || doc.length > 20)
            errores.push('El número de documento debe tener entre 5 y 20 caracteres');
        else if (
            (tipo_documento === 'cedula' || tipo_documento === 'cedula de extranjeria') &&
            !/^\d+$/.test(doc)
        )
            errores.push('Para cédula y cédula de extranjería el número solo puede contener dígitos');
        else if (tipo_documento === 'nit' && !/^\d{9,10}(-\d)?$/.test(doc))
            errores.push('El NIT debe tener entre 9 y 10 dígitos, opcionalmente con dígito de verificación (ej: 900123456-7)');
        else if (tipo_documento === 'pasaporte' && !/^[a-zA-Z0-9]+$/.test(doc))
            errores.push('El número de pasaporte solo puede contener letras y números');
        else if (tipo_documento === 'rut' && !/^\d+$/.test(doc))
            errores.push('El RUT solo puede contener dígitos');
    }

    // ── 6. Teléfono ────────────────────────────────────────────────────
    if (telefono) {
        const tel = String(telefono).trim();
        if (!/^[+]?[\d\s\-(). ]{7,20}$/.test(tel))
            errores.push('El teléfono tiene un formato inválido (ej: 3001234567 o +57 300 123 4567)');
    }

    // ── 7. Email ───────────────────────────────────────────────────────
    if (email) {
        const mail = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))
            errores.push('El correo electrónico no tiene un formato válido');
        else if (mail.length > 100)
            errores.push('El correo electrónico no puede superar los 100 caracteres');
    }

    // ── 8. Ciudad ──────────────────────────────────────────────────────
    if (ciudad) {
        const c = ciudad.trim();
        if (c.length < 2 || c.length > 50)
            errores.push('La ciudad debe tener entre 2 y 50 caracteres');
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(c))
            errores.push('La ciudad solo puede contener letras y espacios');
    }

    // ── 8b. Departamento ────────────────────────────────────────────────
    if (departamento) {
        const d = departamento.trim();
        if (d.length < 2 || d.length > 50)
            errores.push('El departamento debe tener entre 2 y 50 caracteres');
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(d))
            errores.push('El departamento solo puede contener letras y espacios');
    }

    // ── 9. Dirección (opcional) ────────────────────────────────────────
    if (direccion && String(direccion).trim().length > 100)
        errores.push('La dirección no puede superar los 100 caracteres');

    // ── 10. Razón social ───────────────────────────────────────────────
    if (razon_social) {
        const rs = razon_social.trim();
        if (rs.length > 100)
            errores.push('La razón social no puede superar los 100 caracteres');
        if (tipo_documento && !['nit', 'rut'].includes(tipo_documento))
            errores.push('La razón social solo aplica para clientes con NIT o RUT');
    }

    // ── 11. Estado ─────────────────────────────────────────────────────
    if (estado && !['activo', 'inactivo'].includes(estado))
        errores.push('El estado solo puede ser "activo" o "inactivo"');

    // ── 12. Contraseña (opcional — solo si se proporciona)
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
                errores.push('La contraseña debe contener al menos un caracter especial (!@#$%...)');
            if (confirmPassword !== undefined && confirmPassword !== null && password !== confirmPassword)
                errores.push('Las contraseñas no coinciden');
        }
    } else if (confirmPassword !== undefined && confirmPassword !== null && String(confirmPassword).trim() !== '') {
        errores.push('Debes ingresar la contraseña antes de confirmarla');
    }

    // ── 13. Foto ───────────────────────────────────────────────────────
    if (foto) {
        const extensionesValidas = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!extensionesValidas.some(ext => foto.toLowerCase().endsWith(ext)))
            errores.push('La foto debe tener una extensión válida: .jpg, .jpeg, .png o .webp');
        if (foto.length > 255)
            errores.push('La ruta de la foto no puede superar los 255 caracteres');
    }

    // ── 13. Duplicados — solo si no hay errores previos ────────────────
    if (errores.length === 0) {
        const excluirId = idExcluir ? [{ id: { [Op.ne]: idExcluir } }] : [];

        if (email) {
            // Case-insensitive: LOWER(email) = LOWER(:valor)
            const condEmail = sequelize.where(
                sequelize.fn('LOWER', sequelize.col('email')),
                email.trim().toLowerCase()
            );
            const emailExiste = await Clientes.findOne({
                where: { [Op.and]: [condEmail, ...excluirId] },
            });
            if (emailExiste)
                errores.push('Ya existe un cliente registrado con ese correo electrónico');
        }

        if (numero_documento && !errores.length) {
            // Número de documento: comparación exacta (ya está normalizado)
            const docExiste = await Clientes.findOne({
                where: { [Op.and]: [{ numero_documento: String(numero_documento).trim() }, ...excluirId] },
            });
            if (docExiste)
                errores.push('Ya existe un cliente registrado con ese número de documento');
        }
    }

    return errores;
}

module.exports = { validarCliente };