import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Package, CheckCircleIcon, XCircleIcon, AlertTriangle,
    Tag, Hash, DollarSign, Boxes, FileText, Loader2, ImageOff, ShoppingCart,
} from 'lucide-react';

// ─── Tipo ─────────────────────────────────────────────────────────────────────

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

// ─── Config por estado ────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
    activo: {
        label: 'Activo', icon: <CheckCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb', rowHover: '#eff6ff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    inactivo: {
        label: 'Inactivo', icon: <XCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', headerText: '#fff',
        chipBg: '#f1f5f9', chipText: '#475569', chipBorder: '#cbd5e1',
        accentColor: '#64748b', rowHover: '#f8fafc',
        iconBg: '#f8fafc', iconColor: '#64748b',
    },
};

// ─── Imagen con fallback ──────────────────────────────────────────────────────

function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
    const [error, setError] = useState(false);
    if (!src || error) {
        return (
            <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 12 }}>
                <ImageOff style={{ width: 40, height: 40, color: '#cbd5e1' }} />
            </div>
        );
    }
    return (
        <img
            src={src} alt={alt} onError={() => setError(true)}
            style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' }}
        />
    );
}

// ─── Helper InfoItem ──────────────────────────────────────────────────────────

function InfoItem({ icon, label, value, iconBg, iconColor }: {
    icon: React.ReactNode; label: string; value: string;
    iconBg: string; iconColor: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 160px' }}>
            <div style={{ background: iconBg, borderRadius: 8, padding: 8, display: 'flex', color: iconColor }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</div>
            </div>
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductoDetailModalProps {
    open: boolean;
    onClose: () => void;
    producto: Producto | null;
    loadingDetail?: boolean;
    onAddToCart?: (producto: Producto) => void;
    isInCart?: (id: number) => boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProductoDetailModal({ open, onClose, producto, loadingDetail, onAddToCart, isInCart }: ProductoDetailModalProps) {
    const cfg = ESTADO_CONFIG[producto?.estado ?? 'activo'];
    const sinStock = (producto?.stock ?? 0) === 0;
    const enCarrito = producto && isInCart ? isInCart(producto.id) : false;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="p-0 max-w-lg overflow-hidden max-h-[90vh] flex flex-col" style={{ borderRadius: 16 }}>

                {/* Header */}
                <div style={{ background: cfg.headerBg, color: cfg.headerText, padding: '24px 28px 20px', position: 'relative', flexShrink: 0 }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                        <X className="w-4 h-4" />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginRight: 36 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Package className="w-4 h-4" style={{ opacity: 0.75 }} />
                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Ficha del producto
                                </span>
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                                {producto?.nombreProducto ?? '—'}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5, fontFamily: 'monospace' }}>
                                Ref: {producto?.referencia ?? '—'}
                            </div>
                        </div>
                        {producto && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                                {cfg.icon}{cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {loadingDetail ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: cfg.accentColor }} />
                        </div>
                    ) : producto ? (
                        <>
                            {producto.estado === 'inactivo' && (
                                <div style={{ margin: '16px 24px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                                    <XCircleIcon className="w-4 h-4 shrink-0" />
                                    Producto inactivo. No aparece en el catálogo de clientes.
                                </div>
                            )}
                            {sinStock && producto.estado === 'activo' && (
                                <div style={{ margin: '16px 24px 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#991b1b' }}>
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    Sin stock disponible. No se puede agregar al carrito.
                                </div>
                            )}

                            {/* Imagen */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <ProductImage src={producto.imagenUrl} alt={producto.nombreProducto} />
                            </div>

                            {/* Info */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Información</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        {producto.categoria && (
                                            <InfoItem icon={<Tag className="w-4 h-4" />} label="Categoría" value={producto.categoria.nombreCategoria} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        )}
                                        <InfoItem icon={<Hash className="w-4 h-4" />} label="Referencia" value={producto.referencia} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                    </div>
                                </div>
                            </div>

                            {/* Precio */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ background: cfg.headerBg, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8, display: 'flex' }}>
                                            <DollarSign className="w-4 h-4" style={{ color: '#fff' }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Precio unitario
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                                            ${Number(producto.precio).toLocaleString('es-CO')}
                                        </span>
                                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginLeft: 4 }}>COP</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stock */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ background: sinStock ? '#fef2f2' : '#fff', borderRadius: 12, border: `1px solid ${sinStock ? '#fecaca' : '#e2e8f0'}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: sinStock ? '#fee2e2' : cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex' }}>
                                        <Boxes className="w-4 h-4" style={{ color: sinStock ? '#dc2626' : cfg.iconColor }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock disponible</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: sinStock ? '#dc2626' : '#0f172a' }}>
                                            {sinStock ? 'Sin stock' : `${Number(producto.stock).toLocaleString()} unidades`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Descripción */}
                            {producto.descripcion && (
                                <div style={{ padding: '12px 24px 0' }}>
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FileText className="w-3 h-3" />Descripción
                                        </div>
                                        <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{producto.descripcion}</p>
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Producto ID #{producto.id}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {producto && !loadingDetail && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                        {onAddToCart && (
                            <Button
                                disabled={sinStock}
                                onClick={() => { onAddToCart(producto); if (!sinStock) onClose(); }}
                                style={{ fontSize: 13, border: 'none', background: sinStock ? '#e2e8f0' : enCarrito ? '#1e3a8a' : cfg.accentColor, color: sinStock ? '#94a3b8' : '#fff', cursor: sinStock ? 'not-allowed' : 'pointer' }}
                            >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                {sinStock ? 'Sin stock' : enCarrito ? 'Agregar otra unidad' : 'Agregar al carrito'}
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
