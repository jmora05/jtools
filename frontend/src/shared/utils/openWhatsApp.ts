// src/shared/utils/openWhatsApp.ts
import type { CartItem } from '@/shared/context/CartContext';

/**
 * Arma el mensaje con los productos del carrito y abre WhatsApp.
 *
 * @param items    - Productos del carrito
 * @param telefono - Número en formato internacional sin + (ej: "573001234567")
 * @param nombreNegocio - Nombre opcional del negocio para el encabezado
 */
export function openWhatsApp(
    items: CartItem[],
    telefono: string,
    nombreNegocio = 'la tienda'
): void {
    if (items.length === 0) return;

    const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

    // ── Construir líneas de productos ─────────────────────────────────────────
    const lineas = items.map(item => {
        const subtotal    = item.precio * item.cantidad;
        const pedidoNota  = item.esPedido ? '\n  ⏳ _Bajo pedido (sin stock actual)_' : '';
        return (
            `• *${item.nombreProducto}*\n` +
            `  Ref: ${item.referencia}\n` +
            `  Cantidad: ${item.cantidad}\n` +
            `  Precio unit.: $${Number(item.precio).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP\n` +
            `  Subtotal: $${Number(subtotal).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP` +
            pedidoNota
        );
    });

    // ── Armar mensaje completo ────────────────────────────────────────────────
    const mensaje =
        `¡Hola! Me interesa realizar el siguiente pedido en ${nombreNegocio}:\n\n` +
        lineas.join('\n\n') +
        `\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `*TOTAL: $${Number(total).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Por favor, confirmen disponibilidad y proceso de pago. ¡Gracias! 🙏`;

    // ── Abrir WhatsApp ────────────────────────────────────────────────────────
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}
