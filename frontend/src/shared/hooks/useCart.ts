// src/shared/hooks/useCart.ts
import { useContext } from 'react';
import { CartContext } from '@/shared/context/CartContext';

/**
 * Hook para consumir el carrito desde cualquier componente.
 *
 * Uso:
 *   const { addItem, items, totalItems } = useCart();
 *
 * Lanza error si se usa fuera de <CartProvider>.
 */
export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error('useCart debe usarse dentro de <CartProvider>');
    }
    return ctx;
}
