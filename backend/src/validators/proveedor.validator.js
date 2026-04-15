// Validaciones de negocio — Módulo Proveedores
// JRepuestos Medellín
// ============================================================

// FIX #2 + #5: tipos alineados al ENUM real del modelo (CC, CE, PA, RUNT, NIT, RUN)
const TIPOS_DOCUMENTO = ['CC', 'CE', 'PA', 'RUNT', 'NIT', 'RUN'];

/**
 * Valida los datos de un proveedor.
 * @param {object}  data            - Cuerpo de la petición (req.body)
 * @param {boolean} esActualizacion - Si es PUT, los campos obligatorios son opcionales
 * @returns {string[]} Array de mensajes de error. Vacío = sin errores.
 */
function validarProveedor(data, esActualizacion = false) {
    const errores = [];

    // FIX #1: nombres de campo corregidos para coincidir con el modelo Sequelize
    const {
        nombreEmpresa,
        tipoDocumento,
        numeroDocumento,
        personaContacto,
        telefono,
        email,
        direccion,
        ciudad,
        estado,
    } = data;

    // ── 1. Campos obligatorios (solo en creación) ──────────────────────────────
    if (!esActualizacion) {
        const requeridos = {
            nombreEmpresa,
            tipoDocumento,
            numeroDocumento,
            personaContacto,
            telefono,
            email,
        };
        for (const [campo, valor] of Object.entries(requeridos)) {
            if (!valor || String(valor).trim() === '') {
                errores.push(`El campo "${campo}" es obligatorio`);
            }
        }
        if (errores.length > 0) return errores;
    }

    // ── 2. Nombre de la empresa / persona ──────────────────────────────────────
    if (nombreEmpresa) {
        const ne = nombreEmpresa.trim();
        if (ne.length < 2 || ne.length > 100) {
            errores.push('El nombre debe tener entre 2 y 100 caracteres');
        }
    }

    // ── 3. Persona de contacto ─────────────────────────────────────────────────
    if (personaContacto) {
        const pc = personaContacto.trim();
        if (pc.length < 2 || pc.length > 100) {
            errores.push('El nombre del contacto debe tener entre 2 y 100 caracteres');
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(pc)) {
            errores.push('El nombre del contacto solo puede contener letras, espacios, guiones y apóstrofes');
        }
    }

    // ── 4. Tipo de documento ───────────────────────────────────────────────────
    if (tipoDocumento) {
        const tipo = tipoDocumento.trim().toUpperCase();
        if (!TIPOS_DOCUMENTO.includes(tipo)) {
            errores.push(
                `Tipo de documento inválido. Valores permitidos: ${TIPOS_DOCUMENTO.join(', ')}`
            );
        }
    }

    // ── 5. Número de documento ─────────────────────────────────────────────────
    if (numeroDocumento) {
        const doc = String(numeroDocumento).trim();
        if (doc.length < 2 || doc.length > 20) {
            errores.push('El número de documento debe tener entre 2 y 20 caracteres');
        } else if (
            tipoDocumento === 'CC' &&
            !/^\d+$/.test(doc)
        ) {
            errores.push('Para cédula (CC) el número solo puede contener dígitos');
        } else if (
            tipoDocumento === 'NIT' &&
            !/^\d{9,10}(-\d)?$/.test(doc)
        ) {
            errores.push('El NIT debe tener entre 9 y 10 dígitos, opcionalmente con dígito de verificación (ej: 900123456-7)');
        } else if (
            tipoDocumento === 'PA' &&
            !/^[a-zA-Z0-9]+$/.test(doc)
        ) {
            errores.push('El número de pasaporte solo puede contener letras y números');
        } else if (
            tipoDocumento === 'RUN' &&
            !/^\d+$/.test(doc)
        ) {
            errores.push('El RUN solo puede contener dígitos');
        } else if (
            tipoDocumento === 'RUNT' &&
            !/^\d+$/.test(doc)
        ) {
            errores.push('El RUNT solo puede contener dígitos');
        }
    }

    // ── 6. Teléfono ────────────────────────────────────────────────────────────
    if (telefono) {
        const tel = String(telefono).trim();
        if (tel.length < 2 || tel.length > 10) {
            errores.push('El teléfono debe tener entre 2 y 10 caracteres');
        } else if (!/^[+]?[\d\s\-(). ]{2,10}$/.test(tel)) {
            errores.push('El teléfono tiene un formato inválido (ej: 3001234567)');
        }
    }

    // ── 7. Email ───────────────────────────────────────────────────────────────
    if (email) {
        const mail = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
            errores.push('El correo electrónico no tiene un formato válido');
        } else if (mail.length > 50) {
            errores.push('El correo electrónico no puede superar los 50 caracteres');
        }
    }

    // ── 8. Ciudad (opcional) ───────────────────────────────────────────────────
    if (ciudad) {
        const c = ciudad.trim();
        if (c.length < 2 || c.length > 50) {
            errores.push('La ciudad debe tener entre 2 y 50 caracteres');
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(c)) {
            errores.push('La ciudad solo puede contener letras y espacios');
        }
    }

    // ── 9. Dirección (opcional) ────────────────────────────────────────────────
    // FIX #8: límite corregido a 200 para coincidir con STRING(200) del modelo
    if (direccion && String(direccion).trim().length > 200) {
        errores.push('La dirección no puede superar los 200 caracteres');
    }

    // ── 10. Estado ─────────────────────────────────────────────────────────────
    if (estado && !['activo', 'inactivo'].includes(estado)) {
        errores.push('El estado solo puede ser "activo" o "inactivo"');
    }

    // FIX #6: validación de "foto" eliminada — el modelo no tiene ese campo

    return errores;
}

module.exports = { validarProveedor };