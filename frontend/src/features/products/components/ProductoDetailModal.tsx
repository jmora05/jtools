import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Package, CheckCircleIcon, XCircleIcon, AlertTriangle,
    Tag, Hash, DollarSign, Boxes, FileText, Loader2, ImageOff, ShoppingCart,
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

const ESTADO_CONFIG = {
    activo: {
        label: 'Activo',
        icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
        headerBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#bfdbfe',
        accentColor: '#2563eb',
        tilePriceBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
    },
    inactivo: {
        label: 'Inactivo',
        icon: <XCircleIcon className="w-3.5 h-3.5" />,
        headerBg: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        chipBg: '#f1f5f9', chipText: '#475569', chipBorder: '#cbd5e1',
        accentColor: '#475569',
        tilePriceBg: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    },
};

function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
    const [error, setError] = useState(false);
    if (!src || error) {
        return (
            <div style={{
                width: '100%', aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 8,
            }}>
                <ImageOff style={{ width: 36, height: 36, color: '#cbd5e1' }} />
                <span style={{ fontSize: 12, color: '#cbd5e1' }}>Sin imagen</span>
            </div>
        );
    }
    return (
        <img
            src={src} alt={alt} onError={() => setError(true)}
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
        />
    );
}

interface ProductoDetailModalProps {
    open: boolean;
    onClose: () => void;
    producto: Producto | null;
    loadingDetail?: boolean;
    onAddToCart?: (producto: Producto) => void;
    isInCart?: (id: number) => boolean;
}

export function ProductoDetailModal({ open, onClose, producto, loadingDetail, onAddToCart, isInCart }: ProductoDetailModalProps) {
    const cfg = ESTADO_CONFIG[producto?.estado ?? 'activo'];
    const sinStock = (producto?.stock ?? 0) === 0;
    const enCarrito = producto && isInCart ? isInCart(producto.id) : false;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent hideCloseButton className="p-0 max-w-2xl overflow-hidden max-h-[92vh] flex flex-col" style={{ borderRadius: 14, boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>

                {/* Header */}
                <div style={{ background: cfg.headerBg, color: '#fff', padding: '18px 22px 16px', position: 'relative', flexShrink: 0 }}>
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, padding: '4px 5px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', lineHeight: 1 }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingRight: 28 }}>
                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 8, display: 'flex', flexShrink: 0 }}>
                            <Package className="w-5 h-5" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.65, marginBottom: 3 }}>
                                Detalle del producto
                            </div>
                            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {producto?.nombreProducto ?? '—'}
                            </div>
                        </div>
                        {producto && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                                background: cfg.chipBg, border: `1px solid ${cfg.chipBorder}`,
                                borderRadius: 999, padding: '4px 10px',
                                fontSize: 12, fontWeight: 700, color: cfg.chipText,
                            }}>
                                {cfg.icon}
                                <span>{cfg.label}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {loadingDetail ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px 0' }}>
                            <Loader2 className="w-7 h-7 animate-spin" style={{ color: cfg.accentColor }} />
                        </div>
                    ) : producto ? (
                        <>
                            {/* Alertas */}
                            {(producto.estado === 'inactivo' || (sinStock && producto.estado === 'activo')) && (
                                <div style={{ padding: '10px 16px 0' }}>
                                    {producto.estado === 'inactivo' && (
                                        <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
                                            <XCircleIcon className="w-3.5 h-3.5 shrink-0" />
                                            Producto inactivo — no aparece en el catálogo de clientes.
                                        </div>
                                    )}
                                    {sinStock && producto.estado === 'activo' && (
                                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#b91c1c' }}>
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                            Sin stock disponible.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Imagen */}
                            <div style={{ background: '#fff', overflow: 'hidden' }}>
                                <ProductImage src={producto.imagenUrl} alt={producto.nombreProducto} />
                            </div>

                            {/* Tiles de datos: separados por gaps de 1px sobre fondo gris */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0', borderTop: '1px solid #e2e8f0' }}>

                                {/* Precio */}
                                <div style={{ background: cfg.tilePriceBg, padding: '14px 18px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <DollarSign className="w-3 h-3" /> Precio unitario
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                        ${Number(producto.precio).toLocaleString('es-CO')}
                                        <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4, opacity: 0.7 }}>COP</span>
                                    </div>
                                </div>

                                {/* Stock */}
                                <div style={{ background: sinStock ? '#fef2f2' : '#fff', padding: '14px 18px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: sinStock ? '#f87171' : '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Boxes className="w-3 h-3" /> Stock disponible
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: sinStock ? '#dc2626' : '#0f172a', lineHeight: 1 }}>
                                        {sinStock ? 'Sin stock' : Number(producto.stock).toLocaleString()}
                                        {!sinStock && <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4, color: '#94a3b8' }}>uds.</span>}
                                    </div>
                                </div>

                                {/* Categoría */}
                                {producto.categoria && (
                                    <div style={{ background: '#fff', padding: '12px 18px' }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Tag className="w-3 h-3" /> Categoría
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                                            {producto.categoria.nombreCategoria}
                                        </div>
                                    </div>
                                )}

                                {/* Referencia */}
                                <div style={{ background: '#fff', padding: '12px 18px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Hash className="w-3 h-3" /> Referencia
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                                        {producto.referencia || '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Descripción */}
                            {producto.descripcion && (
                                <div style={{ padding: '14px 18px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <FileText className="w-3 h-3" /> Descripción
                                    </div>
                                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-line' }}>
                                        {producto.descripcion}
                                    </p>
                                </div>
                            )}

                            <div style={{ padding: '8px 18px 10px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, color: '#cbd5e1' }}>ID #{producto.id}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {producto && !loadingDetail && (
                    <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
                        {onAddToCart && (
                            <Button
                                size="sm"
                                disabled={sinStock}
                                onClick={() => { onAddToCart(producto); if (!sinStock) onClose(); }}
                                style={{ background: sinStock ? '#e2e8f0' : enCarrito ? '#1e3a8a' : cfg.accentColor, color: sinStock ? '#94a3b8' : '#fff', border: 'none' }}
                            >
                                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                {sinStock ? 'Sin stock' : enCarrito ? 'Agregar otra unidad' : 'Agregar al carrito'}
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
