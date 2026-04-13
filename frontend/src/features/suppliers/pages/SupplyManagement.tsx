// src/features/supplies/SupplyManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Switch }                from '@/shared/components/ui/switch';
import { Badge }                 from '@/shared/components/ui/badge';
import { Button }                from '@/shared/components/ui/button';
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
    mapInsumoToSupply,
    mapSupplyToDTO,
} from '../services/insumosService';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Supply {
    id:           number;
    name:         string;
    description:  string;
    price:        number;
    unit:         string;
    status:       boolean;
    stockCurrent: number;
}

interface FormData {
    name:        string;
    description: string;
    price:       string;
    unit:        string;
    status:      boolean;
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
    else if (data.name.trim().length > 50)
        errs.name = 'Máximo 50 caracteres';

    if (data.description && data.description.trim().length > 255)
        errs.description = 'Máximo 255 caracteres';

    if (!data.price.trim())
        errs.price = 'El precio es obligatorio';
    else if (isNaN(parseFloat(data.price)) || parseFloat(data.price) < 0)
        errs.price = 'Ingresa un precio válido (≥ 0)';

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

// ─────────────────────────────────────────────────────────────────────────────
export function SupplyManagement() {
    const [supplies, setSupplies]       = useState<Supply[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingSupply, setEditingSupply]   = useState<Supply | null>(null);
    const [viewingSupply, setViewingSupply]   = useState<Supply | null>(null);
    const [deletingSupply, setDeletingSupply] = useState<Supply | null>(null);

    const [searchTerm, setSearchTerm]   = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Banner global
    const [banner, setBanner] = useState<BannerMsg | null>(null);
    const showBanner = useCallback((text: string, variant: BannerVariant = 'info') => {
        setBanner({ text, variant });
        setTimeout(() => setBanner(null), 5000);
    }, []);

    // Banner de fila (insumo agotado al intentar eliminar)
    const [inactiveBannerId, setInactiveBannerId] = useState<number | null>(null);
    const triggerInactiveBanner = (id: number) => {
        setInactiveBannerId(id);
        setTimeout(() => setInactiveBannerId(null), 4000);
    };

    // Errores de formulario
    const [formErrors, setFormErrors]         = useState<FormErrors>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const emptyForm: FormData = {
        name: '', description: '', price: '', unit: 'Unidades', status: true,
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

    useEffect(() => { fetchInsumos(); }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const resetForm = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setSubmitAttempted(false);
        setEditingSupply(null);
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
            const dto = mapSupplyToDTO(formData);

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
        setFormData({
            name:        supply.name,
            description: supply.description,
            price:       supply.price.toString(),
            unit:        supply.unit,
            status:      supply.status,
        });
        setFormErrors({});
        setSubmitAttempted(false);
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
    const handleDelete = (supply: Supply) => {
        if (supply.status) {
            triggerInactiveBanner(supply.id);
            return;
        }
        setDeletingSupply(supply);
        setShowDeleteModal(true);
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
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Insumo</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Descripción</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Precio</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Unidad</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSupplies.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-500">
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

                                                    {/* Descripción */}
                                                    <td className="py-4 px-6">
                                                        <p className={`text-sm truncate max-w-xs ${isAgotado ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {supply.description || '—'}
                                                        </p>
                                                    </td>

                                                    {/* Precio */}
                                                    <td className="py-4 px-6">
                                                        <p className={`text-sm font-medium ${isAgotado ? 'text-gray-400' : 'text-gray-900'}`}>
                                                            ${supply.price.toLocaleString()}
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
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>

                                                            {/* Eliminar — solo si agotado */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleDelete(supply)}
                                                                disabled={isToggling}
                                                                title={supply.status ? 'Márcalo como agotado para eliminar' : 'Eliminar insumo'}
                                                                className={`border transition-all duration-200 ${
                                                                    supply.status
                                                                        ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>

                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Banner inline fila (insumo disponible → no se puede eliminar) ── */}
                                                {showRowBanner && (
                                                    <tr className="border-b border-amber-100">
                                                        <td colSpan={6} className="px-6 py-0">
                                                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                                                                <span>
                                                                    <strong>Insumo disponible:</strong>{' '}
                                                                    Márcalo como agotado usando el interruptor de estado antes de eliminarlo.
                                                                </span>
                                                                <button
                                                                    onClick={() => setInactiveBannerId(null)}
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
                        {totalPages > 1 && (
                            <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                                <Button variant="outline" size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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

            {/* ── MODAL CREAR / EDITAR ────────────────────────────────────── */}
            <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>{editingSupply ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
                            <DialogDescription>
                                {editingSupply
                                    ? 'Modifica los datos del insumo.'
                                    : 'Completa el formulario para registrar un nuevo insumo.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-4">

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Nombre del insumo <span className="text-red-500">*</span>
                                    <span className="ml-1 text-xs text-gray-400">(2–50 caracteres)</span>
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, name: e.target.value }))
                                    }
                                    maxLength={50}
                                    placeholder="Ej: Aceite Motor 5W-30"
                                    className={formErrors.name ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.name} />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Descripción
                                    <span className="ml-1 text-xs text-gray-400">(máx. 255 caracteres)</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, description: e.target.value }))
                                    }
                                    maxLength={255}
                                    rows={3}
                                    placeholder="Descripción detallada del insumo"
                                    className={`w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                                        formErrors.description
                                            ? 'border-red-400 focus:ring-red-300'
                                            : 'border-gray-200'
                                    }`}
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <FieldError msg={formErrors.description} />
                                    <span className={`text-xs ml-auto ${formData.description.length > 230 ? 'text-amber-500' : 'text-gray-400'}`}>
                                        {formData.description.length}/255
                                    </span>
                                </div>
                            </div>

                            {/* Precio + Unidad */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Precio unitario <span className="text-red-500">*</span>
                                        <span className="ml-1 text-xs text-gray-400">(≥ 0)</span>
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, price: e.target.value }))
                                        }
                                        placeholder="45000"
                                        className={formErrors.price ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.price} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Unidad de medida <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={formData.unit}
                                        onValueChange={(value) =>
                                            setFormData(prev => ({ ...prev, unit: value }))
                                        }
                                    >
                                        <SelectTrigger className={formErrors.unit ? 'border-red-400' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Unidades">Unidades</SelectItem>
                                            <SelectItem value="Litros">Litros</SelectItem>
                                            <SelectItem value="Kilogramos">Kilogramos</SelectItem>
                                            <SelectItem value="Metros">Metros</SelectItem>
                                            <SelectItem value="Juegos">Juegos</SelectItem>
                                            <SelectItem value="Cajas">Cajas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError msg={formErrors.unit} />
                                </div>
                            </div>

                            {/* Estado — solo al editar */}
                            {editingSupply && (
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center space-x-3">
                                        <Switch
                                            checked={formData.status}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => ({ ...prev, status: checked }))
                                            }
                                        />
                                        <label className="text-sm text-gray-600">
                                            {formData.status ? 'Disponible' : 'Agotado'}
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingSupply ? 'Actualizar Insumo' : 'Crear Insumo'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── MODAL VER DETALLE ───────────────────────────────────────── */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Detalles del Insumo</DialogTitle>
                            <DialogDescription>Información completa del insumo seleccionado.</DialogDescription>
                        </DialogHeader>
                        {viewingSupply && (
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                    <div className="col-span-2 flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Package className="w-7 h-7 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-blue-900 text-lg">{viewingSupply.name}</p>
                                            <p className="text-sm text-gray-500">{viewingSupply.description || '—'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Precio unitario</p>
                                        <p className="font-semibold text-sm">${viewingSupply.price.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Unidad de medida</p>
                                        <Badge variant="secondary">{viewingSupply.unit}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Estado</p>
                                        <Badge className={viewingSupply.status
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'bg-gray-100 text-gray-500'}>
                                            {viewingSupply.status ? 'Disponible' : 'Agotado'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                    <Button
                                        onClick={() => { handleEdit(viewingSupply); setShowDetailModal(false); }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Editar Insumo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── MODAL CONFIRMAR ELIMINACIÓN ─────────────────────────────── */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
                if (!open) { setShowDeleteModal(false); setDeletingSupply(null); }
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
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-semibold text-blue-900">{deletingSupply.name}</p>
                                    <p className="text-sm text-blue-700 mt-1">{deletingSupply.unit} · ${deletingSupply.price.toLocaleString()}</p>
                                </div>
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold">¿Estás seguro?</p>
                                        <p className="text-amber-700 mt-0.5">El insumo será eliminado permanentemente del sistema.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button variant="outline"
                                onClick={() => { setShowDeleteModal(false); setDeletingSupply(null); }}
                                disabled={saving}>
                                Cancelar
                            </Button>
                            <Button onClick={confirmDelete} disabled={saving}
                                className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-900">
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Sí, eliminar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}