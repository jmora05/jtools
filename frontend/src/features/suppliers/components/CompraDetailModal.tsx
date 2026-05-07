import React from 'react';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Compra } from '../types/compra.types';

// ─── Generación de PDF ────────────────────────────────────────────────────────
const IVA_DEFAULT = 19;

function generarPDFCompra(compra: Compra, ivaRate: number = IVA_DEFAULT): void {
    const doc    = new jsPDF();
    const pageW  = doc.internal.pageSize.getWidth();
    const margin = 14;
    const ivaDecimal = ivaRate / 100;

    const azulOscuro: [number, number, number] = [30,  58, 138];
    const azulMedio:  [number, number, number] = [37,  99, 235];
    const azulClaro:  [number, number, number] = [219, 234, 254];
    const grisTexto:  [number, number, number] = [55,  65,  81];
    const grisClaro:  [number, number, number] = [243, 244, 246];

    doc.setFillColor(...azulOscuro);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('COMPRA DE INSUMOS', margin, 18);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, margin, 28);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(`# ${compra.id}`, pageW - margin, 20, { align: 'right' });

    const estadoConfig: Record<string, { color: [number, number, number]; label: string }> = {
        pendiente:     { color: [217, 119,   6], label: 'Pendiente'   },
        'en transito': { color: [37,   99, 235], label: 'En tránsito' },
        completada:    { color: [16,  185, 129], label: 'Completada'  },
        anulada:       { color: [220,  38,  38], label: 'Anulada'     },
    };
    const ec = estadoConfig[compra.estado ?? ''] ?? { color: [107, 114, 128] as [number, number, number], label: compra.estado ?? '' };
    doc.setFillColor(...ec.color);
    doc.roundedRect(pageW - margin - 42, 24, 42, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(ec.label, pageW - margin - 21, 30.5, { align: 'center' });

    let y = 50;
    doc.setFillColor(...azulClaro);
    doc.roundedRect(margin, y, pageW - margin * 2, 38, 3, 3, 'F');
    doc.setTextColor(...grisTexto);
    const col1x = margin + 4;
    const col2x = pageW / 2 + 4;

    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('PROVEEDOR', col1x, y + 8);
    doc.text('FECHA', col2x, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(compra.proveedor?.nombreEmpresa ?? `ID #${compra.proveedoresId}`, col1x, y + 15);
    doc.text(new Date(compra.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO'), col2x, y + 15);

    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('CONTACTO', col1x, y + 23);
    doc.text('MÉTODO DE PAGO', col2x, y + 23);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const contacto = [compra.proveedor?.personaContacto, compra.proveedor?.telefono].filter(Boolean).join(' · ') || '—';
    doc.text(contacto, col1x, y + 30);
    doc.text((compra.metodoPago ?? '').charAt(0).toUpperCase() + (compra.metodoPago ?? '').slice(1), col2x, y + 30);

    y += 48;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...azulOscuro);
    doc.text('Detalle de Insumos', margin, y);
    y += 4;

    if (compra.detalles && compra.detalles.length > 0) {
        const subtotal = compra.detalles.reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0);
        const iva      = subtotal * ivaDecimal;
        const total    = subtotal + iva;

        const rows = compra.detalles.map((d, idx) => [
            (idx + 1).toString(),
            d.insumo?.nombreInsumo ?? `ID #${d.insumosId}`,
            d.insumo?.unidadMedida ?? '—',
            d.cantidad.toString(),
            `$${Number(d.precioUnitario).toLocaleString('es-CO')}`,
            `$${(d.cantidad * d.precioUnitario).toLocaleString('es-CO')}`,
        ]);

        (doc as any).autoTable({
            startY: y,
            head:   [['#', 'Insumo', 'Unidad', 'Cant.', 'Precio Unit.', 'Subtotal']],
            body:   rows,
            foot:   [
                ['', '', '', '', 'Subtotal',           `$${subtotal.toLocaleString('es-CO')}`],
                ['', '', '', '', `IVA (${ivaRate}%)`,  `$${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
                ['', '', '', '', 'TOTAL',              `$${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
            ],
            margin: { left: margin, right: margin },
            styles:             { fontSize: 9, cellPadding: 4, textColor: grisTexto },
            headStyles:         { fillColor: azulOscuro, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            footStyles:         { fillColor: azulMedio,  textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            alternateRowStyles: { fillColor: grisClaro },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right', fontStyle: 'bold' },
            },
        });
    } else {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Sin detalles registrados.', margin, y + 8);
    }

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...azulOscuro);
    doc.rect(0, pageH - 14, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Documento generado automáticamente — Sistema de Compras', pageW / 2, pageH - 5, { align: 'center' });

    doc.save(`compra_${compra.id}.pdf`);
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface CompraDetailModalProps {
    open: boolean;
    onClose: () => void;
    viewingCompra: Compra | null;
    loadingDetail: boolean;
    ivaRate: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function CompraDetailModal({
    open, onClose, viewingCompra, loadingDetail, ivaRate,
}: CompraDetailModalProps) {
    const ivaDecimal = ivaRate / 100;

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
            <DialogContent className="max-w-2xl p-0 flex flex-col max-h-[88vh]">
                <div className="overflow-y-auto flex-1 p-6">
                    <DialogHeader>
                        <DialogTitle>Detalle de compra</DialogTitle>
                        <DialogDescription>Información completa de la compra seleccionada.</DialogDescription>
                    </DialogHeader>

                    {loadingDetail ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : viewingCompra ? (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">N° Compra</p>
                                    <p className="font-mono font-bold text-blue-900 text-lg">#{viewingCompra.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Proveedor</p>
                                    <p className="font-semibold text-blue-900">{viewingCompra.proveedor?.nombreEmpresa}</p>
                                    <p className="text-xs text-gray-500">{viewingCompra.proveedor?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Fecha</p>
                                    <p className="font-semibold">
                                        {new Date(viewingCompra.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Método de pago</p>
                                    <p className="capitalize font-semibold">{viewingCompra.metodoPago}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Contacto</p>
                                    <p className="text-sm">{viewingCompra.proveedor?.personaContacto ?? '—'}</p>
                                    <p className="text-xs text-gray-500">{viewingCompra.proveedor?.telefono}</p>
                                </div>
                            </div>

                            {viewingCompra.detalles && viewingCompra.detalles.length > 0 ? (() => {
                                const sub   = viewingCompra.detalles.reduce((s, d) => s + d.cantidad * Number(d.precioUnitario), 0);
                                const iva   = sub * ivaDecimal;
                                const total = sub + iva;
                                return (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">
                                            Insumos adquiridos ({viewingCompra.detalles.length})
                                        </p>
                                        <div className="divide-y rounded-lg border overflow-hidden">
                                            {viewingCompra.detalles.map((d, i) => (
                                                <div key={i} className="flex justify-between items-center px-4 py-3 bg-white hover:bg-blue-50">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{d.insumo?.nombreInsumo ?? `Insumo #${d.insumosId}`}</p>
                                                        <p className="text-xs text-gray-500">{d.insumo?.unidadMedida}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-blue-900">
                                                            {d.cantidad} × ${Number(d.precioUnitario).toLocaleString('es-CO')}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            = ${(d.cantidad * Number(d.precioUnitario)).toLocaleString('es-CO')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border border-t-0 rounded-b-lg overflow-hidden">
                                            <div className="bg-blue-50 px-4 py-2 flex justify-between text-sm text-gray-600">
                                                <span>Subtotal</span>
                                                <span>${sub.toLocaleString('es-CO')}</span>
                                            </div>
                                            <div className="bg-blue-50 px-4 py-2 flex justify-between text-sm text-gray-600 border-t border-blue-100">
                                                <span>IVA ({ivaRate}%)</span>
                                                <span>${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="bg-blue-900 px-4 py-3 flex justify-between items-center">
                                                <span className="text-white font-semibold text-sm">Total con IVA</span>
                                                <span className="text-white font-bold">
                                                    ${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <p className="text-sm text-gray-400 italic">Sin insumos registrados para esta compra.</p>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={onClose}>Cerrar</Button>
                                <Button
                                    onClick={handleDescargarPDF}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <FileDown className="w-4 h-4 mr-2" />Descargar PDF
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
