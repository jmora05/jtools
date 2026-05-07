import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogTitle,
} from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import {
    Search, Plus, ShoppingCart, Loader2, Info, X,
    PackageIcon, CalendarIcon, Percent, Banknote, ArrowLeftRight,
    ChevronDown, ChevronUp,
} from 'lucide-react';
import type {
    Proveedor, Insumo, Compra,
    ItemCarrito, CompraFormData, CompraFormErrors, CarritoItemError,
} from '../types/compra.types';

const NOTAS_MAX    = 500;
const PRECIO_MAX   = 999_999_999;
const CANTIDAD_MAX = 100_000;
const FACTURA_MAX  = 2_147_483_647;

// ─── Validadores ────────────────────────────────────────────────────────
function validateCompraForm(form: CompraFormData): CompraFormErrors {
    const errors: CompraFormErrors = {};
    if (!form.proveedoresId || form.proveedoresId.trim() === '') errors.proveedoresId = 'Debes seleccionar un proveedor.';
    if (!form.fecha || form.fecha.trim() === '') {
        errors.fecha = 'La fecha es obligatoria.';
    } else {
        const d = new Date(form.fecha + 'T12:00:00');
        const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
        const hace7 = new Date(); hace7.setDate(hace7.getDate() - 7); hace7.setHours(0, 0, 0, 0);
        if (isNaN(d.getTime())) errors.fecha = 'Fecha inválida.';
        else if (d > hoy)       errors.fecha = 'La fecha no puede ser futura.';
        else if (d < hace7)     errors.fecha = 'La fecha no puede ser anterior a una semana.';
    }
    if (!form.metodoPago || form.metodoPago.trim() === '') errors.metodoPago = 'El método de pago es obligatorio.';
    if (form.numeroFactura.trim() !== '') {
        const n = Number(form.numeroFactura);
        if (!Number.isInteger(n) || n <= 0) errors.numeroFactura = 'Debe ser un entero positivo.';
        else if (n > FACTURA_MAX) errors.numeroFactura = `No puede superar ${FACTURA_MAX.toLocaleString()}.`;
    }
    if (form.notas.length > NOTAS_MAX) errors.notas = `Máximo ${NOTAS_MAX} caracteres.`;
    if (/<script|javascript:|on\w+=/i.test(form.notas)) errors.notas = 'Contenido no permitido.';
    return errors;
}

function validateCarritoItem(item: ItemCarrito): CarritoItemError {
    const err: CarritoItemError = {};
    if (!item.precio || isNaN(item.precio) || item.precio <= 0) err.precio = 'Precio > 0.';
    else if (item.precio > PRECIO_MAX) err.precio = `Precio máx $${PRECIO_MAX.toLocaleString()}.`;
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) err.cantidad = 'Mínimo 1.';
    else if (item.cantidad > CANTIDAD_MAX) err.cantidad = `Máximo ${CANTIDAD_MAX.toLocaleString()}.`;
    return err;
}

const blockNonInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!nav.includes(e.key) && !e.ctrlKey && !e.metaKey && !/\d/.test(e.key)) e.preventDefault();
};
const blockNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!nav.includes(e.key) && !e.ctrlKey && !e.metaKey && !/[\d.]/.test(e.key)) e.preventDefault();
};

// ─── Estilos reutilizables ──────────────────────────────────────────────
const S = {
    label: {
        fontSize: 11, fontWeight: 600, color: '#6b7280',
        textTransform: 'uppercase' as const, letterSpacing: '0.05em',
        marginBottom: 6, display: 'block',
    },
    fieldGroup: { marginBottom: 18 },
    error: {
        color: '#ef4444', fontSize: 11, marginTop: 4,
        display: 'flex', alignItems: 'center', gap: 4,
    },
};

const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p style={S.error}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
            {message}
        </p>
    ) : null;

const PAYMENT_METHODS = [
    { value: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
    { value: 'efectivo',      label: 'Efectivo',      icon: Banknote },
];

interface CompraFormModalProps {
    open: boolean;
    editingCompra: Compra | null;
    proveedores: Proveedor[];
    insumos: Insumo[];
    ivaRate: number;
    onIvaChange: (value: number) => void;
    saving: boolean;
    onSave: (formData: CompraFormData, carrito: ItemCarrito[]) => void;
    onClose: () => void;
}

export function CompraFormModal({
    open, editingCompra, proveedores, insumos,
    ivaRate, onIvaChange, saving, onSave, onClose,
}: CompraFormModalProps) {

    const emptyForm: CompraFormData = {
        proveedoresId: '', fecha: new Date().toISOString().split('T')[0],
        metodoPago: 'efectivo', estado: 'pendiente', notas: '', numeroFactura: '',
    };

    const [formData, setFormData]               = useState<CompraFormData>(emptyForm);
    const [formErrors, setFormErrors]           = useState<CompraFormErrors>({});
    const [touched, setTouched]                 = useState<Partial<Record<keyof CompraFormData, boolean>>>({});
    const [carrito, setCarrito]                 = useState<ItemCarrito[]>([]);
    const [carritoErrors, setCarritoErrors]     = useState<Record<number, CarritoItemError>>({});
    const [supplySearch, setSupplySearch]       = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [cantidadInputs, setCantidadInputs]   = useState<Record<number, string>>({});
    const [showAddPanel, setShowAddPanel]       = useState(false);

    const [proveedorSearch, setProveedorSearch]     = useState('');
    const [showProveedorList, setShowProveedorList] = useState(false);
    const proveedorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        if (editingCompra) {
            setFormData({
                proveedoresId: editingCompra.proveedoresId.toString(),
                fecha:         (editingCompra.fecha ?? '').split('T')[0],
                metodoPago:    editingCompra.metodoPago ?? 'efectivo',
                estado:        editingCompra.estado ?? 'pendiente',
                notas:         '',
                numeroFactura: editingCompra.id.toString(),
            });
            setCarrito((editingCompra.detalles ?? []).map((d) => ({
                insumoId: d.insumosId,
                nombre:   d.insumo?.nombreInsumo ?? `Insumo #${d.insumosId}`,
                unidad:   d.insumo?.unidadMedida ?? '',
                precio:   Number(d.precioUnitario),
                cantidad: Math.round(Number(d.cantidad)),
            })));
        } else {
            setFormData(emptyForm); setCarrito([]);
        }
        setFormErrors({}); setTouched({}); setCarritoErrors({});
        setSubmitAttempted(false); setCantidadInputs({}); setSupplySearch(''); setShowAddPanel(false);
    }, [open, editingCompra]);

    useEffect(() => { setFormErrors(validateCompraForm(formData)); }, [formData]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (proveedorRef.current && !proveedorRef.current.contains(e.target as Node)) {
                setShowProveedorList(false); setProveedorSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleInputChange = (f: keyof CompraFormData, v: string) =>
        setFormData((p) => ({ ...p, [f]: v }));
    const handleBlur = (f: keyof CompraFormData) =>
        setTouched((p) => ({ ...p, [f]: true }));
    const touchAll = () => setTouched({
        proveedoresId: true, fecha: true, metodoPago: true, notas: true, numeroFactura: true,
    });

    const selectedProveedor = proveedores.find((p) => p.id.toString() === formData.proveedoresId);
    const filteredProveedores = proveedores.filter((p) =>
        p.nombreEmpresa.toLowerCase().includes(proveedorSearch.toLowerCase())
    );
    const filteredInsumos = insumos.filter((i) =>
        i.nombreInsumo.toLowerCase().includes(supplySearch.toLowerCase()) ||
        (i.codigoInsumo ?? '').toLowerCase().includes(supplySearch.toLowerCase())
    );

    const agregarInsumo = (insumo: Insumo) => {
        setCarrito((prev) => {
            const existe = prev.find((i) => i.insumoId === insumo.id);
            if (existe) {
                return prev.map((i) => i.insumoId === insumo.id
                    ? { ...i, cantidad: Math.min(Math.floor(i.cantidad) + 1, CANTIDAD_MAX) } : i);
            }
            return [...prev, {
                insumoId: insumo.id,
                nombre: insumo.nombreInsumo,
                unidad: insumo.unidadMedida,
                precio: insumo.precioUnitario ?? 0,
                cantidad: 1,
            }];
        });
    };

    const actualizarCantidad = (insumoId: number, value: number) => {
        const intValue = Math.floor(value);
        setCarrito((prev) => prev.map((i) => i.insumoId === insumoId ? { ...i, cantidad: intValue } : i));
        if (intValue <= 0) {
            setCarritoErrors((prev) => ({ ...prev, [insumoId]: { ...prev[insumoId], cantidad: 'Mínimo 1.' } }));
        } else {
            setCarritoErrors((prev) => {
                const n = { ...prev };
                if (n[insumoId]) {
                    delete n[insumoId].cantidad;
                    if (Object.keys(n[insumoId]).length === 0) delete n[insumoId];
                }
                return n;
            });
        }
    };

    const actualizarPrecio = (insumoId: number, raw: string) => {
        const valor = parseFloat(raw);
        setCarrito((prev) => prev.map((i) => i.insumoId === insumoId
            ? { ...i, precio: isNaN(valor) ? 0 : valor } : i));
    };

    const eliminarDelCarrito = (insumoId: number) => {
        setCarrito((prev) => prev.filter((i) => i.insumoId !== insumoId));
        setCarritoErrors((prev) => { const n = { ...prev }; delete n[insumoId]; return n; });
    };

    const getCantidadDisplay = (insumoId: number, cantidad: number) =>
        cantidadInputs[insumoId] ?? cantidad.toString();

    const subtotalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const ivaCarrito      = subtotalCarrito * (ivaRate / 100);
    const totalCarrito    = subtotalCarrito + ivaCarrito;
    const carritoTieneErrores = Object.keys(carritoErrors).length > 0;
    const totalFormErrors = Object.keys(formErrors).length;

    const handleSave = () => {
        setSubmitAttempted(true); touchAll();
        const errors = validateCompraForm(formData);
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) { toast.error('Completa los campos obligatorios.'); return; }
        if (carrito.length === 0) { toast.error('Agrega al menos un insumo.'); return; }
        const carritoErrs: Record<number, CarritoItemError> = {};
        carrito.forEach((item) => {
            const err = validateCarritoItem(item);
            if (Object.keys(err).length > 0) carritoErrs[item.insumoId] = err;
        });
        setCarritoErrors(carritoErrs);
        if (Object.keys(carritoErrs).length > 0) { toast.error('Revisa precios y cantidades.'); return; }
        onSave(formData, carrito);
    };

    const today    = new Date().toISOString().split('T')[0];
    const hace7dias = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; })();

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent
                className="p-0 gap-0 overflow-hidden"
                style={{
                    width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh',
                    display: 'flex', flexDirection: 'column', padding: 0, gap: 0,
                }}
            >
                {/* ════ HEADER ════ */}
                <header style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
                    flexShrink: 0, background: '#fff',
                }}>
                    <div style={{
                        width: 40, height: 40, background: '#1d4ed8',
                        borderRadius: 8, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                    }}>
                        <ShoppingCart style={{ width: 20, height: 20, color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
                        <DialogTitle style={{
                            fontSize: 18, fontWeight: 700, color: '#111827',
                            lineHeight: 1.2, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
                        }}>
                            {editingCompra ? 'Editar compra' : 'Gestión de Compra de Insumos'}
                        </DialogTitle>
                        <DialogDescription style={{
                            fontSize: 12, color: '#6b7280', marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {editingCompra
                                ? 'Modifica los datos. Solo compras pendientes dentro de los primeros 5 días.'
                                : 'Detalla los productos e insumos para esta orden.'}
                        </DialogDescription>
                    </div>
                </header>

                {/* ════ ALERTAS ════ */}
                {submitAttempted && (totalFormErrors > 0 || carrito.length === 0) && (
                    <div style={{
                        padding: '8px 24px', background: '#fffbeb',
                        borderBottom: '1px solid #fde68a', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 12,
                        fontSize: 12, color: '#92400e',
                    }}>
                        <Info style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0 }} />
                        <span>
                            {totalFormErrors > 0 && `${totalFormErrors} campo(s) requieren atención. `}
                            {carrito.length === 0 && 'Agrega al menos un insumo para continuar.'}
                        </span>
                    </div>
                )}

                {/* ════ BODY (2 COLUMNAS) ════ */}
                <div style={{
                    display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0,
                }}>
                    {/* ── SIDEBAR IZQUIERDO ── */}
                    <aside style={{
                        width: 320, flexShrink: 0,
                        borderRight: '1px solid #e5e7eb', background: '#f9fafb',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div style={{
                            flex: 1, overflowY: 'auto', padding: 20,
                        }}>
                            {/* Proveedor */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>Proveedor <span style={{ color: '#f87171' }}>*</span></label>
                                <div ref={proveedorRef} style={{ position: 'relative' }}>
                                    <Search style={{
                                        position: 'absolute', left: 12, top: '50%',
                                        transform: 'translateY(-50%)', color: '#9ca3af',
                                        width: 14, height: 14, pointerEvents: 'none',
                                    }} />
                                    <Input
                                        placeholder="Seleccionar proveedor..."
                                        value={showProveedorList ? proveedorSearch : (selectedProveedor?.nombreEmpresa ?? proveedorSearch)}
                                        onChange={(e) => {
                                            setProveedorSearch(e.target.value);
                                            setShowProveedorList(e.target.value.trim().length > 0);
                                        }}
                                        onFocus={() => { setProveedorSearch(''); setShowProveedorList(true); }}
                                        style={{
                                            paddingLeft: 36, height: 40, fontSize: 14, background: '#fff',
                                            borderColor: touched.proveedoresId && formErrors.proveedoresId
                                                ? '#f87171' : selectedProveedor && !showProveedorList ? '#60a5fa' : undefined,
                                        }}
                                        autoComplete="off"
                                    />
                                    {selectedProveedor && !showProveedorList && (
                                        <button
                                            type="button"
                                            onClick={() => { handleInputChange('proveedoresId', ''); setProveedorSearch(''); setShowProveedorList(true); }}
                                            style={{
                                                position: 'absolute', right: 12, top: '50%',
                                                transform: 'translateY(-50%)', color: '#9ca3af',
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                            }}
                                        >
                                            <X style={{ width: 14, height: 14 }} />
                                        </button>
                                    )}
                                    {showProveedorList && proveedorSearch.trim().length > 0 && (
                                        <div style={{
                                            position: 'absolute', zIndex: 9999, width: '100%', marginTop: 4,
                                            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                            maxHeight: 160, overflowY: 'auto',
                                        }}>
                                            {filteredProveedores.length === 0 ? (
                                                <div style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Sin resultados</div>
                                            ) : filteredProveedores.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleInputChange('proveedoresId', p.id.toString());
                                                        handleBlur('proveedoresId');
                                                        setShowProveedorList(false); setProveedorSearch('');
                                                    }}
                                                    style={{
                                                        width: '100%', textAlign: 'left', padding: '8px 16px',
                                                        fontSize: 14, border: 'none', cursor: 'pointer',
                                                        background: formData.proveedoresId === p.id.toString() ? '#dbeafe' : '#fff',
                                                        color: formData.proveedoresId === p.id.toString() ? '#1e3a8a' : '#1f2937',
                                                        fontWeight: formData.proveedoresId === p.id.toString() ? 600 : 400,
                                                    }}
                                                    onMouseEnter={(e) => { if (formData.proveedoresId !== p.id.toString()) e.currentTarget.style.background = '#eff6ff'; }}
                                                    onMouseLeave={(e) => { if (formData.proveedoresId !== p.id.toString()) e.currentTarget.style.background = '#fff'; }}
                                                >
                                                    {p.nombreEmpresa}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <FieldError message={touched.proveedoresId ? formErrors.proveedoresId : undefined} />
                            </div>

                            {/* Métodos de pago */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>Métodos de pago <span style={{ color: '#f87171' }}>*</span></label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
                                        const selected = formData.metodoPago === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => { handleInputChange('metodoPago', value); handleBlur('metodoPago'); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    gap: 6, padding: '10px 8px', borderRadius: 8,
                                                    border: `1px solid ${selected ? '#1d4ed8' : '#e5e7eb'}`,
                                                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                                    background: selected ? '#1d4ed8' : '#fff',
                                                    color: selected ? '#fff' : '#4b5563',
                                                    whiteSpace: 'nowrap', transition: 'all 0.15s',
                                                }}
                                            >
                                                <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <FieldError message={touched.metodoPago ? formErrors.metodoPago : undefined} />
                            </div>

                            {/* Fecha */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>Fecha de emisión <span style={{ color: '#f87171' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <CalendarIcon style={{
                                        position: 'absolute', left: 12, top: '50%',
                                        transform: 'translateY(-50%)', color: '#9ca3af',
                                        width: 14, height: 14, pointerEvents: 'none',
                                    }} />
                                    <Input
                                        type="date"
                                        value={formData.fecha}
                                        min={hace7dias} max={today}
                                        onChange={(e) => { handleInputChange('fecha', e.target.value); handleBlur('fecha'); }}
                                        onBlur={() => handleBlur('fecha')}
                                        style={{
                                            paddingLeft: 36, height: 40, fontSize: 14, background: '#fff',
                                            borderColor: touched.fecha && formErrors.fecha ? '#f87171' : undefined,
                                        }}
                                    />
                                </div>
                                <FieldError message={touched.fecha ? formErrors.fecha : undefined} />
                            </div>

                            {/* N° Factura + IVA */}
                            <div style={{ ...S.fieldGroup, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={S.label}>N° Factura</label>
                                    <Input
                                        type="number" placeholder="Ej: 1001"
                                        value={formData.numeroFactura}
                                        onChange={(e) => handleInputChange('numeroFactura', e.target.value)}
                                        onBlur={() => handleBlur('numeroFactura')}
                                        onKeyDown={blockNonInteger}
                                        min="1" max={FACTURA_MAX} step="1"
                                        disabled={!!editingCompra}
                                        style={{
                                            height: 40, fontSize: 14, background: '#fff',
                                            borderColor: touched.numeroFactura && formErrors.numeroFactura ? '#f87171' : undefined,
                                        }}
                                    />
                                    <FieldError message={touched.numeroFactura ? formErrors.numeroFactura : undefined} />
                                </div>
                                <div>
                                    <label style={S.label}>IVA (%)</label>
                                    <div style={{ position: 'relative' }}>
                                        <Percent style={{
                                            position: 'absolute', left: 12, top: '50%',
                                            transform: 'translateY(-50%)', color: '#9ca3af',
                                            width: 14, height: 14, pointerEvents: 'none',
                                        }} />
                                        <Input
                                            type="number"
                                            value={ivaRate === 0 ? '' : ivaRate}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                onIvaChange(isNaN(val) ? 0 : Math.min(Math.max(val, 0), 100));
                                            }}
                                            onKeyDown={blockNonNumeric}
                                            min="0" max="100" step="0.1"
                                            style={{ paddingLeft: 36, height: 40, fontSize: 14, background: '#fff' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notas */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>Notas (opcional)</label>
                                <Textarea
                                    placeholder="Comentarios adicionales..."
                                    value={formData.notas}
                                    onChange={(e) => handleInputChange('notas', e.target.value)}
                                    onBlur={() => handleBlur('notas')}
                                    rows={3}
                                    maxLength={NOTAS_MAX + 1}
                                    style={{
                                        fontSize: 14, background: '#fff', resize: 'none',
                                        borderColor: touched.notas && formErrors.notas ? '#f87171' : undefined,
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                    <FieldError message={touched.notas ? formErrors.notas : undefined} />
                                    <span style={{
                                        fontSize: 11, marginLeft: 'auto',
                                        color: formData.notas.length > NOTAS_MAX ? '#ef4444' : '#9ca3af',
                                        fontWeight: formData.notas.length > NOTAS_MAX ? 600 : 400,
                                    }}>
                                        {formData.notas.length}/{NOTAS_MAX}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* ── PANEL DERECHO ── */}
                    <section style={{
                        flex: 1, minWidth: 0,
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', background: '#fff',
                    }}>
                        {/* Header del panel */}
                        <div style={{
                            padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                            gap: 16, flexShrink: 0,
                        }}>
                            <div style={{ minWidth: 0 }}>
                                <h3 style={{
                                    fontWeight: 700, color: '#111827', fontSize: 16,
                                    lineHeight: 1.2, margin: 0,
                                }}>
                                    {editingCompra ? 'Editar productos' : 'Nueva Compra'}
                                </h3>
                                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, margin: 0 }}>
                                    Detalle los productos e insumos para esta orden.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => setShowAddPanel((v) => !v)}
                                style={{
                                    background: '#1d4ed8', color: '#fff', fontSize: 12,
                                    height: 36, padding: '0 14px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                <Plus style={{ width: 16, height: 16 }} />
                                Agregar productos / insumos
                                {showAddPanel ? <ChevronUp style={{ width: 12, height: 12, marginLeft: 2 }} /> : <ChevronDown style={{ width: 12, height: 12, marginLeft: 2 }} />}
                            </Button>
                        </div>

                        {/* Buscador colapsable */}
                        {showAddPanel && (
                            <div style={{
                                borderBottom: '1px solid #e5e7eb', background: '#f9fafb',
                                padding: '12px 24px', flexShrink: 0,
                            }}>
                                <div style={{ position: 'relative', marginBottom: 8 }}>
                                    <Search style={{
                                        position: 'absolute', left: 12, top: '50%',
                                        transform: 'translateY(-50%)', color: '#9ca3af', width: 14, height: 14,
                                    }} />
                                    <Input
                                        placeholder="Buscar insumo por nombre o código..."
                                        value={supplySearch}
                                        onChange={(e) => setSupplySearch(e.target.value)}
                                        style={{ paddingLeft: 36, height: 36, fontSize: 14 }}
                                        maxLength={100} autoFocus
                                    />
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 176, paddingRight: 4 }}>
                                    {filteredInsumos.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
                                            <PackageIcon style={{ width: 24, height: 24, margin: '0 auto 4px', opacity: 0.3 }} />
                                            <p style={{ fontSize: 12, margin: 0 }}>No se encontraron insumos</p>
                                        </div>
                                    ) : filteredInsumos.map((insumo) => {
                                        const yaAgregado = carrito.some((i) => i.insumoId === insumo.id);
                                        return (
                                            <div
                                                key={insumo.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '8px 12px', marginBottom: 4, borderRadius: 8,
                                                    border: `1px solid ${yaAgregado ? '#93c5fd' : '#f3f4f6'}`,
                                                    background: '#fff',
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                                                        {insumo.nombreInsumo}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                                                        {insumo.codigoInsumo ? `SKU: ${insumo.codigoInsumo} · ` : ''}
                                                        {insumo.unidadMedida}
                                                        {insumo.precioUnitario ? ` · $${Number(insumo.precioUnitario).toLocaleString('es-CO')}` : ''}
                                                        {insumo.cantidad !== undefined ? ` · Stock: ${insumo.cantidad}` : ''}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => agregarInsumo(insumo)}
                                                    style={{
                                                        marginLeft: 12, flexShrink: 0, height: 28, fontSize: 11, padding: '0 10px',
                                                        background: yaAgregado ? '#dbeafe' : '#2563eb',
                                                        color: yaAgregado ? '#1d4ed8' : '#fff',
                                                    }}
                                                >
                                                    <Plus style={{ width: 12, height: 12, marginRight: 4 }} />
                                                    {yaAgregado ? '+1' : 'Agregar'}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tabla / vacío */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {carrito.length === 0 ? (
                                <div style={{
                                    margin: 24, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    padding: '64px 0', borderRadius: 12,
                                    border: `2px dashed ${submitAttempted ? '#fca5a5' : '#e5e7eb'}`,
                                    background: submitAttempted ? '#fef2f2' : 'transparent',
                                    color: '#9ca3af',
                                }}>
                                    <ShoppingCart style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.25 }} />
                                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Sin productos aún</p>
                                    <p style={{ fontSize: 12, marginTop: 4, margin: 0 }}>Usa el botón "Agregar productos / insumos"</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto / Insumo</th>
                                            <th style={{ textAlign: 'center', padding: '12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>Cantidad</th>
                                            <th style={{ textAlign: 'right', padding: '12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 145 }}>Precio Unitario</th>
                                            <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>Subtotal</th>
                                            <th style={{ width: 40 }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carrito.map((item) => {
                                            const itemErr = carritoErrors[item.insumoId];
                                            return (
                                                <tr key={item.insumoId} style={{
                                                    borderBottom: '1px solid #f3f4f6',
                                                    background: itemErr ? '#fef2f2' : 'transparent',
                                                }}>
                                                    <td style={{ padding: '12px 24px' }}>
                                                        <p style={{ fontWeight: 500, color: '#111827', fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</p>
                                                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                                                            {item.unidad}{item.unidad ? ' · ' : ''}SKU: {item.insumoId}
                                                        </p>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center',
                                                                border: '1px solid #e5e7eb', borderRadius: 8,
                                                                overflow: 'hidden', background: '#fff',
                                                            }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => actualizarCantidad(item.insumoId, item.cantidad - 1)}
                                                                    disabled={item.cantidad <= 1}
                                                                    style={{
                                                                        width: 28, height: 32, display: 'flex',
                                                                        alignItems: 'center', justifyContent: 'center',
                                                                        color: '#6b7280', background: 'transparent',
                                                                        border: 'none', fontSize: 16, fontWeight: 500,
                                                                        cursor: item.cantidad <= 1 ? 'not-allowed' : 'pointer',
                                                                        opacity: item.cantidad <= 1 ? 0.3 : 1,
                                                                    }}
                                                                >−</button>
                                                                <Input
                                                                    type="text" inputMode="numeric"
                                                                    value={getCantidadDisplay(item.insumoId, item.cantidad)}
                                                                    onKeyDown={blockNonInteger}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value;
                                                                        setCantidadInputs(prev => ({ ...prev, [item.insumoId]: raw }));
                                                                        if (raw === '' || raw === '0') return;
                                                                        const parsed = parseInt(raw, 10);
                                                                        if (!isNaN(parsed) && parsed > 0) actualizarCantidad(item.insumoId, parsed);
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        const parsed = parseInt(e.target.value, 10);
                                                                        if (isNaN(parsed)) {
                                                                            setCarritoErrors(prev => ({ ...prev, [item.insumoId]: { ...prev[item.insumoId], cantidad: 'Mínimo 1.' } }));
                                                                        } else {
                                                                            actualizarCantidad(item.insumoId, parsed);
                                                                        }
                                                                        setCantidadInputs(prev => { const n = { ...prev }; delete n[item.insumoId]; return n; });
                                                                    }}
                                                                    style={{
                                                                        width: 40, height: 32, textAlign: 'center',
                                                                        fontSize: 14, fontWeight: 600, padding: '0 4px',
                                                                        border: 'none', borderLeft: '1px solid #e5e7eb',
                                                                        borderRight: '1px solid #e5e7eb', borderRadius: 0,
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => actualizarCantidad(item.insumoId, item.cantidad + 1)}
                                                                    disabled={item.cantidad >= CANTIDAD_MAX}
                                                                    style={{
                                                                        width: 28, height: 32, display: 'flex',
                                                                        alignItems: 'center', justifyContent: 'center',
                                                                        color: '#6b7280', background: 'transparent',
                                                                        border: 'none', fontSize: 16, fontWeight: 500,
                                                                        cursor: item.cantidad >= CANTIDAD_MAX ? 'not-allowed' : 'pointer',
                                                                        opacity: item.cantidad >= CANTIDAD_MAX ? 0.3 : 1,
                                                                    }}
                                                                >+</button>
                                                            </div>
                                                            {itemErr?.cantidad && (
                                                                <p style={{ color: '#ef4444', fontSize: 10, lineHeight: 1.2, textAlign: 'center', margin: 0 }}>{itemErr.cantidad}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <span style={{ fontSize: 11, color: '#9ca3af' }}>$</span>
                                                                <Input
                                                                    type="number"
                                                                    value={item.precio === 0 ? '' : item.precio}
                                                                    onChange={(e) => actualizarPrecio(item.insumoId, e.target.value)}
                                                                    onKeyDown={blockNonNumeric}
                                                                    placeholder="0.00"
                                                                    min="0.01" max={PRECIO_MAX} step="0.01"
                                                                    style={{
                                                                        width: 96, height: 32, fontSize: 14, textAlign: 'right',
                                                                        borderColor: itemErr?.precio ? '#f87171' : undefined,
                                                                    }}
                                                                />
                                                            </div>
                                                            {itemErr?.precio && (
                                                                <p style={{ color: '#ef4444', fontSize: 10, lineHeight: 1.2, textAlign: 'right', margin: 0 }}>{itemErr.precio}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                                                        <span style={{
                                                            fontSize: 14, fontWeight: 700,
                                                            color: itemErr ? '#d1d5db' : '#111827',
                                                        }}>
                                                            {item.precio > 0 && !itemErr
                                                                ? `$${(item.precio * item.cantidad).toLocaleString('es-CO')}`
                                                                : '—'}
                                                        </span>
                                                    </td>
                                                    <td style={{ paddingRight: 12, paddingTop: 12, paddingBottom: 12 }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => eliminarDelCarrito(item.insumoId)}
                                                            style={{
                                                                color: '#9ca3af', background: 'transparent',
                                                                border: 'none', cursor: 'pointer',
                                                            }}
                                                            title="Quitar"
                                                            onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                                        >
                                                            <X style={{ width: 16, height: 16 }} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Totales */}
                        {subtotalCarrito > 0 && !carritoTieneErrores && (
                            <div style={{
                                borderTop: '1px solid #e5e7eb', padding: '16px 24px',
                                flexShrink: 0, background: '#fff',
                            }}>
                                <div style={{ marginLeft: 'auto', maxWidth: 320 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280', marginBottom: 6 }}>
                                        <span>Subtotal</span>
                                        <span>${subtotalCarrito.toLocaleString('es-CO', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: 14, color: '#6b7280',
                                        paddingBottom: 8, borderBottom: '1px solid #e5e7eb', marginBottom: 4,
                                    }}>
                                        <span>IVA ({ivaRate}%)</span>
                                        <span>${ivaCarrito.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                                        <span style={{ fontWeight: 700, color: '#111827' }}>Total</span>
                                        <span style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>
                                            ${totalCarrito.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* ════ FOOTER ════ */}
                <footer style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 16, padding: '12px 24px',
                    borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
                }}>
                    <p style={{
                        fontSize: 12, color: '#9ca3af',
                        display: 'flex', alignItems: 'center', gap: 6,
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                        Todos los precios están en COP
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} disabled={saving} style={{ height: 36, padding: '0 16px' }}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px' }}
                        >
                            {saving && <Loader2 style={{ width: 16, height: 16, marginRight: 8 }} className="animate-spin" />}
                            {editingCompra ? 'Actualizar compra' : 'Guardar Compra'}
                        </Button>
                    </div>
                </footer>
            </DialogContent>
        </Dialog>
    );
}