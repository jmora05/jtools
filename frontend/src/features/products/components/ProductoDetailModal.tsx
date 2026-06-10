import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Package, XCircleIcon, AlertTriangle,
    Tag, Boxes, Loader2, ShoppingCart,
} from 'lucide-react';

export interface Producto {
    id: number;
    nombreProducto: string;
    referencia: string;
    precio: number | string;
    stock: number;
    descripcion?: string | null;
    estado: 'activo' | 'inactivo';
    imagenUrl?: string | null;
    categoriaProductoId?: number;
    categoria?: { id: number; nombreCategoria: string } | null;
}

interface ProductoDetailModalProps {
    open: boolean;
    onClose: () => void;
    producto: Producto | null;
    loadingDetail?: boolean;
    onAddToCart?: (producto: Producto) => void;
    isInCart?: (id: number) => boolean;
}

const H = 540; // altura fija del modal en px

function ImagePanel({ src, alt, id }: { src?: string | null; alt: string; id: number }) {
    const [err, setErr] = useState(false);
    return (
        <div style={{ position: 'relative', height: H, overflow: 'hidden', borderRadius: '18px 0 0 18px', background: '#e2e8f0' }}>
            {!src || err ? (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(140deg, #f1f5f9, #e2e8f0)',
                    gap: 12,
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Package style={{ width: 32, height: 32, color: '#94a3b8' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Sin imagen</span>
                </div>
            ) : (
                <img
                    key={src}
                    src={src}
                    alt={alt}
                    onError={() => setErr(true)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}
            {/* gradient overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%, rgba(0,0,0,0.08) 100%)',
            }} />
            {/* ID pill */}
            <div style={{
                position: 'absolute', bottom: 14, left: 14,
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                color: 'rgba(255,255,255,0.88)', fontSize: 11, fontFamily: 'monospace',
                borderRadius: 999, padding: '5px 11px',
                border: '1px solid rgba(255,255,255,0.12)',
            }}>
                <Package style={{ width: 11, height: 11 }} />
                #{id}
            </div>
        </div>
    );
}

export function ProductoDetailModal({ open, onClose, producto, loadingDetail, onAddToCart, isInCart }: ProductoDetailModalProps) {
    const sinStock  = (producto?.stock ?? 0) === 0;
    const isActivo  = (producto?.estado ?? 'activo') === 'activo';
    const enCarrito = producto && isInCart ? isInCart(producto.id) : false;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                hideCloseButton
                className="p-0 overflow-hidden"
                style={{
                    maxWidth: 860,
                    width: '94vw',
                    borderRadius: 18,
                    padding: 0,
                    boxShadow: '0 28px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
                }}
            >
                {/* ── Spinner ── */}
                {loadingDetail && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: H }}>
                        <Loader2 style={{ width: 36, height: 36, color: '#94a3b8' }} className="animate-spin" />
                    </div>
                )}

                {/* ── Grid (inner div — no en DialogContent) ── */}
                {!loadingDetail && producto && (
                    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: H, overflow: 'hidden' }}>

                        {/* columna izquierda: imagen */}
                        <ImagePanel key={producto.id} src={producto.imagenUrl} alt={producto.nombreProducto} id={producto.id} />

                        {/* columna derecha: info */}
                        <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', height: H, borderRadius: '0 18px 18px 0', overflow: 'hidden' }}>

                            {/* header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px 0', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                                        background: isActivo ? '#f0fdf4' : '#f1f5f9',
                                        color: isActivo ? '#15803d' : '#64748b',
                                        outline: `1.5px solid ${isActivo ? '#bbf7d0' : '#e2e8f0'}`,
                                    }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActivo ? '#22c55e' : '#94a3b8', flexShrink: 0 }} />
                                        {isActivo ? 'Activo' : 'Inactivo'}
                                    </span>
                                    {sinStock && (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                                            background: '#fef2f2', color: '#dc2626',
                                            outline: '1.5px solid #fecaca',
                                        }}>
                                            <AlertTriangle style={{ width: 11, height: 11 }} />
                                            Sin stock
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: 30, height: 30, borderRadius: 8, border: 'none',
                                        cursor: 'pointer', background: '#f1f5f9',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#64748b', flexShrink: 0,
                                    }}
                                >
                                    <X style={{ width: 15, height: 15 }} />
                                </button>
                            </div>

                            {/* body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 26px 16px' }}>
                                <h2 style={{
                                    fontSize: 21, fontWeight: 900, color: '#0f172a',
                                    letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 3px',
                                }}>
                                    {producto.nombreProducto}
                                </h2>
                                <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.05em', margin: '0 0 20px' }}>
                                    REF: {producto.referencia}
                                </p>

                                {/* precio */}
                                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', margin: '0 0 5px' }}>
                                    Precio unitario
                                </p>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 22 }}>
                                    <span style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em', lineHeight: 1 }}>
                                        ${Number(producto.precio).toLocaleString('es-CO')}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>COP</span>
                                </div>

                                {/* divisor */}
                                <div style={{ height: 1, background: '#f1f5f9', marginBottom: 18 }} />

                                {/* chips */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 10,
                                        background: sinStock ? '#fef2f2' : '#eff6ff',
                                        color: sinStock ? '#dc2626' : '#1d4ed8',
                                    }}>
                                        <Boxes style={{ width: 14, height: 14 }} />
                                        {sinStock ? 'Sin stock' : `${Number(producto.stock).toLocaleString()} en stock`}
                                    </span>
                                    {producto.categoria && (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 10,
                                            background: '#f8fafc', color: '#475569',
                                        }}>
                                            <Tag style={{ width: 14, height: 14 }} />
                                            {producto.categoria.nombreCategoria}
                                        </span>
                                    )}
                                </div>

                                {/* descripción */}
                                {producto.descripcion && (
                                    <>
                                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', margin: '0 0 7px' }}>
                                            Descripción
                                        </p>
                                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                                            {producto.descripcion}
                                        </p>
                                    </>
                                )}

                                {/* aviso inactivo */}
                                {!isActivo && (
                                    <div style={{
                                        marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 9,
                                        background: '#fffbeb', border: '1px solid #fde68a',
                                        borderRadius: 10, padding: '9px 13px',
                                        fontSize: 12, color: '#92400e',
                                    }}>
                                        <XCircleIcon style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                                        Este producto no es visible en el catálogo de clientes.
                                    </div>
                                )}
                            </div>

                            {/* acciones */}
                            <div style={{ padding: '12px 26px 20px', borderTop: '1px solid #f8fafc', display: 'flex', gap: 10, flexShrink: 0 }}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onClose}
                                    style={{ flex: 1, height: 40, fontSize: 14, fontWeight: 600 }}
                                >
                                    Cerrar
                                </Button>
                                {onAddToCart && (
                                    <Button
                                        size="sm"
                                        disabled={sinStock}
                                        onClick={() => { onAddToCart(producto); if (!sinStock) onClose(); }}
                                        style={{
                                            flex: 1, height: 40, fontSize: 14, fontWeight: 600,
                                            background: sinStock ? '#f1f5f9' : '#0f172a',
                                            color: sinStock ? '#94a3b8' : '#fff',
                                            border: 'none',
                                            cursor: sinStock ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <ShoppingCart style={{ width: 15, height: 15, marginRight: 6 }} />
                                        {sinStock ? 'Sin stock' : enCarrito ? 'Añadir otra' : 'Agregar al carrito'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
