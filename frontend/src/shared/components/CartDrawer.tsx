// src/shared/components/CartDrawer.tsx
import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart, MessageCircle, ImageOff, Package } from 'lucide-react';
import { useCart } from '@/shared/hooks/useCart';
import { openWhatsApp } from '@/shared/utils/openWhatsApp';

// ─── Configura aquí tu número y nombre de negocio ────────────────────────────
const WHATSAPP_TELEFONO = '573001234567'; // ← CAMBIA ESTE VALOR
const NOMBRE_NEGOCIO    = 'Jrepuestos';   // ← CAMBIA ESTE VALOR

// ─── Imagen con fallback ──────────────────────────────────────────────────────
const ItemImage = ({ src, alt }: { src?: string | null; alt: string }) => {
    const [error, setError] = React.useState(false);
    React.useEffect(() => setError(false), [src]);

    if (!src || error) {
        return (
            <div style={{
                width: 60, height: 60, borderRadius: 10,
                background: '#eff6ff', border: '1px solid #bfdbfe',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Package style={{ width: 22, height: 22, color: '#93c5fd' }} />
            </div>
        );
    }
    return (
        <img
            src={src} alt={alt} onError={() => setError(true)}
            style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid #bfdbfe', flexShrink: 0 }}
        />
    );
};

// ─── Control de cantidad con input editable ───────────────────────────────────
const QtyControl = ({ id, cantidad, onUpdate }: { id: number; cantidad: number; onUpdate: (id: number, qty: number) => void }) => {
    const [inputVal, setInputVal] = useState(cantidad.toString());

    React.useEffect(() => { setInputVal(cantidad.toString()); }, [cantidad]);

    const commit = (raw: string) => {
        const n = parseInt(raw, 10);
        if (!isNaN(n) && n > 0) {
            onUpdate(id, n);
            setInputVal(n.toString());
        } else {
            setInputVal(cantidad.toString());
        }
    };

    const btnStyle = (active: boolean): React.CSSProperties => ({
        width: 30, height: 30, borderRadius: 6,
        border: `1.5px solid ${active ? '#1e40af' : '#bfdbfe'}`,
        background: active ? '#1e3a8a' : '#eff6ff',
        color: active ? '#fff' : '#1e40af',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
                style={btnStyle(true)}
                onClick={() => onUpdate(id, cantidad - 1)}
                onMouseEnter={e => { e.currentTarget.style.background = '#1e40af'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1e3a8a'; }}
            >
                <Minus style={{ width: 13, height: 13 }} />
            </button>

            <input
                type="number"
                min={1}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onBlur={e => commit(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commit(inputVal); }}
                style={{
                    width: 48, height: 30, textAlign: 'center',
                    fontSize: 14, fontWeight: 700, color: '#1e3a8a',
                    border: '1.5px solid #bfdbfe', borderRadius: 6,
                    background: '#fff', outline: 'none',
                    MozAppearance: 'textfield',
                }}
            />

            <button
                style={btnStyle(true)}
                onClick={() => onUpdate(id, cantidad + 1)}
                onMouseEnter={e => { e.currentTarget.style.background = '#1e40af'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1e3a8a'; }}
            >
                <Plus style={{ width: 13, height: 13 }} />
            </button>
        </div>
    );
};

// ─── CartDrawer ───────────────────────────────────────────────────────────────
export function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, updateQty, clearCart, totalItems, totalPrice } = useCart();
    const [sending, setSending] = useState(false);

    const handleWhatsApp = () => {
        setSending(true);
        openWhatsApp(items, WHATSAPP_TELEFONO, NOMBRE_NEGOCIO);
        setTimeout(() => setSending(false), 800);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                onClick={closeCart}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15, 23, 42, 0.45)',
                    zIndex: 9998, backdropFilter: 'blur(3px)',
                }}
            />

            {/* Panel */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 440, maxWidth: '96vw',
                background: '#fff', zIndex: 9999,
                display: 'flex', flexDirection: 'column',
                boxShadow: '-12px 0 40px rgba(30,58,138,0.15)',
            }}>

                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
                    padding: '18px 20px', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ShoppingCart style={{ width: 18, height: 18, color: '#fff' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                                    Carrito de pedido
                                </p>
                                <p style={{ fontSize: 11, color: '#bfdbfe', margin: 0, marginTop: 2 }}>
                                    {totalItems === 0 ? 'Sin productos' : `${totalItems} producto${totalItems > 1 ? 's' : ''} agregado${totalItems > 1 ? 's' : ''}`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeCart}
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <X style={{ width: 16, height: 16, color: '#fff' }} />
                        </button>
                    </div>
                </div>

                {/* ── Lista de items ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
                    {items.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', gap: 14,
                            padding: '40px 20px',
                        }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: 20,
                                background: '#eff6ff', border: '2px dashed #bfdbfe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ShoppingCart style={{ width: 32, height: 32, color: '#93c5fd' }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#1e3a8a', margin: 0 }}>
                                    Tu carrito está vacío
                                </p>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0', lineHeight: 1.5 }}>
                                    Agrega productos desde el catálogo<br />para armar tu pedido por WhatsApp
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {items.map((item, idx) => (
                                <div key={item.id} style={{
                                    background: '#fff',
                                    border: '1.5px solid #e0e7ff',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    display: 'flex', gap: 12,
                                    boxShadow: '0 1px 4px rgba(30,58,138,0.06)',
                                }}>
                                    <ItemImage src={item.imagenUrl} alt={item.nombreProducto} />

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Nombre */}
                                        <p style={{
                                            fontSize: 13, fontWeight: 700, color: '#1e3a8a',
                                            margin: 0, lineHeight: 1.3,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {item.nombreProducto}
                                        </p>
                                        {/* Referencia */}
                                        <p style={{
                                            fontSize: 11, color: '#6b7280', margin: '3px 0 10px',
                                            fontFamily: 'monospace', letterSpacing: '0.02em',
                                        }}>
                                            Ref: {item.referencia}
                                        </p>

                                        {/* Fila cantidad + precio unitario */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <QtyControl id={item.id} cantidad={item.cantidad} onUpdate={updateQty} />
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                                                    c/u ${Number(item.precio).toLocaleString('es-CO')}
                                                </p>
                                                <p style={{ fontSize: 15, fontWeight: 800, color: '#1d4ed8', margin: 0 }}>
                                                    ${Number(item.precio * item.cantidad).toLocaleString('es-CO')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón eliminar */}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        style={{
                                            alignSelf: 'flex-start',
                                            width: 28, height: 28, borderRadius: 7,
                                            background: '#fef2f2', border: '1px solid #fecaca',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = '#fee2e2';
                                            e.currentTarget.style.borderColor = '#f87171';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = '#fef2f2';
                                            e.currentTarget.style.borderColor = '#fecaca';
                                        }}
                                    >
                                        <Trash2 style={{ width: 13, height: 13, color: '#ef4444' }} />
                                    </button>
                                </div>
                            ))}
                            {/* Espaciado final */}
                            <div style={{ height: 4 }} />
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {items.length > 0 && (
                    <div style={{
                        borderTop: '1px solid #e0e7ff',
                        padding: '16px 20px 20px',
                        background: '#fff', flexShrink: 0,
                        display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                        {/* Resumen */}
                        <div style={{
                            background: '#eff6ff', borderRadius: 10,
                            padding: '12px 14px',
                            display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#6b7280' }}>
                                    Subtotal ({totalItems} und.)
                                </span>
                                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                                    ${Number(totalPrice).toLocaleString('es-CO')} COP
                                </span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                paddingTop: 8, borderTop: '1px solid #bfdbfe',
                            }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>Total</span>
                                <span style={{ fontSize: 18, fontWeight: 800, color: '#1d4ed8' }}>
                                    ${Number(totalPrice).toLocaleString('es-CO')} COP
                                </span>
                            </div>
                        </div>

                        {/* Botón WhatsApp */}
                        <button
                            onClick={handleWhatsApp}
                            disabled={sending}
                            style={{
                                width: '100%', height: 48,
                                background: sending ? '#15803d' : '#16a34a',
                                border: 'none', borderRadius: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                cursor: sending ? 'not-allowed' : 'pointer',
                                fontSize: 14, fontWeight: 700, color: '#fff',
                                boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#15803d'; }}
                            onMouseLeave={e => { if (!sending) e.currentTarget.style.background = '#16a34a'; }}
                        >
                            <MessageCircle style={{ width: 20, height: 20 }} />
                            {sending ? 'Abriendo WhatsApp...' : 'Pedir por WhatsApp'}
                        </button>

                        {/* Vaciar */}
                        <button
                            onClick={clearCart}
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                fontSize: 12, color: '#9ca3af', textDecoration: 'underline',
                                textAlign: 'center', padding: 0,
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}
                        >
                            Vaciar carrito
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}