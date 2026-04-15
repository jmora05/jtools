import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import {
    Plus, Search, Eye, Edit, Trash2, AlertTriangle,
    ChevronLeft, ChevronRight, FileText, ArrowLeft,
    CheckCircle, XCircle, Package, List, Ruler,
    ClipboardList, Calendar, Loader2, CheckCircle2,
    Lock, X, User,
} from 'lucide-react';
import {
    getFichasTecnicas, createFichaTecnica, updateFichaTecnica, deleteFichaTecnica, puedeEliminarFichaTecnica,
    type FichaTecnica, type Proceso, type Medida, type InsumoFT,
} from '../services/fichaTecnicaService';
import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';
import { getInsumosDisponibles, type InsumoDisponible } from '../services/insumosService';
import {
    validarProceso, validarMedida,
    validarProcesoCampos, validarMedidaCampos, validarInsumoCampos,
    validarFormCrear, validarFormEditar, validarNotasCampo,
    filtrarDescripcion, filtrarDuracion, filtrarParametro,
    filtrarNotas, filtrarCantidad, filtrarUnidad, contadorTexto,
    type ItemErrors,
} from '../utils/fichaTecnicaValidations';

type Producto = {
    id: number;
    nombreProducto: string;
    referencia: string;
    estado: string;
    categoria?: { id: number; nombreCategoria: string };
};

type FormInfo = {
    productoId: string;
    notas: string;
    estado: 'Activa' | 'Inactiva';
};

const EMPTY_FORM: FormInfo = { productoId: '', notas: '', estado: 'Activa' };

const selectCls = (hasError?: boolean) =>
    `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-[#f3f3f5] h-9 ${
        hasError ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'
    }`;

// ─── Helpers visuales ─────────────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: string }) {
    return estado === 'Activa'
        ? <Badge className="bg-blue-100 text-blue-900 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Activa</Badge>
        : <Badge className="bg-gray-100 text-gray-500 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Inactiva</Badge>;
}

function FieldError({ mensaje }: { mensaje?: string }) {
    if (!mensaje) return null;
    return (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {mensaje}
        </p>
    );
}

function CharCounter({ valor, limite }: { valor: string; limite: number }) {
    const c = contadorTexto(valor, limite);
    if (c.actual === 0) return null;
    return (
        <span className={`text-xs ${c.excedido ? 'text-red-500 font-medium' : c.enPeligro ? 'text-amber-500' : 'text-gray-400'}`}>
            {c.texto}
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

// ─── ItemsForm ────────────────────────────────────────────────────────────────
function ItemsForm({
    procesos, setProcesos,
    medidas, setMedidas,
    insumos, setInsumos,
    catalogoInsumos, loadingInsumos, insumosListError,
    empleados = [],
}: {
    procesos: Proceso[];       setProcesos: (v: Proceso[]) => void;
    medidas: Medida[];         setMedidas: (v: Medida[]) => void;
    insumos: InsumoFT[];       setInsumos: (v: InsumoFT[]) => void;
    catalogoInsumos: InsumoDisponible[];
    loadingInsumos: boolean;
    insumosListError: string | null;
    empleados?: any[];
}) {
    const [newProc, setNewProc] = useState<{ description: string; duration: string; responsableId?: number }>({ description: '', duration: '' });
    const [newMed, setNewMed]   = useState<Medida>({ parameter: '', value: '' });
    const [selectedInsumoId, setSelectedInsumoId] = useState<string>('');
    const [newInsQuantity, setNewInsQuantity]      = useState<number>(0);
    const [newInsUnit, setNewInsUnit]              = useState<string>('');

    const [procErrors, setProcErrors] = useState<ItemErrors>({});
    const [medErrors, setMedErrors]   = useState<ItemErrors>({});
    const [insErrors, setInsErrors]   = useState<ItemErrors>({});

    const [procSubmitted, setProcSubmitted] = useState(false);
    const [medSubmitted, setMedSubmitted]   = useState(false);
    const [insSubmitted, setInsSubmitted]   = useState(false);

    function updateProcField(campo: keyof typeof newProc, valor: string) {
        let valorFiltrado = valor;
        if (campo === 'description') valorFiltrado = filtrarDescripcion(valor);
        if (campo === 'duration')    valorFiltrado = filtrarDuracion(valor);

        const nuevoProc = { ...newProc, [campo]: valorFiltrado };
        setNewProc(nuevoProc);
        if (procSubmitted) setProcErrors(validarProcesoCampos(nuevoProc));
    }

    const addProc = () => {
        setProcSubmitted(true);
        const camposErr = validarProcesoCampos(newProc);
        
        // Validar que responsableId esté presente
        if (!newProc.responsableId) {
            setProcErrors({ ...camposErr, responsableId: 'El responsable es obligatorio' });
            toast.error('Debes seleccionar un responsable para el proceso');
            return;
        }
        
        setProcErrors(camposErr);
        const { valid, errors } = validarProceso({ ...newProc, step: procesos.length + 1 });
        if (!valid) { toast.error(errors[0]); return; }
        setProcesos([...procesos, { step: procesos.length + 1, description: newProc.description.trim(), duration: newProc.duration.trim(), responsableId: newProc.responsableId }]);
        setNewProc({ description: '', duration: '' });
        setProcErrors({});
        setProcSubmitted(false);
    };

    function updateMedField(campo: keyof typeof newMed, valor: string) {
        const valorFiltrado = filtrarParametro(valor);
        const nuevaMed = { ...newMed, [campo]: valorFiltrado };
        setNewMed(nuevaMed);
        if (medSubmitted) setMedErrors(validarMedidaCampos(nuevaMed));
    }

    const addMed = () => {
        setMedSubmitted(true);
        const camposErr = validarMedidaCampos(newMed);
        setMedErrors(camposErr);
        const { valid, errors } = validarMedida(newMed);
        if (!valid) { toast.error(errors[0]); return; }
        setMedidas([...medidas, { parameter: newMed.parameter.trim(), value: newMed.value.trim() }]);
        setNewMed({ parameter: '', value: '' });
        setMedErrors({});
        setMedSubmitted(false);
    };

    function updateInsField(campo: 'quantity' | 'unit', valor: string | number) {
        let valorFiltrado: string | number = valor;
        if (campo === 'unit') valorFiltrado = filtrarUnidad(String(valor));
        if (campo === 'quantity') valorFiltrado = filtrarCantidad(String(valor));

        const nuevoIns = {
            quantity: campo === 'quantity' ? parseFloat(String(valorFiltrado)) || 0 : newInsQuantity,
            unit: campo === 'unit' ? String(valorFiltrado) : newInsUnit,
        };
        if (campo === 'quantity') setNewInsQuantity(nuevoIns.quantity);
        if (campo === 'unit') setNewInsUnit(nuevoIns.unit);
        if (insSubmitted) setInsErrors(validarInsumoCampos(nuevoIns, selectedInsumoId));
    }

    const addIns = () => {
        setInsSubmitted(true);
        const camposErr = validarInsumoCampos({ quantity: newInsQuantity, unit: newInsUnit }, selectedInsumoId);
        setInsErrors(camposErr);
        if (Object.keys(camposErr).length > 0) {
            const firstError = camposErr.insumoId ?? camposErr.quantity ?? camposErr.unit ?? '';
            toast.error(firstError);
            return;
        }
        const name = catalogoInsumos.find(i => String(i.id) === selectedInsumoId)?.nombreInsumo ?? '';
        setInsumos([...insumos, { name, quantity: newInsQuantity, unit: newInsUnit.trim() }]);
        setSelectedInsumoId('');
        setNewInsQuantity(0);
        setNewInsUnit('');
        setInsErrors({});
        setInsSubmitted(false);
    };

    const inputErr = (hasErr: boolean) =>
        hasErr ? 'border-red-400 focus-visible:ring-red-300' : '';

    return (
        <>
            {/* ── Procesos ── */}
            <div className="border border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 py-3 px-4">
                    <p className="text-sm font-semibold text-blue-900">
                        Procesos de Fabricación <span className="text-red-500">*</span>
                        <span className="text-gray-400 text-xs font-normal ml-1">(mínimo 1, máx. 30)</span>
                    </p>
                </div>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Descripción *</Label>
                                <CharCounter valor={newProc.description} limite={300} />
                            </div>
                            <Input placeholder="Ej: Preparación de materiales, Corte de piezas"
                                value={newProc.description}
                                onChange={e => updateProcField('description', e.target.value)} className={inputErr(!!procErrors.description)} />
                            <FieldError mensaje={procErrors.description} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Duración *</Label>
                                <CharCounter valor={newProc.duration} limite={50} />
                            </div>
                            <Input placeholder="15 min, 2 horas" value={newProc.duration}
                                onChange={e => updateProcField('duration', e.target.value)} className={inputErr(!!procErrors.duration)} />
                            <FieldError mensaje={procErrors.duration} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Responsable <span className="text-red-500">*</span></Label>
                        <select
                            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-[#f3f3f5] h-9 ${!newProc.responsableId ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                            value={newProc.responsableId || ''}
                            onChange={e => {
                                const id = e.target.value ? parseInt(e.target.value) : undefined;
                                setNewProc({ ...newProc, responsableId: id });
                            }}
                        >
                            <option value="">Seleccionar responsable</option>
                            {empleados.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.nombres} {emp.apellidos}</option>
                            ))}
                        </select>
                        {!newProc.responsableId && procSubmitted && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                El responsable es obligatorio
                            </p>
                        )}
                    </div>
                    <Button type="button" variant="outline" onClick={addProc} className="w-full text-blue-700 border-blue-300 hover:bg-blue-50">
                        <Plus className="w-4 h-4 mr-2" />Agregar Proceso
                    </Button>
                    {procesos.length === 0 && (
                        <p className="text-xs text-red-500 text-center">Debes agregar al menos un proceso</p>
                    )}
                    {procesos.map((p, i) => {
                        const responsable = empleados.find(e => e.id === p.responsableId);
                        return (
                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3 border text-sm">
                                <div className="flex-1">
                                    <span>
                                        <span className="font-medium text-blue-700 mr-2">Paso {i + 1}:</span>
                                        {p.description}
                                    </span>
                                    {responsable && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            👤 {responsable.nombres} {responsable.apellidos}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-xs shrink-0">{p.duration}</Badge>
                                    <Button type="button" variant="ghost" size="sm"
                                        onClick={() => setProcesos(procesos.filter((_, j) => j !== i))}
                                        className="text-blue-500 hover:text-blue-700 h-7 w-7 p-0">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Medidas ── */}
            <div className="border border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 py-3 px-4">
                    <p className="text-sm font-semibold text-blue-900">
                        Medidas y Especificaciones
                        <span className="text-gray-400 text-xs font-normal ml-1">(Opcional, máx. 30)</span>
                    </p>
                </div>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Parámetro *</Label>
                                <CharCounter valor={newMed.parameter} limite={100} />
                            </div>
                            <Input placeholder="Ej: Diámetro exterior, Longitud"
                                value={newMed.parameter}
                                onChange={e => updateMedField('parameter', e.target.value)} className={inputErr(!!medErrors.parameter)} />
                            <FieldError mensaje={medErrors.parameter} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Valor *</Label>
                                <CharCounter valor={newMed.value} limite={100} />
                            </div>
                            <Input placeholder="Ej: 95 mm, 1.2 kg"
                                value={newMed.value}
                                onChange={e => updateMedField('value', e.target.value)} className={inputErr(!!medErrors.value)} />
                            <FieldError mensaje={medErrors.value} />
                        </div>
                    </div>
                    <Button type="button" variant="outline" onClick={addMed} className="w-full text-blue-700 border-blue-300 hover:bg-blue-50">
                        <Plus className="w-4 h-4 mr-2" />Agregar Medida
                    </Button>
                    {medidas.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3 border text-sm">
                            <span className="text-gray-700">{m.parameter}</span>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">{m.value}</Badge>
                                <Button type="button" variant="ghost" size="sm"
                                    onClick={() => setMedidas(medidas.filter((_, j) => j !== i))}
                                    className="text-blue-500 hover:text-blue-700 h-7 w-7 p-0">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Insumos ── */}
            <div className="border border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 py-3 px-4">
                    <p className="text-sm font-semibold text-blue-900">
                        Insumos Requeridos <span className="text-red-500">*</span>
                        <span className="text-gray-400 text-xs font-normal ml-1">(mínimo 1, máx. 50)</span>
                    </p>
                </div>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs">Insumo *</Label>
                            <select
                                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-[#f3f3f5] h-9 ${insErrors.insumoId ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                                value={selectedInsumoId}
                                disabled={loadingInsumos}
                                onChange={e => {
                                    const id = e.target.value;
                                    setSelectedInsumoId(id);
                                    const insumo = catalogoInsumos.find(i => String(i.id) === id);
                                    setNewInsUnit(insumo ? insumo.unidadMedida : '');
                                    if (insSubmitted) setInsErrors(validarInsumoCampos({ quantity: newInsQuantity, unit: insumo ? insumo.unidadMedida : newInsUnit }, id));
                                }}
                            >
                                <option value="">{loadingInsumos ? 'Cargando insumos...' : 'Seleccionar insumo'}</option>
                                {catalogoInsumos.map(insumo => (
                                    <option key={insumo.id} value={String(insumo.id)}>{insumo.nombreInsumo}</option>
                                ))}
                            </select>
                            <FieldError mensaje={insErrors.insumoId} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Cantidad *</Label>
                            <Input type="text" inputMode="decimal" placeholder="Ej: 0.5"
                                value={newInsQuantity || ''}
                                onChange={e => updateInsField('quantity', e.target.value)} className={inputErr(!!insErrors.quantity)} />
                            <FieldError mensaje={insErrors.quantity} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Unidad *</Label>
                                <CharCounter valor={newInsUnit} limite={30} />
                            </div>
                            <Input placeholder="litros, kg, ml" value={newInsUnit}
                                onChange={e => updateInsField('unit', e.target.value)} className={inputErr(!!insErrors.unit)} />
                            <FieldError mensaje={insErrors.unit} />
                        </div>
                    </div>
                    <Button type="button" variant="outline" onClick={addIns} className="w-full text-blue-700 border-blue-300 hover:bg-blue-50">
                        <Plus className="w-4 h-4 mr-2" />Agregar Insumo
                    </Button>
                    {insumosListError && (
                        <p className="text-xs text-red-500 text-center">{insumosListError}</p>
                    )}
                    {insumos.map((ins, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3 border text-sm">
                            <span className="font-medium text-gray-700">{ins.name}</span>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">{ins.quantity} {ins.unit}</Badge>
                                <Button type="button" variant="ghost" size="sm"
                                    onClick={() => setInsumos(insumos.filter((_, j) => j !== i))}
                                    className="text-blue-500 hover:text-blue-700 h-7 w-7 p-0">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export function TechnicalSheetModule() {
    const [fichas, setFichas]       = useState<FichaTecnica[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [loading, setLoading]     = useState(false);
    const [saving, setSaving]       = useState(false);

    const [showCreateModal, setShowCreateModal]   = useState(false);
    const [showEditModal, setShowEditModal]       = useState(false);
    const [showDetailModal, setShowDetailModal]   = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [selectedFicha, setSelectedFicha] = useState<FichaTecnica | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [fichaToDelete, setFichaToDelete] = useState<FichaTecnica | null>(null);

    const [createForm, setCreateForm] = useState<FormInfo>(EMPTY_FORM);
    const [editForm, setEditForm]     = useState<FormInfo>(EMPTY_FORM);

    const [createInfoErrors, setCreateInfoErrors] = useState<{ productoId?: string; notas?: string }>({});
    const [editInfoErrors, setEditInfoErrors]     = useState<{ notas?: string }>({});

    const [cProcesos, setCProcesos]     = useState<Proceso[]>([]);
    const [cMedidas, setCMedidas]       = useState<Medida[]>([]);
    const [cInsumos, setCInsumos]       = useState<InsumoFT[]>([]);

    const [eProcesos, setEProcesos]     = useState<Proceso[]>([]);
    const [eMedidas, setEMedidas]       = useState<Medida[]>([]);
    const [eInsumos, setEInsumos]       = useState<InsumoFT[]>([]);

    const [catalogoInsumos, setCatalogoInsumos] = useState<InsumoDisponible[]>([]);
    const [loadingInsumos, setLoadingInsumos]   = useState(false);
    const [errorInsumos, setErrorInsumos]       = useState<string | null>(null);

    const productosConFichaActiva = new Set(
        fichas.filter(f => f.estado === 'Activa').map(f => f.productoId)
    );

    const [searchTerm, setSearchTerm]   = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [currentPage, setCurrentPage]  = useState(1);
    const itemsPerPage = 5;

    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const showFeedback = (msg: string) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

    const [inactiveAlert, setInactiveAlert] = useState<string | null>(null);
    const showInactiveAlert = (msg: string) => {
        setInactiveAlert(msg);
        setTimeout(() => setInactiveAlert(null), 5000);
    };

    const fetchFichas = useCallback(async () => {
        setLoading(true);
        try { setFichas(await getFichasTecnicas()); }
        catch (err: any) { toast.error('Error al cargar fichas: ' + (err?.message ?? 'Error desconocido')); }
        finally { setLoading(false); }
    }, []);

    const fetchProductos = useCallback(async () => {
        try {
            const BASE = getApiBaseUrl();
            const res = await fetch(`${BASE}/productos`, { headers: buildAuthHeaders() });
            const data = await handleResponse<Producto[]>(res);
            setProductos(data.filter(p => p.estado === 'activo'));
        } catch { /* silencioso */ }
    }, []);

    const fetchInsumosDisponibles = useCallback(async () => {
        setLoadingInsumos(true);
        setErrorInsumos(null);
        try {
            const data = await getInsumosDisponibles();
            setCatalogoInsumos(data);
        } catch (err: any) {
            setErrorInsumos('No se pudo cargar el catálogo de insumos. Intenta de nuevo.');
            setCatalogoInsumos([]);
        } finally {
            setLoadingInsumos(false);
        }
    }, []);

    const fetchEmpleados = useCallback(async () => {
        try {
            const BASE = getApiBaseUrl();
            const res = await fetch(`${BASE}/empleados`, { headers: buildAuthHeaders() });
            const data = await handleResponse<any[]>(res);
            // Filtrar solo empleados activos
            setEmpleados(data.filter(e => e.estado === 'activo'));
        } catch { /* silencioso */ }
    }, []);

    useEffect(() => { fetchFichas(); fetchProductos(); fetchEmpleados(); }, [fetchFichas, fetchProductos, fetchEmpleados]);

    const filtered = fichas.filter(f => {
        const codigo   = (f.codigoFicha ?? '').toLowerCase();
        const producto = (f.producto?.nombreProducto ?? '').toLowerCase();
        const ref      = (f.producto?.referencia ?? '').toLowerCase();
        const search   = searchTerm.toLowerCase();
        const matchSearch = codigo.includes(search) || producto.includes(search) || ref.includes(search);
        const matchEstado = filterEstado === 'all' || f.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    const sorted = [...filtered].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );

    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const paginated  = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleQuickEstadoChange = async (ficha: FichaTecnica, nuevoEstado: string) => {
        setInactiveAlert(null);
        try {
            await updateFichaTecnica(ficha.id!, { estado: nuevoEstado as 'Activa' | 'Inactiva' });
            toast.success(`Estado cambiado a ${nuevoEstado}`);
            fetchFichas();
        } catch (err: any) {
            toast.error('Error al cambiar estado: ' + (err?.message ?? 'Error desconocido'));
        }
    };

    const resetCreate = () => {
        setCreateForm(EMPTY_FORM);
        setCProcesos([]); setCMedidas([]); setCInsumos([]);
        setCreateInfoErrors({});
        fetchInsumosDisponibles();
    };

    function updateCreateNotas(valor: string) {
        const filtrado = filtrarNotas(valor);
        setCreateForm(prev => ({ ...prev, notas: filtrado }));
        const err = validarNotasCampo(filtrado);
        setCreateInfoErrors(prev => ({ ...prev, notas: err }));
    }

    function updateEditNotas(valor: string) {
        const filtrado = filtrarNotas(valor);
        setEditForm(prev => ({ ...prev, notas: filtrado }));
        const err = validarNotasCampo(filtrado);
        setEditInfoErrors(prev => ({ ...prev, notas: err }));
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.productoId) {
            setCreateInfoErrors(prev => ({ ...prev, productoId: 'Debes seleccionar un producto' }));
        }
        // Validación previa: el producto ya tiene una ficha activa
        if (createForm.productoId && productosConFichaActiva.has(parseInt(createForm.productoId))) {
            const fichaExistente = fichas.find(
                f => f.productoId === parseInt(createForm.productoId) && f.estado === 'Activa'
            );
            const codigo = fichaExistente?.codigoFicha ?? '';
            setCreateInfoErrors(prev => ({
                ...prev,
                productoId: `Este producto ya tiene la ficha activa ${codigo}. Inactívala antes de crear una nueva.`,
            }));
            toast.error(`Este producto ya tiene la ficha activa ${codigo}. Inactívala primero.`);
            return;
        }
        const { valid, errors } = validarFormCrear(createForm, cProcesos, cMedidas, cInsumos);
        if (!valid) { toast.error(errors[0]); return; }

        setSaving(true);
        try {
            const res = await createFichaTecnica({
                productoId: parseInt(createForm.productoId),
                procesos:   cProcesos,
                medidas:    cMedidas,
                insumos:    cInsumos,
                notas:      createForm.notas || undefined,
            });
            showFeedback(`✓ Ficha ${res.ficha.codigoFicha} creada exitosamente`);
            toast.success(`Ficha ${res.ficha.codigoFicha} creada exitosamente`);
            setShowCreateModal(false);
            resetCreate();
            fetchFichas();
        } catch (err: any) {
            toast.error('Error al crear: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (f: FichaTecnica) => {
        setSelectedFicha(f);
        setEditForm({ productoId: String(f.productoId), notas: f.notas ?? '', estado: f.estado ?? 'Activa' });
        setEProcesos(f.procesos ?? []);
        setEMedidas(f.medidas ?? []);
        setEInsumos(f.insumos ?? []);
        setEditInfoErrors({});
        fetchInsumosDisponibles();
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFicha?.id) return;
        const { valid, errors } = validarFormEditar(eProcesos, eMedidas, eInsumos, editForm.notas);
        if (!valid) { toast.error(errors[0]); return; }

        setSaving(true);
        try {
            await updateFichaTecnica(selectedFicha.id, {
                procesos:   eProcesos,
                medidas:    eMedidas,
                insumos:    eInsumos,
                notas:      editForm.notas || undefined,
                estado:     editForm.estado,
            });
            showFeedback('✓ Ficha técnica actualizada correctamente');
            toast.success('Ficha técnica actualizada correctamente');
            setShowEditModal(false);
            setSelectedFicha(null);
            fetchFichas();
        } catch (err: any) {
            toast.error('Error al actualizar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!fichaToDelete?.id) return;
        setSaving(true);
        try {
            await deleteFichaTecnica(fichaToDelete.id);
            showFeedback('✓ Ficha técnica eliminada correctamente');
            toast.success('Ficha técnica eliminada correctamente');
            setShowDeleteDialog(false);
            setFichaToDelete(null);
            fetchFichas();
        } catch (err: any) {
            toast.error('Error al eliminar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Fichas Técnicas</h1>
                    <p className="text-blue-800">Especificaciones técnicas de productos</p>
                </div>
                <Button
                    onClick={() => { resetCreate(); setShowCreateModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Registrar Ficha Técnica
                </Button>
            </div>

            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por código, producto, referencia..."
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 w-full"
                    />
                  </div>
                  <select
                    value={filterEstado}
                    onChange={e => {
                      setFilterEstado(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-40"
                  >
                    <option value="all">Todos</option>
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Tabla */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando fichas técnicas...</span>
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
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-12 text-gray-500">
                                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p>No se encontraron fichas técnicas</p>
                                            </td>
                                        </tr>
                                    ) : paginated.map(ficha => {
                                        const isInactiva = ficha.estado === 'Inactiva';
                                        return (
                                            <tr key={ficha.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className={`w-4 h-4 shrink-0 ${isInactiva ? 'text-gray-300' : 'text-blue-600'}`} />
                                                        <span className={`text-sm font-semibold ${isInactiva ? 'text-gray-400' : 'text-blue-900'}`}>{ficha.codigoFicha}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className={`font-semibold ${isInactiva ? 'text-gray-400' : 'text-gray-900'}`}>{ficha.producto?.nombreProducto ?? '—'}</p>
                                                </td>

                                                {/* ── Columna Estado: Switch solo ── */}
                                                <td className="py-4 px-6">
                                                    <Switch
                                                        checked={ficha.estado === 'Activa'}
                                                        onCheckedChange={() => handleQuickEstadoChange(ficha, ficha.estado === 'Activa' ? 'Inactiva' : 'Activa')}
                                                    />
                                                </td>

                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-2">
                                                        {/* Ver detalle: siempre activo */}
                                                        <Button size="sm"
                                                            onClick={() => { setSelectedFicha(ficha); setShowDetailModal(true); }}
                                                            className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {/* Editar: bloqueado si inactiva */}
                                                        <Button size="sm"
                                                            onClick={() => {
                                                                if (isInactiva) {
                                                                    showInactiveAlert('Ficha inactiva: No puedes editar una ficha inactiva. Actívala primero usando el interruptor de estado.');
                                                                    return;
                                                                }
                                                                openEdit(ficha);
                                                            }}
                                                            className={`border transition-colors ${
                                                                isInactiva
                                                                    ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed hover:bg-white'
                                                                    : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                            }`}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        {/* Eliminar: solo si activa */}
                                                        <Button size="sm"
                                                            onClick={async () => {
                                                                if (ficha.estado === 'Inactiva') {
                                                                    showInactiveAlert('Ficha inactiva: No puedes eliminar una ficha inactiva. Actívala primero usando el interruptor de estado.');
                                                                    return;
                                                                }
                                                                // Verificar si puede eliminarse
                                                                try {
                                                                    const resultado = await puedeEliminarFichaTecnica(ficha.id!);
                                                                    setFichaToDelete(ficha);
                                                                    if (!resultado.puedeEliminar) {
                                                                        setDeleteError(resultado.razon);
                                                                    } else {
                                                                        setDeleteError(null);
                                                                    }
                                                                    setShowDeleteDialog(true);
                                                                } catch (err: any) {
                                                                    toast.error('Error al verificar: ' + (err?.message ?? 'Error desconocido'));
                                                                }
                                                            }}
                                                            className={`border transition-colors ${
                                                                ficha.estado === 'Inactiva'
                                                                    ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed hover:bg-white'
                                                                    : 'bg-white text-blue-600 border-0 hover:bg-blue-50'
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

            {/* Alerta de ficha inactiva */}
            {inactiveAlert && (
                <InactiveAlert
                    mensaje={inactiveAlert}
                    onClose={() => setInactiveAlert(null)}
                />
            )}

            {/* Feedback Banner */}
            {feedbackMsg && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{feedbackMsg}</span>
                </div>
            )}

            {/* MODAL — CREAR */}
            <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) { resetCreate(); setShowCreateModal(false); } }}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Registrar Nueva Ficha Técnica</DialogTitle>
                            <DialogDescription>Completa los campos obligatorios (*) para crear la ficha.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="mt-4 space-y-4">
                            <div className="border border-blue-100 rounded-lg overflow-hidden">
                                <div className="bg-blue-50 py-3 px-4">
                                    <p className="text-sm font-semibold text-blue-900">Información General</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Producto <span className="text-red-500">*</span></label>
                                        <select
                                            className={selectCls(!!createInfoErrors.productoId)}
                                            value={createForm.productoId}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setCreateForm({ ...createForm, productoId: val });
                                                if (!val) {
                                                    setCreateInfoErrors(prev => ({ ...prev, productoId: 'Debes seleccionar un producto' }));
                                                } else if (productosConFichaActiva.has(parseInt(val))) {
                                                    const fichaExistente = fichas.find(
                                                        f => f.productoId === parseInt(val) && f.estado === 'Activa'
                                                    );
                                                    setCreateInfoErrors(prev => ({
                                                        ...prev,
                                                        productoId: `Este producto ya tiene la ficha activa ${fichaExistente?.codigoFicha ?? ''}. Inactívala antes de crear una nueva.`,
                                                    }));
                                                } else {
                                                    setCreateInfoErrors(prev => ({ ...prev, productoId: undefined }));
                                                }
                                            }}
                                        >
                                            <option value="">Seleccionar producto</option>
                                            {productos.map(p => {
                                                const tieneActiva = productosConFichaActiva.has(p.id);
                                                return (
                                                    <option key={p.id} value={p.id} disabled={tieneActiva}>
                                                        {tieneActiva ? '⚠ ' : ''}{p.nombreProducto} — {p.referencia}{p.categoria ? ` (${p.categoria.nombreCategoria})` : ''}{tieneActiva ? ' [ya tiene ficha activa]' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <FieldError mensaje={createInfoErrors.productoId} />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm text-gray-700">Notas <span className="text-gray-400">(opcional)</span></label>
                                            <CharCounter valor={createForm.notas} limite={1000} />
                                        </div>
                                        <Textarea
                                            placeholder="Notas adicionales sobre la ficha técnica..."
                                            value={createForm.notas}
                                            rows={2}
                                            onChange={e => updateCreateNotas(e.target.value)}
                                            className={createInfoErrors.notas ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError mensaje={createInfoErrors.notas} />
                                    </div>
                                </div>
                            </div>

                            <ItemsForm
                                procesos={cProcesos}     setProcesos={setCProcesos}
                                medidas={cMedidas}       setMedidas={setCMedidas}
                                insumos={cInsumos}       setInsumos={setCInsumos}
                                catalogoInsumos={catalogoInsumos}
                                loadingInsumos={loadingInsumos}
                                insumosListError={cInsumos.length === 0 ? 'Debes agregar al menos un insumo' : null}
                                empleados={empleados}
                            />

                            {errorInsumos && (
                                <p className="text-red-500 text-sm flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {errorInsumos}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline"
                                    onClick={() => { resetCreate(); setShowCreateModal(false); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving || !!errorInsumos}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {saving ? 'Guardando...' : 'Registrar Ficha Técnica'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL — VER DETALLE */}
            <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(false); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Detalle de Ficha Técnica</DialogTitle>
                            <DialogDescription>Información completa — {selectedFicha?.codigoFicha}</DialogDescription>
                        </DialogHeader>
                        {selectedFicha && (
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Código</p>
                                        <p className="font-semibold text-blue-900 mt-1">{selectedFicha.codigoFicha}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Estado</p>
                                        <div className="mt-1"><StatusBadge estado={selectedFicha.estado ?? 'Activa'} /></div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Producto</p>
                                        <p className="font-semibold text-sm mt-1">{selectedFicha.producto?.nombreProducto ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Referencia</p>
                                        <p className="font-semibold text-sm mt-1">{selectedFicha.producto?.referencia ?? '—'}</p>
                                    </div>
                                    {selectedFicha.producto?.categoria && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Categoría</p>
                                            <Badge variant="secondary" className="mt-1">{selectedFicha.producto.categoria.nombreCategoria}</Badge>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" />Creado</p>
                                        <p className="font-semibold text-sm mt-1">{(selectedFicha.createdAt ?? '').slice(0, 10)}</p>
                                    </div>
                                    {selectedFicha.notas && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 uppercase">Notas</p>
                                            <p className="text-sm text-gray-700 mt-1">{selectedFicha.notas}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Procesos */}
                                <div className="border border-blue-100 rounded-lg overflow-hidden">
                                    <div className="bg-blue-50 py-3 px-4">
                                        <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4" />Procesos de Fabricación ({(selectedFicha.procesos ?? []).length})
                                        </p>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {(selectedFicha.procesos ?? []).map((p, i) => {
                                            const responsable = empleados.find(e => e.id === p.responsableId);
                                            return (
                                                <div key={i} className="bg-gray-50 rounded p-3 border text-sm space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <span><span className="font-medium text-blue-700 mr-2">Paso {i + 1}:</span>{p.description}</span>
                                                        <Badge variant="outline">{p.duration}</Badge>
                                                    </div>
                                                    {responsable && (
                                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                                            <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                            <span className="font-medium">{responsable.nombres} {responsable.apellidos}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {(selectedFicha.medidas ?? []).length > 0 && (
                                    <div className="border border-blue-100 rounded-lg overflow-hidden">
                                        <div className="bg-blue-50 py-3 px-4">
                                            <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                                <Ruler className="w-4 h-4" />Medidas y Especificaciones
                                            </p>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {(selectedFicha.medidas ?? []).map((m, i) => (
                                                <div key={i} className="flex justify-between bg-gray-50 rounded p-3 border text-sm">
                                                    <span>{m.parameter}</span><Badge variant="outline">{m.value}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(selectedFicha.insumos ?? []).length > 0 && (
                                    <div className="border border-blue-100 rounded-lg overflow-hidden">
                                        <div className="bg-blue-50 py-3 px-4">
                                            <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                                <List className="w-4 h-4" />Insumos Requeridos
                                            </p>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {(selectedFicha.insumos ?? []).map((ins, i) => (
                                                <div key={i} className="flex justify-between bg-gray-50 rounded p-3 border text-sm">
                                                    <span>{ins.name}</span><Badge variant="outline">{ins.quantity} {ins.unit}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                    {selectedFicha.estado === 'Activa' && (
                                        <Button
                                            onClick={() => { setShowDetailModal(false); openEdit(selectedFicha); }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />Editar Ficha
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL — EDITAR */}
            <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) { setShowEditModal(false); setSelectedFicha(null); } }}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Editar Ficha Técnica</DialogTitle>
                            <DialogDescription>Ficha: {selectedFicha?.codigoFicha}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                            <div className="border border-blue-100 rounded-lg overflow-hidden">
                                <div className="bg-blue-50 py-3 px-4">
                                    <p className="text-sm font-semibold text-blue-900">Información General</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-2">Producto (no editable)</label>
                                            <Input value={selectedFicha?.producto?.nombreProducto ?? ''} disabled className="bg-gray-50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-2">Estado <span className="text-red-500">*</span></label>
                                            <select
                                                className={selectCls()}
                                                value={editForm.estado}
                                                onChange={e => setEditForm({ ...editForm, estado: e.target.value as 'Activa' | 'Inactiva' })}
                                            >
                                                <option value="Activa">Activa</option>
                                                <option value="Inactiva">Inactiva</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm text-gray-700">Notas <span className="text-gray-400">(opcional)</span></label>
                                            <CharCounter valor={editForm.notas} limite={1000} />
                                        </div>
                                        <Textarea
                                            value={editForm.notas}
                                            rows={2}
                                            onChange={e => updateEditNotas(e.target.value)}
                                            placeholder="Notas adicionales..."
                                            className={editInfoErrors.notas ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError mensaje={editInfoErrors.notas} />
                                    </div>
                                </div>
                            </div>

                            <ItemsForm
                                procesos={eProcesos}     setProcesos={setEProcesos}
                                medidas={eMedidas}       setMedidas={setEMedidas}
                                insumos={eInsumos}       setInsumos={setEInsumos}
                                catalogoInsumos={catalogoInsumos}
                                loadingInsumos={loadingInsumos}
                                insumosListError={eInsumos.length === 0 ? 'Debes agregar al menos un insumo' : null}
                                empleados={empleados}
                            />

                            {errorInsumos && (
                                <p className="text-red-500 text-sm flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {errorInsumos}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline"
                                    onClick={() => { setShowEditModal(false); setSelectedFicha(null); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving || !!errorInsumos}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL — ELIMINAR */}
            <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!open) { setShowDeleteDialog(false); setFichaToDelete(null); setDeleteError(null); } }}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-900">
                            <Trash2 className="w-5 h-5" />
                            Eliminar Ficha Técnica
                        </DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>

                    {fichaToDelete && (
                        <div className="mt-4 space-y-3">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-semibold text-blue-900">{fichaToDelete.codigoFicha}</p>
                                <p className="text-sm text-blue-700 mt-1">{fichaToDelete.producto?.nombreProducto}</p>
                                <p className="text-sm text-blue-700">{fichaToDelete.producto?.referencia}</p>
                            </div>

                            {deleteError ? (
                                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold">No se puede eliminar</p>
                                        <p className="text-red-700 mt-0.5">{deleteError}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3">
                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold">Ficha técnica sin referencias</p>
                                        <p className="text-blue-700 mt-0.5">Esta ficha técnica puede ser <strong>eliminada permanentemente</strong> del sistema.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setFichaToDelete(null); setDeleteError(null); }} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={saving || !!deleteError}
                            className="bg-white hover:bg-blue-50 text-blue-600"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {saving ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}