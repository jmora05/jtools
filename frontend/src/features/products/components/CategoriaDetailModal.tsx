import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Tag, CheckCircleIcon, XCircleIcon,
    Hash, FileText, Package, Edit,
} from 'lucide-react';

// ─── Tipo ─────────────────────────────────────────────────────────────────────

export interface Categoria {
    id: number;
    nombreCategoria: string;
    descripcion: string | null;
    estado: 'activo' | 'inactivo';
    productos?: { id: number; nombreProducto: string; precio: number; stock: number }[];
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoriaDetailModalProps {
    open: boolean;
    onClose: () => void;
    categoria: Categoria | null;
    onEdit?: (cat: Categoria) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CategoriaDetailModal({ open, onClose, categoria, onEdit }: CategoriaDetailModalProps) {
    const cfg = ESTADO_CONFIG[categoria?.estado ?? 'activo'];
    const productos = categoria?.productos ?? [];

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
                                <Tag className="w-4 h-4" style={{ opacity: 0.75 }} />
                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Categoría de productos
                                </span>
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                {categoria?.nombreCategoria ?? '—'}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                                {productos.length} producto{productos.length !== 1 ? 's' : ''} asociado{productos.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        {categoria && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                                {cfg.icon}{cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {categoria ? (
                        <>
                            {categoria.estado === 'inactivo' && (
                                <div style={{ margin: '16px 24px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                                    <XCircleIcon className="w-4 h-4 shrink-0" />
                                    Categoría inactiva. Los productos asociados conservan su estado individual.
                                </div>
                            )}

                            {/* Info */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>General</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 160px' }}>
                                            <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex', color: cfg.iconColor }}>
                                                <Tag className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Nombre</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{categoria.nombreCategoria}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 160px' }}>
                                            <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex', color: cfg.iconColor }}>
                                                <Hash className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>ID</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>#{categoria.id}</div>
                                            </div>
                                        </div>
                                    </div>
                                    {categoria.descripcion && (
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <FileText className="w-3 h-3" />Descripción
                                            </div>
                                            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>{categoria.descripcion}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Productos asociados */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <Package className="w-4 h-4" style={{ color: cfg.accentColor }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Productos asociados</span>
                                    <span style={{ background: cfg.chipBg, color: cfg.chipText, border: `1px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '1px 10px', fontSize: 12, fontWeight: 700 }}>
                                        {productos.length}
                                    </span>
                                </div>

                                {productos.length > 0 ? (
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '8px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            <span>Producto</span>
                                            <span style={{ textAlign: 'right', minWidth: 90 }}>Precio</span>
                                            <span style={{ textAlign: 'right', minWidth: 70 }}>Stock</span>
                                        </div>
                                        {productos.map((p, i) => (
                                            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '10px 16px', alignItems: 'center', borderBottom: i < productos.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.12s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = cfg.rowHover)}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.nombreProducto}</div>
                                                <div style={{ textAlign: 'right', minWidth: 90, fontSize: 13, color: '#475569' }}>
                                                    ${Number(p.precio).toLocaleString('es-CO')}
                                                </div>
                                                <div style={{ textAlign: 'right', minWidth: 70 }}>
                                                    <span style={{ background: p.stock === 0 ? '#fee2e2' : cfg.chipBg, color: p.stock === 0 ? '#991b1b' : cfg.chipText, border: `1px solid ${p.stock === 0 ? '#fca5a5' : cfg.chipBorder}`, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                                                        {p.stock}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                                        Sin productos asociados a esta categoría.
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Categoría ID #{categoria.id}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {categoria && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                        {categoria.estado === 'activo' && onEdit && (
                            <Button onClick={() => { onEdit(categoria); onClose(); }} style={{ background: cfg.accentColor, color: '#fff', fontSize: 13, border: 'none' }}>
                                <Edit className="w-4 h-4 mr-2" />Editar categoría
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
