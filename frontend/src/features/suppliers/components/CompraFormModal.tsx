import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';
import {
    Search, Plus, ShoppingCart, Loader2, Info, X,
    PackageIcon, CalendarIcon, Percent,
} from 'lucide-react';
import type {
    Proveedor, Insumo, Compra,
    ItemCarrito, CompraFormData, CompraFormErrors, CarritoItemError,
} from '../types/compra.types';

// ─── Constantes ───────────────────────────────────────────────────────────────
const NOTAS_MAX   = 500;
const PRECIO_MAX  = 999_999_999;
const CANTIDAD_MAX = 100_000;
const FACTURA_MAX = 2_147_483_647;

// ─── Validadores ──────────────────────────────────────────────────────────────
function validateCompraForm(form: CompraFormData): CompraFormErrors {
    const errors: CompraFormErrors = {};

    if (!form.proveedoresId || form.proveedoresId.trim() === '')
        errors.proveedoresId = 'Debes seleccionar un proveedor.';

    if (!form.fecha || form.fecha.trim() === '') {
        errors.fecha = 'La fecha es obligatoria.';
    } else {
        const d = new Date(form.fecha + 'T12:00:00');
        const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
        const hace7dias = new Date(); hace7dias.setDate(hace7dias.getDate() - 7); hace7dias.setHours(0, 0, 0, 0);
        if (isNaN(d.getTime()))   errors.fecha = 'Fecha inválida.';
        else if (d > hoy)         errors.fecha = 'La fecha no puede ser una fecha futura.';
        else if (d < hace7dias)   errors.fecha = 'La fecha no puede ser anterior a una semana.';
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
        err.cantidad = 'La cantidad debe ser mínimo 1.';
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

// ─── Componentes UI internos ──────────────────────────────────────────────────
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

// ─── Sección de formulario de datos ──────────────────────────────────────────
interface CompraFormSectionProps {
    proveedores: Proveedor[];
    formData: CompraFormData;
    onChange: (field: keyof CompraFormData, value: string) => void;
    errors: CompraFormErrors;
    touched: Partial<Record<keyof CompraFormData, boolean>>;
    onBlur: (field: keyof CompraFormData) => void;
    isEditing: boolean;
    ivaRate: number;
    onIvaChange: (value: number) => void;
}

const CompraFormSection = ({
    proveedores, formData, onChange, errors, touched, onBlur, isEditing,
    ivaRate, onIvaChange,
}: CompraFormSectionProps) => {
    const today = new Date().toISOString().split('T')[0];
    const hace7dias = (() => {
        const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0];
    })();

    const [proveedorSearch, setProveedorSearch] = useState('');
    const [showProveedorList, setShowProveedorList] = useState(false);
    const proveedorRef = useRef<HTMLDivElement>(null);

    const selectedProveedor = proveedores.find(
        (p) => p.id.toString() === formData.proveedoresId
    );

    const filteredProveedores = proveedores.filter((p) =>
        p.nombreEmpresa.toLowerCase().includes(proveedorSearch.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (proveedorRef.current && !proveedorRef.current.contains(e.target as Node)) {
                setShowProveedorList(false);
                setProveedorSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProveedorSelect = (proveedor: Proveedor) => {
        onChange('proveedoresId', proveedor.id.toString());
        onBlur('proveedoresId');
        setShowProveedorList(false);
        setProveedorSearch('');
    };

    const handleProveedorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setProveedorSearch(value);
        setShowProveedorList(value.trim().length > 0);
    };

    const handleProveedorFocus = () => {
        setProveedorSearch('');
        setShowProveedorList(true);
    };

    const inputDisplayValue = showProveedorList
        ? proveedorSearch
        : (selectedProveedor?.nombreEmpresa ?? proveedorSearch);

    return (
        <div className="space-y-3">
            {/* Proveedor */}
            <div>
                <label className="block text-sm text-gray-700 mb-1">
                    Proveedor <span className="text-red-500">*</span>
                </label>
                <div ref={proveedorRef} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <Input
                        placeholder="Buscar proveedor..."
                        value={inputDisplayValue}
                        onChange={handleProveedorInputChange}
                        onFocus={handleProveedorFocus}
                        className={`pl-10 h-9 ${touched.proveedoresId && errors.proveedoresId ? 'border-red-400 focus-visible:ring-red-300' : ''} ${selectedProveedor && !showProveedorList ? 'border-blue-400' : ''}`}
                        autoComplete="off"
                    />
                    {selectedProveedor && !showProveedorList && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange('proveedoresId', '');
                                setProveedorSearch('');
                                setShowProveedorList(true);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    {showProveedorList && proveedorSearch.trim().length > 0 && (
                        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {filteredProveedores.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-400 text-center">No se encontraron proveedores</div>
                            ) : (
                                filteredProveedores.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); handleProveedorSelect(p); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                                            formData.proveedoresId === p.id.toString() ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-gray-800'
                                        }`}
                                    >
                                        {p.nombreEmpresa}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
                <FieldError message={touched.proveedoresId ? errors.proveedoresId : undefined} />
            </div>

            {/* N° Factura + Fecha */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm text-gray-700 mb-1">N° Factura</label>
                    <Input
                        type="number"
                        placeholder="Ej: 1001"
                        value={formData.numeroFactura}
                        onChange={(e) => onChange('numeroFactura', e.target.value)}
                        onBlur={() => onBlur('numeroFactura')}
                        onKeyDown={blockNonInteger}
                        min="1" max={FACTURA_MAX} step="1"
                        disabled={isEditing}
                        className={`h-9 ${touched.numeroFactura && errors.numeroFactura ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                    />
                    <FieldError message={touched.numeroFactura ? errors.numeroFactura : undefined} />
                    {isEditing && <p className="text-xs text-gray-400 mt-0.5">No modificable.</p>}
                </div>
                <div>
                    <label className="block text-sm text-gray-700 mb-1">
                        Fecha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="date"
                            value={formData.fecha}
                            min={hace7dias}
                            max={today}
                            onChange={(e) => { onChange('fecha', e.target.value); onBlur('fecha'); }}
                            onBlur={() => onBlur('fecha')}
                            className={`pl-10 h-9 ${touched.fecha && errors.fecha ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                        />
                    </div>
                    <FieldError message={touched.fecha ? errors.fecha : undefined} />
                </div>
            </div>

            {/* Método de pago + IVA */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm text-gray-700 mb-1">
                        Método de pago <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={formData.metodoPago}
                        onValueChange={(v) => { onChange('metodoPago', v); onBlur('metodoPago'); }}
                    >
                        <SelectTrigger className={`h-9 ${touched.metodoPago && errors.metodoPago ? 'border-red-400 focus-visible:ring-red-300' : ''}`}>
                            <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[9999]">
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                        </SelectContent>
                    </Select>
                    <FieldError message={touched.metodoPago ? errors.metodoPago : undefined} />
                </div>
                <div>
                    <label className="block text-sm text-gray-700 mb-1">IVA (%)</label>
                    <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="number"
                            placeholder="Ej: 19"
                            value={ivaRate === 0 ? '' : ivaRate}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                onIvaChange(isNaN(val) ? 0 : Math.min(Math.max(val, 0), 100));
                            }}
                            onKeyDown={blockNonNumeric}
                            min="0" max="100" step="0.1"
                            className="pl-10 h-9"
                        />
                    </div>
                </div>
            </div>

            {/* Notas */}
            <div>
                <label className="block text-sm text-gray-700 mb-1">Notas (opcional)</label>
                <Textarea
                    placeholder="Comentarios adicionales..."
                    value={formData.notas}
                    onChange={(e) => onChange('notas', e.target.value)}
                    onBlur={() => onBlur('notas')}
                    rows={2}
                    maxLength={NOTAS_MAX + 1}
                    className={`text-sm ${touched.notas && errors.notas ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                />
                <div className="flex justify-between items-center mt-0.5">
                    <FieldError message={touched.notas ? errors.notas : undefined} />
                    <span className={`text-xs ml-auto ${formData.notas.length > NOTAS_MAX ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {formData.notas.length}/{NOTAS_MAX}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── Props del modal ──────────────────────────────────────────────────────────
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

// ─── Componente principal ─────────────────────────────────────────────────────
export function CompraFormModal({
    open, editingCompra, proveedores, insumos,
    ivaRate, onIvaChange, saving, onSave, onClose,
}: CompraFormModalProps) {
    const emptyForm: CompraFormData = {
        proveedoresId: '',
        fecha: new Date().toISOString().split('T')[0],
        metodoPago: 'efectivo',
        estado: 'pendiente',
        notas: '',
        numeroFactura: '',
    };

    const [formData, setFormData]         = useState<CompraFormData>(emptyForm);
    const [formErrors, setFormErrors]     = useState<CompraFormErrors>({});
    const [touched, setTouched]           = useState<Partial<Record<keyof CompraFormData, boolean>>>({});
    const [carrito, setCarrito]           = useState<ItemCarrito[]>([]);
    const [carritoErrors, setCarritoErrors] = useState<Record<number, CarritoItemError>>({});
    const [supplySearch, setSupplySearch] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [cantidadInputs, setCantidadInputs]   = useState<Record<number, string>>({});

    // Inicializar / resetear cuando el modal abre o cambia el modo
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
            setCarrito(
                (editingCompra.detalles ?? []).map((d) => ({
                    insumoId: d.insumosId,
                    nombre:   d.insumo?.nombreInsumo ?? `Insumo #${d.insumosId}`,
                    unidad:   d.insumo?.unidadMedida ?? '',
                    precio:   Number(d.precioUnitario),
                    cantidad: Math.round(Number(d.cantidad)),
                }))
            );
        } else {
            setFormData({
                proveedoresId: '',
                fecha:         new Date().toISOString().split('T')[0],
                metodoPago:    'efectivo',
                estado:        'pendiente',
                notas:         '',
                numeroFactura: '',
            });
            setCarrito([]);
        }
        setFormErrors({});
        setTouched({});
        setCarritoErrors({});
        setSubmitAttempted(false);
        setCantidadInputs({});
        setSupplySearch('');
    }, [open, editingCompra]);

    useEffect(() => {
        setFormErrors(validateCompraForm(formData));
    }, [formData]);

    // ── Handlers de formulario ─────────────────────────────────────────────
    const handleInputChange = (field: keyof CompraFormData, value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const handleBlur = (field: keyof CompraFormData) =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    const touchAll = () => setTouched({
        proveedoresId: true, fecha: true, metodoPago: true, notas: true, numeroFactura: true,
    });

    // ── Carrito ────────────────────────────────────────────────────────────
    const agregarInsumo = (insumo: Insumo) => {
        setCarrito((prev) => {
            const existe = prev.find((i) => i.insumoId === insumo.id);
            if (existe) {
                return prev.map((i) =>
                    i.insumoId === insumo.id
                        ? { ...i, cantidad: Math.min(Math.floor(i.cantidad) + 1, CANTIDAD_MAX) }
                        : i
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
        const intValue = Math.floor(value);
        if (intValue <= 0) {
            setCarrito((prev) => prev.map((i) => i.insumoId === insumoId ? { ...i, cantidad: intValue } : i));
            setCarritoErrors((prev) => ({
                ...prev,
                [insumoId]: { ...prev[insumoId], cantidad: 'La cantidad debe ser mínimo 1.' },
            }));
            return;
        }
        setCarrito((prev) => prev.map((i) => i.insumoId === insumoId ? { ...i, cantidad: intValue } : i));
        setCarritoErrors((prev) => {
            const n = { ...prev };
            if (n[insumoId]) {
                delete n[insumoId].cantidad;
                if (Object.keys(n[insumoId]).length === 0) delete n[insumoId];
            }
            return n;
        });
    };

    const actualizarPrecio = (insumoId: number, raw: string) => {
        const valor = parseFloat(raw);
        setCarrito((prev) => prev.map((i) => i.insumoId === insumoId ? { ...i, precio: isNaN(valor) ? 0 : valor } : i));
    };

    const eliminarDelCarrito = (insumoId: number) => {
        setCarrito((prev) => prev.filter((i) => i.insumoId !== insumoId));
        setCarritoErrors((prev) => { const n = { ...prev }; delete n[insumoId]; return n; });
    };

    const getCantidadDisplay = (insumoId: number, cantidad: number) =>
        cantidadInputs[insumoId] ?? cantidad.toString();

    const ivaDecimal       = ivaRate / 100;
    const subtotalCarrito  = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    const ivaCarrito       = subtotalCarrito * ivaDecimal;
    const totalCarrito     = subtotalCarrito + ivaCarrito;
    const carritoTieneErrores = Object.keys(carritoErrors).length > 0;

    const filteredInsumos = insumos.filter((i) =>
        i.nombreInsumo.toLowerCase().includes(supplySearch.toLowerCase()) ||
        (i.codigoInsumo ?? '').toLowerCase().includes(supplySearch.toLowerCase())
    );

    const totalFormErrors = Object.keys(formErrors).length;

    // ── Guardar ────────────────────────────────────────────────────────────
    const handleSave = () => {
        setSubmitAttempted(true);
        touchAll();
        const errors = validateCompraForm(formData);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            toast.error('Completa los campos obligatorios correctamente.');
            return;
        }
        if (carrito.length === 0) {
            toast.error('Agrega al menos un insumo antes de continuar.');
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

        onSave(formData, carrito);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-5xl w-[95vw] h-[88vh] p-0 flex flex-col overflow-hidden">

                {/* Header fijo */}
                <div className="px-6 pt-5 pb-4 border-b shrink-0">
                    <DialogTitle className="text-lg font-bold text-blue-900">
                        {editingCompra ? 'Editar compra' : 'Nueva compra de insumos'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 mt-0.5">
                        {editingCompra
                            ? 'Modifica los datos de la compra. Solo se pueden editar compras pendientes dentro de los primeros 5 días.'
                            : 'Registra una nueva adquisición. Al guardar, el stock se actualizará automáticamente.'}
                    </DialogDescription>

                    {submitAttempted && (totalFormErrors > 0 || carrito.length === 0) && (
                        <div className="mt-2 space-y-1.5">
                            {totalFormErrors > 0 && (
                                <InfoAlert message={`Hay ${totalFormErrors} campo(s) que requieren atención.`} />
                            )}
                            {carrito.length === 0 && (
                                <InfoAlert message="Agrega al menos un insumo antes de continuar." />
                            )}
                        </div>
                    )}
                </div>

                {/* Cuerpo: 2 columnas con scroll independiente */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Columna izquierda: Datos + Buscar insumos */}
                    <div className="w-[45%] border-r flex flex-col overflow-hidden">
                        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

                            {/* Sección 1 — Datos */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
                                    <h3 className="font-semibold text-blue-900 text-sm">Datos de la compra</h3>
                                </div>
                                <CompraFormSection
                                    proveedores={proveedores}
                                    formData={formData}
                                    onChange={handleInputChange}
                                    errors={formErrors}
                                    touched={touched}
                                    onBlur={handleBlur}
                                    isEditing={!!editingCompra}
                                    ivaRate={ivaRate}
                                    onIvaChange={onIvaChange}
                                />
                            </div>

                            {/* Sección 2 — Buscar insumos */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
                                    <h3 className="font-semibold text-blue-900 text-sm">Agregar insumos</h3>
                                </div>
                                <div className="border border-blue-100 rounded-lg p-3 space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Buscar insumo por nombre o código..."
                                            value={supplySearch}
                                            onChange={(e) => setSupplySearch(e.target.value)}
                                            className="pl-10 h-9"
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="overflow-y-auto max-h-52 space-y-1.5 pr-1">
                                        {filteredInsumos.length === 0 ? (
                                            <div className="text-center py-6 text-gray-400">
                                                <PackageIcon className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
                                                <p className="text-xs">No se encontraron insumos</p>
                                            </div>
                                        ) : filteredInsumos.map((insumo) => {
                                            const yaAgregado = carrito.some((i) => i.insumoId === insumo.id);
                                            return (
                                                <div
                                                    key={insumo.id}
                                                    className={`flex items-center justify-between p-2.5 bg-white rounded-lg border transition-colors ${
                                                        yaAgregado ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-900 truncate">{insumo.nombreInsumo}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {insumo.unidadMedida}
                                                            {insumo.precioUnitario ? ` · $${Number(insumo.precioUnitario).toLocaleString('es-CO')}` : ''}
                                                            {insumo.cantidad !== undefined ? ` · Stock: ${insumo.cantidad}` : ''}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => agregarInsumo(insumo)}
                                                        className={`ml-2 shrink-0 h-7 text-xs px-2 ${
                                                            yaAgregado
                                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        {yaAgregado ? '+1' : 'Agregar'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha: Carrito */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
                                <h3 className="font-semibold text-blue-900 text-sm">Carrito de compra</h3>
                            </div>
                            {carrito.length > 0 && (
                                <Badge className="bg-blue-600 text-white text-xs">{carrito.length} ítem(s)</Badge>
                            )}
                        </div>

                        {/* Lista del carrito con scroll */}
                        <div className="flex-1 overflow-y-auto px-5 py-3">
                            {carrito.length === 0 ? (
                                <div className={`text-center py-12 border-2 border-dashed rounded-lg text-gray-400 ${
                                    submitAttempted ? 'border-red-300 bg-red-50' : 'border-blue-100'
                                }`}>
                                    <ShoppingCart className={`w-10 h-10 mx-auto mb-2 opacity-20 ${submitAttempted ? 'text-red-400' : ''}`} />
                                    <p className="text-sm">Agrega insumos desde la sección de la izquierda</p>
                                </div>
                            ) : (
                                <div className="border border-blue-100 rounded-lg overflow-hidden">
                                    <div className="divide-y divide-blue-50">
                                        {carrito.map((item) => {
                                            const itemErr = carritoErrors[item.insumoId];
                                            return (
                                                <div key={item.insumoId} className={`p-3 ${itemErr ? 'bg-red-50' : 'hover:bg-blue-50'}`}>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-blue-900 truncate flex-1 mr-2">{item.nombre}</p>
                                                            <button
                                                                onClick={() => eliminarDelCarrito(item.insumoId)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                                                                title="Quitar del carrito"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-400">{item.unidad}</p>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            {/* Cantidad */}
                                                            <div className="flex flex-col items-center">
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        size="sm" variant="outline"
                                                                        onClick={() => actualizarCantidad(item.insumoId, item.cantidad - 1)}
                                                                        disabled={item.cantidad <= 1}
                                                                        className="w-6 h-6 p-0 border-blue-200 text-blue-900 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                                    >-</Button>
                                                                    <Input
                                                                        type="text"
                                                                        inputMode="numeric"
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
                                                                                setCarritoErrors(prev => ({
                                                                                    ...prev,
                                                                                    [item.insumoId]: { ...prev[item.insumoId], cantidad: 'La cantidad debe ser mínimo 1.' },
                                                                                }));
                                                                            } else {
                                                                                actualizarCantidad(item.insumoId, parsed);
                                                                            }
                                                                            setCantidadInputs(prev => {
                                                                                const n = { ...prev };
                                                                                delete n[item.insumoId];
                                                                                return n;
                                                                            });
                                                                        }}
                                                                        className={`w-12 h-6 text-center text-xs font-bold text-blue-900 px-1 border-blue-200 ${
                                                                            getCantidadDisplay(item.insumoId, item.cantidad) === '' || item.cantidad <= 0
                                                                                ? 'border-red-400' : ''
                                                                        }`}
                                                                    />
                                                                    <Button
                                                                        size="sm" variant="outline"
                                                                        onClick={() => actualizarCantidad(item.insumoId, item.cantidad + 1)}
                                                                        disabled={item.cantidad >= CANTIDAD_MAX}
                                                                        className="w-6 h-6 p-0 border-blue-200 text-blue-900 font-bold text-xs"
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
                                                                        className={`w-24 h-6 text-xs text-right ${itemErr?.precio ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                                                                    />
                                                                </div>
                                                                <FieldError message={itemErr?.precio} />
                                                            </div>
                                                            {/* Subtotal ítem */}
                                                            {item.precio > 0 && !itemErr && (
                                                                <span className="text-xs font-semibold text-blue-600">
                                                                    = ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Totales fijos al fondo */}
                        {subtotalCarrito > 0 && !carritoTieneErrores && (
                            <div className="border-t border-blue-100 bg-blue-50 px-5 py-3 space-y-1 text-sm shrink-0">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${subtotalCarrito.toLocaleString('es-CO', { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>IVA ({ivaRate}%)</span>
                                    <span>${ivaCarrito.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between items-center bg-blue-900 rounded-md px-3 py-2 mt-1">
                                    <span className="text-white font-semibold text-sm">Total con IVA</span>
                                    <span className="text-white font-bold">
                                        ${totalCarrito.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer fijo */}
                <div className="flex justify-end gap-2 px-6 py-3 border-t bg-white shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {editingCompra ? 'Actualizar compra' : 'Registrar compra'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
