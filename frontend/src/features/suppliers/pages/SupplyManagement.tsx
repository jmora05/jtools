// src/features/supplies/SupplyManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Switch }                from '@/shared/components/ui/switch';
import { Badge }                 from '@/shared/components/ui/badge';
import { Button }                from '@/shared/components/ui/button';
import { SmartPagination }       from '@/shared/components/SmartPagination';
import { Input }                 from '@/shared/components/ui/input';
import { Card, CardContent }     from '@/shared/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';
import {
    Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
    AlertTriangle, X, Search, Loader2, CheckCircle2, Info, Lock,
    Package,
} from 'lucide-react';
import {
    getInsumos,
    createInsumo,
    updateInsumo,
    deleteInsumo,
    cambiarEstadoInsumo,
    getInsumosDependencias,
    mapInsumoToSupply,
    mapSupplyToDTO,
    type InsumosDependencias,
} from '../services/insumosService';
import { getProveedores } from '../services/proveedoresService';
import { InsumoDetailModal } from '../components/InsumoDetailModal';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Supply {
    id:              number;
    name:            string;
    description:     string;
    price:           number;
    unit:            string;
    cantidad:        number | null;
    proveedores:     { id: number; nombre: string }[];
    proveedoresIds:  number[];
    proveedorNombre: string | null;
    status:          boolean;
}

// ── cantidad eliminado del formulario; se gestiona solo vía compras ──────────
interface FormData {
    name:           string;
    description:    string;
    price:          string;
    unit:           string;
    proveedoresIds: number[];
    status:         boolean;
}

interface FormErrors {
    name?:        string;
    description?: string;
    price?:       string;
    unit?:        string;
}

// ── Validación frontend ───────────────────────────────────────────────────────
function validarFormulario(data: FormData): FormErrors {
    const errs: FormErrors = {};

    if (!data.name.trim())
        errs.name = 'El nombre es obligatorio';
    else if (data.name.trim().length < 2)
        errs.name = 'Mínimo 2 caracteres';
    else if (data.name.trim().length > 30)
        errs.name = 'Máximo 30 caracteres';

    if (data.description && data.description.trim().length > 255)
        errs.description = 'Máximo 255 caracteres';

    if (!data.unit.trim())
        errs.unit = 'La unidad es obligatoria';

    return errs;
}

// ── Banner de notificación inline ─────────────────────────────────────────────
type BannerVariant = 'success' | 'error' | 'warning' | 'info';
interface BannerMsg { text: string; variant: BannerVariant; }

const bannerStyles: Record<BannerVariant, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50   border-red-200   text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info:    'bg-blue-50  border-blue-200  text-blue-800',
};
const bannerIcons: Record<BannerVariant, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
    error:   <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info:    <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

// ── Componente de error de campo ──────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{msg}
        </p>
    );
}

const Sf = {
    label: {
        fontSize: 11, fontWeight: 600, color: '#6b7280',
        textTransform: 'uppercase' as const, letterSpacing: '0.05em',
        marginBottom: 6, display: 'block',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
export function SupplyManagement() {
    const [supplies, setSupplies]       = useState<Supply[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const [proveedores, setProveedores]         = useState<{ id: number; nombre: string }[]>([]);
    const [proveedorQuery, setProveedorQuery]   = useState('');
    const [proveedorOpen, setProveedorOpen]     = useState(false);

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingSupply, setEditingSupply]   = useState<Supply | null>(null);
    const [viewingSupply, setViewingSupply]   = useState<Supply | null>(null);
    const [deletingSupply, setDeletingSupply] = useState<Supply | null>(null);
    const [deleteCheck, setDeleteCheck]       = useState<(InsumosDependencias & { loading: boolean }) | null>(null);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);

    const [searchTerm, setSearchTerm]   = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Banner global
    const [banner, setBanner] = useState<BannerMsg | null>(null);
    const showBanner = useCallback((text: string, variant: BannerVariant = 'info') => {
        setBanner({ text, variant });
        setTimeout(() => setBanner(null), 5000);
    }, []);

    // Banner de fila (inactivo al intentar editar o eliminar)
    const [inactiveBannerId, setInactiveBannerId]         = useState<number | null>(null);
    const [inactiveBannerAction, setInactiveBannerAction] = useState<'edit' | 'delete' | null>(null);
    const triggerInactiveBanner = (id: number, action: 'edit' | 'delete') => {
        setInactiveBannerId(id);
        setInactiveBannerAction(action);
        setTimeout(() => { setInactiveBannerId(null); setInactiveBannerAction(null); }, 4000);
    };

    // Errores de formulario
    const [formErrors, setFormErrors]           = useState<FormErrors>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // cantidad eliminado — se inicializa en 0 desde el backend al crear
    const emptyForm: FormData = {
        name: '', description: '', price: '0', unit: 'Unidades',
        proveedoresIds: [], status: true,
    };
    const [formData, setFormData] = useState<FormData>(emptyForm);

    // Revalidar en tiempo real
    useEffect(() => {
        if (submitAttempted) setFormErrors(validarFormulario(formData));
    }, [formData, submitAttempted]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchInsumos = async () => {
        try {
            setLoading(true);
            const data = await getInsumos();
            setSupplies(data.map(mapInsumoToSupply));
        } catch (error: any) {
            toast.error(`Error al cargar insumos: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchProveedores = async () => {
        try {
            const data = await getProveedores();
            setProveedores(
                data
                    .filter(p => p.estado === 'activo')
                    .map(p => ({ id: p.id, nombre: p.nombreEmpresa }))
            );
        } catch { /* silencioso */ }
    };

    useEffect(() => { fetchInsumos(); fetchProveedores(); }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const resetForm = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setSubmitAttempted(false);
        setEditingSupply(null);
        setProveedorQuery('');
        setProveedorOpen(false);
        setShowModal(false);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);

        const errs = validarFormulario(formData);
        setFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            showBanner('Corrige los errores del formulario antes de continuar', 'warning');
            return;
        }

        try {
            setSaving(true);
            // cantidad no viene del formulario; se envía 0 al crear, se omite al editar
            const dto = mapSupplyToDTO({ ...formData, cantidad: '0' });

            if (editingSupply) {
                await updateInsumo(editingSupply.id, dto);
                showBanner('Insumo actualizado correctamente', 'success');
                toast.success('Insumo actualizado exitosamente');
            } else {
                await createInsumo(dto);
                showBanner('Insumo creado exitosamente', 'success');
                toast.success('Insumo creado exitosamente');
            }
            await fetchInsumos();
            resetForm();
        } catch (error: any) {
            const errores: string[] = error.errores ?? [];
            if (errores.length > 0) {
                const backendFieldErrors: FormErrors = {};
                errores.forEach((msg: string) => {
                    const lower = msg.toLowerCase();
                    if (lower.includes('nombre'))         backendFieldErrors.name        = msg;
                    else if (lower.includes('precio'))    backendFieldErrors.price       = msg;
                    else if (lower.includes('unidad'))    backendFieldErrors.unit        = msg;
                    else if (lower.includes('descripci')) backendFieldErrors.description = msg;
                    else toast.error(msg);
                });
                if (Object.keys(backendFieldErrors).length > 0) {
                    setFormErrors(backendFieldErrors);
                    showBanner('Corrige los errores del formulario antes de continuar', 'warning');
                } else {
                    showBanner(errores[0], 'error');
                }
            } else {
                showBanner(`Error: ${error.message}`, 'error');
                toast.error(`Error: ${error.message}`);
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Editar ────────────────────────────────────────────────────────────────
    const handleEdit = (supply: Supply) => {
        if (!supply.status) {
            triggerInactiveBanner(supply.id, 'edit');
            return;
        }
        setFormData({
            name:           supply.name,
            description:    supply.description,
            price:          supply.price.toString(),
            unit:           supply.unit,
            // cantidad no se edita manualmente; se omite del formulario
            proveedoresIds: supply.proveedoresIds,
            status:         supply.status,
        });
        setFormErrors({});
        setSubmitAttempted(false);
        setProveedorQuery('');
        setProveedorOpen(false);
        setEditingSupply(supply);
        setShowModal(true);
    };

    // ── Toggle estado ─────────────────────────────────────────────────────────
    const handleToggleStatus = async (supply: Supply) => {
        const nuevoEstado = supply.status ? 'agotado' : 'disponible';
        setSupplies(prev => prev.map(s =>
            s.id === supply.id ? { ...s, status: !s.status } : s
        ));
        setTogglingIds(prev => new Set(prev).add(supply.id));
        try {
            await cambiarEstadoInsumo(supply.id, nuevoEstado);
            toast.success(`Insumo marcado como ${nuevoEstado}`);
        } catch (error: any) {
            setSupplies(prev => prev.map(s =>
                s.id === supply.id ? { ...s, status: supply.status } : s
            ));
            toast.error(`Error: ${error.message}`);
        } finally {
            setTogglingIds(prev => { const n = new Set(prev); n.delete(supply.id); return n; });
        }
    };

    // ── Eliminar ──────────────────────────────────────────────────────────────
    const handleDelete = async (supply: Supply) => {
        if (!supply.status) {
            triggerInactiveBanner(supply.id, 'delete');
            return;
        }
        setDeletingSupply(supply);
        setDeleteCheck({ loading: true, enUso: false, compras: [], productos: [], fichasTecnicas: [] });
        setDeleteConfirmed(false);
        setShowDeleteModal(true);
        try {
            const deps = await getInsumosDependencias(supply.id);
            setDeleteCheck({ loading: false, ...deps });
        } catch {
            setDeleteCheck({ loading: false, enUso: false, compras: [], productos: [], fichasTecnicas: [] });
        }
    };

    const confirmDelete = async () => {
        if (!deletingSupply) return;
        try {
            setSaving(true);
            await deleteInsumo(deletingSupply.id);
            showBanner('Insumo eliminado exitosamente', 'success');
            toast.success('Insumo eliminado exitosamente');
            await fetchInsumos();
        } catch (error: any) {
            toast.error(`No se puede eliminar: ${error.message}`);
            showBanner(`No se puede eliminar: ${error.message}`, 'error');
        } finally {
            setSaving(false);
            setShowDeleteModal(false);
            setDeletingSupply(null);
            setDeleteCheck(null);
            setDeleteConfirmed(false);
        }
    };

    // ── Filtros y paginación ──────────────────────────────────────────────────
    const filteredSupplies = supplies.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages      = Math.ceil(filteredSupplies.length / itemsPerPage);
    const currentSupplies = filteredSupplies.slice(
        (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">

            {/* ── Banner global ──────────────────────────────────────────── */}
            {banner && (
                <div className={`flex items-center gap-3 border rounded-xl px-5 py-3 shadow-sm ${bannerStyles[banner.variant]}`}>
                    {bannerIcons[banner.variant]}
                    <span className="text-sm font-medium flex-1">{banner.text}</span>
                    <button onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Insumos</h1>
                    <p className="text-blue-800">Administra el inventario de insumos</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Nuevo Insumo
                </Button>
            </div>

            {/* ── Filtros ─────────────────────────────────────────────────── */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <Input
                                placeholder="Buscar por nombre o descripción..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 w-full"
                            />
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap self-center">
                            {filteredSupplies.length} insumo(s)
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* ── Tabla ───────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando insumos...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Insumo</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Proveedor</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Precio</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Unidad</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSupplies.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-gray-500">
                                                No se encontraron insumos
                                            </td>
                                        </tr>
                                    ) : currentSupplies.map((supply) => {
                                        const isToggling    = togglingIds.has(supply.id);
                                        const isAgotado     = !supply.status;
                                        const showRowBanner = inactiveBannerId === supply.id;

                                        return (
                                            <React.Fragment key={supply.id}>
                                                <tr className={`border-b border-blue-100 transition-colors ${
                                                    isAgotado ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'
                                                }`}>

                                                    {/* Insumo */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                                                isAgotado ? 'bg-gray-200' : 'bg-blue-100'
                                                            }`}>
                                                                <Package className={`w-5 h-5 ${isAgotado ? 'text-gray-400' : 'text-blue-600'}`} />
                                                            </div>
                                                            <p className={`font-semibold text-sm ${isAgotado ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                {supply.name}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Proveedor */}
                                                    <td className="py-4 px-6">
                                                        {supply.proveedores.length === 0 ? (
                                                            <span className={`text-sm ${isAgotado ? 'text-gray-400' : 'text-gray-700'}`}>—</span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1">
                                                                {supply.proveedores.map(p => (
                                                                    <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full ${isAgotado ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-800'}`}>
                                                                        {p.nombre}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Precio */}
                                                    <td className="py-4 px-6">
                                                        <p className={`text-sm font-medium ${isAgotado ? 'text-gray-400' : 'text-gray-900'}`}>
                                                            ${supply.price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                                        </p>
                                                    </td>

                                                    {/* Cantidad — solo lectura, se actualiza vía compras */}
                                                    <td className="py-4 px-6">
                                                        <p className={`text-sm ${isAgotado ? 'text-gray-400' : 'text-gray-700'}`}>
                                                            {supply.cantidad ?? 0}
                                                        </p>
                                                    </td>

                                                    {/* Unidad */}
                                                    <td className="py-4 px-6">
                                                        <Badge variant="secondary">{supply.unit}</Badge>
                                                    </td>

                                                    {/* Estado */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={supply.status}
                                                                onCheckedChange={() => handleToggleStatus(supply)}
                                                                disabled={isToggling}
                                                            />
                                                            {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        </div>
                                                    </td>

                                                    {/* Acciones */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-2">

                                                            {/* Ver */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => { setViewingSupply(supply); setShowDetailModal(true); }}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>

                                                            {/* Editar */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleEdit(supply)}
                                                                disabled={isToggling}
                                                                title={isAgotado ? 'Insumo inactivo' : 'Editar'}
                                                                className={`border transition-all duration-200 ${
                                                                    isAgotado
                                                                        ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>

                                                            {/* Eliminar */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleDelete(supply)}
                                                                disabled={isToggling}
                                                                title={isAgotado ? 'Insumo inactivo' : 'Eliminar insumo'}
                                                                className={`border transition-all duration-200 ${
                                                                    isAgotado
                                                                        ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>

                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Banner inline fila (inactivo al intentar editar o eliminar) ── */}
                                                {showRowBanner && (
                                                    <tr className="border-b border-amber-100">
                                                        <td colSpan={7} className="px-6 py-0">
                                                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                                                                <span>
                                                                    <strong>Insumo inactivo:</strong>{' '}
                                                                    {inactiveBannerAction === 'delete'
                                                                        ? 'No puedes eliminar un insumo inactivo. Actívalo primero usando el interruptor de estado.'
                                                                        : 'No puedes editar un insumo inactivo. Actívalo primero usando el interruptor de estado.'
                                                                    }
                                                                </span>
                                                                <button
                                                                    onClick={() => { setInactiveBannerId(null); setInactiveBannerAction(null); }}
                                                                    className="ml-auto opacity-60 hover:opacity-100"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <SmartPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredSupplies.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </CardContent>
                </Card>
            )}

            {/* ── MODAL CREAR / EDITAR ────────────────────────────────────── */}
            <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent
                    className="p-0 gap-0 overflow-hidden"
                    style={{
                        width: '96vw', maxWidth: 680, height: 'auto', maxHeight: '92vh',
                        display: 'flex', flexDirection: 'column',
                    }}
                >
                    {/* HEADER */}
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
                            <Package style={{ width: 20, height: 20, color: '#fff' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
                            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.2, margin: 0 }}>
                                {editingSupply ? 'Editar Insumo' : 'Nuevo Insumo'}
                            </DialogTitle>
                            <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                {editingSupply ? 'Modifica los datos del insumo.' : 'Completa el formulario para registrar un nuevo insumo.'}
                            </DialogDescription>
                        </div>
                    </header>

                    {/* BODY */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f9fafb' }}>
                        <form id="supply-form" onSubmit={handleSubmit} noValidate>

                            {/* Nombre */}
                            <div style={{ marginBottom: 18 }}>
                                <label style={Sf.label}>
                                    Nombre del insumo <span style={{ color: '#f87171' }}>*</span>
                                    <span style={{ marginLeft: 4, fontSize: 10, color: '#9ca3af', textTransform: 'none', fontWeight: 400 }}>(2–30 caracteres)</span>
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    maxLength={30} placeholder="Ej: Aceite Motor 5W-30"
                                    className={formErrors.name ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    style={{ height: 40, background: '#fff', fontSize: 14 }}
                                />
                                {!formErrors.name && (
                                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                        {formData.name.length}/30 caracteres
                                    </p>
                                )}
                                <FieldError msg={formErrors.name} />
                            </div>

                            {/* Descripción */}
                            <div style={{ marginBottom: 18 }}>
                                <label style={Sf.label}>
                                    Descripción
                                    <span style={{ marginLeft: 4, fontSize: 10, color: '#9ca3af', textTransform: 'none', fontWeight: 400 }}>(máx. 255 caracteres)</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    maxLength={255} rows={3}
                                    placeholder="Descripción detallada del insumo"
                                    style={{
                                        width: '100%', border: `1px solid ${formErrors.description ? '#f87171' : '#e5e7eb'}`,
                                        borderRadius: 6, padding: '8px 12px', fontSize: 14, resize: 'none',
                                        background: '#fff', outline: 'none',
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                    <FieldError msg={formErrors.description} />
                                    <span style={{ fontSize: 11, marginLeft: 'auto', color: formData.description.length > 230 ? '#f59e0b' : '#9ca3af' }}>
                                        {formData.description.length}/255
                                    </span>
                                </div>
                            </div>

                            {/* Proveedores (multi-select) */}
                            <div style={{ marginBottom: 18, position: 'relative' }}>
                                <label style={Sf.label}>
                                    Proveedores
                                    <span style={{ marginLeft: 4, fontSize: 10, color: '#9ca3af', textTransform: 'none', fontWeight: 400 }}>(opcional — puedes agregar varios)</span>
                                </label>

                                {formData.proveedoresIds.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        {formData.proveedoresIds.map(id => {
                                            const p = proveedores.find(pr => pr.id === id);
                                            return p ? (
                                                <span key={id} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    background: '#dbeafe', color: '#1e40af', fontSize: 12,
                                                    fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                                                }}>
                                                    {p.nombre}
                                                    <button type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, proveedoresIds: prev.proveedoresIds.filter(i => i !== id) }))}
                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 0, lineHeight: 0 }}
                                                    >
                                                        <X style={{ width: 12, height: 12 }} />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    border: '1px solid #e5e7eb', borderRadius: 6,
                                    background: '#fff', overflow: 'visible',
                                }}>
                                    <Search style={{ width: 14, height: 14, color: '#9ca3af', marginLeft: 12, flexShrink: 0 }} />
                                    <input
                                        type="text" value={proveedorQuery}
                                        placeholder="Buscar proveedor por nombre..."
                                        style={{ flex: 1, padding: '0 10px', height: 40, fontSize: 14, background: 'transparent', border: 'none', outline: 'none' }}
                                        onChange={e => { setProveedorQuery(e.target.value); setProveedorOpen(true); }}
                                        onFocus={() => setProveedorOpen(true)}
                                    />
                                    {proveedorQuery && (
                                        <button type="button" onClick={() => { setProveedorQuery(''); setProveedorOpen(false); }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 10px', color: '#9ca3af' }}>
                                            <X style={{ width: 14, height: 14 }} />
                                        </button>
                                    )}
                                </div>

                                {proveedorOpen && proveedorQuery && (
                                    <div style={{
                                        position: 'absolute', zIndex: 9999, width: '100%', marginTop: 4,
                                        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: 180, overflowY: 'auto',
                                    }}>
                                        {(() => {
                                            const filtrados = proveedores
                                                .filter(p => p.nombre.toLowerCase().includes(proveedorQuery.toLowerCase()) && !formData.proveedoresIds.includes(p.id))
                                                .slice(0, 8);
                                            return filtrados.length === 0 ? (
                                                <p style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>No se encontraron proveedores</p>
                                            ) : filtrados.map(p => (
                                                <button key={p.id} type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setFormData(prev => ({ ...prev, proveedoresIds: [...prev.proveedoresIds, p.id] }));
                                                        setProveedorQuery(''); setProveedorOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%', textAlign: 'left', padding: '8px 16px',
                                                        fontSize: 14, border: 'none', cursor: 'pointer', background: '#fff',
                                                        color: '#1f2937',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                                >
                                                    {p.nombre}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Unidad de medida */}
                            <div style={{ marginBottom: 18 }}>
                                <label style={Sf.label}>Unidad de medida <span style={{ color: '#f87171' }}>*</span></label>
                                <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                                    <SelectTrigger className={formErrors.unit ? 'border-red-400' : ''} style={{ height: 40, background: '#fff', fontSize: 14 }}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Unidades">Unidades</SelectItem>
                                        <SelectItem value="Kilogramos">Kilogramos</SelectItem>
                                        <SelectItem value="Gramos">Gramos</SelectItem>
                                        <SelectItem value="Metros">Metros</SelectItem>
                                        <SelectItem value="Par">Par</SelectItem>
                                        <SelectItem value="Rollo">Rollo</SelectItem>
                                        <SelectItem value="Galón">Galón</SelectItem>
                                        <SelectItem value="Juegos">Juegos</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError msg={formErrors.unit} />
                                <p style={{ marginTop: 6, fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Info style={{ width: 12, height: 12, flexShrink: 0 }} />
                                    El precio se actualiza automáticamente al registrar una compra (siempre se conserva el mayor).
                                </p>
                            </div>

                            {/* Estado — solo al editar */}
                            {editingSupply && (
                                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Switch
                                            checked={formData.status}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
                                        />
                                        <label style={{ fontSize: 13, color: '#4b5563' }}>
                                            {formData.status ? 'Disponible' : 'Agotado'}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* FOOTER */}
                    <footer style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        gap: 8, padding: '12px 24px',
                        borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
                    }}>
                        <Button variant="outline" onClick={resetForm} disabled={saving} style={{ height: 36, padding: '0 16px' }}>
                            Cancelar
                        </Button>
                        <Button
                            form="supply-form" type="submit" disabled={saving}
                            style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px' }}
                        >
                            {saving && <Loader2 style={{ width: 16, height: 16, marginRight: 8 }} className="animate-spin" />}
                            {editingSupply ? 'Actualizar Insumo' : 'Crear Insumo'}
                        </Button>
                    </footer>
                </DialogContent>
            </Dialog>

            {/* ── MODAL VER DETALLE ───────────────────────────────────────── */}
            <InsumoDetailModal
                open={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                insumo={viewingSupply}
            />

            {/* ── MODAL CONFIRMAR ELIMINACIÓN ─────────────────────────────── */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
                if (!open) {
                    setShowDeleteModal(false);
                    setDeletingSupply(null);
                    setDeleteCheck(null);
                    setDeleteConfirmed(false);
                }
            }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <Trash2 className="w-5 h-5" />Eliminar Insumo
                            </DialogTitle>
                            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                        </DialogHeader>

                        {deletingSupply && (
                            <div className="mt-4 space-y-3">
                                {/* Tarjeta del insumo */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-semibold text-blue-900">{deletingSupply.name}</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {deletingSupply.unit} · ${deletingSupply.price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>

                                {/* Verificando dependencias */}
                                {deleteCheck?.loading && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        Verificando dependencias del insumo...
                                    </div>
                                )}

                                {/* Bloqueado: hay dependencias */}
                                {!deleteCheck?.loading && deleteCheck?.enUso && (
                                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                                        <div className="text-sm space-y-2">
                                            <p className="font-semibold">No es posible eliminar este insumo</p>
                                            <p className="text-amber-700">
                                                Está siendo utilizado en otras partes del sistema. Retíralo primero de:
                                            </p>
                                            <ul className="space-y-1 text-amber-800">
                                                {deleteCheck.compras.length > 0 && (
                                                    <li className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                        <strong>{deleteCheck.compras.length}</strong>&nbsp;compra(s) registrada(s)
                                                    </li>
                                                )}
                                                {deleteCheck.productos.length > 0 && (
                                                    <li className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                        <strong>{deleteCheck.productos.length}</strong>&nbsp;producto(s) asociado(s)
                                                        <span className="text-xs text-amber-600">
                                                            ({deleteCheck.productos.slice(0, 2).map(p => p.nombreProducto).join(', ')}
                                                            {deleteCheck.productos.length > 2 ? '...' : ''})
                                                        </span>
                                                    </li>
                                                )}
                                                {deleteCheck.fichasTecnicas.length > 0 && (
                                                    <li className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                        <strong>{deleteCheck.fichasTecnicas.length}</strong>&nbsp;ficha(s) técnica(s)
                                                        <span className="text-xs text-amber-600">
                                                            ({deleteCheck.fichasTecnicas.slice(0, 2).map(f => f.codigoFicha).join(', ')}
                                                            {deleteCheck.fichasTecnicas.length > 2 ? '...' : ''})
                                                        </span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Libre: sin dependencias */}
                                {!deleteCheck?.loading && deleteCheck && !deleteCheck.enUso && (
                                    <>
                                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
                                            <Info className="w-4 h-4 shrink-0 text-blue-500" />
                                            <span>Este insumo no está en uso y puede eliminarse de forma segura.</span>
                                        </div>
                                        {!deleteConfirmed ? (
                                            <p className="text-sm text-gray-600">
                                                ¿Estás seguro de que deseas eliminarlo permanentemente?
                                            </p>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg px-4 py-3 text-sm">
                                                <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600" />
                                                Confirma que entiendes que esta acción es irreversible.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletingSupply(null);
                                    setDeleteCheck(null);
                                    setDeleteConfirmed(false);
                                }}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>

                            {/* Bloqueado: hay dependencias */}
                            {!deleteCheck?.loading && deleteCheck?.enUso && (
                                <Button disabled className="bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                                    No se puede eliminar
                                </Button>
                            )}

                            {/* Libre: confirmación en 2 pasos */}
                            {!deleteCheck?.loading && deleteCheck && !deleteCheck.enUso && (
                                <>
                                    {!deleteConfirmed ? (
                                        <Button
                                            onClick={() => setDeleteConfirmed(true)}
                                            className="bg-white hover:bg-red-50 text-blue-900 border border-blue-900"
                                        >
                                            Sí, eliminar
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={confirmDelete}
                                            disabled={saving}
                                            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                                        >
                                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            Confirmar eliminación
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}