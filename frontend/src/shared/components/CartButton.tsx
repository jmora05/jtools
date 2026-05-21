// src/shared/components/CartButton.tsx
// Botón flotante que muestra el contador del carrito y abre el drawer.
// Ponlo en tu layout principal junto a <CartDrawer />.
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/shared/hooks/useCart';

export function CartButton() {
    const { openCart, totalItems } = useCart();

    return (
        <button
            onClick={openCart}
            title="Ver carrito de pedido"
            style={{
                position: 'fixed', bottom: 28, right: 28, zIndex: 9000,
                width: 56, height: 56, borderRadius: '50%',
                background: '#1d4ed8', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(29,78,216,0.4)',
                transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(29,78,216,0.5)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(29,78,216,0.4)';
            }}
        >
            <ShoppingCart style={{ width: 24, height: 24, color: '#fff' }} />
            {totalItems > 0 && (
                <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#ef4444', color: '#fff',
                    borderRadius: '50%', width: 22, height: 22,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                }}>
                    {totalItems > 99 ? '99+' : totalItems}
                </span>
            )}
        </button>
    );
}
