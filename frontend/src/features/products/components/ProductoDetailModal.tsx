import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Package, CheckCircleIcon, XCircleIcon, AlertTriangle,
    Tag, Boxes, Loader2, ShoppingCart, Hash, Clock,
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
    onPedir?: (producto: Producto) => void;
    isInCart?: (id: number) => boolean;
}

// ─── Config por estado (idéntica al resto del proyecto) ────────────────────────
const ESTADO_CFG: Record<string, {
    label: string; icon: React.ReactNode;
    headerBg: string;
    chipBg: string; chipText: string; chipBorder: string;
    accentColor: string;
    iconBg: string; iconColor: string;
}> = {
    activo: {
        label: 'Activo', icon: <CheckCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    inactivo: {
        label: 'Inactivo', icon: <XCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
        chipBg: '#f1f5f9', chipText: '#475569', chipBorder: '#cbd5e1',
        accentColor: '#64748b',
        iconBg: '#f8fafc', iconColor: '#64748b',
    },
};

// ─── InfoItem (idéntico al de EmpleadoDetailModal) ────────────────────────────
function InfoItem({ icon, label, value, iconBg, iconColor }: {
    icon: React.ReactNode; label: string; value: string;
    iconBg: string; iconColor: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 140px' }}>
            <div style={{ background: iconBg, borderRadius: 8, padding: 8, display: 'flex', color: iconColor, flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</div>
            </div>
        </div>
    );
}

// ─── Panel de imagen a sangre completa ────────────────────────────────────────
const H = 560; // altura fija del modal

function ImagePanel({ src, alt, id }: { src?: string | null; alt: string; id: number }) {
    const [err, setErr] = useState(false);
    return (
        <div style={{ position: 'relative', height: H, overflow: 'hidden', borderRadius: '16px 0 0 16px', background: '#e2e8f0' }}>
            {!src || err ? (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(140deg, #f1f5f9, #e2e8f0)', gap: 12,
                }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            {/* gradiente overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 45%, rgba(0,0,0,0.08) 100%)' }} />
            {/* ID pill */}
            <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.88)', fontSize: 11, fontFamily: 'monospace', borderRadius: 999, padding: '5px 11px', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Package style={{ width: 11, height: 11 }} />
                #{id}
            </div>
        </div>
    );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export function ProductoDetailModal({ open, onClose, producto, loadingDetail, onAddToCart, onPedir, isInCart }: ProductoDetailModalProps) {
    const sinStock  = (producto?.stock ?? 0) === 0;
    const isActivo  = (producto?.estado ?? 'activo') === 'activo';
    const enCarrito = producto && isInCart ? isInCart(producto.id) : false;
    const cfg       = ESTADO_CFG[producto?.estado ?? 'activo'] ?? ESTADO_CFG.activo;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                hideCloseButton
                className="p-0 overflow-hidden"
                style={{ maxWidth: 860, width: '94vw', borderRadius: 16, padding: 0, boxShadow: '0 28px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)' }}
            >
                {/* Spinner */}
                {loadingDetail && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: H }}>
                        <Loader2 style={{ width: 36, height: 36, color: '#94a3b8' }} className="animate-spin" />
                    </div>
                )}

                {/* Grid de dos columnas — en un div interno para no conflictuar con los estilos de DialogContent */}
                {!loadingDetail && producto && (
                    <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr', height: H, overflow: 'hidden' }}>

                        {/* IZQUIERDA: imagen a sangre */}
                        <ImagePanel key={producto.id} src={producto.imagenUrl} alt={producto.nombreProducto} id={producto.id} />

                        {/* DERECHA: info */}
                        <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', height: H, borderRadius: '0 16px 16px 0', overflow: 'hidden' }}>

                            {/* Header con gradiente — igual al resto del proyecto */}
                            <div style={{ background: cfg.headerBg, color: '#fff', padding: '20px 24px 18px', flexShrink: 0, position: 'relative' }}>
                                <button
                                    onClick={onClose}
                                    style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
                                >
                                    <X style={{ width: 16, height: 16 }} />
                                </button>

                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginRight: 36 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            <Package style={{ width: 14, height: 14, opacity: 0.75 }} />
                                            <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                                Detalle del producto
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 4 }}>
                                            {producto.nombreProducto}
                                        </div>
                                        <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                                            REF: {producto.referencia}
                                        </div>
                                    </div>
                                    {/* Chip de estado */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '5px 13px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {cfg.icon}{cfg.label}
                                    </div>
                                </div>
                            </div>

                            {/* Cuerpo scrollable */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                                {/* Aviso sin stock */}
                                {sinStock && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#dc2626' }}>
                                        <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                                        Este producto no tiene stock disponible actualmente.
                                    </div>
                                )}

                                {/* Aviso inactivo */}
                                {!isActivo && (
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
                                        <XCircleIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
                                        Este producto está inactivo y no aparece en el catálogo de clientes.
                                    </div>
                                )}

                                {/* Card de precio — gradiente igual al del salario en EmpleadoDetailModal */}
                                <div style={{ background: cfg.headerBg, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Precio unitario
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                        <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>
                                            ${Number(producto.precio).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                        </span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>COP</span>
                                    </div>
                                </div>

                                {/* Card de información — igual a las cards de EmpleadoDetailModal */}
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                                        Información
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                                        <InfoItem
                                            icon={<Boxes className="w-4 h-4" />}
                                            label="Stock disponible"
                                            value={sinStock ? 'Sin stock' : `${Number(producto.stock).toLocaleString()} unidades`}
                                            iconBg={sinStock ? '#fef2f2' : cfg.iconBg}
                                            iconColor={sinStock ? '#dc2626' : cfg.iconColor}
                                        />
                                        {producto.categoria && (
                                            <InfoItem
                                                icon={<Tag className="w-4 h-4" />}
                                                label="Categoría"
                                                value={producto.categoria.nombreCategoria}
                                                iconBg={cfg.iconBg}
                                                iconColor={cfg.iconColor}
                                            />
                                        )}
                                        <InfoItem
                                            icon={<Hash className="w-4 h-4" />}
                                            label="Referencia"
                                            value={producto.referencia}
                                            iconBg={cfg.iconBg}
                                            iconColor={cfg.iconColor}
                                        />
                                    </div>
                                </div>

                                {/* Card de descripción */}
                                {producto.descripcion && (
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                                            Descripción
                                        </div>
                                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                                            {producto.descripcion}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer — igual al del resto del proyecto */}
                            <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                                <Button variant="outline" size="sm" onClick={onClose} style={{ fontSize: 13 }}>
                                    Cerrar
                                </Button>
                                {sinStock && onPedir ? (
                                    <Button
                                        size="sm"
                                        onClick={() => { onPedir(producto); onClose(); }}
                                        style={{ background: '#d97706', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}
                                    >
                                        <Clock style={{ width: 14, height: 14, marginRight: 6 }} />
                                        Pedir
                                    </Button>
                                ) : onAddToCart && (
                                    <Button
                                        size="sm"
                                        disabled={sinStock}
                                        onClick={() => { onAddToCart(producto); if (!sinStock) onClose(); }}
                                        style={{ background: sinStock ? '#f1f5f9' : cfg.accentColor, color: sinStock ? '#94a3b8' : '#fff', border: 'none', fontSize: 13, cursor: sinStock ? 'not-allowed' : 'pointer' }}
                                    >
                                        <ShoppingCart style={{ width: 14, height: 14, marginRight: 6 }} />
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
