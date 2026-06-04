import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Package, Tag, Ruler, DollarSign, Layers,
    Building2, CheckCircle2, XCircle,
} from 'lucide-react';

interface Supply {
    id:              number;
    name:            string;
    description:     string;
    price:           number;
    unit:            string;
    cantidad:        number | null;
    proveedores:     { id: number; nombre: string }[];
    proveedoresIds:  number[];
    proveedorNombre: string | null;
    status:          boolean;
}

interface InsumoDetailModalProps {
    open:    boolean;
    onClose: () => void;
    insumo:  Supply | null;
}

export function InsumoDetailModal({ open, onClose, insumo }: InsumoDetailModalProps) {
    if (!insumo) return null;

    const headerBg    = insumo.status
        ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
        : 'linear-gradient(135deg, #374151 0%, #6b7280 100%)';
    const accentColor = insumo.status ? '#2563eb' : '#6b7280';
    const iconBg      = insumo.status ? '#eff6ff' : '#f3f4f6';
    const iconColor   = insumo.status ? '#1d4ed8' : '#6b7280';

    const stockColor =
        insumo.cantidad === null  ? '#64748b' :
        insumo.cantidad === 0     ? '#dc2626' :
        insumo.cantidad < 5       ? '#d97706' : '#16a34a';

    const stockBg =
        insumo.cantidad === null  ? '#f1f5f9' :
        insumo.cantidad === 0     ? '#fee2e2' :
        insumo.cantidad < 5       ? '#fef3c7' : '#dcfce7';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="p-0 max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
                style={{ borderRadius: 16 }}
            >
                {/* Header */}
                <div style={{
                    background: headerBg, color: '#fff',
                    padding: '24px 28px 20px', position: 'relative', flexShrink: 0,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 14, right: 14,
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            borderRadius: 8, padding: '4px 6px', cursor: 'pointer',
                            color: '#fff', display: 'flex', alignItems: 'center',
                        }}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginRight: 36 }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)', borderRadius: 12,
                            padding: 10, display: 'flex', flexShrink: 0,
                        }}>
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                                Detalle de insumo
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
                                {insumo.name}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                                ID #{insumo.id}
                            </div>
                        </div>

                        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                            {insumo.status ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: '#dcfce7', color: '#166534',
                                    border: '1.5px solid #86efac', borderRadius: 999,
                                    padding: '5px 12px', fontSize: 12, fontWeight: 700,
                                }}>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Activo
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: '#f3f4f6', color: '#374151',
                                    border: '1.5px solid #d1d5db', borderRadius: 999,
                                    padding: '5px 12px', fontSize: 12, fontWeight: 700,
                                }}>
                                    <XCircle className="w-3.5 h-3.5" />
                                    Inactivo
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc', padding: '20px 24px' }}>

                    {/* Descripción */}
                    {insumo.description && (
                        <div style={{
                            background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
                            padding: '14px 16px', marginBottom: 12,
                        }}>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                                Descripción
                            </div>
                            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                                {insumo.description}
                            </div>
                        </div>
                    )}

                    {/* Datos principales */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

                        <InfoCard
                            icon={<DollarSign className="w-4 h-4" />}
                            label="Precio unitario"
                            iconBg={iconBg} iconColor={iconColor}
                        >
                            <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                                ${Number(insumo.price).toLocaleString('es-CO')}
                            </span>
                        </InfoCard>

                        <InfoCard
                            icon={<Ruler className="w-4 h-4" />}
                            label="Unidad de medida"
                            iconBg={iconBg} iconColor={iconColor}
                        >
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                                {insumo.unit}
                            </span>
                        </InfoCard>

                        <InfoCard
                            icon={<Layers className="w-4 h-4" />}
                            label="Stock actual"
                            iconBg={stockBg} iconColor={stockColor}
                            fullWidth
                        >
                            <span style={{ fontSize: 20, fontWeight: 800, color: stockColor }}>
                                {insumo.cantidad !== null ? insumo.cantidad : '—'}
                            </span>
                            {insumo.cantidad !== null && (
                                <span style={{ fontSize: 13, color: stockColor, marginLeft: 4, fontWeight: 500 }}>
                                    {insumo.unit}
                                </span>
                            )}
                            {insumo.cantidad === 0 && (
                                <span style={{ marginLeft: 10, fontSize: 12, background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                                    Sin stock
                                </span>
                            )}
                            {insumo.cantidad !== null && insumo.cantidad > 0 && insumo.cantidad < 5 && (
                                <span style={{ marginLeft: 10, fontSize: 12, background: '#fef3c7', color: '#d97706', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                                    Stock bajo
                                </span>
                            )}
                        </InfoCard>
                    </div>

                    {/* Proveedores */}
                    <div style={{
                        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 11, color: '#94a3b8', fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            <Building2 className="w-3.5 h-3.5" />
                            Proveedores ({insumo.proveedores.length})
                        </div>

                        {insumo.proveedores.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {insumo.proveedores.map((p) => (
                                    <div key={p.id} style={{
                                        background: iconBg, color: iconColor,
                                        border: `1px solid ${insumo.status ? '#bfdbfe' : '#e5e7eb'}`,
                                        borderRadius: 8, padding: '6px 12px',
                                        fontSize: 13, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        <Tag className="w-3 h-3" />
                                        {p.nombre}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                                Sin proveedores asignados.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 24px', borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'flex-end',
                    background: '#fff', flexShrink: 0,
                }}>
                    <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function InfoCard({
    icon, label, iconBg, iconColor, children, fullWidth,
}: {
    icon: React.ReactNode; label: string;
    iconBg: string; iconColor: string;
    children: React.ReactNode; fullWidth?: boolean;
}) {
    return (
        <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            gridColumn: fullWidth ? '1 / -1' : undefined,
        }}>
            <div style={{ background: iconBg, borderRadius: 8, padding: 8, display: 'flex', color: iconColor, flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
