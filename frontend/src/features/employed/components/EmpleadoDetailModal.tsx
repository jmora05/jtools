import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Users, CheckCircleIcon, XCircleIcon,
    User, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, Hash, Edit,
} from 'lucide-react';
import type { Empleado } from '../services/empleadosService';

// ─── Config por estado ────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, {
    label: string; icon: React.ReactNode;
    headerBg: string; headerText: string;
    chipBg: string; chipText: string; chipBorder: string;
    accentColor: string;
    iconBg: string; iconColor: string;
}> = {
    activo: {
        label: 'Activo', icon: <CheckCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    inactivo: {
        label: 'Inactivo', icon: <XCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', headerText: '#fff',
        chipBg: '#f1f5f9', chipText: '#475569', chipBorder: '#cbd5e1',
        accentColor: '#64748b',
        iconBg: '#f8fafc', iconColor: '#64748b',
    },
};

const DEFAULT_CFG = ESTADO_CONFIG['activo'];

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

interface EmpleadoDetailModalProps {
    open: boolean;
    onClose: () => void;
    empleado: Empleado | null;
    onEdit?: (empleado: Empleado) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function EmpleadoDetailModal({ open, onClose, empleado, onEdit }: EmpleadoDetailModalProps) {
    const cfg = ESTADO_CONFIG[empleado?.estado ?? ''] ?? DEFAULT_CFG;

    const formatSalario = (s?: number | string) => {
        if (!s) return '—';
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(String(s)));
    };

    const formatFecha = (f?: string) => {
        if (!f) return '—';
        const d = new Date(f + 'T12:00:00');
        return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    };

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
                                <Users className="w-4 h-4" style={{ opacity: 0.75 }} />
                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Ficha del empleado
                                </span>
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                {empleado ? `${empleado.nombres} ${empleado.apellidos}` : '—'}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                                {empleado?.cargo ?? ''}{empleado?.area ? ` · ${empleado.area}` : ''}
                            </div>
                        </div>
                        {empleado && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                                {cfg.icon}{cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {empleado ? (
                        <>
                            {empleado.estado === 'inactivo' && (
                                <div style={{ margin: '16px 24px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                                    <XCircleIcon className="w-4 h-4 shrink-0" />
                                    Este empleado está inactivo. No aparece en el control de pagos activo.
                                </div>
                            )}

                            {/* Identificación */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Identificación</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<User className="w-4 h-4" />} label="Nombre completo" value={`${empleado.nombres} ${empleado.apellidos}`} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        <InfoItem icon={<Hash className="w-4 h-4" />} label="Documento" value={`${empleado.tipoDocumento} ${empleado.numeroDocumento}`} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                    </div>
                                </div>
                            </div>

                            {/* Contacto */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Contacto</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<Mail className="w-4 h-4" />} label="Correo electrónico" value={empleado.email} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        <InfoItem icon={<Phone className="w-4 h-4" />} label="Teléfono" value={empleado.telefono} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        {empleado.ciudad && <InfoItem icon={<MapPin className="w-4 h-4" />} label="Ciudad" value={empleado.ciudad} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                        {empleado.direccion && <InfoItem icon={<MapPin className="w-4 h-4" />} label="Dirección" value={empleado.direccion} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                    </div>
                                </div>
                            </div>

                            {/* Laboral */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Información laboral</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Cargo" value={empleado.cargo} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        {empleado.area && <InfoItem icon={<Users className="w-4 h-4" />} label="Área" value={empleado.area} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                        <InfoItem icon={<Calendar className="w-4 h-4" />} label="Fecha de ingreso" value={formatFecha(empleado.fechaIngreso)} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                    </div>
                                </div>
                            </div>

                            {/* Salario */}
                            <div style={{ padding: '12px 24px 16px' }}>
                                <div style={{ background: cfg.headerBg, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8, display: 'flex' }}>
                                            <DollarSign className="w-4 h-4" style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salario base mensual</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                                        {formatSalario(empleado.salario)}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {empleado && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                        {empleado.estado === 'activo' && onEdit && (
                            <Button onClick={() => { onEdit(empleado); onClose(); }} style={{ background: cfg.accentColor, color: '#fff', fontSize: 13, border: 'none' }}>
                                <Edit className="w-4 h-4 mr-2" />Editar empleado
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
