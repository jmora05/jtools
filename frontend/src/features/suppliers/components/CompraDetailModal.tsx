import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import {
    Loader2, FileDown, BanIcon, CheckCircleIcon, TruckIcon,
    ClockIcon, X, Building2, Phone, Mail, User, Calendar,
    CreditCard, Hash, Package, ShoppingBag,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Compra } from '../types/compra.types';

// ─── Config por estado ────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, {
    label:       string;
    icon:        React.ReactNode;
    headerBg:    string;
    headerText:  string;
    chipBg:      string;
    chipText:    string;
    chipBorder:  string;
    accentColor: string;
    rowHover:    string;
    totalBg:     string;
    totalText:   string;
    iconBg:      string;
    iconColor:   string;
}> = {
    pendiente: {
        label:       'Pendiente',
        icon:        <ClockIcon className="w-4 h-4" />,
        headerBg:    'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        headerText:  '#fff',
        chipBg:      '#fef9c3',
        chipText:    '#713f12',
        chipBorder:  '#fde047',
        accentColor: '#ca8a04',
        rowHover:    '#fefce8',
        totalBg:     'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        totalText:   '#fff',
        iconBg:      '#eff6ff',
        iconColor:   '#1d4ed8',
    },
    'en transito': {
        label:       'En tránsito',
        icon:        <TruckIcon className="w-4 h-4" />,
        headerBg:    'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        headerText:  '#fff',
        chipBg:      '#dbeafe',
        chipText:    '#1e3a8a',
        chipBorder:  '#93c5fd',
        accentColor: '#2563eb',
        rowHover:    '#eff6ff',
        totalBg:     'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        totalText:   '#fff',
        iconBg:      '#eff6ff',
        iconColor:   '#1d4ed8',
    },
    completada: {
        label:       'Completada',
        icon:        <CheckCircleIcon className="w-4 h-4" />,
        headerBg:    'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        headerText:  '#fff',
        chipBg:      '#dcfce7',
        chipText:    '#14532d',
        chipBorder:  '#86efac',
        accentColor: '#16a34a',
        rowHover:    '#f0fdf4',
        totalBg:     'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        totalText:   '#fff',
        iconBg:      '#f0fdf4',
        iconColor:   '#16a34a',
    },
    anulada: {
        label:       'Anulada',
        icon:        <BanIcon className="w-4 h-4" />,
        headerBg:    'linear-gradient(135deg, #450a0a 0%, #b91c1c 100%)',
        headerText:  '#fff',
        chipBg:      '#fee2e2',
        chipText:    '#7f1d1d',
        chipBorder:  '#fca5a5',
        accentColor: '#dc2626',
        rowHover:    '#fff1f2',
        totalBg:     'linear-gradient(135deg, #450a0a 0%, #b91c1c 100%)',
        totalText:   '#fff',
        iconBg:      '#fff1f2',
        iconColor:   '#dc2626',
    },
};

const DEFAULT_CFG = ESTADO_CONFIG['pendiente'];

// ─── PDF ──────────────────────────────────────────────────────────────────────
const IVA_DEFAULT = 19;

function generarPDFCompra(compra: Compra, ivaRate: number = IVA_DEFAULT): void {
    const doc      = new jsPDF();
    const pageW    = doc.internal.pageSize.getWidth();
    const pageH    = doc.internal.pageSize.getHeight();
    const margin   = 14;
    const ivaDecimal = ivaRate / 100;

    // Paleta según estado
    const paleta: Record<string, { header: [number,number,number]; accent: [number,number,number] }> = {
        pendiente:     { header: [30, 58, 138],  accent: [37, 99, 235]  },
        'en transito': { header: [30, 58, 138],  accent: [37, 99, 235]  },
        completada:    { header: [6,  78, 59],   accent: [5,  150, 105] },
        anulada:       { header: [69, 10, 10],   accent: [185, 28, 28]  },
    };
    const p = paleta[compra.estado ?? ''] ?? paleta['pendiente'];
    const grisTexto: [number,number,number] = [55, 65, 81];
    const grisClaro: [number,number,number] = [243, 244, 246];
    const azulClaro: [number,number,number] = [219, 234, 254];

    // Header
    doc.setFillColor(...p.header);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('COMPRA DE INSUMOS', margin, 18);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, margin, 28);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(`Factura #${compra.id}`, pageW - margin, 20, { align: 'right' });

    // Badge estado
    const estadoLabel: Record<string, string> = {
        pendiente: 'Pendiente', 'en transito': 'En tránsito',
        completada: 'Completada', anulada: 'ANULADA',
    };
    doc.setFillColor(...p.accent);
    doc.roundedRect(pageW - margin - 48, 26, 48, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(estadoLabel[compra.estado ?? ''] ?? (compra.estado ?? ''), pageW - margin - 24, 32.5, { align: 'center' });

    // Info proveedor
    let y = 50;
    doc.setFillColor(...azulClaro);
    doc.roundedRect(margin, y, pageW - margin * 2, 42, 3, 3, 'F');
    doc.setTextColor(...grisTexto);
    const c1 = margin + 4, c2 = pageW / 2 + 4;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('PROVEEDOR', c1, y + 7); doc.text('FECHA', c2, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(compra.proveedor?.nombreEmpresa ?? `ID #${compra.proveedoresId}`, c1, y + 15);
    doc.text(new Date(compra.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO'), c2, y + 15);
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('CONTACTO', c1, y + 25); doc.text('MÉTODO DE PAGO', c2, y + 25);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const contacto = [compra.proveedor?.personaContacto, compra.proveedor?.telefono].filter(Boolean).join(' · ') || '—';
    doc.text(contacto, c1, y + 33);
    doc.text((compra.metodoPago ?? '').charAt(0).toUpperCase() + (compra.metodoPago ?? '').slice(1), c2, y + 33);

    // Tabla de insumos
    y += 52;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...p.header);
    doc.text('Detalle de Insumos', margin, y);
    y += 5;

    if (compra.detalles && compra.detalles.length > 0) {
        const subtotal = compra.detalles.reduce((s, d) => s + Number(d.cantidad) * Number(d.precioUnitario), 0);
        const iva   = subtotal * ivaDecimal;
        const total = subtotal + iva;

        const rows = compra.detalles.map((d, i) => [
            (i + 1).toString(),
            d.insumo?.nombreInsumo ?? `ID #${d.insumosId}`,
            d.insumo?.unidadMedida ?? '—',
            String(d.cantidad),
            `$${Number(d.precioUnitario).toLocaleString('es-CO')}`,
            `$${(Number(d.cantidad) * Number(d.precioUnitario)).toLocaleString('es-CO')}`,
        ]);

        autoTable(doc, {
            startY: y,
            head: [['#', 'Insumo', 'Unidad', 'Cant.', 'Precio unit.', 'Subtotal']],
            body: rows,
            foot: [
                ['', '', '', '', 'Subtotal',          `$${subtotal.toLocaleString('es-CO')}`],
                ['', '', '', '', `IVA (${ivaRate}%)`, `$${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
                ['', '', '', '', 'TOTAL',             `$${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
            ],
            margin: { left: margin, right: margin },
            styles:             { fontSize: 9, cellPadding: 4, textColor: grisTexto },
            headStyles:         { fillColor: p.header, textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
            footStyles:         { fillColor: p.accent, textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
            alternateRowStyles: { fillColor: grisClaro },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right', fontStyle: 'bold' },
            },
        });

        // Sello ANULADA en diagonal si corresponde
        if (compra.estado === 'anulada') {
            const finalY = (doc as any).lastAutoTable?.finalY ?? y + 60;
            doc.setTextColor(185, 28, 28);
            doc.setFontSize(48); doc.setFont('helvetica', 'bold');
            doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
            doc.text('ANULADA', pageW / 2, finalY / 2 + 30, { align: 'center', angle: 30 });
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
        }
    }

    // Footer
    doc.setFillColor(...p.header);
    doc.rect(0, pageH - 14, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Documento generado automáticamente — Sistema de Compras', pageW / 2, pageH - 5, { align: 'center' });

    doc.save(`compra_${compra.id}.pdf`);
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface CompraDetailModalProps {
    open:          boolean;
    onClose:       () => void;
    viewingCompra: Compra | null;
    loadingDetail: boolean;
    ivaRate:       number;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function CompraDetailModal({ open, onClose, viewingCompra, loadingDetail, ivaRate }: CompraDetailModalProps) {
    const ivaDecimal = ivaRate / 100;
    const cfg = ESTADO_CONFIG[viewingCompra?.estado ?? ''] ?? DEFAULT_CFG;

    const sub   = viewingCompra?.detalles?.reduce((s, d) => s + Number(d.cantidad) * Number(d.precioUnitario), 0) ?? 0;
    const iva   = sub * ivaDecimal;
    const total = sub + iva;

    const handleDescargarPDF = () => {
        if (!viewingCompra) return;
        try {
            generarPDFCompra(viewingCompra, ivaRate);
            toast.success(`PDF de la compra #${viewingCompra.id} descargado.`);
        } catch (error: any) {
            toast.error(`Error al generar PDF: ${error.message}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="p-0 max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ borderRadius: 16 }}>

                {/* ── Header ── */}
                <div style={{ background: cfg.headerBg, color: cfg.headerText, padding: '24px 28px 20px', position: 'relative', flexShrink: 0 }}>
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginRight: 36 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <ShoppingBag className="w-4 h-4" style={{ opacity: 0.75 }} />
                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Detalle de compra
                                </span>
                            </div>
                            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                #{viewingCompra?.id ?? '—'}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                                {viewingCompra
                                    ? new Date(viewingCompra.fecha.split('T')[0] + 'T12:00:00')
                                        .toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                    : ''}
                            </div>
                        </div>

                        {/* Badge estado */}
                        {viewingCompra && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: cfg.chipBg,
                                border: `1.5px solid ${cfg.chipBorder}`,
                                borderRadius: 999, padding: '6px 14px',
                                fontSize: 13, fontWeight: 700, color: cfg.chipText,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                            }}>
                                {cfg.icon}
                                {cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Cuerpo ── */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {loadingDetail ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: cfg.accentColor }} />
                        </div>
                    ) : viewingCompra ? (
                        <>
                            {/* Aviso anulada */}
                            {viewingCompra.estado === 'anulada' && (
                                <div style={{ margin: '16px 24px 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#991b1b' }}>
                                    <BanIcon className="w-4 h-4 shrink-0" />
                                    Esta compra fue anulada. Si estaba completada, los insumos fueron devueltos al inventario.
                                </div>
                            )}

                            {/* Aviso completada */}
                            {viewingCompra.estado === 'completada' && (
                                <div style={{ margin: '16px 24px 0', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534' }}>
                                    <CheckCircleIcon className="w-4 h-4 shrink-0" />
                                    Compra completada. Los insumos fueron agregados al inventario.
                                </div>
                            )}

                            {/* Info proveedor */}
                            <div style={{ padding: '16px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Proveedor</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<Building2 className="w-4 h-4" />} label="Empresa"  value={viewingCompra.proveedor?.nombreEmpresa ?? '—'} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        {viewingCompra.proveedor?.personaContacto && <InfoItem icon={<User className="w-4 h-4" />}     label="Contacto" value={viewingCompra.proveedor.personaContacto} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                        {viewingCompra.proveedor?.telefono        && <InfoItem icon={<Phone className="w-4 h-4" />}    label="Teléfono" value={viewingCompra.proveedor.telefono}        iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                        {viewingCompra.proveedor?.email           && <InfoItem icon={<Mail className="w-4 h-4" />}     label="Email"    value={viewingCompra.proveedor.email}           iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                    </div>
                                </div>

                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex' }}>
                                        <Calendar className="w-4 h-4" style={{ color: cfg.iconColor }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                            {new Date(viewingCompra.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO')}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex' }}>
                                        <CreditCard className="w-4 h-4" style={{ color: cfg.iconColor }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Método de pago</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                                            {viewingCompra.metodoPago}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla insumos */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <Package className="w-4 h-4" style={{ color: cfg.accentColor }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Insumos adquiridos</span>
                                    <span style={{ background: cfg.chipBg, color: cfg.chipText, border: `1px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '1px 10px', fontSize: 12, fontWeight: 700 }}>
                                        {viewingCompra.detalles?.length ?? 0}
                                    </span>
                                </div>

                                {viewingCompra.detalles && viewingCompra.detalles.length > 0 ? (
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        {/* Cabecera */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '8px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            <span>Insumo</span>
                                            <span style={{ textAlign: 'center', minWidth: 60 }}>Cant.</span>
                                            <span style={{ textAlign: 'right', minWidth: 90 }}>Precio u.</span>
                                            <span style={{ textAlign: 'right', minWidth: 100 }}>Subtotal</span>
                                        </div>

                                        {viewingCompra.detalles.map((d, i) => (
                                            <div
                                                key={i}
                                                style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '12px 16px', alignItems: 'center', borderBottom: i < viewingCompra.detalles!.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.12s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = cfg.rowHover)}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                                                        {d.insumo?.nombreInsumo ?? `Insumo #${d.insumosId}`}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{d.insumo?.unidadMedida ?? ''}</div>
                                                </div>
                                                <div style={{ textAlign: 'center', minWidth: 60 }}>
                                                    <span style={{ background: cfg.chipBg, color: cfg.chipText, border: `1px solid ${cfg.chipBorder}`, borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>
                                                        ×{d.cantidad}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'right', minWidth: 90, fontSize: 13, color: '#475569' }}>
                                                    ${Number(d.precioUnitario).toLocaleString('es-CO')}
                                                </div>
                                                <div style={{ textAlign: 'right', minWidth: 100, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                                    ${(Number(d.cantidad) * Number(d.precioUnitario)).toLocaleString('es-CO')}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Totales */}
                                        <div style={{ borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                            <div style={{ minWidth: 230 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13, color: '#64748b' }}>
                                                    <span>Subtotal</span><span>${sub.toLocaleString('es-CO')}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px', fontSize: 13, color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
                                                    <span>IVA ({ivaRate}%)</span>
                                                    <span>${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: cfg.totalBg, color: cfg.totalText, borderRadius: '0 0 12px 0' }}>
                                                    <span style={{ fontWeight: 700, fontSize: 14 }}>Total con IVA</span>
                                                    <span style={{ fontWeight: 800, fontSize: 16 }}>${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                                        Sin insumos registrados.
                                    </div>
                                )}
                            </div>

                            {/* Factura al pie */}
                            <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Factura N° {viewingCompra.id}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* ── Footer ── */}
                {viewingCompra && !loadingDetail && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                        <Button onClick={handleDescargarPDF} style={{ background: cfg.accentColor, color: '#fff', fontSize: 13, border: 'none' }}>
                            <FileDown className="w-4 h-4 mr-2" />Descargar PDF
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
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