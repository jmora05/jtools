// Validaciones de negocio — Módulo Insumos
// JRepuestos Medellín
// ============================================================

const UNIDADES_MEDIDA = ['unidad', 'litro', 'kilogramo', 'gramo', 'metro', 'caja', 'par', 'rollo', 'galón'];

/**
 * Valida los datos de un insumo.
 * @param {object} data           - Cuerpo de la petición (req.body)
 * @param {boolean} esActualizacion - Si es PUT, los campos obligatorios son opcionales
 * @returns {string[]} Array de mensajes de error. Si está vacío, no hay errores.
 */
function validarInsumo(data, esActualizacion = false) {
    const errores = [];
    const {
        nombre,
        descripcion,
        precio_unitario,
        stock,
        stock_minimo,
        unidad_medida,
        categoria,
        estado,
        foto,
        proveedorId,
    } = data;

    // ── 1. Campos obligatorios (solo en creación) ──────────────────────
    if (!esActualizacion) {
        const requeridos = { nombre, precio_unitario, unidad_medida };
        for (const [campo, valor] of Object.entries(requeridos)) {
            if (valor === undefined || valor === null || String(valor).trim() === '') {
                errores.push(`El campo "${campo}" es obligatorio`);
            }
        }
        if (errores.length > 0) return errores;
    }

    // ── 2. Nombre ──────────────────────────────────────────────────────
    if (nombre) {
        const n = String(nombre).trim();
        if (n.length < 2 || n.length > 100) {
            errores.push('El nombre debe tener entre 2 y 100 caracteres');
        }
    }

    // ── 3. Descripción (opcional) ──────────────────────────────────────
    if (descripcion && String(descripcion).trim().length > 500) {
        errores.push('La descripción no puede superar los 500 caracteres');
    }

    // ── 4. Precio unitario ─────────────────────────────────────────────
    if (precio_unitario !== undefined && precio_unitario !== null && precio_unitario !== '') {
        const precio = parseFloat(precio_unitario);
        if (isNaN(precio)) {
            errores.push('El precio unitario debe ser un número válido');
        } else if (precio < 0) {
            errores.push('El precio unitario no puede ser negativo');
        } else if (precio > 99999999.99) {
            errores.push('El precio unitario excede el valor máximo permitido');
        }
    }

    // ── 5. Stock ───────────────────────────────────────────────────────
    if (stock !== undefined && stock !== null && stock !== '') {
        const s = parseInt(stock, 10);
        if (isNaN(s) || !Number.isInteger(s)) {
            errores.push('El stock debe ser un número entero');
        } else if (s < 0) {
            errores.push('El stock no puede ser negativo');
        }
    }

    // ── 6. Stock mínimo (opcional) ─────────────────────────────────────
    if (stock_minimo !== undefined && stock_minimo !== null && stock_minimo !== '') {
        const sm = parseInt(stock_minimo, 10);
        if (isNaN(sm) || !Number.isInteger(sm)) {
            errores.push('El stock mínimo debe ser un número entero');
        } else if (sm < 0) {
            errores.push('El stock mínimo no puede ser negativo');
        }
    }

    // ── 7. Unidad de medida ────────────────────────────────────────────
    if (unidad_medida) {
        const um = unidad_medida.trim().toLowerCase();
        if (!UNIDADES_MEDIDA.includes(um)) {
            errores.push(
                `Unidad de medida inválida. Valores permitidos: ${UNIDADES_MEDIDA.join(', ')}`
            );
        }
    }

    // ── 8. Categoría (opcional) ────────────────────────────────────────
    if (categoria && String(categoria).trim().length > 60) {
        errores.push('La categoría no puede superar los 60 caracteres');
    }

    // ── 9. Estado ──────────────────────────────────────────────────────
    if (estado && !['activo', 'inactivo'].includes(estado)) {
        errores.push('El estado solo puede ser "activo" o "inactivo"');
    }

    // ── 10. Proveedor (opcional, si viene debe ser entero positivo) ────
    if (proveedorId !== undefined && proveedorId !== null && proveedorId !== '') {
        const pid = parseInt(proveedorId, 10);
        if (isNaN(pid) || pid <= 0) {
            errores.push('El ID del proveedor debe ser un número entero positivo');
        }
    }

    // ── 11. Foto (opcional, solo valida extensión si viene) ────────────
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

module.exports = { validarInsumo };