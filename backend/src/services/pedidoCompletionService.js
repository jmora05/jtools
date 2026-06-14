/**
 * pedidoCompletionService.js
 *
 * Verifica si todas las órdenes de producción de un pedido están finalizadas.
 * Si lo están, cambia el estado del pedido a 'completada' y notifica al cliente.
 *
 * Diseñado para ser llamado de forma asíncrona (fire-and-forget) desde
 * ordenesProduccionController tras finalizar una orden.
 *
 * Garantías:
 *  - Idempotente: si el pedido ya está 'completada', no hace nada.
 *  - Sin condiciones de carrera: usa SELECT FOR UPDATE sobre la fila de ventas.
 *  - No bloquea la respuesta HTTP: se llama sin await desde el controlador.
 *  - No lanza excepciones al llamador: todos los errores se loguean internamente.
 */

const { Ventas, OrdenesProduccion, Clientes } = require('../models/index.js');
const { sequelize } = require('../config/jtools_db');
const { sendPedidoCompletadoEmail } = require('./emailService');
const { registrar } = require('./auditoriaService');

/**
 * @param {number} ventaId       ID de la venta/pedido a verificar
 * @param {number|null} usuarioId  ID del usuario que finalizó la última orden (para auditoría)
 */
async function checkPedidoCompletion(ventaId, usuarioId = null) {
    if (!ventaId) return;

    const t = await sequelize.transaction();
    try {
        // 1. Bloquear la fila de ventas para evitar actualizaciones simultáneas
        const venta = await Ventas.findByPk(ventaId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
            include: [{ model: Clientes, as: 'cliente', attributes: ['nombres', 'apellidos', 'email'] }],
        });

        if (!venta) {
            await t.rollback();
            return;
        }

        // 2. Solo aplica a pedidos, no a ventas directas
        if (venta.tipoVenta !== 'pedido') {
            await t.rollback();
            return;
        }

        // 3. Idempotencia: ya fue completado anteriormente
        if (venta.estado === 'completada') {
            await t.rollback();
            return;
        }

        // 4. No procesar pedidos anulados
        if (venta.estado === 'anulada') {
            await t.rollback();
            return;
        }

        // 5. Obtener todas las órdenes de producción vinculadas
        const ordenes = await OrdenesProduccion.findAll({
            where: { ventaId },
            attributes: ['id', 'codigoOrden', 'estado'],
            transaction: t,
        });

        // Sin órdenes asociadas: no hay nada que verificar
        if (ordenes.length === 0) {
            await t.rollback();
            return;
        }

        // 6. Si hay alguna orden anulada, no completar el pedido
        const hayAnuladas = ordenes.some(o => o.estado === 'Anulada');
        if (hayAnuladas) {
            await t.rollback();
            console.info(`[PedidoCompletion] Pedido #${ventaId} tiene órdenes anuladas — no se completa`);
            return;
        }

        // 7. Verificar que TODAS estén Finalizadas
        const todasFinalizadas = ordenes.every(o => o.estado === 'Finalizada');
        if (!todasFinalizadas) {
            await t.rollback();
            return;
        }

        // 8. Marcar pedido como completado
        await venta.update({ estado: 'completada' }, { transaction: t });
        await t.commit();

        const codigosOrdenes = ordenes.map(o => o.codigoOrden).join(', ');
        const fechaCompletado = new Date().toLocaleDateString('es-CO', {
            day: '2-digit', month: 'long', year: 'numeric',
        });

        console.info(`[PedidoCompletion] Pedido #${ventaId} completado`, {
            ordenes: codigosOrdenes,
            timestamp: new Date().toISOString(),
        });

        // 9. Registrar auditoría (nunca lanza excepción)
        registrar({
            usuarioId,
            accion:    'PEDIDO_COMPLETADO',
            entidad:   'ventas',
            entidadId: ventaId,
            detalle:   `Pedido #${ventaId} completado automáticamente. Órdenes: ${codigosOrdenes}`,
            ip:        null,
        });

        // 10. Enviar email al cliente (no bloquea, no falla si hay error)
        const cliente = venta.cliente;
        if (cliente?.email) {
            sendPedidoCompletadoEmail({
                to:            cliente.email,
                nombre:        `${cliente.nombres} ${cliente.apellidos}`.trim(),
                numeroPedido:  ventaId,
                fecha:         fechaCompletado,
            }).catch(err => {
                console.error(`[PedidoCompletion] Error enviando email pedido #${ventaId}:`, err.message);
            });
        } else {
            console.warn(`[PedidoCompletion] Pedido #${ventaId} completado pero el cliente no tiene email`);
        }

    } catch (err) {
        await t.rollback().catch(() => {});
        console.error(`[PedidoCompletion] Error procesando pedido #${ventaId}:`, err.message, err.stack);
    }
}

module.exports = { checkPedidoCompletion };
