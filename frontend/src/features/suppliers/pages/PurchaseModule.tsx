import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    PlusIcon, SearchIcon, ShoppingCartIcon, EyeIcon,
    Trash2, FileDown, CalendarIcon, ChevronLeft, ChevronRight,
    Loader2, PackageIcon, TruckIcon, CheckCircleIcon, ClockIcon,
    CheckCircle2, Info, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import {
    getCompras,
    getCompraById,
    createCompra,
    cambiarEstadoCompra,
    deleteCompra,
    getProveedores,
    getInsumos,
} from '../../sales/services/comprasService';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Proveedor {
    id: number;
    nombreEmpresa: string;
    personaContacto: string;
    telefono: string;
    email: string;
    estado?: string;
}

interface Insumo {
    id: number;
    nombreInsumo: string;
    codigoInsumo?: string;
    unidadMedida: string;
    precioUnitario?: number;
    stock?: number;
}

interface DetalleCompra {
    id?: number;
    insumosId: number;
    cantidad: number;
    precioUnitario: number;
    insumo?: Insumo;
}

interface Compra {
    id: number;
    proveedoresId: number;
    fecha: string;
    metodoPago: string;
    estado: 'pendiente' | 'en transito' | 'completada';
    proveedor?: Proveedor;
    detalles?: DetalleCompra[];
}

interface ItemCarrito {
    insumoId: number;
    nombre: string;
    codigo: string;
    precio: number;
    cantidad: number;
    unidad: string;
}

// ── Tipos de errores del formulario ───────────────────────────────────────────
interface CompraFormErrors {
    proveedoresId?: string;
    fecha?: string;
}

// ── Validación del formulario ─────────────────────────────────────────────────
function validateCompraForm(form: {
    proveedoresId: string;
    fecha: string;
    metodoPago: string;
    estado: string;
    notas: string;
    numeroFactura: string;
}): CompraFormErrors {
    const errors: CompraFormErrors = {};
    if (!form.proveedoresId) errors.proveedoresId = 'Selecciona un proveedor';
    if (!form.fecha) errors.fecha = 'La fecha es obligatoria';
    return errors;
}

// ── Mensaje de error bajo campo ───────────────────────────────────────────────
const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {message}
        </p>
    ) : null;

// ── Banner informativo azul ───────────────────────────────────────────────────
const InfoAlert = ({ message }: { message: string }) => (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
        <Info className="w-4 h-4 shrink-0 text-blue-500" />
        <span>{message}</span>
    </div>
);

// ── Bloqueo de teclas: solo enteros positivos ─────────────────────────────────
const blockNonInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!allowed.includes(e.key) && !/\d/.test(e.key)) e.preventDefault();
};

// ── Bloqueo: solo letras y caracteres no numéricos ────────────────────────────
const blockDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^\d$/.test(e.key)) e.preventDefault();
};

// ── Helper estado badge ───────────────────────────────────────────────────────
const EstadoBadge = ({ estado }: { estado: string }) => {
    const config: Record<string, { icon: React.ReactNode; clase: string }> = {
        'pendiente':   { icon: <ClockIcon className="w-3 h-3 mr-1" />,       clase: 'bg-blue-50 text-blue-700 border border-blue-200' },
        'en transito': { icon: <TruckIcon className="w-3 h-3 mr-1" />,       clase: 'bg-blue-100 text-blue-800 border border-blue-300' },
        'completada':  { icon: <CheckCircleIcon className="w-3 h-3 mr-1" />, clase: 'bg-blue-900 text-white border border-blue-900' },
    };
    const { icon, clase } = config[estado] ?? { icon: null, clase: 'bg-gray-100 text-gray-600' };
    return (
        <Badge className={`flex items-center ${clase}`}>
            {icon}{estado.charAt(0).toUpperCase() + estado.slice(1)}
        </Badge>
    );
};

// ── Formulario de compra ──────────────────────────────────────────────────────
interface CompraFormProps {
    proveedores: Proveedor[];
    form: {
        proveedoresId: string;
        fecha: string;
        metodoPago: string;
        estado: string;
        notas: string;
        numeroFactura: string;
    };
    onChange: (field: string, value: string) => void;
    errors: CompraFormErrors;
    touched: Partial<Record<string, boolean>>;
    onBlur: (field: string) => void;
}

const CompraForm = ({ proveedores, form, onChange, errors, touched, onBlur }: CompraFormProps) => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label>Proveedor <span className="text-red-500">*</span></Label>
            <Select
                value={form.proveedoresId}
                onValueChange={(v) => { onChange('proveedoresId', v); onBlur('proveedoresId'); }}
            >
                <SelectTrigger className={touched.proveedoresId && errors.proveedoresId ? 'border-red-400' : ''}>
                    <SelectValue placeholder="Seleccionar proveedor..." />
                </SelectTrigger>
                <SelectContent>
                    {proveedores.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                            {p.nombreEmpresa}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FieldError message={touched.proveedoresId ? errors.proveedoresId : undefined} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>N° Factura (opcional)</Label>
                <Input
                    type="number"
                    placeholder="Ej: 1001"
                    value={form.numeroFactura}
                    onChange={(e) => onChange('numeroFactura', e.target.value)}
                    onKeyDown={blockNonInteger}
                    min="1"
                />
            </div>
            <div className="space-y-2">
                <Label>Fecha <span className="text-red-500">*</span></Label>
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => { onChange('fecha', e.target.value); onBlur('fecha'); }}
                        className={`pl-10 ${touched.fecha && errors.fecha ? 'border-red-400' : ''}`}
                    />
                </div>
                <FieldError message={touched.fecha ? errors.fecha : undefined} />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Método de Pago <span className="text-red-500">*</span></Label>
                <Select value={form.metodoPago} onValueChange={(v) => onChange('metodoPago', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => onChange('estado', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en transito">En tránsito</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
                placeholder="Comentarios adicionales..."
                value={form.notas}
                onChange={(e) => onChange('notas', e.target.value)}
                rows={3}
            />
        </div>
    </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export function PurchaseModule() {
    const [compras, setCompras]         = useState<Compra[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [insumos, setInsumos]         = useState<Insumo[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);

    const [searchTerm, setSearchTerm]   = useState('');
    const [dateFilter, setDateFilter]   = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
    const [viewingCompra, setViewingCompra]         = useState<Compra | null>(null);
    const [showDetailModal, setShowDetailModal]     = useState(false);
    const [loadingDetail, setLoadingDetail]         = useState(false);

    const [supplySearch, setSupplySearch] = useState('');
    const [carrito, setCarrito]           = useState<ItemCarrito[]>([]);

    // ── Errores de precio en el carrito ──────────────────────────────────────
    const [precioErrors, setPrecioErrors] = useState<Record<number, string>>({});

    const emptyForm = {
        proveedoresId: '',
        fecha: new Date().toISOString().split('T')[0],
        metodoPago: 'efectivo',
        estado: 'pendiente',
        notas: '',
        numeroFactura: '',
    };
    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState<CompraFormErrors>({});
    const [touched, setTouched]       = useState<Partial<Record<string, boolean>>>({});

    // ── Feedback banner ───────────────────────────────────────────────────────
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const showFeedback = (msg: string) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

    // ── Cargar datos ──────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [comprasData, proveedoresData, insumosData] = await Promise.all([
                getCompras(),
                getProveedores(),
                getInsumos(),
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

    // Re-validar en tiempo real
    useEffect(() => {
        setFormErrors(validateCompraForm(form));
    }, [form]);

    // ── Formulario ────────────────────────────────────────────────────────────
    const handleFormChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const touchAll = () => {
        setTouched({ proveedoresId: true, fecha: true });
    };

    const resetForm = () => {
        setForm(emptyForm);
        setCarrito([]);
        setSupplySearch('');
        setFormErrors({});
        setTouched({});
        setPrecioErrors({});
    };

    // ── Carrito ───────────────────────────────────────────────────────────────
    const agregarInsumo = (insumo: Insumo) => {
        setCarrito((prev) => {
            const existe = prev.find((i) => i.insumoId === insumo.id);
            if (existe) {
                return prev.map((i) =>
                    i.insumoId === insumo.id ? { ...i, cantidad: i.cantidad + 1 } : i
                );
            }
            return [...prev, {
                insumoId: insumo.id,
                nombre: insumo.nombreInsumo,
                codigo: insumo.codigoInsumo ?? '',
                precio: insumo.precioUnitario ?? 0,
                cantidad: 1,
                unidad: insumo.unidadMedida,
            }];
        });
    };

    const actualizarCantidad = (insumoId: number, cantidad: number) => {
        if (cantidad <= 0) {
            setCarrito((prev) => prev.filter((i) => i.insumoId !== insumoId));
            // Limpiar error de precio si se elimina
            setPrecioErrors((prev) => { const n = { ...prev }; delete n[insumoId]; return n; });
        } else {
            setCarrito((prev) =>
                prev.map((i) => i.insumoId === insumoId ? { ...i, cantidad } : i)
            );
        }
    };

    // Actualizar precio individual con validación
    const actualizarPrecio = (insumoId: number, rawValue: string) => {
        const valor = parseFloat(rawValue);
        // Actualizar en carrito
        setCarrito((prev) =>
            prev.map((i) => i.insumoId === insumoId ? { ...i, precio: isNaN(valor) ? 0 : valor } : i)
        );
        // Validar
        if (rawValue === '' || isNaN(valor) || valor <= 0) {
            setPrecioErrors((prev) => ({ ...prev, [insumoId]: 'El precio debe ser mayor a 0' }));
        } else {
            setPrecioErrors((prev) => { const n = { ...prev }; delete n[insumoId]; return n; });
        }
    };

    const totalCarrito = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

    // Verificar si el carrito tiene errores de precio
    const carritoTienePreciosInvalidos = carrito.some((i) => i.precio <= 0);

    // ── Crear compra ──────────────────────────────────────────────────────────
    const handleCreateCompra = async () => {
        touchAll();
        const errors = validateCompraForm(form);

        if (Object.keys(errors).length > 0) {
            toast.error('Completa los campos obligatorios');
            return;
        }
        if (carrito.length === 0) {
            toast.error('Agrega al menos un insumo al carrito');
            return;
        }
        if (carritoTienePreciosInvalidos) {
            toast.error('Todos los insumos en el carrito deben tener un precio mayor a 0');
            return;
        }

        try {
            setSaving(true);
            await createCompra({
                ...(form.numeroFactura ? { id: parseInt(form.numeroFactura) } : {}),
                proveedoresId: parseInt(form.proveedoresId),
                fecha: form.fecha,
                metodoPago: form.metodoPago as 'efectivo' | 'transferencia',
                estado: form.estado as 'pendiente' | 'en transito' | 'completada',
            });
            showFeedback('✓ Compra registrada exitosamente');
            toast.success('Compra creada exitosamente');
            setIsNewPurchaseOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(`Error al crear compra: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Cambiar estado ────────────────────────────────────────────────────────
    const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
        try {
            await cambiarEstadoCompra(id, nuevoEstado);
            showFeedback(`✓ Estado actualizado a "${nuevoEstado}"`);
            toast.success(`Estado actualizado a "${nuevoEstado}"`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // ── Eliminar ──────────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta compra? Solo se pueden eliminar compras pendientes.')) return;
        try {
            await deleteCompra(id);
            showFeedback('✓ Compra eliminada correctamente');
            toast.success('Compra eliminada correctamente');
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // ── Ver detalle ───────────────────────────────────────────────────────────
    const verDetalle = async (compra: Compra) => {
        setShowDetailModal(true);
        setViewingCompra(null);
        setLoadingDetail(true);
        try {
            const detail = await getCompraById(compra.id);
            setViewingCompra(detail);
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const filteredCompras = compras.filter((c) => {
        const matchesSearch =
            c.proveedor?.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.id.toString().includes(searchTerm);

        let matchesDate = true;
        const today     = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const weekAgo   = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

        if (dateFilter === 'today')     matchesDate = c.fecha.startsWith(today);
        if (dateFilter === 'yesterday') matchesDate = c.fecha.startsWith(yesterday);
        if (dateFilter === 'week')      matchesDate = c.fecha >= weekAgo;

        return matchesSearch && matchesDate;
    });

    const totalPages     = Math.ceil(filteredCompras.length / itemsPerPage);
    const currentCompras = filteredCompras.slice(
        (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
    );

    const filteredInsumos = insumos.filter((i) =>
        i.nombreInsumo.toLowerCase().includes(supplySearch.toLowerCase()) ||
        (i.codigoInsumo ?? '').toLowerCase().includes(supplySearch.toLowerCase())
    );

    // ── Condiciones para poder procesar la compra ────────────────────────────
    const canSubmit =
        Object.keys(validateCompraForm(form)).length === 0 &&
        carrito.length > 0 &&
        !carritoTienePreciosInvalidos;

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">

            {/* ── Feedback Banner ── */}
            {feedbackMsg && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{feedbackMsg}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-blue-900 mb-1">Compras de Insumos</h1>
                    <p className="text-blue-600">Gestión y control de adquisiciones</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsNewPurchaseOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Nueva Compra
                </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-blue-100">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-500">Total compras</p>
                        <p className="text-2xl font-bold text-blue-900">{compras.length}</p>
                    </CardContent>
                </Card>
                <Card className="border border-blue-100">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Pendientes</p>
                        <p className="text-2xl font-bold text-blue-900">
                            {compras.filter(c => c.estado === 'pendiente').length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-blue-100">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Completadas</p>
                        <p className="text-2xl font-bold text-blue-900">
                            {compras.filter(c => c.estado === 'completada').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar por proveedor o N° factura..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filtrar por fecha" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las fechas</SelectItem>
                                <SelectItem value="today">Hoy</SelectItem>
                                <SelectItem value="yesterday">Ayer</SelectItem>
                                <SelectItem value="week">Última semana</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de compras */}
            <Card>
                <CardHeader className="border-b border-blue-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-blue-900">Lista de Compras</CardTitle>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                            {filteredCompras.length} registros
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-500">Cargando compras...</span>
                        </div>
                    ) : currentCompras.length === 0 ? (
                        <div className="text-center py-16">
                            <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No se encontraron compras</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-blue-50">
                            {currentCompras.map((compra) => (
                                <div key={compra.id} className="p-5 hover:bg-blue-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="font-mono font-bold text-blue-900 text-lg">
                                                    #{compra.id}
                                                </span>
                                                <EstadoBadge estado={compra.estado} />
                                                <span className="text-sm text-gray-400">
                                                    {new Date(compra.fecha).toLocaleDateString('es-CO')}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Proveedor</p>
                                                    <p className="text-gray-900 font-medium">
                                                        {compra.proveedor?.nombreEmpresa ?? `ID #${compra.proveedoresId}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{compra.proveedor?.telefono}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Insumos</p>
                                                    {compra.detalles && compra.detalles.length > 0 ? (
                                                        <>
                                                            {compra.detalles.slice(0, 2).map((d, i) => (
                                                                <p key={i} className="text-sm text-gray-700">
                                                                    {d.cantidad}x {d.insumo?.nombreInsumo}
                                                                </p>
                                                            ))}
                                                            {compra.detalles.length > 2 && (
                                                                <p className="text-xs text-gray-400">
                                                                    +{compra.detalles.length - 2} más
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">Sin detalles</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pago</p>
                                                    <p className="text-gray-900 capitalize">{compra.metodoPago}</p>
                                                    {compra.estado !== 'completada' && (
                                                        <button
                                                            onClick={() => handleCambiarEstado(
                                                                compra.id,
                                                                compra.estado === 'pendiente' ? 'en transito' : 'completada'
                                                            )}
                                                            className="text-xs text-blue-600 hover:underline mt-1"
                                                        >
                                                            → Avanzar estado
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <Button variant="outline" size="sm"
                                                onClick={() => verDetalle(compra)}
                                                className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                                <EyeIcon className="w-4 h-4" />
                                            </Button>
                                            {compra.estado === 'pendiente' && (
                                                <Button variant="outline" size="sm"
                                                    onClick={() => handleDelete(compra.id)}
                                                    className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="border-t border-blue-100 px-6 py-4 flex justify-center items-center gap-2">
                            <Button variant="outline" size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button key={page} size="sm"
                                    variant={currentPage === page ? 'default' : 'ghost'}
                                    onClick={() => setCurrentPage(page)}
                                    className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                                    {page}
                                </Button>
                            ))}
                            <Button variant="outline" size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ════ MODAL — NUEVA COMPRA ════ */}
            <Dialog open={isNewPurchaseOpen} onOpenChange={(open) => { if (!open) { resetForm(); setIsNewPurchaseOpen(false); } }}>
                <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-blue-900">Nueva Compra de Insumos</DialogTitle>
                        <DialogDescription>Completa el formulario para registrar una nueva compra</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">

                        {/* ── Paso 1: Datos de la compra ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                                <h3 className="font-semibold text-blue-900">Datos de la Compra</h3>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                {/* Alerta si hay errores tocados en el formulario */}
                                {Object.keys(touched).length > 0 && Object.keys(formErrors).length > 0 && (
                                    <div className="mb-4">
                                        <InfoAlert message="Completa los campos obligatorios antes de procesar la compra." />
                                    </div>
                                )}
                                <CompraForm
                                    proveedores={proveedores}
                                    form={form}
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    touched={touched}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>

                        {/* ── Paso 2: Seleccionar insumos ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                                <h3 className="font-semibold text-blue-900">Seleccionar Insumos</h3>
                            </div>
                            <div className="border border-blue-100 rounded-lg p-4 space-y-3">
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Buscar insumo por nombre o código..."
                                        value={supplySearch}
                                        onChange={(e) => setSupplySearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="overflow-y-auto max-h-52 space-y-2 pr-1">
                                    {filteredInsumos.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <PackageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No hay insumos disponibles</p>
                                        </div>
                                    ) : filteredInsumos.map((insumo) => (
                                        <div key={insumo.id}
                                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{insumo.nombreInsumo}</p>
                                                <p className="text-xs text-gray-400">
                                                    {insumo.codigoInsumo} • {insumo.unidadMedida}
                                                    {insumo.precioUnitario ? ` • $${Number(insumo.precioUnitario).toLocaleString()}` : ''}
                                                </p>
                                            </div>
                                            <Button size="sm" onClick={() => agregarInsumo(insumo)}
                                                className="ml-3 bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                                                <PlusIcon className="w-3 h-3 mr-1" /> Agregar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Paso 3: Carrito ── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold">3</span>
                                    <h3 className="font-semibold text-blue-900">Carrito de Compra</h3>
                                </div>
                                {carrito.length > 0 && (
                                    <Badge className="bg-blue-600 text-white">
                                        {carrito.reduce((s, i) => s + i.cantidad, 0)} items
                                    </Badge>
                                )}
                            </div>

                            {/* Advertencia de precios inválidos */}
                            {carritoTienePreciosInvalidos && (
                                <div className="mb-3">
                                    <InfoAlert message="Uno o más insumos tienen precio 0 o sin definir. Establece un precio mayor a 0 para poder procesar la compra." />
                                </div>
                            )}

                            {carrito.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-blue-100 rounded-lg text-gray-400">
                                    <ShoppingCartIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Agrega insumos desde el paso 2</p>
                                </div>
                            ) : (
                                <div className="border border-blue-100 rounded-lg overflow-hidden">
                                    <div className="divide-y divide-blue-50">
                                        {carrito.map((item) => (
                                            <div key={item.insumoId} className="p-3 hover:bg-blue-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-blue-900 truncate">{item.nombre}</p>
                                                        <p className="text-xs text-gray-400">{item.unidad}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-3 flex-wrap justify-end">
                                                        {/* Cantidad */}
                                                        <div className="flex items-center gap-1">
                                                            <Button size="sm" variant="outline"
                                                                onClick={() => actualizarCantidad(item.insumoId, item.cantidad - 1)}
                                                                className="w-7 h-7 p-0 border-blue-200 text-blue-900 font-bold">-</Button>
                                                            <span className="w-8 text-center text-sm font-bold text-blue-900">{item.cantidad}</span>
                                                            <Button size="sm" variant="outline"
                                                                onClick={() => actualizarCantidad(item.insumoId, item.cantidad + 1)}
                                                                className="w-7 h-7 p-0 border-blue-200 text-blue-900 font-bold">+</Button>
                                                        </div>
                                                        {/* Precio editable */}
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-gray-400">$</span>
                                                                <Input
                                                                    type="number"
                                                                    value={item.precio === 0 ? '' : item.precio}
                                                                    onChange={(e) => actualizarPrecio(item.insumoId, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                                                                        if (!allowed.includes(e.key) && !/[\d.]/.test(e.key)) e.preventDefault();
                                                                    }}
                                                                    placeholder="Precio"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    className={`w-24 h-7 text-xs text-right ${precioErrors[item.insumoId] ? 'border-red-400' : ''}`}
                                                                />
                                                            </div>
                                                            {precioErrors[item.insumoId] && (
                                                                <p className="text-red-500 text-xs mt-0.5">{precioErrors[item.insumoId]}</p>
                                                            )}
                                                        </div>
                                                        {/* Total ítem */}
                                                        {item.precio > 0 && (
                                                            <span className="text-xs font-semibold text-blue-600 w-20 text-right">
                                                                ${(item.precio * item.cantidad).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {totalCarrito > 0 && (
                                        <div className="bg-blue-900 px-4 py-3 flex justify-between items-center">
                                            <span className="text-white font-semibold">Total estimado</span>
                                            <span className="text-white font-bold text-lg">${totalCarrito.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4 pt-4 border-t border-blue-100 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => { resetForm(); setIsNewPurchaseOpen(false); }}
                            className="flex-1 border-blue-900 text-blue-900 hover:bg-blue-50"
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateCompra}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            🛒 Procesar Compra
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ════ MODAL — DETALLE ════ */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-blue-900">Detalle de Compra</DialogTitle>
                        <DialogDescription>Información completa de la compra seleccionada</DialogDescription>
                    </DialogHeader>

                    {loadingDetail ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : viewingCompra ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">N° Factura</p>
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
                                        {new Date(viewingCompra.fecha).toLocaleDateString('es-CO')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Método de Pago</p>
                                    <p className="capitalize font-semibold">{viewingCompra.metodoPago}</p>
                                </div>
                            </div>

                            {viewingCompra.detalles && viewingCompra.detalles.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        Insumos ({viewingCompra.detalles.length})
                                    </p>
                                    <div className="divide-y rounded-lg border overflow-hidden">
                                        {viewingCompra.detalles.map((d, i) => (
                                            <div key={i} className="flex justify-between items-center px-4 py-3 bg-white hover:bg-blue-50">
                                                <div>
                                                    <p className="font-medium text-gray-900">{d.insumo?.nombreInsumo}</p>
                                                    <p className="text-xs text-gray-500">{d.insumo?.unidadMedida}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-blue-900">
                                                        {d.cantidad} x ${Number(d.precioUnitario).toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        = ${(d.cantidad * d.precioUnitario).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDetailModal(false)}
                                    className="flex-1 border-blue-900 text-blue-900"
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => toast.info('Función de PDF próximamente')}
                                >
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Descargar PDF
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}