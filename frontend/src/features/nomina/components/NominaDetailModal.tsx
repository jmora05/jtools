import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import {
    X, FileText, CheckCircleIcon, ClockIcon,
    User, Calendar, DollarSign, Hash, FileDown, Briefcase,
    TrendingUp, TrendingDown,
} from 'lucide-react';
// @ts-ignore
import { generarPdfNomina } from '../utils/generarPdfNomina';
import { toast } from 'sonner';

// ─── Tipo ─────────────────────────────────────────────────────────────────────

export interface PayrollRecord {
    id: number;
    employeeId?: number;
    employeeName: string;
    employeeDocument: string;
    position: string;
    baseSalary: number;
    daysWorked: number;
    weekLabel: string;
    paymentDate: string;
    recargoNocturno: number;
    recargoDiurnoDominical: number;
    recargoNocturnoDominical: number;
    horaExtraDiurna: number;
    horaExtraNocturna: number;
    horaExtraDiurnaDominical: number;
    horaExtraNocturnaDominical: number;
    hasTransportAllowance: boolean;
    calculatedValues: {
        proportionalSalary: number;
        recargoNocturno: number;
        recargoDiurnoDominical: number;
        recargoNocturnoDominical: number;
        horaExtraDiurna: number;
        horaExtraNocturna: number;
        horaExtraDiurnaDominical: number;
        horaExtraNocturnaDominical: number;
        transportAllowance: number;
        totalEarned: number;
        healthDeduction: number;
        pensionDeduction: number;
        totalDeductions: number;
        netPay: number;
    };
    estado: 'pendiente' | 'pagado';
    createdAt: string;
}

// ─── Config por estado ────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, {
    label: string; icon: React.ReactNode;
    headerBg: string; headerText: string;
    chipBg: string; chipText: string; chipBorder: string;
    accentColor: string; rowHover: string;
    iconBg: string; iconColor: string;
}> = {
    pagado: {
        label: 'Pagado', icon: <CheckCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb', rowHover: '#eff6ff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    pendiente: {
        label: 'Pendiente', icon: <ClockIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', headerText: '#fff',
        chipBg: '#fef9c3', chipText: '#713f12', chipBorder: '#fde047',
        accentColor: '#ca8a04', rowHover: '#fefce8',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
};

const DEFAULT_CFG = ESTADO_CONFIG['pendiente'];

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

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

// ─── Helper fila de detalle ───────────────────────────────────────────────────

function DetalleRow({ label, value, bold, rowHover }: { label: string; value: string; bold?: boolean; rowHover: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: '#0f172a' }}>{value}</span>
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NominaDetailModalProps {
    open: boolean;
    onClose: () => void;
    record: PayrollRecord | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NominaDetailModal({ open, onClose, record }: NominaDetailModalProps) {
    const cfg = ESTADO_CONFIG[record?.estado ?? ''] ?? DEFAULT_CFG;
    const cv = record?.calculatedValues;

    const devengados = [
        { label: 'Salario proporcional', value: cv?.proportionalSalary ?? 0 },
        ...(cv?.recargoNocturno        ? [{ label: 'Recargo Nocturno (+35%)',                  value: cv.recargoNocturno }]        : []),
        ...(cv?.recargoDiurnoDominical  ? [{ label: 'Recargo Diurno Dominical (+75%)',           value: cv.recargoDiurnoDominical }]  : []),
        ...(cv?.recargoNocturnoDominical? [{ label: 'Recargo Nocturno Dominical (+110%)',         value: cv.recargoNocturnoDominical}]  : []),
        ...(cv?.horaExtraDiurna         ? [{ label: 'Hora Extra Diurna (+25%)',                   value: cv.horaExtraDiurna }]         : []),
        ...(cv?.horaExtraNocturna        ? [{ label: 'Hora Extra Nocturna (+75%)',                 value: cv.horaExtraNocturna }]        : []),
        ...(cv?.horaExtraDiurnaDominical ? [{ label: 'Hora Extra Diurna Dominical (+100%)',        value: cv.horaExtraDiurnaDominical }] : []),
        ...(cv?.horaExtraNocturnaDominical? [{ label: 'Hora Extra Nocturna Dominical (+150%)',     value: cv.horaExtraNocturnaDominical }]: []),
        ...(cv?.transportAllowance       ? [{ label: 'Auxilio de transporte',                      value: cv.transportAllowance }]       : []),
    ];

    const deducciones = [
        ...(cv?.healthDeduction  ? [{ label: 'Salud (4%)',   value: cv.healthDeduction }]  : []),
        ...(cv?.pensionDeduction ? [{ label: 'Pensión (4%)', value: cv.pensionDeduction }] : []),
    ];

    const handlePDF = () => {
        if (!record) return;
        try {
            generarPdfNomina(record, formatCurrency);
            toast.success(`PDF de control de pagos de ${record.employeeName} descargado.`);
        } catch (err: any) {
            toast.error(`Error al generar PDF: ${err.message}`);
        }
    };

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
                                <FileText className="w-4 h-4" style={{ opacity: 0.75 }} />
                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Control de pagos
                                </span>
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                {record?.employeeName ?? '—'}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                                {record?.weekLabel ?? ''}
                            </div>
                        </div>
                        {record && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                                {cfg.icon}{cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {record && cv ? (
                        <>
                            {/* Info empleado */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Empleado</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<User className="w-4 h-4" />}     label="Nombre"       value={record.employeeName}     iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        <InfoItem icon={<Hash className="w-4 h-4" />}     label="Documento"    value={record.employeeDocument}  iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Cargo"       value={record.position}          iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        <InfoItem icon={<Calendar className="w-4 h-4" />}  label="Días trabajados" value={`${record.daysWorked} días`} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                    </div>
                                </div>
                            </div>

                            {/* Devengados */}
                            <div style={{ padding: '12px 24px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <TrendingUp className="w-4 h-4" style={{ color: '#16a34a' }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Devengados</span>
                                </div>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    {devengados.map((r, i) => (
                                        <div key={i} style={{ borderBottom: i < devengados.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                            <DetalleRow label={r.label} value={formatCurrency(r.value)} rowHover={cfg.rowHover} />
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Total devengado</span>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{formatCurrency(cv.totalEarned)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deducciones */}
                            {deducciones.length > 0 && (
                                <div style={{ padding: '12px 24px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <TrendingDown className="w-4 h-4" style={{ color: '#dc2626' }} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Deducciones</span>
                                    </div>
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        {deducciones.map((r, i) => (
                                            <div key={i} style={{ borderBottom: i < deducciones.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                <DetalleRow label={r.label} value={`-${formatCurrency(r.value)}`} rowHover="#fff1f2" />
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#fef2f2', borderTop: '2px solid #fecaca' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Total deducciones</span>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: '#dc2626' }}>-{formatCurrency(cv.totalDeductions)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Neto a pagar */}
                            <div style={{ padding: '12px 24px 16px' }}>
                                <div style={{ background: cfg.headerBg, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8, display: 'flex' }}>
                                            <DollarSign className="w-4 h-4" style={{ color: '#fff' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Neto a pagar</div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Fecha de pago: {record.paymentDate}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                                        {formatCurrency(cv.netPay)}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {record && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                        <Button onClick={handlePDF} style={{ background: cfg.accentColor, color: '#fff', fontSize: 13, border: 'none' }}>
                            <FileDown className="w-4 h-4 mr-2" />Descargar PDF
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
