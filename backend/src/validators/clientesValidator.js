
//  Validaciones de negocio — Módulo Clientes
//  JRepuestos Medellín
// ============================================================
 
const TIPOS_DOCUMENTO = ['cedula', 'nit', 'cedula de extranjeria', 'pasaporte', 'rut'];
 
/**
 * Valida los datos de un cliente.
 * @param {object} data          - Cuerpo de la petición (req.body)
 * @param {boolean} esActualizacion - Si es PUT, los campos obligatorios son opcionales
 * @returns {string[]} Array de mensajes de error. Si está vacío, no hay errores.
 */
function validarCliente(data, esActualizacion = false) {
    const errores = [];
    const {
        nombres,
        apellidos,
        tipo_documento,
        numero_documento,
        telefono,
        email,
        direccion,
        ciudad,
        razon_social,
        estado,
        foto,
    } = data;
 
    // ── 1. Campos obligatorios (solo en creación) ──────────────────────
    if (!esActualizacion) {
        const requeridos = {
            nombres,
            apellidos,
            tipo_documento,
            numero_documento,
            telefono,
            email,
            ciudad,
        };
        for (const [campo, valor] of Object.entries(requeridos)) {
            if (!valor || String(valor).trim() === '') {
                errores.push(`El campo "${campo}" es obligatorio`);
            }
        }
        if (errores.length > 0) return errores;
    }
 
    // ── 2. Nombres ─────────────────────────────────────────────────────
    if (nombres) {
        const n = nombres.trim();
        if (n.length < 2 || n.length > 50) {
            errores.push('Los nombres deben tener entre 2 y 50 caracteres');
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(n)) {
            errores.push('Los nombres solo pueden contener letras, espacios, guiones y apóstrofes');
        }
    }
 
    // ── 3. Apellidos ───────────────────────────────────────────────────
    if (apellidos) {
        const a = apellidos.trim();
        if (a.length < 2 || a.length > 50) {
            errores.push('Los apellidos deben tener entre 2 y 50 caracteres');
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(a)) {
            errores.push('Los apellidos solo pueden contener letras, espacios, guiones y apóstrofes');
        }
    }
 
    // ── 4. Tipo de documento ───────────────────────────────────────────
    if (tipo_documento) {
        const tipo = tipo_documento.trim().toLowerCase();
        if (!TIPOS_DOCUMENTO.includes(tipo)) {
            errores.push(
                `Tipo de documento inválido. Valores permitidos: ${TIPOS_DOCUMENTO.join(', ')}`
            );
        }
    }
 
    // ── 5. Número de documento ─────────────────────────────────────────
    if (numero_documento) {
        const doc = String(numero_documento).trim();
        if (doc.length < 5 || doc.length > 20) {
            errores.push('El número de documento debe tener entre 5 y 20 caracteres');
        } else if (
            (tipo_documento === 'cedula' || tipo_documento === 'cedula de extranjeria') &&
            !/^\d+$/.test(doc)
        ) {
            errores.push('Para cédula y cédula de extranjería el número solo puede contener dígitos');
        } else if (
            tipo_documento === 'nit' &&
            !/^\d{9,10}(-\d)?$/.test(doc)
        ) {
            errores.push('El NIT debe tener entre 9 y 10 dígitos, opcionalmente con dígito de verificación (ej: 900123456-7)');
        } else if (
            tipo_documento === 'pasaporte' &&
            !/^[a-zA-Z0-9]+$/.test(doc)
        ) {
            errores.push('El número de pasaporte solo puede contener letras y números');
        } else if (
            tipo_documento === 'rut' &&
            !/^\d+$/.test(doc)
        ) {
            errores.push('El RUT solo puede contener dígitos');
        }
    }
 
    // ── 6. Teléfono ────────────────────────────────────────────────────
    if (telefono) {
        const tel = String(telefono).trim();
        if (!/^[+]?[\d\s\-(). ]{7,20}$/.test(tel)) {
            errores.push(
                'El teléfono tiene un formato inválido (ej: 3001234567 o +57 300 123 4567)'
            );
        }
    }
 
    // ── 7. Email ───────────────────────────────────────────────────────
    if (email) {
        const mail = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
            errores.push('El correo electrónico no tiene un formato válido');
        } else if (mail.length > 100) {
            errores.push('El correo electrónico no puede superar los 100 caracteres');
        }
    }
 
    // ── 8. Ciudad ──────────────────────────────────────────────────────
    if (ciudad) {
        const c = ciudad.trim();
        if (c.length < 2 || c.length > 50) {
            errores.push('La ciudad debe tener entre 2 y 50 caracteres');
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(c)) {
            errores.push('La ciudad solo puede contener letras y espacios');
        }
    }
 
    // ── 9. Dirección (opcional) ────────────────────────────────────────
    if (direccion && String(direccion).trim().length > 100) {
        errores.push('La dirección no puede superar los 100 caracteres');
    }
 
    // ── 10. Razón social (opcional, solo para empresas con NIT) ────────
    if (razon_social) {
        const rs = razon_social.trim();
        if (rs.length > 100) {
            errores.push('La razón social no puede superar los 100 caracteres');
        }
        if (tipo_documento && tipo_documento !== 'nit') {
            errores.push('La razón social solo aplica para clientes con NIT');
        }
    }
 
    // ── 11. Estado ─────────────────────────────────────────────────────
    if (estado && !['activo', 'inactivo'].includes(estado)) {
        errores.push('El estado solo puede ser "activo" o "inactivo"');
    }
 
    // ── 12. Foto (opcional, solo valida extensión si viene) ────────────
    if (foto) {
        const extensionesValidas = ['.jpg', '.jpeg', '.png', '.webp'];
        const tieneExtensionValida = extensionesValidas.some(ext =>
            foto.toLowerCase().endsWith(ext)
        );
        if (!tieneExtensionValida) {
            errores.push('La foto debe tener una extensión válida: .jpg, .jpeg, .png o .webp');
        }
        if (foto.length > 255) {
            errores.push('La ruta de la foto no puede superar los 255 caracteres');
        }
    }
 
    return errores;
}
 
module.exports = { validarCliente };
 