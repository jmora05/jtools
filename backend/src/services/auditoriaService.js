/**
 * auditoriaService.js
 * Registro silencioso de eventos de seguridad y cambios de acceso.
 * Nunca lanza excepciones — los errores se loguean pero no interrumpen el flujo.
 */

async function registrar({ usuarioId, accion, entidad, entidadId, detalle, ip }) {
    try {
        const { Auditoria } = require('../models');
        await Auditoria.create({
            usuarioId:  usuarioId  ?? null,
            accion,
            entidad:    entidad    ?? null,
            entidadId:  entidadId  ?? null,
            detalle:    detalle    ?? null,
            ip:         ip         ?? null,
        });
    } catch (err) {
        console.error('[Auditoria] Error al registrar evento:', err.message);
    }
}

module.exports = { registrar };
