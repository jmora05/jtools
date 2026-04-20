import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';
import {
    Search, Plus, Edit, Eye, Trash2, ShoppingCart, ChevronLeft, ChevronRight,
    Loader2, Info, AlertTriangle, Lock, X, FileDown, PackageIcon, CalendarIcon,
    TruckIcon, CheckCircleIcon, ClockIcon, BanIcon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
    getCompras, getCompraById, createCompra, updateCompra,
    cambiarEstadoCompra, deleteCompra, getProveedores, getInsumos,
} from '../../suppliers/services/comprasService';

// ─── Constantes ───────────────────────────────────────────────────────────────
const FECHA_MIN_ISO  = '2000-01-01';
const NOTAS_MAX      = 500;
const PRECIO_MAX     = 999_999_999;
const CANTIDAD_MAX   = 100_000;
const FACTURA_MAX    = 2_147_483_647;
const IVA_RATE       = 0.19;            // IVA Colombia 19 %
const EDIT_LIMIT_DAYS = 5;              // días máximos para poder editar
const FLUJO_ESTADO: Record<string, number> = { pendiente: 0, 'en transito': 1, completada: 2 };

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Proveedor {
    id: number; nombreEmpresa: string; personaContacto: string;
    telefono: string; email: string; estado?: string;
}
interface Insumo {
    id: number; nombreInsumo: string; codigoInsumo?: string;
    unidadMedida: string; precioUnitario?: number; cantidad?: number;
}
interface DetalleCompra {
    id?: number; insumosId: number; cantidad: number;
    precioUnitario: number; insumo?: Insumo;
}
interface Compra {
    id: number; proveedoresId: number; fecha: string;
    metodoPago: string; estado: 'pendiente' | 'en transito' | 'completada' | 'anulada';
    proveedor?: Proveedor; detalles?: DetalleCompra[];
}
interface ItemCarrito {
    insumoId: number; nombre: string; unidad: string;
    precio: number; cantidad: number;
}
interface CompraFormData {
    proveedoresId: string;
    fecha: string;
    metodoPago: string;
    estado: string;
    notas: string;
    numeroFactura: string;
}
interface CompraFormErrors {
    proveedoresId?: string;
    fecha?: string;
    metodoPago?: string;
    notas?: string;
    numeroFactura?: string;
}
interface CarritoItemError { precio?: string; cantidad?: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Devuelve true si la fecha de la compra está dentro del límite de edición */
const isEditableByDate = (fecha: string): boolean => {
    const purchaseDate = new Date(fecha.split('T')[0] + 'T12:00:00');
    const diffDays = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= EDIT_LIMIT_DAYS;
};

// ─── Validación ───────────────────────────────────────────────────────────────
function validateCompraForm(form: CompraFormData): CompraFormErrors {
    const errors: CompraFormErrors = {};

    if (!form.proveedoresId || form.proveedoresId.trim() === '')
        errors.proveedoresId = 'Debes seleccionar un proveedor.';

    if (!form.fecha || form.fecha.trim() === '') {
        errors.fecha = 'La fecha es obligatoria.';
    } else {
        const d   = new Date(form.fecha);
        const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
        if (isNaN(d.getTime()))        errors.fecha = 'Fecha inválida.';
        else if (d < new Date(FECHA_MIN_ISO)) errors.fecha = 'La fecha no puede ser anterior al año 2000.';
        else if (d > hoy)              errors.fecha = 'La fecha no puede ser una fecha futura.';
    }

    if (!form.metodoPago || form.metodoPago.trim() === '')
        errors.metodoPago = 'El método de pago es obligatorio.';

    if (form.numeroFactura.trim() !== '') {
        const n = Number(form.numeroFactura);
        if (!Number.isInteger(n) || n <= 0)
            errors.numeroFactura = 'Debe ser un número entero positivo.';
        else if (n > FACTURA_MAX)
            errors.numeroFactura = `No puede superar ${FACTURA_MAX.toLocaleString()}.`;
    }

    if (form.notas.length > NOTAS_MAX)
        errors.notas = `Las notas no pueden superar ${NOTAS_MAX} caracteres.`;
    if (/<script|javascript:|on\w+=/i.test(form.notas))
        errors.notas = 'Las notas contienen contenido no permitido.';

    return errors;
}

function validateCarritoItem(item: ItemCarrito): CarritoItemError {
    const err: CarritoItemError = {};
    if (!item.precio || isNaN(item.precio) || item.precio <= 0)
        err.precio = 'El precio debe ser mayor a 0.';
    else if (item.precio > PRECIO_MAX)
        err.precio = `El precio no puede superar $${PRECIO_MAX.toLocaleString()}.`;
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0)
        err.cantidad = 'La cantidad debe ser un entero positivo.';
    else if (item.cantidad > CANTIDAD_MAX)
        err.cantidad = `La cantidad no puede superar ${CANTIDAD_MAX.toLocaleString()}.`;
    return err;
}

// ─── Handlers de teclado ──────────────────────────────────────────────────────
const blockNonInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!nav.includes(e.key) && !e.ctrlKey && !e.metaKey && !/\d/.test(e.key))
        e.preventDefault();
};
const blockNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!nav.includes(e.key) && !e.ctrlKey && !e.metaKey && !/[\d.]/.test(e.key))
        e.preventDefault();
};

// ─── Componentes UI ───────────────────────────────────────────────────────────
const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {message}
        </p>
    ) : null;

const InfoAlert = ({ message }: { message: string }) => (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
        <Info className="w-4 h-4 shrink-0 text-blue-500" /><span>{message}</span>
    </div>
);

const BlockedAlert = ({ message, onClose }: { message: string; onClose: () => void }) => (
    <div className="flex items-center justify-between bg-gray-100 border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-gray-500" />
            <span>{message}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 shrink-0">
            <X className="w-4 h-4" />
        </button>
    </div>
);

const EstadoBadge = ({ estado }: { estado: string }) => {
    const config: Record<string, { icon: React.ReactNode; clase: string }> = {
        pendiente:     { icon: <ClockIcon className="w-3 h-3 mr-1" />,        clase: 'bg-amber-50 text-amber-700 border border-amber-200' },
        'en transito': { icon: <TruckIcon className="w-3 h-3 mr-1" />,        clase: 'bg-blue-100 text-blue-800 border border-blue-300' },
        completada:    { icon: <CheckCircleIcon className="w-3 h-3 mr-1" />,  clase: 'bg-green-50 text-green-700 border border-green-200' },
        anulada:       { icon: <BanIcon className="w-3 h-3 mr-1" />,          clase: 'bg-red-50 text-red-600 border border-red-200' },
    };
    const { icon, clase } = config[estado] ?? { icon: null, clase: 'bg-gray-100 text-gray-600' };
    return (
        <Badge className={`flex items-center w-fit ${clase}`}>
            {icon}{estado.charAt(0).toUpperCase() + estado.slice(1)}
        </Badge>
    );
};

// ─── Generación de PDF ────────────────────────────────────────────────────────
function generarPDFCompra(compra: Compra): void {
    const doc    = new jsPDF();
    const pageW  = doc.internal.pageSize.getWidth();
    const margin = 14;

    const azulOscuro: [number, number, number] = [30,  58, 138];
    const azulMedio:  [number, number, number] = [37,  99, 235];
    const azulClaro:  [number, number, number] = [219, 234, 254];
    const grisTexto:  [number, number, number] = [55,  65,  81];
    const grisClaro:  [number, number, number] = [243, 244, 246];

    // Cabecera
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
        pendiente:     { color: [217, 119, 6],   label: 'Pendiente'   },
        'en transito': { color: [37,  99,  235],  label: 'En tránsito' },
        completada:    { color: [16,  185, 129],  label: 'Completada'  },
        anulada:       { color: [220, 38,  38],   label: 'Anulada'     },
    };
    const ec = estadoConfig[compra.estado] ?? { color: [107, 114, 128] as [number, number, number], label: compra.estado };
    doc.setFillColor(...ec.color);
    doc.roundedRect(pageW - margin - 42, 24, 42, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(ec.label, pageW - margin - 21, 30.5, { align: 'center' });

    // Bloque de datos generales
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

    // Tabla de detalles
    y += 48;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...azulOscuro);
    doc.text('Detalle de Insumos', margin, y);
    y += 4;

    if (compra.detalles && compra.detalles.length > 0) {
        const subtotal = compra.detalles.reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0);
        const iva      = subtotal * IVA_RATE;
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
                ['', '', '', '', 'Subtotal',   `$${subtotal.toLocaleString('es-CO')}`],
                ['', '', '', '', `IVA (${IVA_RATE * 100}%)`, `$${iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
                ['', '', '', '', 'TOTAL',      `$${total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
            ],
            margin: { left: margin, right: margin },
            styles:            { fontSize: 9, cellPadding: 4, textColor: grisTexto },
            headStyles:        { fillColor: azulOscuro, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            footStyles:        { fillColor: azulMedio,  textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
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

    // Pie de página
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...azulOscuro);
    doc.rect(0, pageH - 14, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Documento generado automáticamente — Sistema de Compras', pageW / 2, pageH - 5, { align: 'center' });

    doc.save(`compra_${compra.id}.pdf`);
}

// ─── Formulario de datos de la compra ─────────────────────────────────────────
interface CompraFormSectionProps {
    proveedores: Proveedor[];
    formData: CompraFormData;
    onChange: (field: keyof CompraFormData, value: string) => void;
    errors: CompraFormErrors;
    touched: Partial<Record<keyof CompraFormData, boolean>>;
    onBlur: (field: keyof CompraFormData) => void;
    isEditing: boolean;
}

const CompraFormSection = ({
    proveedores, formData, onChange, errors, touched, onBlur, isEditing,
}: CompraFormSectionProps) => {
    const today = new Date().toISOString().split('T')[0];
    return (
        <div className="space-y-4">
            {/* Proveedor */}
            <div>
                <label className="block text-sm text-gray-700 mb-2">
                    Proveedor <span className="text-red-500">*</span>
                </label>
                <Select
                    value={formData.proveedoresId}
                    onValueChange={(v) => { onChange('proveedoresId', v); onBlur('proveedoresId'); }}
                >
                    <SelectTrigger className={touched.proveedoresId && errors.proveedoresId ? 'border-red-400 focus-visible:ring-red-300' : ''}>
                        <SelectValue placeholder="Seleccionar proveedor..." />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999]">
                        {proveedores.length === 0
                            ? <SelectItem value="__none__" disabled>No hay proveedores activos</SelectItem>
                            : proveedores.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.nombreEmpresa}</SelectItem>
                            ))
                        }
                    </SelectContent>
                </Select>
                <FieldError message={touched.proveedoresId ? errors.proveedoresId : undefined} />
            </div>

            {/* N° Factura + Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-700 mb-2">N° Factura</label>
                    <Input
                        type="number"
                        placeholder="Ej: 1001"
                        value={formData.numeroFactura}
                        onChange={(e) => onChange('numeroFactura', e.target.value)}
                        onBlur={() => onBlur('numeroFactura')}
                        onKeyDown={blockNonInteger}
                        min="1" max={FACTURA_MAX} step="1"
                        disabled={isEditing}
                        className={touched.numeroFactura && errors.numeroFactura ? 'border-red-400 focus-visible:ring-red-300' : ''}
                    />
                    <FieldError message={touched.numeroFactura ? errors.numeroFactura : undefined} />
                    {isEditing && (
                        <p className="text-xs text-gray-400 mt-1">El N° de factura no puede modificarse.</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm text-gray-700 mb-2">
                        Fecha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="date"
                            value={formData.fecha}
                            min={FECHA_MIN_ISO}
                            max={today}
                            onChange={(e) => { onChange('fecha', e.target.value); onBlur('fecha'); }}
                            onBlur={() => onBlur('fecha')}
                            className={`pl-10 ${touched.fecha && errors.fecha ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                        />
                    </div>
                    <FieldError message={touched.fecha ? errors.fecha : undefined} />
                </div>
            </div>

            {/* Método de pago — el estado se elimina del formulario: siempre inicia como 'pendiente' */}
            <div>
                <label className="block text-sm text-gray-700 mb-2">
                    Método de pago <span className="text-red-500">*</span>
                </label>
                <Select
                    value={formData.metodoPago}
                    onValueChange={(v) => { onChange('metodoPago', v); onBlur('metodoPago'); }}
                >
                    <SelectTrigger className={touched.metodoPago && errors.metodoPago ? 'border-red-400 focus-visible:ring-red-300' : ''}>
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999]">
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                </Select>
                <FieldError message={touched.metodoPago ? errors.metodoPago : undefined} />
            </div>

            {/* Notas */}
            <div>
                <label className="block text-sm text-gray-700 mb-2">Notas (opcional)</label>
                <Textarea
                    placeholder="Comentarios adicionales sobre la compra..."
                    value={formData.notas}
                    onChange={(e) => onChange('notas', e.target.value)}
                    onBlur={() => onBlur('notas')}
                    rows={2}
                    maxLength={NOTAS_MAX + 1}
                    className={touched.notas && errors.notas ? 'border-red-400 focus-visible:ring-red-300' : ''}
                />
                <div className="flex justify-between items-center mt-1">
                    <FieldError message={touched.notas ? errors.notas : undefined} />
                    <span className={`text-xs ml-auto ${formData.notas.length > NOTAS_MAX ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {formData.notas.length}/{NOTAS_MAX}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function PurchaseModule() {
    const [compras, setCompras]         = useState<Compra[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [insumos, setInsumos]         = useState<Insumo[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 5;

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAnularModal, setShowAnularModal] = useState(false);
    const [anularConfirmed, setAnularConfirmed] = useState(false);

    const [editingCompra, setEditingCompra]   = useState<Compra | null>(null);
    const [viewingCompra, setViewingCompra]   = useState<Compra | null>(null);
    const [anulatingCompra, setAnulatingCompra] = useState<Compra | null>(null);
    const [loadingDetail, setLoadingDetail]   = useState(false);

    const [blockedAlertId, setBlockedAlertId]     = useState<number | null>(null);
    const [blockedAlertMsg, setBlockedAlertMsg]   = useState('');

    // ── Estado del carrito ─────────────────────────────────────────────────
    const [supplySearch, setSupplySearch]       = useState('');
    const [carrito, setCarrito]                 = useState<ItemCarrito[]>([]);
    const [carritoErrors, setCarritoErrors]     = useState<Record<number, CarritoItemError>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // ── Estado del formulario ──────────────────────────────────────────────
    const emptyForm: CompraFormData = {
        proveedoresId: '',
        fecha:         new Date().toISOString().split('T')[0],
        metodoPago:    'efectivo',
        estado:        'pendiente',   // siempre pendiente en creación
        notas:         '',
        numeroFactura: '',
    };
    const [formData, setFormData]     = useState<CompraFormData>(emptyForm);
    const [formErrors, setFormErrors] = useState<CompraFormErrors>({});
    const [touched, setTouched]       = useState<Partial<Record<keyof CompraFormData, boolean>>>({});

    // ── Carga de datos ─────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [comprasData, proveedoresData, insumosData] = await Promise.all([
                getCompras(), getProveedores(), getInsumos(),
            ]);
            setCompras(comprasData);
            setProveedores(proveedoresData.filter((p: Proveedor) => p.estado !== 'inactivo'));
            setInsumos(insumosData);
        } catch (error: any) {
            toast.error(`Error al cargar datos: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setFormErrors(validateCompraForm(formData)); }, [formData]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    // ── Filtrado y paginación ──────────────────────────────────────────────
    const filteredCompras = compras.filter((c) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            (c.proveedor?.nombreEmpresa ?? '').toLowerCase().includes(term) ||
            c.id.toString().includes(term);
        const matchesStatus = statusFilter === 'all' || c.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages   = Math.ceil(filteredCompras.length / itemsPerPage);
    const currentItems = filteredCompras.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const filteredInsumos = insumos.filter((i) =>
        i.nombreInsumo.toLowerCase().includes(supplySearch.toLowerCase()) ||
        (i.codigoInsumo ?? '').toLowerCase().includes(supplySearch.toLowerCase())
    );

    // ── Operaciones del carrito ────────────────────────────────────────────
    const agregarInsumo = (insumo: Insumo) => {
        setCarrito((prev) => {
            const existe = prev.find((i) => i.insumoId === insumo.id);
            if (existe) {
                return prev.map((i) =>
                    i.insumoId === insumo.id ? { ...i, cantidad: Math.min(i.cantidad + 1, CANTIDAD_MAX) } : i
                );
            }
            return [...prev, {
                insumoId: insumo.id,
                nombre:   insumo.nombreInsumo,
                unidad:   insumo.unidadMedida,
                precio:   insumo.precioUnitario ?? 0,
                cantidad: 1,
            }];
        });
    };

    const actualizarCantidad = (insumoId: number, value: number) => {
        if (value <= 0) {
            setCarrito((prev) => prev.filter((i) => i.insumoId !== insumoId));
            setCarritoErrors((prev) => { const n = { ...prev }; delete n[insumoId]; return n; });
            return;
        }
        setCarrito((prev) => prev.map((i) => i.insumoId === insumoId ? { ...i, cantidad: value } : i));
    };

    const actualizarPrecio = (insumoId: number, raw: string) => {
        const valor = parseFloat(raw);
        setCarrito((prev) => prev.map((i) => i.insumoId === insumoId ? { ...i, precio: isNaN(valor) ? 0 : valor } : i));
    };

    const eliminarDelCarrito = (insumoId: number) => {
        setCarrito((prev) => prev.filter((i) => i.insumoId !== insumoId));
        setCarritoErrors((prev) => { const n = { ...prev }; delete n[insumoId]; return n; });
    };

    // IVA 19 % aplicado sobre el subtotal del carrito
    const subtotalCarrito = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    const ivaCarrito      = subtotalCarrito * IVA_RATE;
    const totalCarrito    = subtotalCarrito + ivaCarrito;
    const carritoTieneErrores = Object.keys(carritoErrors).length > 0;

    // ── Formulario ─────────────────────────────────────────────────────────
    const resetForm = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setTouched({});
        setCarrito([]);
        setSupplySearch('');
        setCarritoErrors({});
        setSubmitAttempted(false);
        setEditingCompra(null);
        setShowModal(false);
    };

    const handleInputChange = (field: keyof CompraFormData, value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const handleBlur = (field: keyof CompraFormData) =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    const touchAll = () => setTouched({
        proveedoresId: true, fecha: true, metodoPago: true, notas: true, numeroFactura: true,
    });

    // ── Crear / Editar ─────────────────────────────────────────────────────
    const handleSave = async () => {
        setSubmitAttempted(true);
        touchAll();
        const errors = validateCompraForm(formData);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            toast.error('Completa los campos obligatorios correctamente.');
            return;
        }
        if (carrito.length === 0) {
            toast.error('Agrega al menos un insumo a la compra.');
            return;
        }

        const carritoErrs: Record<number, CarritoItemError> = {};
        carrito.forEach((item) => {
            const err = validateCarritoItem(item);
            if (Object.keys(err).length > 0) carritoErrs[item.insumoId] = err;
        });
        setCarritoErrors(carritoErrs);
        if (Object.keys(carritoErrs).length > 0) {
            toast.error('Revisa los precios y cantidades de los insumos.');
            return;
        }

        const detalles = carrito.map((i) => ({
            insumosId:      i.insumoId,
            cantidad:       i.cantidad,
            precioUnitario: i.precio,
        }));

        try {
            setSaving(true);
            if (editingCompra) {
                await updateCompra(editingCompra.id, {
                    proveedoresId: parseInt(formData.proveedoresId),
                    fecha:         formData.fecha,
                    metodoPago:    formData.metodoPago,
                    detalles,
                });
                toast.success('Compra actualizada exitosamente.');
            } else {
                // Las compras nuevas SIEMPRE inician como 'pendiente'
                await createCompra({
                    ...(formData.numeroFactura.trim() ? { id: parseInt(formData.numeroFactura) } : {}),
                    proveedoresId: parseInt(formData.proveedoresId),
                    fecha:         formData.fecha,
                    metodoPago:    formData.metodoPago as 'efectivo' | 'transferencia',
                    estado:        'pendiente',
                    detalles,
                });
                toast.success('Compra registrada exitosamente.');
                // El stock lo actualiza el backend cuando el estado llega a 'completada'
            }
            resetForm();
            fetchData();
        } catch (error: any) {
            const errores: any[] = Array.isArray(error.errores) ? error.errores : [];
            const facturaErr = errores.find((e) =>
                (typeof e === 'string' ? e : (e?.mensaje ?? '')).toLowerCase().includes('factura')
            );
            if (facturaErr) {
                toast.error(typeof facturaErr === 'string' ? facturaErr : facturaErr.mensaje);
                return;
            }
            const msg: string = typeof error.message === 'string' ? error.message : 'Error desconocido';
            if (msg.toLowerCase().includes('factura'))        toast.error(msg);
            else if (msg.toLowerCase().includes('proveedor')) toast.error(`Proveedor: ${msg}`);
            else                                               toast.error(`Error al guardar: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Ver detalle ────────────────────────────────────────────────────────
    const openViewDialog = async (compra: Compra) => {
        setShowDetailModal(true);
        setViewingCompra(null);
        setLoadingDetail(true);
        try {
            const detail = await getCompraById(compra.id);
            setViewingCompra(detail);
        } catch (error: any) {
            toast.error(`Error al cargar detalle: ${error.message}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    // ── Abrir edición ──────────────────────────────────────────────────────
    const openEditDialog = async (compra: Compra) => {
        // Verificar límite de 5 días
        if (!isEditableByDate(compra.fecha)) {
            setBlockedAlertId(compra.id);
            setBlockedAlertMsg(
                `Esta compra no puede editarse: han pasado más de ${EDIT_LIMIT_DAYS} días desde su fecha de registro.`
            );
            return;
        }

        setLoadingDetail(true);
        try {
            const detail = await getCompraById(compra.id);
            setEditingCompra(detail);
            setFormData({
                proveedoresId: detail.proveedoresId.toString(),
                fecha:         (detail.fecha ?? '').split('T')[0],
                metodoPago:    detail.metodoPago ?? 'efectivo',
                estado:        detail.estado ?? 'pendiente',
                notas:         '',
                numeroFactura: detail.id.toString(),
            });
            setCarrito(
                (detail.detalles ?? []).map((d: DetalleCompra) => ({
                    insumoId: d.insumosId,
                    nombre:   d.insumo?.nombreInsumo ?? `Insumo #${d.insumosId}`,
                    unidad:   d.insumo?.unidadMedida ?? '',
                    precio:   Number(d.precioUnitario),
                    cantidad: d.cantidad,
                }))
            );
            setFormErrors({});
            setTouched({});
            setCarritoErrors({});
            setSubmitAttempted(false);
            setShowModal(true);
        } catch (error: any) {
            toast.error(`Error al cargar la compra: ${error.message}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    // ── Anular compra ──────────────────────────────────────────────────────
    const openAnularDialog = (compra: Compra) => {
        setAnulatingCompra(compra);
        setAnularConfirmed(false);
        setShowAnularModal(true);
    };

    const confirmAnular = async () => {
        if (!anulatingCompra) return;
        try {
            setSaving(true);
            await deleteCompra(anulatingCompra.id);
            toast.success('Compra anulada exitosamente.');
            setShowAnularModal(false);
            setAnulatingCompra(null);
            setAnularConfirmed(false);
            fetchData();
        } catch (error: any) {
            const errores: any[] = Array.isArray(error.errores) ? error.errores : [];
            if (errores.length > 0) { toast.error(errores[0].mensaje); return; }
            toast.error(typeof error.message === 'string' ? error.message : 'Error al anular');
        } finally {
            setSaving(false);
        }
    };

    // ── Avanzar estado (el backend actualiza el stock al completar) ────────
    const handleAvanzarEstado = async (compra: Compra) => {
        const idxActual = FLUJO_ESTADO[compra.estado] ?? -1;
        if (idxActual < 0 || idxActual >= 2) return;
        const nuevoEstado = Object.keys(FLUJO_ESTADO).find((k) => FLUJO_ESTADO[k] === idxActual + 1)!;

        // Actualización optimista
        setCompras((prev) => prev.map((c) =>
            c.id === compra.id ? { ...c, estado: nuevoEstado as Compra['estado'] } : c
        ));
        setTogglingIds((prev) => new Set(prev).add(compra.id));

        try {
            await cambiarEstadoCompra(compra.id, nuevoEstado);
            if (nuevoEstado === 'completada') {
                toast.success(`Compra #${compra.id} completada. Stock de insumos actualizado.`);
                await fetchData(); // refrescar para mostrar stock actualizado
            } else {
                toast.success(`Estado actualizado a "${nuevoEstado}".`);
            }
        } catch (error: any) {
            setCompras((prev) => prev.map((c) =>
                c.id === compra.id ? { ...c, estado: compra.estado } : c
            ));
            toast.error(`Error al cambiar estado: ${error.message}`);
        } finally {
            setTogglingIds((prev) => { const n = new Set(prev); n.delete(compra.id); return n; });
        }
    };

    // ── PDF ────────────────────────────────────────────────────────────────
    const handleDescargarPDF = () => {
        if (!viewingCompra) return;
        try {
            generarPDFCompra(viewingCompra);
            toast.success(`PDF de la compra #${viewingCompra.id} descargado.`);
        } catch (error: any) {
            toast.error(`Error al generar PDF: ${error.message}`);
        }
    };

    const handleBlockedClick = (compraId: number, msg: string) => {
        setBlockedAlertId((prev) => prev === compraId ? null : compraId);
        setBlockedAlertMsg(msg);
    };

    const totalFormErrors = Object.keys(formErrors).length;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">

            {/* ── Encabezado ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Compras de insumos</h1>
                    <p className="text-blue-800">Gestión y control de adquisiciones del taller</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCompra(null);
                        setFormData(emptyForm);
                        setFormErrors({});
                        setTouched({});
                        setCarrito([]);
                        setSupplySearch('');
                        setSubmitAttempted(false);
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Nueva compra
                </Button>
            </div>

            {/* ── Filtros ── */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar por proveedor o N° compra..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                                maxLength={100}
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-44"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en transito">En tránsito</option>
                            <option value="completada">Completada</option>
                            <option value="anulada">Anulada</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* ── Tabla ── */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando compras...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">N° Factura</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Proveedor</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Fecha</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Insumos</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Total (c/IVA)</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((compra) => {
                                        const isPending  = compra.estado === 'pendiente';
                                        const isAnulada  = compra.estado === 'anulada';
                                        const isComplete = compra.estado === 'completada';
                                        const isToggling = togglingIds.has(compra.id);
                                        const canEdit    = isPending && isEditableByDate(compra.fecha);

                                        const subtotal = compra.detalles?.reduce(
                                            (sum, d) => sum + d.cantidad * Number(d.precioUnitario), 0
                                        ) ?? 0;
                                        const totalConIva = subtotal * (1 + IVA_RATE);

                                        return (
                                            <React.Fragment key={compra.id}>
                                                <tr className={`border-b border-blue-100 transition-colors ${
                                                    isAnulada ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'
                                                }`}>
                                                    {/* ID */}
                                                    <td className="py-4 px-6">
                                                        <span className={`font-mono text-sm ${isAnulada ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                                                            #{compra.id}
                                                        </span>
                                                    </td>
                                                    {/* Proveedor */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-blue-900">
                                                                {compra.proveedor?.nombreEmpresa ?? `Proveedor #${compra.proveedoresId}`}
                                                            </span>
                                                            <span className="text-xs text-gray-400 capitalize">{compra.metodoPago}</span>
                                                        </div>
                                                    </td>
                                                    {/* Fecha */}
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-600 text-sm">
                                                            {new Date(compra.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO')}
                                                        </span>
                                                    </td>
                                                    {/* Insumos */}
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-600 text-sm">
                                                            {(compra.detalles?.length ?? 0) > 0
                                                                ? `${compra.detalles!.length} ítem(s)`
                                                                : <em className="text-gray-400">Sin detalles</em>
                                                            }
                                                        </span>
                                                    </td>
                                                    {/* Total con IVA */}
                                                    <td className="py-4 px-6">
                                                        <span className="font-semibold text-blue-900 text-sm">
                                                            {totalConIva > 0
                                                                ? `$${totalConIva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
                                                                : '—'}
                                                        </span>
                                                    </td>
                                                    {/* Estado */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col gap-1">
                                                            <EstadoBadge estado={compra.estado} />
                                                            {!isComplete && !isAnulada && (
                                                                <button
                                                                    onClick={() => handleAvanzarEstado(compra)}
                                                                    disabled={isToggling}
                                                                    className="text-xs text-blue-600 hover:underline text-left flex items-center gap-1 disabled:opacity-50"
                                                                >
                                                                    {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                                                                    → Avanzar estado
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Acciones */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-2">
                                                            {/* VER — siempre activo */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openViewDialog(compra)}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            {/* EDITAR — solo pendiente + dentro de 5 días */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (canEdit) {
                                                                        openEditDialog(compra);
                                                                    } else {
                                                                        const msg = !isPending
                                                                            ? `Solo se pueden editar compras en estado "pendiente".`
                                                                            : `Solo se pueden editar compras con menos de ${EDIT_LIMIT_DAYS} días desde su fecha.`;
                                                                        handleBlockedClick(compra.id, msg);
                                                                    }
                                                                }}
                                                                className={`border ${canEdit
                                                                    ? 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            {/* ANULAR — solo pendiente */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (isPending) {
                                                                        openAnularDialog(compra);
                                                                    } else {
                                                                        handleBlockedClick(
                                                                            compra.id,
                                                                            isAnulada
                                                                                ? 'Esta compra ya fue anulada.'
                                                                                : `Solo se pueden anular compras en estado "pendiente". Esta compra está en estado "${compra.estado}".`
                                                                        );
                                                                    }
                                                                }}
                                                                className={`border ${isPending
                                                                    ? 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                <BanIcon className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Fila de alerta de bloqueo */}
                                                {blockedAlertId === compra.id && (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 pb-3 pt-0">
                                                            <BlockedAlert
                                                                message={blockedAlertMsg}
                                                                onClose={() => setBlockedAlertId(null)}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {filteredCompras.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p>No se encontraron compras</p>
                                </div>
                            )}
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page} size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ════ MODAL — CREAR / EDITAR ════ */}
            <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCompra ? 'Editar compra' : 'Nueva compra de insumos'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCompra
                                    ? 'Modifica los datos de la compra. Solo se pueden editar compras pendientes dentro de los primeros 5 días.'
                                    : 'Registra una nueva adquisición de insumos. La compra iniciará en estado Pendiente.'}
                            </DialogDescription>
                        </DialogHeader>

                        {submitAttempted && (totalFormErrors > 0 || carrito.length === 0) && (
                            <div className="mt-4 space-y-2">
                                {totalFormErrors > 0 && (
                                    <InfoAlert message={`Hay ${totalFormErrors} campo(s) que requieren atención.`} />
                                )}
                                {carrito.length === 0 && (
                                    <InfoAlert message="Agrega al menos un insumo antes de continuar." />
                                )}
                            </div>
                        )}

                        <div className="mt-4 space-y-6">

                            {/* Sección 1 — Datos de la compra */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
                                    <h3 className="font-semibold text-blue-900">Datos de la compra</h3>
                                </div>
                                <CompraFormSection
                                    proveedores={proveedores}
                                    formData={formData}
                                    onChange={handleInputChange}
                                    errors={formErrors}
                                    touched={touched}
                                    onBlur={handleBlur}
                                    isEditing={!!editingCompra}
                                />
                            </div>

                            {/* Sección 2 — Seleccionar insumos */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
                                    <h3 className="font-semibold text-blue-900">Seleccionar insumos</h3>
                                </div>
                                <div className="border border-blue-100 rounded-lg p-4 space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Buscar insumo por nombre o código..."
                                            value={supplySearch}
                                            onChange={(e) => setSupplySearch(e.target.value)}
                                            className="pl-10"
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="overflow-y-auto max-h-48 space-y-2 pr-1">
                                        {filteredInsumos.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <PackageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">No se encontraron insumos</p>
                                            </div>
                                        ) : filteredInsumos.map((insumo) => {
                                            const yaAgregado = carrito.some((i) => i.insumoId === insumo.id);
                                            return (
                                                <div
                                                    key={insumo.id}
                                                    className={`flex items-center justify-between p-3 bg-white rounded-lg border transition-colors ${
                                                        yaAgregado
                                                            ? 'border-blue-300 bg-blue-50'
                                                            : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{insumo.nombreInsumo}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {insumo.unidadMedida}
                                                            {insumo.precioUnitario ? ` · $${Number(insumo.precioUnitario).toLocaleString('es-CO')}` : ''}
                                                            {insumo.codigoInsumo ? ` · ${insumo.codigoInsumo}` : ''}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => agregarInsumo(insumo)}
                                                        className={`ml-3 shrink-0 ${
                                                            yaAgregado
                                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        {yaAgregado ? 'Agregar más' : 'Agregar'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Sección 3 — Carrito */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
                                        <h3 className="font-semibold text-blue-900">Carrito de compra</h3>
                                    </div>
                                    {carrito.length > 0 && (
                                        <Badge className="bg-blue-600 text-white">{carrito.length} ítem(s)</Badge>
                                    )}
                                </div>

                                {carrito.length === 0 ? (
                                    <div className={`text-center py-8 border-2 border-dashed rounded-lg text-gray-400 ${
                                        submitAttempted ? 'border-red-300 bg-red-50' : 'border-blue-100'
                                    }`}>
                                        <ShoppingCart className={`w-10 h-10 mx-auto mb-2 opacity-20 ${submitAttempted ? 'text-red-400' : ''}`} />
                                        <p className="text-sm">Agrega insumos desde la sección anterior</p>
                                    </div>
                                ) : (
                                    <div className="border border-blue-100 rounded-lg overflow-hidden">
                                        <div className="divide-y divide-blue-50">
                                            {carrito.map((item) => {
                                                const itemErr = carritoErrors[item.insumoId];
                                                return (
                                                    <div key={item.insumoId} className={`p-3 ${itemErr ? 'bg-red-50' : 'hover:bg-blue-50'}`}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-blue-900 truncate">{item.nombre}</p>
                                                                <p className="text-xs text-gray-400">{item.unidad}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                                {/* Cantidad */}
                                                                <div className="flex flex-col items-center">
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            size="sm" variant="outline"
                                                                            onClick={() => actualizarCantidad(item.insumoId, item.cantidad - 1)}
                                                                            className="w-7 h-7 p-0 border-blue-200 text-blue-900 font-bold"
                                                                        >-</Button>
                                                                        <span className="w-8 text-center text-sm font-bold text-blue-900">{item.cantidad}</span>
                                                                        <Button
                                                                            size="sm" variant="outline"
                                                                            onClick={() => actualizarCantidad(item.insumoId, item.cantidad + 1)}
                                                                            disabled={item.cantidad >= CANTIDAD_MAX}
                                                                            className="w-7 h-7 p-0 border-blue-200 text-blue-900 font-bold"
                                                                        >+</Button>
                                                                    </div>
                                                                    <FieldError message={itemErr?.cantidad} />
                                                                </div>
                                                                {/* Precio */}
                                                                <div className="flex flex-col items-end">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-xs text-gray-400">$</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={item.precio === 0 ? '' : item.precio}
                                                                            onChange={(e) => actualizarPrecio(item.insumoId, e.target.value)}
                                                                            onKeyDown={blockNonNumeric}
                                                                            placeholder="Precio"
                                                                            min="0.01" max={PRECIO_MAX} step="0.01"
                                                                            className={`w-24 h-7 text-xs text-right ${itemErr?.precio ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                                                                        />
                                                                    </div>
                                                                    <FieldError message={itemErr?.precio} />
                                                                </div>
                                                                {/* Subtotal ítem */}
                                                                {item.precio > 0 && !itemErr && (
                                                                    <span className="text-xs font-semibold text-blue-600 w-20 text-right">
                                                                        ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                                                                    </span>
                                                                )}
                                                                {/* Eliminar */}
                                                                <button
                                                                    onClick={() => eliminarDelCarrito(item.insumoId)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                                    title="Quitar del carrito"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Totales con IVA */}
                                        {subtotalCarrito > 0 && !carritoTieneErrores && (
                                            <div className="border-t border-blue-100 bg-blue-50 px-4 py-2 space-y-1 text-sm">
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Subtotal</span>
                                                    <span>${subtotalCarrito.toLocaleString('es-CO', { maximumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>IVA (19%)</span>
                                                    <span>${ivaCarrito.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-blue-900 rounded-md px-3 py-2 mt-1">
                                                    <span className="text-white font-semibold">Total con IVA</span>
                                                    <span className="text-white font-bold text-base">
                                                        ${totalCarrito.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button variant="outline" onClick={resetForm} disabled={saving}>Cancelar</Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {editingCompra ? 'Actualizar compra' : 'Registrar compra'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ════ MODAL — VER DETALLE ════ */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
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
                                        <p className="text-xs text-gray-500 uppercase">Estado</p>
                                        <EstadoBadge estado={viewingCompra.estado} />
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
                                    const iva   = sub * IVA_RATE;
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
                                            {/* Resumen IVA en detalle */}
                                            <div className="border border-t-0 rounded-b-lg overflow-hidden">
                                                <div className="bg-blue-50 px-4 py-2 flex justify-between text-sm text-gray-600">
                                                    <span>Subtotal</span>
                                                    <span>${sub.toLocaleString('es-CO')}</span>
                                                </div>
                                                <div className="bg-blue-50 px-4 py-2 flex justify-between text-sm text-gray-600 border-t border-blue-100">
                                                    <span>IVA (19%)</span>
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
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
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

            {/* ════ MODAL — ANULAR COMPRA ════ */}
            <Dialog open={showAnularModal} onOpenChange={(open) => {
                if (!open) { setShowAnularModal(false); setAnulatingCompra(null); setAnularConfirmed(false); }
            }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <BanIcon className="w-5 h-5" />Anular compra
                            </DialogTitle>
                            <DialogDescription>
                                La compra pasará a estado "anulada". Esta acción no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>

                        {anulatingCompra && (
                            <div className="mt-4 space-y-3">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-mono font-semibold text-blue-900">#{anulatingCompra.id}</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {anulatingCompra.proveedor?.nombreEmpresa ?? `Proveedor #${anulatingCompra.proveedoresId}`}
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        {new Date(anulatingCompra.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO')} · <span className="capitalize">{anulatingCompra.metodoPago}</span>
                                    </p>
                                </div>

                                {!anularConfirmed ? (
                                    <p className="text-sm text-gray-600">
                                        ¿Estás seguro de que deseas anular esta compra permanentemente?
                                    </p>
                                ) : (
                                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg px-4 py-3 text-sm">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600" />
                                        Confirma que entiendes que esta acción es irreversible.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                onClick={() => { setShowAnularModal(false); setAnulatingCompra(null); setAnularConfirmed(false); }}
                                disabled={saving}
                            >
                                Volver
                            </Button>
                            {!anularConfirmed ? (
                                <Button
                                    onClick={() => setAnularConfirmed(true)}
                                    className="bg-white hover:bg-red-50 text-blue-900 border border-blue-900"
                                >
                                    Sí, anular
                                </Button>
                            ) : (
                                <Button
                                    onClick={confirmAnular}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    Confirmar anulación
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}