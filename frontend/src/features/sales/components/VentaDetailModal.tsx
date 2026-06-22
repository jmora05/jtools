import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import {
    X, ShoppingBag, CheckCircleIcon, ClockIcon, BanIcon, TruckIcon,
    User, Calendar, CreditCard, Package, Hash, FileDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SaleItem {
    id: string;
    name: string;
    code: string;
    quantity: number;
    price: number;
}

export interface Sale {
    id: number;
    clientName: string;
    clientId?: string;
    clientDocument?: string;
    date: string;
    total: number;
    paymentMethod: string;
    status: string;
    type: string;
    items: SaleItem[];
}

// ─── Config por estado ────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, {
    label: string; icon: React.ReactNode;
    headerBg: string; headerText: string;
    chipBg: string; chipText: string; chipBorder: string;
    accentColor: string; rowHover: string;
    totalBg: string; totalText: string;
    iconBg: string; iconColor: string;
}> = {
    Completada: {
        label: 'Completada', icon: <CheckCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb', rowHover: '#eff6ff',
        totalBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', totalText: '#fff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    Completado: {
        label: 'Completado', icon: <CheckCircleIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb', rowHover: '#eff6ff',
        totalBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', totalText: '#fff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
    Pendiente: {
        label: 'Pendiente', icon: <ClockIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', headerText: '#fff',
        chipBg: '#fef9c3', chipText: '#713f12', chipBorder: '#fde047',
        accentColor: '#ca8a04', rowHover: '#fefce8',
        totalBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', totalText: '#fff',
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
    Pedido: {
        label: 'Pedido', icon: <TruckIcon className="w-4 h-4" />,
        headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', headerText: '#fff',
        chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
        accentColor: '#2563eb', rowHover: '#eff6ff',
        totalBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', totalText: '#fff',
        iconBg: '#eff6ff', iconColor: '#1d4ed8',
    },
};

const DEFAULT_CFG = ESTADO_CONFIG['Pendiente'];

// ─── PDF ──────────────────────────────────────────────────────────────────────

function generarPDFVenta(sale: Sale): void {
    const doc    = new jsPDF();
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 14;

    const paleta: Record<string, { header: [number,number,number]; accent: [number,number,number] }> = {
        Completada:  { header: [29, 78, 216], accent: [59, 130, 246] },
        Completado:  { header: [29, 78, 216], accent: [59, 130, 246] },
        Pendiente:   { header: [30, 58, 138], accent: [37, 99, 235] },
        Anulada:     { header: [69, 10, 10],  accent: [185, 28, 28] },
    };
    const p = paleta[sale.status] ?? paleta['Pendiente'];
    const grisTexto: [number,number,number] = [55, 65, 81];
    const grisClaro: [number,number,number] = [243, 244, 246];
    const azulClaro: [number,number,number] = [219, 234, 254];

    doc.setFillColor(...p.header);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('FACTURA DE VENTA', margin, 18);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, margin, 28);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(`Venta #${sale.id}`, pageW - margin, 20, { align: 'right' });

    doc.setFillColor(...p.accent);
    doc.roundedRect(pageW - margin - 48, 26, 48, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(sale.status, pageW - margin - 24, 32.5, { align: 'center' });

    let y = 50;
    doc.setFillColor(...azulClaro);
    doc.roundedRect(margin, y, pageW - margin * 2, 42, 3, 3, 'F');
    doc.setTextColor(...grisTexto);
    const c1 = margin + 4, c2 = pageW / 2 + 4;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', c1, y + 7); doc.text('FECHA', c2, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(sale.clientName, c1, y + 15);
    doc.text(sale.date, c2, y + 15);
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENTO', c1, y + 25); doc.text('MÉTODO DE PAGO', c2, y + 25);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(sale.clientDocument ?? '—', c1, y + 33);
    doc.text(sale.paymentMethod, c2, y + 33);

    y += 52;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...p.header);
    doc.text('Detalle de Productos', margin, y);
    y += 5;

    const subtotal = sale.items.reduce((s, i) => s + i.quantity * i.price, 0);
    const iva   = Math.round(sale.total - sale.total / 1.19);
    const total = sale.total;

    autoTable(doc, {
        startY: y,
        head: [['#', 'Producto', 'Código', 'Cant.', 'Precio unit.', 'Subtotal']],
        body: sale.items.map((it, i) => [
            (i + 1).toString(),
            it.name, it.code, String(it.quantity),
            `$${it.price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
            `$${(it.quantity * it.price).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
        ]),
        foot: [
            ['','','','','Subtotal', `$${subtotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
            ['','','','','IVA (19%)', `$${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
            ['','','','','TOTAL',    `$${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
        ],
        margin: { left: margin, right: margin },
        styles:             { fontSize: 9, cellPadding: 4, textColor: grisTexto },
        headStyles:         { fillColor: p.header, textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
        footStyles:         { fillColor: p.accent, textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: grisClaro },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right', fontStyle: 'bold' } },
    });

    if (sale.status === 'Anulada') {
        const finalY = (doc as any).lastAutoTable?.finalY ?? y + 60;
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(48); doc.setFont('helvetica', 'bold');
        doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
        doc.text('ANULADA', pageW / 2, finalY / 2 + 30, { align: 'center', angle: 30 });
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
    }

    doc.setFillColor(...p.header);
    doc.rect(0, pageH - 14, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Documento generado automáticamente — JTools Sistema de Ventas', pageW / 2, pageH - 5, { align: 'center' });

    doc.save(`venta_${sale.id}.pdf`);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface VentaDetailModalProps {
    open: boolean;
    onClose: () => void;
    viewingSale: Sale | null;
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

// ─── Componente ───────────────────────────────────────────────────────────────

export function VentaDetailModal({ open, onClose, viewingSale }: VentaDetailModalProps) {
    const cfg = ESTADO_CONFIG[viewingSale?.status ?? ''] ?? DEFAULT_CFG;

    const sub   = viewingSale?.items.reduce((s, i) => s + i.quantity * i.price, 0) ?? 0;
    const total = viewingSale?.total ?? 0;
    const iva   = Math.round(total - total / 1.19);

    const handleDescargarPDF = () => {
        if (!viewingSale) return;
        if (viewingSale.status === 'Anulada') { toast.error('No se puede descargar el PDF de una venta anulada.'); return; }
        try {
            generarPDFVenta(viewingSale);
            toast.success(`PDF de venta #${viewingSale.id} descargado.`);
        } catch (error: any) {
            toast.error(`Error al generar PDF: ${error.message}`);
        }
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
                                <ShoppingBag className="w-4 h-4" style={{ opacity: 0.75 }} />
                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    {viewingSale?.type === 'Pedido' ? 'Detalle de pedido' : 'Detalle de venta'}
                                </span>
                            </div>
                            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                #{viewingSale?.id ?? '—'}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>{viewingSale?.date ?? ''}</div>
                        </div>
                        {viewingSale && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
                                {cfg.icon}{cfg.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {viewingSale ? (
                        <>
                            {viewingSale.status === 'Anulada' && (
                                <div style={{ margin: '16px 24px 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#991b1b' }}>
                                    <BanIcon className="w-4 h-4 shrink-0" />
                                    Esta venta fue anulada y no tiene efectos en el inventario.
                                </div>
                            )}
                            {(viewingSale.status === 'Completada' || viewingSale.status === 'Completado') && (
                                <div style={{ margin: '16px 24px 0', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534' }}>
                                    <CheckCircleIcon className="w-4 h-4 shrink-0" />
                                    Venta completada. El stock fue descontado del inventario.
                                </div>
                            )}

                            {/* Info cliente */}
                            <div style={{ padding: '16px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Cliente</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        <InfoItem icon={<User className="w-4 h-4" />} label="Nombre" value={viewingSale.clientName} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                        {viewingSale.clientDocument && <InfoItem icon={<Hash className="w-4 h-4" />} label="Documento" value={viewingSale.clientDocument} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                    </div>
                                </div>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex' }}>
                                        <Calendar className="w-4 h-4" style={{ color: cfg.iconColor }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{viewingSale.date}</div>
                                    </div>
                                </div>
                                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: cfg.iconBg, borderRadius: 8, padding: 8, display: 'flex' }}>
                                        <CreditCard className="w-4 h-4" style={{ color: cfg.iconColor }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Método de pago</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{viewingSale.paymentMethod}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla productos */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <Package className="w-4 h-4" style={{ color: cfg.accentColor }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Productos</span>
                                    <span style={{ background: cfg.chipBg, color: cfg.chipText, border: `1px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '1px 10px', fontSize: 12, fontWeight: 700 }}>
                                        {viewingSale.items.length}
                                    </span>
                                </div>

                                {viewingSale.items.length > 0 ? (
                                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '8px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            <span>Producto</span>
                                            <span style={{ textAlign: 'center', minWidth: 60 }}>Cant.</span>
                                            <span style={{ textAlign: 'right', minWidth: 90 }}>Precio u.</span>
                                            <span style={{ textAlign: 'right', minWidth: 100 }}>Subtotal</span>
                                        </div>
                                        {viewingSale.items.map((item, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '12px 16px', alignItems: 'center', borderBottom: i < viewingSale.items.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.12s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = cfg.rowHover)}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.code}</div>
                                                </div>
                                                <div style={{ textAlign: 'center', minWidth: 60 }}>
                                                    <span style={{ background: cfg.chipBg, color: cfg.chipText, border: `1px solid ${cfg.chipBorder}`, borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>×{item.quantity}</span>
                                                </div>
                                                <div style={{ textAlign: 'right', minWidth: 90, fontSize: 13, color: '#475569' }}>${item.price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</div>
                                                <div style={{ textAlign: 'right', minWidth: 100, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>${(item.quantity * item.price).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</div>
                                            </div>
                                        ))}
                                        <div style={{ borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                                            <div style={{ minWidth: 230 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13, color: '#64748b' }}>
                                                    <span>Subtotal</span><span>${sub.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px', fontSize: 13, color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
                                                    <span>IVA (19%)</span><span>${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: cfg.totalBg, color: cfg.totalText, borderRadius: '0 0 12px 0' }}>
                                                    <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
                                                    <span style={{ fontWeight: 800, fontSize: 16 }}>${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Sin productos registrados.</div>
                                )}
                            </div>

                            <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, color: '#cbd5e1' }}>Factura N° {viewingSale.id}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                {viewingSale && (
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cerrar</Button>
                        {viewingSale.status !== 'Anulada' && (
                            <Button onClick={handleDescargarPDF} style={{ background: cfg.accentColor, color: '#fff', fontSize: 13, border: 'none' }}>
                                <FileDown className="w-4 h-4 mr-2" />Descargar PDF
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
