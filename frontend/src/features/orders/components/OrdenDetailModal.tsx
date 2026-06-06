import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, ClipboardList, CheckCircleIcon, ClockIcon, BanIcon, PauseCircle,
    PlayCircle, User, Calendar, Package, Hash, FileText,
} from 'lucide-react';
import type { OrdenProduccion } from '../services/ordenesproduccionservice';

// ─── Config por estado ────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, {
    label: string; icon: React.ReactNode;
    headerBg: string; headerText: string;
    chipBg: string; chipText: string; chipBorder: string;
    accentColor: string; rowHover: string;
    totalBg: string; totalText: string;
    iconBg: string; iconColor: string;
}> = {
    Pendiente: {
        label: 'Pendiente', icon: <ClockIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', headerText: '#fff',
        chipBg: '#fef9c3', chipText: '#713f12', chipBorder: '#fde047',
        accentColor: '#ca8a04', rowHover: '#fefce8',
        totalBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', totalText: '#fff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    'En Proceso': {
        label: 'En Proceso', icon: <PlayCircle className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb', rowHover: '#eff6ff',
        totalBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', totalText: '#fff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    Pausada: {
        label: 'Pausada', icon: <PauseCircle className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb', rowHover: '#eff6ff',
        totalBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', totalText: '#fff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    Finalizada: {
        label: 'Finalizada', icon: <CheckCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb', rowHover: '#eff6ff',
        totalBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', totalText: '#fff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    Anulada: {
        label: 'Anulada', icon: <BanIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 100%)', headerText: '#fff',
        chipBg: '#fee2e2', chipText: '#7f1d1d', chipBorder: '#fca5a5',
        accentColor: '#dc2626', rowHover: '#fff1f2',
        totalBg: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 100%)', totalText: '#fff',
        iconBg: '#fff1f2', iconColor: '#dc2626',
    },
};

const DEFAULT_CFG = ESTADO_CONFIG['Pendiente'];

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

interface OrdenDetailModalProps {
    open: boolean;
    onClose: () => void;
    orden: OrdenProduccion | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function OrdenDetailModal({ open, onClose, orden }: OrdenDetailModalProps) {
    const cfg = ESTADO_CONFIG[orden?.estado ?? ''] ?? DEFAULT_CFG;

    const formatFecha = (f?: string) => {
        if (!f) return '—';
        const d = f.includes('T') ? new Date(f) : new Date(f + 'T12:00:00');
        return d.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const insumos = Array.isArray(orden?.insumosCalculados) ? orden!.insumosCalculados : [];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent hideCloseButton className="p-0 max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ borderRadius: 16 }}>

                {/* Header */}
                <div style={{ background: cfg.headerBg, color: cfg.headerText, padding: '24px 28px 20px', position: 'relative', flexShrink: 0 }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                        <X className="w-4 h-4" />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginRight: 36 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <ClipboardList className="w-4 h-4" style={{ opacity: 0.75 }} />
                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Orden de producción
                                </span>
                            </div>
                            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {orden?.codigoOrden ?? `#${orden?.id ?? '—'}`}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>{formatFecha(orden?.fechaEntrega)}</div>
                        </div>
                        {orden && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
                                {cfg.icon}{cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {orden ? (
                        <>
                            {orden.estado === 'Anulada' && (
                                <div style={{ margin: '16px 24px 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#991b1b' }}>
                                    <BanIcon className="w-4 h-4 shrink-0" />
                                    Orden anulada.{orden.motivoAnulacion ? ` Motivo: ${orden.motivoAnulacion}` : ''}
                                </div>
                            )}
                            {orden.estado === 'Finalizada' && (
                                <div style={{ margin: '16px 24px 0', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534' }}>
                                    <CheckCircleIcon className="w-4 h-4 shrink-0" />
                                    Orden finalizada exitosamente.
                                </div>
                            )}

                            {/* Info principal */}
                            <div style={{ padding: '16px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Información</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<Package className="w-4 h-4" />} label="Producto" value={orden.producto?.nombreProducto ?? `ID #${orden.productoId}`} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        {orden.producto?.referencia && <InfoItem icon={<Hash className="w-4 h-4" />} label="Referencia" value={orden.producto.referencia} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                        <InfoItem icon={<User className="w-4 h-4" />} label="Responsable" value={orden.responsable ? `${orden.responsable.nombres} ${orden.responsable.apellidos}` : `ID #${orden.responsableId}`} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        {orden.responsable?.cargo && <InfoItem icon={<ClipboardList className="w-4 h-4" />} label="Cargo" value={orden.responsable.cargo} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                    </div>
                                </div>

                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex' }}>
                                        <Calendar className="w-4 h-4" style={{ color: cfg.iconColor }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha de entrega</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                            {orden.fechaEntrega ? new Date(orden.fechaEntrega.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO') : '—'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex' }}>
                                        <Package className="w-4 h-4" style={{ color: cfg.iconColor }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cantidad</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{orden.cantidad} unidades</div>
                                    </div>
                                </div>
                            </div>

                            {/* Nota */}
                            {orden.nota && (
                                <div style={{ padding: '12px 24px 0' }}>
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FileText className="w-3 h-3" />Nota
                                        </div>
                                        <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>{orden.nota}</p>
                                    </div>
                                </div>
                            )}

                            {/* Insumos calculados */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <Package className="w-4 h-4" style={{ color: cfg.accentColor }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Insumos utilizados</span>
                                    <span style={{ background: cfg.chipBg, color: cfg.chipText, border: `1px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '1px 10px', fontSize: 12, fontWeight: 700 }}>
                                        {insumos.length}
                                    </span>
                                </div>

                                {insumos.length > 0 ? (
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '8px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            <span>Insumo</span>
                                            <span style={{ textAlign: 'right', minWidth: 120 }}>Cantidad descontada</span>
                                        </div>
                                        {insumos.map((ins, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '12px 16px', alignItems: 'center', borderBottom: i < insumos.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.12s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = cfg.rowHover)}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{ins.nombre}</div>
                                                <div style={{ textAlign: 'right', minWidth: 120 }}>
                                                    <span style={{ background: cfg.chipBg, color: cfg.chipText, border: `1px solid ${cfg.chipBorder}`, borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>
                                                        {ins.cantidadDescontada}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Sin insumos registrados para esta orden.</div>
                                )}
                            </div>

                            <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Orden {orden.codigoOrden ?? `#${orden.id}`}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {orden && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
