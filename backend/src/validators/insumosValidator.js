// Validaciones de negocio — Módulo Insumos
// ============================================================

const UNIDADES_MEDIDA = ['Unidades', 'Litros', 'Kilogramos', 'Gramos', 'Metros', 'Cajas', 'Par', 'Rollo', 'Galón', 'Juegos'];

/**
 * Valida los datos de un insumo.
 * @param {object}  data             - Cuerpo de la petición (req.body)
 * @param {boolean} esActualizacion  - Si es PUT, los campos obligatorios son opcionales
 * @returns {string[]} Array de mensajes de error. Si está vacío, no hay errores.
 */
function validarInsumo(data, esActualizacion = false) {
    const errores = [];
    const {
        nombreInsumo,
        descripcion,
        precioUnitario,
        unidadMedida,
        estado,
    } = data;

    // ── 1. Campos obligatorios (solo en creación) ──────────────────────
    if (!esActualizacion) {
        const requeridos = { nombreInsumo, precioUnitario, unidadMedida };
        for (const [campo, valor] of Object.entries(requeridos)) {
            if (valor === undefined || valor === null || String(valor).trim() === '') {
                errores.push(`El campo "${campo}" es obligatorio`);
            }
        }
        if (errores.length > 0) return errores;
    }

    // ── 2. Nombre ──────────────────────────────────────────────────────
    if (nombreInsumo !== undefined && nombreInsumo !== null && nombreInsumo !== '') {
        const n = String(nombreInsumo).trim();
        if (n.length < 2 || n.length > 50) {
            errores.push('El nombre del insumo debe tener entre 2 y 50 caracteres');
        }
    }

    // ── 3. Descripción (opcional) ──────────────────────────────────────
    if (descripcion && String(descripcion).trim().length > 255) {
        errores.push('La descripción no puede superar los 255 caracteres');
    }

    // ── 4. Precio unitario ─────────────────────────────────────────────
    if (precioUnitario !== undefined && precioUnitario !== null && precioUnitario !== '') {
        const precio = parseFloat(precioUnitario);
        if (isNaN(precio)) {
            errores.push('El precio unitario debe ser un número válido');
        } else if (precio < 0) {
            errores.push('El precio unitario no puede ser negativo');
        } else if (precio > 99999999.99) {
            errores.push('El precio unitario excede el valor máximo permitido');
        }
    }

    // ── 5. Unidad de medida ────────────────────────────────────────────
    if (unidadMedida !== undefined && unidadMedida !== null && unidadMedida !== '') {
        if (!UNIDADES_MEDIDA.includes(unidadMedida.trim())) {
            errores.push(
                `Unidad de medida inválida. Valores permitidos: ${UNIDADES_MEDIDA.join(', ')}`
            );
        }
    }

    // ── 6. Estado ──────────────────────────────────────────────────────
    if (estado && !['disponible', 'agotado'].includes(estado)) {
        errores.push('El estado solo puede ser "disponible" o "agotado"');
    }

    return errores;
}

module.exports = { validarInsumo };