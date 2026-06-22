import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, Building2, CheckCircleIcon, XCircleIcon,
    User, Mail, Phone, MapPin, Hash, FileText, Tag,
} from 'lucide-react';

// ─── Tipo ─────────────────────────────────────────────────────────────────────

export interface Supplier {
    id: number;
    type: string;
    name: string;
    firstName?: string;
    lastName?: string;
    legalRepresentative?: string;
    documentType: string;
    documentNumber: string;
    email: string;
    phone: string;
    city: string;
    department?: string;
    address: string;
    isActive: boolean;
}

// ─── Config por estado ────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
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

interface ProveedorDetailModalProps {
    open: boolean;
    onClose: () => void;
    proveedor: Supplier | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProveedorDetailModal({ open, onClose, proveedor }: ProveedorDetailModalProps) {
    const cfg = proveedor?.isActive ? ESTADO_CONFIG.activo : ESTADO_CONFIG.inactivo;

    const tipoLabel = proveedor?.type === 'empresa' ? 'Empresa' : 'Persona Natural';

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
                                <Building2 className="w-4 h-4" style={{ opacity: 0.75 }} />
                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Ficha del proveedor
                                </span>
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                {proveedor?.name ?? '—'}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                                {tipoLabel}{proveedor?.city ? ` · ${proveedor.city}${proveedor.department ? ', ' + proveedor.department : ''}` : ''}
                            </div>
                        </div>
                        {proveedor && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                                {cfg.icon}{cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {proveedor ? (
                        <>
                            {!proveedor.isActive && (
                                <div style={{ margin: '16px 24px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                                    <XCircleIcon className="w-4 h-4 shrink-0" />
                                    Este proveedor está inactivo y no aparece en la lista de selección al crear compras.
                                </div>
                            )}

                            {/* Identificación */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Identificación</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<Tag className="w-4 h-4" />}      label="Tipo"       value={tipoLabel}                     iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        <InfoItem icon={<Hash className="w-4 h-4" />}     label="Documento"  value={`${proveedor.documentType} ${proveedor.documentNumber}`} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        {proveedor.type === 'empresa' && proveedor.legalRepresentative && (
                                            <InfoItem icon={<User className="w-4 h-4" />} label="Representante legal" value={proveedor.legalRepresentative} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        )}
                                        {proveedor.type !== 'empresa' && proveedor.firstName && (
                                            <InfoItem icon={<User className="w-4 h-4" />} label="Nombre completo" value={`${proveedor.firstName} ${proveedor.lastName ?? ''}`} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contacto */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Contacto</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        {proveedor.email && <InfoItem icon={<Mail className="w-4 h-4" />}   label="Correo"    value={proveedor.email}   iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                        {proveedor.phone && <InfoItem icon={<Phone className="w-4 h-4" />}  label="Teléfono"  value={proveedor.phone}   iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                        {proveedor.city  && <InfoItem icon={<MapPin className="w-4 h-4" />} label="Ciudad"    value={proveedor.department ? `${proveedor.city}, ${proveedor.department}` : proveedor.city} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                        {proveedor.address && <InfoItem icon={<FileText className="w-4 h-4" />} label="Dirección" value={proveedor.address} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Proveedor ID #{proveedor.id}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {proveedor && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
