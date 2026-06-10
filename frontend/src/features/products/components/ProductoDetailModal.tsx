import { useState, type ReactNode } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Package, CheckCircleIcon, XCircleIcon, AlertTriangle,
    Tag, Hash, Boxes, Loader2, ImageOff, ShoppingCart,
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

function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
    const [error, setError] = useState(false);
    if (!src || error) {
        return (
            <div style={{
                width: '100%', aspectRatio: '1 / 1',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', background: '#fff', borderRadius: 12,
                border: '1px dashed #e2e8f0', gap: 8,
            }}>
                <ImageOff style={{ width: 32, height: 32, color: '#cbd5e1' }} />
                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Sin imagen</span>
            </div>
        );
    }
    return (
        <img
            src={src} alt={alt} onError={() => setError(true)}
            style={{
                width: '100%', aspectRatio: '1 / 1',
                objectFit: 'cover', borderRadius: 12,
                border: '1px solid #e2e8f0', display: 'block',
            }}
        />
    );
}

function MetaRow({ icon, label, value, mono = false, highlight = false }: {
    icon: ReactNode; label: string; value: string;
    mono?: boolean; highlight?: boolean;
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '9px 0',
            borderBottom: '1px solid #f1f5f9',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
                {icon}
                <span>{label}</span>
            </div>
            <span style={{
                fontSize: 13, fontWeight: 700,
                color: highlight ? '#dc2626' : '#0f172a',
                fontFamily: mono ? 'monospace' : undefined,
            }}>
                {value}
            </span>
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
                className="p-0 overflow-hidden flex flex-col"
                style={{
                    maxWidth: 780, width: '95vw',
                    maxHeight: '90vh',
                    borderRadius: 18,
                    boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
                }}
            >
                {/* Botón cerrar — flotante */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 14, right: 14, zIndex: 20,
                        background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 8, padding: '5px 6px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', color: '#475569',
                        lineHeight: 1,
                    }}
                >
                    <X className="w-4 h-4" />
                </button>

                {/* ── Spinner ── */}
                {loadingDetail && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 420 }}>
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2563eb' }} />
                    </div>
                )}

                {/* ── Contenido principal ── */}
                {!loadingDetail && producto && (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '260px 1fr',
                            flex: 1,
                            overflow: 'hidden',
                            minHeight: 0,
                        }}>
                            {/* ──────── COLUMNA IZQUIERDA: Imagen ──────── */}
                            <div style={{
                                background: '#f8fafc',
                                borderRight: '1px solid #e2e8f0',
                                padding: '28px 20px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 16,
                                overflow: 'hidden',
                            }}>
                                <ProductImage src={producto.imagenUrl} alt={producto.nombreProducto} />

                                {/* Pill de ID */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: '#fff', border: '1px solid #e2e8f0',
                                    borderRadius: 999, padding: '4px 12px',
                                    fontSize: 11, color: '#94a3b8', fontFamily: 'monospace',
                                }}>
                                    <Package style={{ width: 12, height: 12 }} />
                                    ID #{producto.id}
                                </div>

                                {/* Badge estado inactivo (solo visible aquí si inactivo) */}
                                {!isActivo && (
                                    <div style={{
                                        background: '#f1f5f9', border: '1px solid #e2e8f0',
                                        borderRadius: 8, padding: '8px 12px',
                                        fontSize: 12, color: '#64748b',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        textAlign: 'center', lineHeight: 1.4,
                                    }}>
                                        <XCircleIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
                                        No visible en el catálogo de clientes
                                    </div>
                                )}
                            </div>

                            {/* ──────── COLUMNA DERECHA: Info ──────── */}
                            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '28px 28px 20px', flex: 1 }}>

                                    {/* Estado badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            fontSize: 11, fontWeight: 700, padding: '3px 10px',
                                            borderRadius: 999,
                                            background: isActivo ? '#f0fdf4' : '#f1f5f9',
                                            color: isActivo ? '#16a34a' : '#64748b',
                                            border: `1px solid ${isActivo ? '#bbf7d0' : '#e2e8f0'}`,
                                        }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: isActivo ? '#22c55e' : '#94a3b8',
                                                flexShrink: 0,
                                            }} />
                                            {isActivo ? 'Activo' : 'Inactivo'}
                                        </span>

                                        {sinStock && isActivo && (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                fontSize: 11, fontWeight: 600, padding: '3px 10px',
                                                borderRadius: 999, background: '#fef2f2',
                                                color: '#dc2626', border: '1px solid #fecaca',
                                            }}>
                                                <AlertTriangle style={{ width: 11, height: 11 }} />
                                                Sin stock
                                            </span>
                                        )}
                                    </div>

                                    {/* Nombre del producto */}
                                    <h2 style={{
                                        fontSize: 22, fontWeight: 900, color: '#0f172a',
                                        lineHeight: 1.2, margin: '0 0 6px', letterSpacing: '-0.025em',
                                    }}>
                                        {producto.nombreProducto}
                                    </h2>

                                    {/* Referencia secundaria */}
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 22 }}>
                                        REF: {producto.referencia}
                                    </div>

                                    {/* ── Precio (protagonista) ── */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                                        border: '1px solid #dbeafe',
                                        borderRadius: 12, padding: '14px 18px', marginBottom: 20,
                                    }}>
                                        <div style={{
                                            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                                            letterSpacing: '0.07em', color: '#93c5fd', marginBottom: 4,
                                        }}>
                                            Precio unitario
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                            <span style={{
                                                fontSize: 36, fontWeight: 900, color: '#1e40af',
                                                letterSpacing: '-0.04em', lineHeight: 1,
                                            }}>
                                                ${Number(producto.precio).toLocaleString('es-CO')}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: 500, color: '#93c5fd' }}>COP</span>
                                        </div>
                                    </div>

                                    {/* ── Filas de metadatos ── */}
                                    <div>
                                        <MetaRow
                                            icon={<Boxes style={{ width: 15, height: 15 }} />}
                                            label="Stock disponible"
                                            value={sinStock ? 'Sin stock' : `${Number(producto.stock).toLocaleString()} unidades`}
                                            highlight={sinStock}
                                        />
                                        {producto.categoria && (
                                            <MetaRow
                                                icon={<Tag style={{ width: 15, height: 15 }} />}
                                                label="Categoría"
                                                value={producto.categoria.nombreCategoria}
                                            />
                                        )}
                                        <MetaRow
                                            icon={<Hash style={{ width: 15, height: 15 }} />}
                                            label="Referencia"
                                            value={producto.referencia}
                                            mono
                                        />
                                    </div>

                                    {/* ── Descripción ── */}
                                    {producto.descripcion && (
                                        <div style={{ marginTop: 20 }}>
                                            <div style={{
                                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                                letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 8,
                                            }}>
                                                Descripción
                                            </div>
                                            <p style={{
                                                fontSize: 13, color: '#475569', lineHeight: 1.75,
                                                margin: 0, whiteSpace: 'pre-line',
                                            }}>
                                                {producto.descripcion}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#fff', flexShrink: 0,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12 }}>
                                {isActivo
                                    ? <><CheckCircleIcon style={{ width: 13, height: 13, color: '#22c55e' }} /> Visible en catálogo</>
                                    : <><XCircleIcon style={{ width: 13, height: 13 }} /> Oculto del catálogo</>
                                }
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Cerrar
                                </Button>
                                {onAddToCart && (
                                    <Button
                                        size="sm"
                                        disabled={sinStock}
                                        onClick={() => { onAddToCart(producto); if (!sinStock) onClose(); }}
                                        style={{
                                            background: sinStock ? '#f1f5f9' : enCarrito ? '#1e3a8a' : '#2563eb',
                                            color: sinStock ? '#94a3b8' : '#fff',
                                            border: 'none',
                                            cursor: sinStock ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                        {sinStock ? 'Sin stock' : enCarrito ? 'Agregar otra unidad' : 'Agregar al carrito'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
