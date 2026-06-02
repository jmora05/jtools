import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Package, CheckCircleIcon, XCircleIcon,
    DollarSign, Hash, Building2, Layers,
} from 'lucide-react';

// ─── Tipo ─────────────────────────────────────────────────────────────────────

export interface Supply {
    id: number;
    name: string;
    description: string;
    price: number;
    unit: string;
    cantidad: number | null;
    proveedores: { id: number; nombre: string }[];
    proveedoresIds: number[];
    proveedorNombre: string | null;
    status: boolean;
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

interface InsumoDetailModalProps {
    open: boolean;
    onClose: () => void;
    insumo: Supply | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function InsumoDetailModal({ open, onClose, insumo }: InsumoDetailModalProps) {
    const cfg = insumo?.status ? ESTADO_CONFIG.activo : ESTADO_CONFIG.inactivo;

    const stockBajo = (insumo?.cantidad ?? 0) < 5;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="p-0 max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ borderRadius: 16 }}>

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
                                    Ficha del insumo
                                </span>
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                {insumo?.name ?? '—'}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                                {insumo?.unit ?? ''}
                            </div>
                        </div>
                        {insumo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                                {cfg.icon}{cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {insumo ? (
                        <>
                            {!insumo.status && (
                                <div style={{ margin: '16px 24px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                                    <XCircleIcon className="w-4 h-4 shrink-0" />
                                    Este insumo está inactivo y no aparece en el formulario de compras.
                                </div>
                            )}
                            {stockBajo && insumo.status && (
                                <div style={{ margin: '16px 24px 0', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#713f12' }}>
                                    <Package className="w-4 h-4 shrink-0" />
                                    Stock bajo. Se recomienda realizar una compra pronto.
                                </div>
                            )}

                            {/* Info general */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>General</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<Layers className="w-4 h-4" />}  label="Unidad de medida"    value={insumo.unit}    iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        <InfoItem icon={<Package className="w-4 h-4" />} label="Stock disponible"    value={insumo.cantidad !== null ? String(insumo.cantidad) : '—'} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                    </div>
                                    {insumo.description && (
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Descripción</div>
                                            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>{insumo.description}</p>
                                        </div>
                                    )}
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
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                                        ${insumo.price.toLocaleString('es-CO')}
                                    </div>
                                </div>
                            </div>

                            {/* Proveedores */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <Building2 className="w-4 h-4" style={{ color: cfg.accentColor }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Proveedores</span>
                                    <span style={{ background: cfg.chipBg, color: cfg.chipText, border: `1px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '1px 10px', fontSize: 12, fontWeight: 700 }}>
                                        {insumo.proveedores.length}
                                    </span>
                                </div>

                                {insumo.proveedores.length > 0 ? (
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        {insumo.proveedores.map((prov, i) => (
                                            <div key={prov.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < insumo.proveedores.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.12s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = cfg.rowHover)}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex', color: cfg.iconColor, flexShrink: 0 }}>
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{prov.nombre}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Sin proveedores asignados.</div>
                                )}
                            </div>

                            <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Insumo ID #{insumo.id}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {insumo && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
