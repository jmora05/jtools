import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import {
    Plus, Search, Eye, Edit, AlertTriangle,
    ChevronLeft, ChevronRight, ClipboardList,
    CheckCircle, Play, Pause, XCircle, Clock,
    Package, RefreshCw, ShoppingCart, Truck,
    Loader2, CheckCircle2, Lock, X, Trash2,
} from 'lucide-react';
import {
    getOrdenesProduccion, createOrdenProduccion, updateOrdenProduccion,
    anularOrdenProduccion, type OrdenProduccion, type EstadoOrden, type TipoOrden,
} from '../services/ordenesproduccionservice';
import { getEmpleados, type Empleado } from '../../employed/services/empleadosService';
import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';
import {
    validarCrearOrden, validarEditarOrden, validarAnulacion,
    validarCampoCrear, validarCampoEditar, validarCampoAnulacion,
    hayErrores, estadosPermitidos,
    filtrarTextoLibre, filtrarSoloEnteros, filtrarMotivo, contadorTexto,
    type FormCreate, type FormEdit, type CreateErrors, type EditErrors, type AnularErrors,
} from '../utils/ordenesProduccionValidations';

// ─── Tipos locales ─────────────────────────────────────────────────────────────
type Producto = { id: number; nombreProducto: string; referencia: string };

const EMPTY_CREATE: FormCreate = {
    tipoOrden: '',
    productoId: '',
    cantidad: '',
    responsableId: '',
    fechaEntrega: '',
};

const ESTADOS: EstadoOrden[] = ['Pendiente', 'En Proceso', 'Pausada', 'Finalizada', 'Anulada'];

const selectCls = (hasError?: boolean) =>
    `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-[#f3f3f5] h-9 ${
        hasError ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'
    }`;

// ─── Badge de estado ──────────────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: EstadoOrden | string }) {
    const map: Record<string, React.ReactNode> = {
        Pendiente:    <Badge className="bg-blue-100 text-black-600 "><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>,
        'En Proceso': <Badge className="bg-blue-100 text-black-600 "><Play className="w-3 h-3 mr-1" />En Proceso</Badge>,
        Pausada:      <Badge className="bg-blue-100 text-black-600 "><Pause className="w-3 h-3 mr-1" />Pausada</Badge>,
        Finalizada:   <Badge className="bg-blue-100 text-black-600 "><CheckCircle className="w-3 h-3 mr-1" />Finalizada</Badge>,
        Anulada:      <Badge className="bg-blue-100 text-black-600 "><XCircle className="w-3 h-3 mr-1" />Anulada</Badge>,
    };
    return <>{map[estado] ?? <Badge>{estado}</Badge>}</>;
}

// ─── Badge de tipo de orden ───────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo?: TipoOrden | null }) {
    if (!tipo) return <span className="text-gray-400 text-xs">—</span>;
    if (tipo === 'Pedido') {
        return (
            <Badge className="bg-blue-50 text-black-600">
                <ShoppingCart className="w-3 h-3" />Pedido
            </Badge>
        );
    }
    return (
        <Badge className="bg-blue-50 text-black-600">
            <Truck className="w-3 h-3" />Venta
        </Badge>
    );
}

// ─── FieldError ───────────────────────────────────────────────────────────────
function FieldError({ mensaje }: { mensaje?: string }) {
    if (!mensaje) return null;
    return (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {mensaje}
        </p>
    );
}

// ─── CharCounter ──────────────────────────────────────────────────────────────
function CharCounter({ valor, limite }: { valor: string; limite: number }) {
    const c = contadorTexto(valor, limite);
    if (c.actual === 0) return null;
    return (
        <span className={`text-xs ml-auto ${c.excedido ? 'text-red-500 font-medium' : c.enPeligro ? 'text-amber-500' : 'text-gray-400'}`}>
            {c.actual}/{c.limite}
        </span>
    );
}

// ─── InactiveAlert ────────────────────────────────────────────────────────────
function InactiveAlert({ mensaje, onClose }: { mensaje: string; onClose: () => void }) {
    return (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg px-4 py-3">
            <Lock className="w-4 h-4 shrink-0 text-gray-500" />
            <span className="flex-1">{mensaje}</span>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export function ProductionOrderModule() {
    const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal]     = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAnularDialog, setShowAnularDialog] = useState(false);

    // ── Confirmación de finalizar ──────────────────────────────────────────
    const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
    const [ordenToFinalizar, setOrdenToFinalizar] = useState<OrdenProduccion | null>(null);
    const [finalizarSaving, setFinalizarSaving] = useState(false);

    const [selectedOrden, setSelectedOrden] = useState<OrdenProduccion | null>(null);
    const [ordenToAnular, setOrdenToAnular] = useState<OrdenProduccion | null>(null);

    const [createForm, setCreateForm] = useState<FormCreate>(EMPTY_CREATE);
    const [editForm, setEditForm]     = useState<FormEdit>({ responsableId: '', fechaEntrega: '', nota: '', estado: 'Pendiente' });
    const [motivoAnulacion, setMotivoAnulacion] = useState('');

    const [createErrors, setCreateErrors] = useState<CreateErrors>({});
    const [editErrors, setEditErrors]     = useState<EditErrors>({});
    const [anularErrors, setAnularErrors] = useState<AnularErrors>({});
    const [createTouched, setCreateTouched] = useState<Partial<Record<keyof FormCreate, boolean>>>({});
    const [editTouched, setEditTouched]     = useState<Partial<Record<keyof FormEdit, boolean>>>({});
    const [anularTouched, setAnularTouched] = useState(false);

    const [searchTerm, setSearchTerm]    = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [currentPage, setCurrentPage]  = useState(1);
    const itemsPerPage = 5;

    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const showFeedback = (msg: string) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

    const [lockedAlert, setLockedAlert] = useState<string | null>(null);
    const showLockedAlert = (msg: string) => {
        setLockedAlert(msg);
        setTimeout(() => setLockedAlert(null), 5000);
    };

    const today = new Date().toISOString().split('T')[0];

    // ── Carga de datos ──────────────────────────────────────────────────────
    const fetchOrdenes = useCallback(async () => {
        setLoading(true);
        try { setOrdenes(await getOrdenesProduccion()); }
        catch (err: any) { toast.error('Error al cargar órdenes: ' + (err?.message ?? 'Error desconocido')); }
        finally { setLoading(false); }
    }, []);

    const fetchProductos = useCallback(async () => {
        try {
            const BASE = getApiBaseUrl();
            const res = await fetch(`${BASE}/productos`, { headers: buildAuthHeaders() });
            setProductos(await handleResponse<Producto[]>(res));
        } catch { /* silencioso */ }
    }, []);

    const fetchEmpleados = useCallback(async () => {
        try {
            const data = await getEmpleados();
            setEmpleados(data.filter(e => e.estado === 'activo'));
        } catch { /* silencioso */ }
    }, []);

    useEffect(() => {
        fetchOrdenes(); fetchProductos(); fetchEmpleados();
    }, [fetchOrdenes, fetchProductos, fetchEmpleados]);

    // ── Helpers de campo con validación en tiempo real ──────────────────────
    function setCreateField<K extends keyof FormCreate>(campo: K, valor: string) {
        let valorFiltrado = valor;
        if (campo === 'cantidad') valorFiltrado = filtrarSoloEnteros(valor);

        const nuevoForm = { ...createForm, [campo]: valorFiltrado };
        setCreateForm(nuevoForm);

        if (createTouched[campo]) {
            const err = validarCampoCrear(campo, valorFiltrado, nuevoForm);
            setCreateErrors(prev => ({ ...prev, [campo]: err }));
        }
    }

    function touchCreateField(campo: keyof FormCreate) {
        setCreateTouched(prev => ({ ...prev, [campo]: true }));
        const err = validarCampoCrear(campo, createForm[campo] as string, createForm);
        setCreateErrors(prev => ({ ...prev, [campo]: err }));
    }

    function setEditField<K extends keyof FormEdit>(campo: K, valor: string) {
        let valorFiltrado = valor;
        if (campo === 'nota') valorFiltrado = filtrarTextoLibre(valor);

        const nuevoForm = { ...editForm, [campo]: valorFiltrado };
        setEditForm(nuevoForm as FormEdit);

        if (editTouched[campo]) {
            const estadoActual = selectedOrden?.estado ?? 'Pendiente';
            const err = validarCampoEditar(campo, valorFiltrado, estadoActual);
            setEditErrors(prev => ({ ...prev, [campo]: err }));
        }
    }

    function touchEditField(campo: keyof FormEdit) {
        setEditTouched(prev => ({ ...prev, [campo]: true }));
        const estadoActual = selectedOrden?.estado ?? 'Pendiente';
        const err = validarCampoEditar(campo, editForm[campo] as string, estadoActual);
        setEditErrors(prev => ({ ...prev, [campo]: err }));
    }

    // ── Filtrado y paginación ───────────────────────────────────────────────
    const filtered = ordenes.filter(o => {
        const search = searchTerm.toLowerCase();
        const matchSearch =
            (o.codigoOrden ?? '').toLowerCase().includes(search) ||
            (o.producto?.nombreProducto ?? '').toLowerCase().includes(search) ||
            (o.producto?.referencia ?? '').toLowerCase().includes(search);
        const matchEstado = filterEstado === 'all' || o.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    const sorted = [...filtered].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );

    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const paginated  = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ── Helpers reset ───────────────────────────────────────────────────────
    const resetCreate = () => {
        setCreateForm(EMPTY_CREATE);
        setCreateErrors({});
        setCreateTouched({});
    };

    const resetEdit = () => {
        setSelectedOrden(null);
        setEditErrors({});
        setEditTouched({});
    };

    const resetAnular = () => {
        setOrdenToAnular(null);
        setMotivoAnulacion('');
        setAnularErrors({});
        setAnularTouched(false);
    };

    // ── Crear ───────────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const allTouched: Partial<Record<keyof FormCreate, boolean>> = {};
        (Object.keys(EMPTY_CREATE) as (keyof FormCreate)[]).forEach(k => { allTouched[k] = true; });
        setCreateTouched(allTouched);

        const errores = validarCrearOrden(createForm);
        setCreateErrors(errores);
        if (hayErrores(errores)) {
            toast.error('Corrige los errores antes de continuar');
            return;
        }
        setSaving(true);
        try {
            const res = await createOrdenProduccion({
                tipoOrden:     createForm.tipoOrden as TipoOrden,
                productoId:    parseInt(createForm.productoId),
                cantidad:      parseInt(createForm.cantidad),
                responsableId: parseInt(createForm.responsableId),
                fechaEntrega:  createForm.fechaEntrega,
            });
            showFeedback(`✓ Orden ${res.orden.codigoOrden} creada exitosamente`);
            toast.success(`Orden ${res.orden.codigoOrden} creada exitosamente`);
            setShowCreateModal(false);
            resetCreate();
            fetchOrdenes();
        } catch (err: any) {
            toast.error('Error al crear: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ── Actualizar ──────────────────────────────────────────────────────────
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrden?.id) return;

        const allTouched: Partial<Record<keyof FormEdit, boolean>> = {};
        (['responsableId', 'fechaEntrega', 'nota', 'estado'] as (keyof FormEdit)[]).forEach(k => { allTouched[k] = true; });
        setEditTouched(allTouched);

        const estadoActual = selectedOrden.estado ?? 'Pendiente';
        const errores = validarEditarOrden(editForm, estadoActual);
        setEditErrors(errores);
        if (hayErrores(errores)) {
            toast.error('Corrige los errores antes de continuar');
            return;
        }
        setSaving(true);
        try {
            await updateOrdenProduccion(selectedOrden.id, {
                responsableId: parseInt(editForm.responsableId),
                fechaEntrega:  editForm.fechaEntrega,
                nota:          editForm.nota || undefined,
                estado:        editForm.estado,
            });
            showFeedback('✓ Orden actualizada correctamente');
            toast.success('Orden actualizada correctamente');
            setShowEditModal(false);
            resetEdit();
            fetchOrdenes();
        } catch (err: any) {
            toast.error('Error al actualizar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ── Anular ──────────────────────────────────────────────────────────────
    const handleAnular = async () => {
        if (!ordenToAnular?.id) return;
        setAnularTouched(true);
        const errores = validarAnulacion(motivoAnulacion);
        setAnularErrors(errores);
        if (hayErrores(errores)) return;

        setSaving(true);
        try {
            await anularOrdenProduccion(ordenToAnular.id, motivoAnulacion);
            toast.success('Orden anulada correctamente');
            setShowAnularDialog(false);
            resetAnular();
            fetchOrdenes();
        } catch (err: any) {
            toast.error('Error al anular: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ── Confirmar finalizar ─────────────────────────────────────────────────
    const handleConfirmarFinalizar = async () => {
        if (!ordenToFinalizar?.id) return;
        setFinalizarSaving(true);
        try {
            await updateOrdenProduccion(ordenToFinalizar.id, { estado: 'Finalizada' });
            showFeedback(`✓ Orden ${ordenToFinalizar.codigoOrden} finalizada correctamente`);
            toast.success('Orden finalizada correctamente');
            setShowFinalizarDialog(false);
            setOrdenToFinalizar(null);
            fetchOrdenes();
        } catch (err: any) {
            toast.error('Error al finalizar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setFinalizarSaving(false);
        }
    };

    // ── Cambio rápido de estado ─────────────────────────────────────────────
    const handleEstadoDirecto = async (id: number | undefined, nuevoEstado: EstadoOrden) => {
        if (!id) return;
        const orden = ordenes.find(o => o.id === id);
        if (!orden) return;

        const estadoActual = orden.estado ?? 'Pendiente';
        const permitidos = estadosPermitidos(estadoActual);

        if (!permitidos.includes(nuevoEstado)) {
            toast.error(`No se puede cambiar de "${estadoActual}" a "${nuevoEstado}"`);
            return;
        }

        // Interceptar "Finalizada" para pedir confirmación
        if (nuevoEstado === 'Finalizada') {
            setOrdenToFinalizar(orden);
            setShowFinalizarDialog(true);
            return;
        }

        try {
            await updateOrdenProduccion(id, { estado: nuevoEstado });
            toast.success(`Estado cambiado a ${nuevoEstado}`);
            fetchOrdenes();
        } catch (err: any) {
            toast.error('Error al cambiar estado: ' + (err?.message ?? 'Error desconocido'));
        }
    };

    // ── Abrir edición ───────────────────────────────────────────────────────
    const openEdit = (o: OrdenProduccion) => {
        setSelectedOrden(o);
        setEditErrors({});
        setEditTouched({});
        setEditForm({
            responsableId: String(o.responsableId ?? ''),
            fechaEntrega:  o.fechaEntrega,
            nota:          o.nota ?? '',
            estado:        o.estado ?? 'Pendiente',
        });
        setShowEditModal(true);
    };

    // ── Helper: orden bloqueada ────────────────────────────────────────────
    const isOrdenBloqueada = (orden: OrdenProduccion) =>
        orden.estado === 'Finalizada' || orden.estado === 'Anulada';

    const mensajeBloqueada = (orden: OrdenProduccion, accion: string) => {
        const estado = orden.estado === 'Finalizada' ? 'finalizada' : 'anulada';
        return `Orden ${estado}: No puedes ${accion} una orden ${estado}.`;
    };

    // ══════════════════════════════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════════════════════════════
    return (
        <div className="p-6 space-y-6">

            {/* Feedback Banner */}
            {feedbackMsg && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{feedbackMsg}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Órdenes de Producción</h1>
                    <p className="text-blue-800">Gestiona las órdenes de fabricación</p>
                </div>
                <Button
                    onClick={() => { resetCreate(); setShowCreateModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Registrar Orden
                </Button>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar por código, producto..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 w-full"
                            />
                        </div>
                        <select
                            value={filterEstado}
                            onChange={e => { setFilterEstado(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-40"
                        >
                            <option value="all">Todos</option>
                            {ESTADOS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Alerta de orden bloqueada */}
            {lockedAlert && (
                <InactiveAlert mensaje={lockedAlert} onClose={() => setLockedAlert(null)} />
            )}

            {/* Tabla */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando órdenes...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Código</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Producto</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Cantidad</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Tipo</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-500">
                                                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p>No se encontraron órdenes de producción</p>
                                            </td>
                                        </tr>
                                    ) : paginated.map(orden => {
                                        const bloqueada = isOrdenBloqueada(orden);
                                        return (
                                            <tr key={orden.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <ClipboardList className={`w-4 h-4 shrink-0 ${bloqueada ? 'text-gray-300' : 'text-blue-600'}`} />
                                                        <span className={`text-sm font-semibold ${bloqueada ? 'text-gray-400' : 'text-black-600'}`}>{orden.codigoOrden}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className={`font-semibold ${bloqueada ? 'text-gray-300' : 'text-gray-900'}`}>{orden.producto?.nombreProducto ?? 'Sin producto'}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge variant="secondary" className={`${bloqueada ? 'opacity-50' : 'bg-blue-50 text-black-600'}`}>
                                                        {orden.cantidad ?? '—'} uds.
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <TipoBadge tipo={orden.tipoOrden} />
                                                </td>
                                                <td className="py-4 px-6">
                                                    {bloqueada ? (
                                                        <StatusBadge estado={orden.estado ?? 'Pendiente'} />
                                                    ) : (
                                                        <select
                                                            value={orden.estado}
                                                            onChange={e => handleEstadoDirecto(orden.id, e.target.value as EstadoOrden)}
                                                            className="border border-gray-200 rounded-md px-2 py-1 text-sm text-black-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                        >
                                                            {[orden.estado ?? 'Pendiente', ...estadosPermitidos(orden.estado ?? 'Pendiente')]
                                                                .filter((v, i, arr) => arr.indexOf(v) === i)
                                                                .filter(e => e !== 'Anulada')
                                                                .map(estado => (
                                                                    <option key={estado} value={estado}>{estado}</option>
                                                                ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-2">
                                                        <Button size="sm"
                                                            onClick={() => { setSelectedOrden(orden); setShowDetailModal(true); }}
                                                            className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm"
                                                            onClick={() => {
                                                                if (bloqueada) { showLockedAlert(mensajeBloqueada(orden, 'editar')); return; }
                                                                openEdit(orden);
                                                            }}
                                                            className={`border transition-colors ${
                                                                bloqueada
                                                                    ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed hover:bg-white'
                                                                    : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                            }`}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm"
                                                            onClick={() => {
                                                                if (bloqueada) { showLockedAlert(mensajeBloqueada(orden, 'anular')); return; }
                                                                setOrdenToAnular(orden);
                                                                setShowAnularDialog(true);
                                                            }}
                                                            className={`border transition-colors ${
                                                                bloqueada
                                                                    ? 'bg-white text-gray-300 cursor-not-allowed hover:bg-white'
                                                                    : 'bg-white text-blue-900 hover:bg-blue-90'
                                                            }`}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                                <Button variant="outline" size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button key={page} size="sm" onClick={() => setCurrentPage(page)}
                                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}>
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
            )}

            {/* ═══ MODAL — CREAR ═══ */}
            <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) { resetCreate(); setShowCreateModal(false); } }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>Nueva Orden de Producción</DialogTitle>
                        <DialogDescription>Completa los campos obligatorios (*) para registrar la orden.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="mt-4 space-y-4">
                        <div className="border border-blue-100 rounded-lg overflow-hidden">
                            <div className="bg-blue-50 py-3 px-4">
                                <p className="text-sm font-semibold text-blue-900">Información de la Orden</p>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">Tipo de Orden <span className="text-red-500">*</span></label>
                                    <select
                                        className={selectCls(!!createErrors.tipoOrden)}
                                        value={createForm.tipoOrden}
                                        onChange={e => setCreateField('tipoOrden', e.target.value)}
                                        onBlur={() => touchCreateField('tipoOrden')}
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        <option value="Pedido">Pedido — Producción basada en pedido de cliente</option>
                                        <option value="Venta">Venta — Producción para inventario y venta directa</option>
                                    </select>
                                    <FieldError mensaje={createErrors.tipoOrden} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Producto <span className="text-red-500">*</span></label>
                                        <select
                                            className={selectCls(!!createErrors.productoId)}
                                            value={createForm.productoId}
                                            onChange={e => setCreateField('productoId', e.target.value)}
                                            onBlur={() => touchCreateField('productoId')}
                                        >
                                            <option value="">Seleccionar producto</option>
                                            {productos.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombreProducto} ({p.referencia})</option>
                                            ))}
                                        </select>
                                        <FieldError mensaje={createErrors.productoId} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Cantidad <span className="text-red-500">*</span></label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Ej: 50"
                                            value={createForm.cantidad}
                                            onChange={e => setCreateField('cantidad', e.target.value)}
                                            onBlur={() => touchCreateField('cantidad')}
                                            className={createErrors.cantidad ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError mensaje={createErrors.cantidad} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Responsable <span className="text-red-500">*</span></label>
                                        <select
                                            className={selectCls(!!createErrors.responsableId)}
                                            value={createForm.responsableId}
                                            onChange={e => setCreateField('responsableId', e.target.value)}
                                            onBlur={() => touchCreateField('responsableId')}
                                        >
                                            <option value="">Seleccionar responsable</option>
                                            {empleados.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.nombres} {emp.apellidos}</option>
                                            ))}
                                        </select>
                                        <FieldError mensaje={createErrors.responsableId} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Fecha de Entrega <span className="text-red-500">*</span></label>
                                        <Input
                                            type="date"
                                            min={today}
                                            value={createForm.fechaEntrega}
                                            onChange={e => setCreateField('fechaEntrega', e.target.value)}
                                            onBlur={() => touchCreateField('fechaEntrega')}
                                            className={createErrors.fechaEntrega ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError mensaje={createErrors.fechaEntrega} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline"
                                onClick={() => { resetCreate(); setShowCreateModal(false); }}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {saving ? 'Guardando...' : 'Registrar Orden'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — VER DETALLE ═══ */}
            <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(false); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>Detalle de Orden de Producción</DialogTitle>
                        <DialogDescription>Información completa de la orden {selectedOrden?.codigoOrden}</DialogDescription>
                    </DialogHeader>
                    {selectedOrden && (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Código</p>
                                    <p className="font-semibold text-blue-900 mt-1">{selectedOrden.codigoOrden}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Estado</p>
                                    <div className="mt-1"><StatusBadge estado={selectedOrden.estado ?? 'Pendiente'} /></div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Tipo de Orden</p>
                                    <div className="mt-1"><TipoBadge tipo={selectedOrden.tipoOrden} /></div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Fecha de Entrega</p>
                                    <p className="font-semibold text-sm mt-1">{selectedOrden.fechaEntrega ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Producto</p>
                                    <p className="font-semibold text-sm mt-1">{selectedOrden.producto?.nombreProducto ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Referencia</p>
                                    <p className="font-semibold text-sm mt-1">{selectedOrden.producto?.referencia ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Cantidad</p>
                                    <p className="font-semibold text-sm mt-1">{selectedOrden.cantidad} unidades</p>
                                </div>
                                {selectedOrden.pedidoId && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">ID Pedido</p>
                                        <p className="font-semibold text-sm mt-1">#{selectedOrden.pedidoId}</p>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Responsable</p>
                                    <p className="font-semibold text-sm mt-1">
                                        {selectedOrden.responsable
                                            ? `${selectedOrden.responsable.nombres} ${selectedOrden.responsable.apellidos} — ${selectedOrden.responsable.cargo}`
                                            : 'No asignado'}
                                    </p>
                                </div>
                                {selectedOrden.nota && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase">Notas</p>
                                        <p className="text-sm text-gray-700 mt-1">{selectedOrden.nota}</p>
                                    </div>
                                )}
                                {selectedOrden.motivoAnulacion && (
                                    <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                                        <p className="text-xs text-red-600 uppercase font-semibold">Motivo de Anulación</p>
                                        <p className="text-sm text-red-700 mt-1">{selectedOrden.motivoAnulacion}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                {!isOrdenBloqueada(selectedOrden) && (
                                    <Button
                                        onClick={() => { setShowDetailModal(false); openEdit(selectedOrden); }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />Editar Orden
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — EDITAR ═══ */}
            <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) { setShowEditModal(false); resetEdit(); } }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>Actualizar Orden de Producción</DialogTitle>
                        <DialogDescription>Orden: {selectedOrden?.codigoOrden}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 py-3 px-4">
                                <p className="text-sm font-semibold text-gray-600">Datos de la Orden (solo lectura)</p>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Código</label>
                                        <Input value={selectedOrden?.codigoOrden ?? ''} disabled className="bg-gray-50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Producto</label>
                                        <Input value={selectedOrden?.producto?.nombreProducto ?? ''} disabled className="bg-gray-50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Cantidad</label>
                                        <Input value={selectedOrden?.cantidad ?? ''} disabled className="bg-gray-50" />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase">Tipo:</span>
                                    <TipoBadge tipo={selectedOrden?.tipoOrden} />
                                </div>
                            </div>
                        </div>

                        <div className="border border-blue-100 rounded-lg overflow-hidden">
                            <div className="bg-blue-50 py-3 px-4">
                                <p className="text-sm font-semibold text-blue-900">Actualizar Información</p>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Responsable <span className="text-red-500">*</span></label>
                                        <select
                                            className={selectCls(!!editErrors.responsableId)}
                                            value={editForm.responsableId}
                                            onChange={e => setEditField('responsableId', e.target.value)}
                                            onBlur={() => touchEditField('responsableId')}
                                        >
                                            <option value="">Seleccionar responsable</option>
                                            {empleados.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.nombres} {emp.apellidos}</option>
                                            ))}
                                        </select>
                                        <FieldError mensaje={editErrors.responsableId} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Estado <span className="text-red-500">*</span></label>
                                        <select
                                            className={selectCls(!!editErrors.estado)}
                                            value={editForm.estado}
                                            onChange={e => setEditField('estado', e.target.value)}
                                            onBlur={() => touchEditField('estado')}
                                        >
                                            {[editForm.estado, ...estadosPermitidos(selectedOrden?.estado ?? 'Pendiente')]
                                                .filter((v, i, arr) => arr.indexOf(v) === i)
                                                .filter(e => e !== 'Anulada')
                                                .map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <FieldError mensaje={editErrors.estado} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">Fecha de Entrega <span className="text-red-500">*</span></label>
                                    <Input
                                        type="date"
                                        value={editForm.fechaEntrega}
                                        onChange={e => setEditField('fechaEntrega', e.target.value)}
                                        onBlur={() => touchEditField('fechaEntrega')}
                                        className={editErrors.fechaEntrega ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError mensaje={editErrors.fechaEntrega} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm text-gray-700">Notas</label>
                                        <CharCounter valor={editForm.nota} limite={1000} />
                                    </div>
                                    <Textarea
                                        value={editForm.nota}
                                        rows={3}
                                        onChange={e => setEditField('nota', e.target.value)}
                                        onBlur={() => touchEditField('nota')}
                                        placeholder="Instrucciones adicionales..."
                                        className={editErrors.nota ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError mensaje={editErrors.nota} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline"
                                onClick={() => { setShowEditModal(false); resetEdit(); }}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — ANULAR ═══ */}
            <Dialog open={showAnularDialog} onOpenChange={(open) => { if (!open) { setShowAnularDialog(false); resetAnular(); } }}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-black-600">
                            <AlertTriangle className="w-5 h-5" />
                            Anular Orden de Producción
                        </DialogTitle>
                        <DialogDescription>Esta acción cambiará la orden a "Anulada" y no podrá procesarse.</DialogDescription>
                    </DialogHeader>

                    {ordenToAnular && (
                        <div className="mt-4 space-y-3">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1 text-sm">
                                <p><span className="text-gray-500">Código: </span><span className="font-semibold">{ordenToAnular.codigoOrden}</span></p>
                                <p><span className="text-gray-500">Producto: </span>{ordenToAnular.producto?.nombreProducto}</p>
                                <p><span className="text-gray-500">Cantidad: </span>{ordenToAnular.cantidad} unidades</p>
                                <div className="flex items-center gap-2"><span className="text-gray-500">Tipo: </span><TipoBadge tipo={ordenToAnular.tipoOrden} /></div>
                                <div className="flex items-center gap-2"><span className="text-gray-500">Estado: </span><StatusBadge estado={ordenToAnular.estado ?? 'Pendiente'} /></div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm text-gray-700">
                                        Motivo de Anulación <span className="text-red-500">*</span>
                                        <span className="text-gray-400 text-xs ml-1">(mín. 10 caracteres)</span>
                                    </label>
                                    <CharCounter valor={motivoAnulacion} limite={500} />
                                </div>
                                <Textarea
                                    placeholder="Indica el motivo de la anulación..."
                                    value={motivoAnulacion}
                                    onChange={e => {
                                        const valorFiltrado = filtrarMotivo(e.target.value);
                                        setMotivoAnulacion(valorFiltrado);
                                        if (anularTouched) {
                                            const err = validarCampoAnulacion(valorFiltrado);
                                            setAnularErrors(err ? { motivoAnulacion: err } : {});
                                        }
                                    }}
                                    onBlur={() => {
                                        setAnularTouched(true);
                                        const err = validarCampoAnulacion(motivoAnulacion);
                                        setAnularErrors(err ? { motivoAnulacion: err } : {});
                                    }}
                                    rows={3}
                                    className={anularErrors.motivoAnulacion ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError mensaje={anularErrors.motivoAnulacion} />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={() => { setShowAnularDialog(false); resetAnular(); }} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAnular} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {saving ? 'Procesando...' : 'Anular Orden'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — CONFIRMAR FINALIZAR ═══ */}
            <Dialog open={showFinalizarDialog} onOpenChange={(open) => {
                if (!open) { setShowFinalizarDialog(false); setOrdenToFinalizar(null); }
            }}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-900">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            Finalizar Orden de Producción
                        </DialogTitle>
                        <DialogDescription>
                            Esta acción marcará la orden como <strong>Finalizada</strong> y no podrá editarse ni reactivarse.
                        </DialogDescription>
                    </DialogHeader>

                    {ordenToFinalizar && (
                        <div className="mt-4 space-y-3">
                            {/* Datos de la orden */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1 text-sm">
                                <p><span className="text-gray-500">Código: </span><span className="font-semibold">{ordenToFinalizar.codigoOrden}</span></p>
                                <p><span className="text-gray-500">Producto: </span>{ordenToFinalizar.producto?.nombreProducto}</p>
                                <p><span className="text-gray-500">Cantidad: </span>{ordenToFinalizar.cantidad} unidades</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Estado actual: </span>
                                    <StatusBadge estado={ordenToFinalizar.estado ?? 'Pendiente'} />
                                </div>
                            </div>

                            {/* Aviso de acción irreversible */}
                            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                                <div className="text-sm">
                                    <p className="font-semibold">¿Estás seguro de que deseas finalizar esta orden?</p>
                                    <p className="text-blue-700 mt-0.5">
                                        Una vez finalizada, la orden quedará <strong>bloqueada</strong> y no podrá modificarse ni anularse.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button
                            variant="outline"
                            onClick={() => { setShowFinalizarDialog(false); setOrdenToFinalizar(null); }}
                            disabled={finalizarSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmarFinalizar}
                            disabled={finalizarSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {finalizarSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {finalizarSaving ? 'Finalizando...' : 'Sí, finalizar orden'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}