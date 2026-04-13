import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import {
    Search, Plus, Edit, Eye, Trash2, Tag, ChevronLeft, ChevronRight,
    Loader2, Info, AlertTriangle, Lock, X,
} from 'lucide-react';
import {
    getCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria,
} from '../services/categoriaProductosService';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Categoria {
    id: number;
    nombreCategoria: string;
    descripcion: string | null;
    estado: 'activo' | 'inactivo';
    productos?: { id: number; nombreProducto: string; precio: number; stock: number }[];
}
interface FormData { nombreCategoria: string; descripcion: string; estado: 'activo' | 'inactivo'; }
interface FormErrors { nombreCategoria?: string; descripcion?: string; }

// ─── Regex ────────────────────────────────────────────────────────────────────
const SOLO_TEXTO_REGEX       = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]*$/;
const SOLO_DESCRIPCION_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]*$/;
const CHARS_BLOQUEADOS_TEXTO = /[$%@#&*|\\^`~<>=+{}[\]!?¡¿"';:]/;
const CHARS_BLOQUEADOS_DESC  = /[$%@#&*|\\^`~<>=+{}[\]¡¿]/;

// ─── Validación ───────────────────────────────────────────────────────────────
function validateCategoryForm(form: FormData): FormErrors {
    const errors: FormErrors = {};
    if (!form.nombreCategoria.trim())
        errors.nombreCategoria = 'El nombre es obligatorio.';
    else if (form.nombreCategoria.trim().length < 2)
        errors.nombreCategoria = 'Mínimo 2 caracteres.';
    else if (form.nombreCategoria.trim().length > 50)
        errors.nombreCategoria = 'El nombre no puede superar 50 caracteres.';
    else if (!SOLO_TEXTO_REGEX.test(form.nombreCategoria))
        errors.nombreCategoria = 'El nombre no puede contener caracteres especiales como $, %, @, #, &, *, etc.';

    if (form.descripcion && form.descripcion.trim().length > 0 && form.descripcion.trim().length < 5)
        errors.descripcion = 'La descripción debe tener al menos 5 caracteres si se ingresa.';
    else if (form.descripcion && !SOLO_DESCRIPCION_REGEX.test(form.descripcion))
        errors.descripcion = 'La descripción contiene caracteres no permitidos.';

    return errors;
}

// ─── Handlers de teclado ──────────────────────────────────────────────────────
const bloquearCaracteresTexto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const ctrl = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
    if (ctrl.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (CHARS_BLOQUEADOS_TEXTO.test(e.key)) { e.preventDefault(); toast.warning(`El carácter "${e.key}" no está permitido.`); }
};
const bloquearCaracteresDescripcion = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ctrl = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
    if (ctrl.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (CHARS_BLOQUEADOS_DESC.test(e.key)) { e.preventDefault(); toast.warning(`El carácter "${e.key}" no está permitido en la descripción.`); }
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

// ── Alerta de bloqueo ─────────────────────────────────────────────────────────
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

// ─── Formulario ───────────────────────────────────────────────────────────────
interface CategoryFormProps {
    formData: FormData;
    onChange: (field: keyof FormData, value: string) => void;
    errors: FormErrors;
    touched: Partial<Record<keyof FormData, boolean>>;
    onBlur: (field: keyof FormData) => void;
    duplicateOf: string | null;
}

const CategoryForm = ({ formData, onChange, errors, touched, onBlur, duplicateOf }: CategoryFormProps) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm text-gray-700 mb-2">
                Nombre de la categoría <span className="text-red-500">*</span>
            </label>
            <Input
                placeholder="Ej: Frenos"
                value={formData.nombreCategoria}
                onChange={(e) => onChange('nombreCategoria', e.target.value)}
                onBlur={() => onBlur('nombreCategoria')}
                onKeyDown={bloquearCaracteresTexto}
                maxLength={50}
                autoFocus
                className={
                    (touched.nombreCategoria && errors.nombreCategoria) || duplicateOf
                        ? 'border-amber-400 focus-visible:ring-amber-300'
                        : ''
                }
            />
            <FieldError message={touched.nombreCategoria ? errors.nombreCategoria : undefined} />
            {duplicateOf && !errors.nombreCategoria && (
                <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Ya existe una categoría con ese nombre (no se distingue entre mayúsculas y minúsculas).
                </p>
            )}
        </div>
        <div>
            <label className="block text-sm text-gray-700 mb-2">Descripción</label>
            <Textarea
                placeholder="Descripción de la categoría (opcional, mín. 5 caracteres si se ingresa)"
                value={formData.descripcion}
                onChange={(e) => onChange('descripcion', e.target.value)}
                onKeyDown={bloquearCaracteresDescripcion}
                rows={3} maxLength={255}
                className={touched.descripcion && errors.descripcion ? 'border-red-400 focus-visible:ring-red-300' : ''}
            />
            <FieldError message={touched.descripcion ? errors.descripcion : undefined} />
            <p className="text-xs text-gray-400 mt-1">{formData.descripcion.length}/255 caracteres</p>
        </div>
        <div>
            <label className="block text-sm text-gray-700 mb-2">Estado</label>
            <div className="flex items-center space-x-2 pt-1">
                <Switch
                    checked={formData.estado === 'activo'}
                    onCheckedChange={(checked) => onChange('estado', checked ? 'activo' : 'inactivo')}
                />
                <span className="text-sm text-gray-600">{formData.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
            </div>
        </div>
    </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────
export function ProductCategoryManagement() {
    const [categories, setCategories]   = useState<Categoria[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 5;

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);

    const [editingCategory, setEditingCategory]   = useState<Categoria | null>(null);
    const [viewingCategory, setViewingCategory]   = useState<Categoria | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Categoria | null>(null);
    const [loadingDetail, setLoadingDetail]       = useState(false);
    const [deleteHasProducts, setDeleteHasProducts]   = useState(false);
    const [loadingDeleteCheck, setLoadingDeleteCheck] = useState(false);

    // ── Estado para alerta de bloqueo ─────────────────────────────────────────
    const [blockedAlertId, setBlockedAlertId] = useState<number | null>(null);

    const [formData, setFormData] = useState<FormData>({ nombreCategoria: '', descripcion: '', estado: 'activo' });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [touched, setTouched]       = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [duplicateOf, setDuplicateOf] = useState<string | null>(null);

    const fetchCategorias = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCategorias();
            setCategories(data);
        } catch (error: any) {
            toast.error(`Error al cargar categorías: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategorias(); }, [fetchCategorias]);
    useEffect(() => { setFormErrors(validateCategoryForm(formData)); }, [formData]);

    useEffect(() => {
        const nombre = formData.nombreCategoria.trim().toLowerCase();
        if (!nombre) { setDuplicateOf(null); return; }
        const existente = categories.find((c) => {
            if (editingCategory && c.id === editingCategory.id) return false;
            return c.nombreCategoria.trim().toLowerCase() === nombre;
        });
        setDuplicateOf(existente ? existente.nombreCategoria : null);
    }, [formData.nombreCategoria, categories, editingCategory]);

    const handleToggleEstado = async (category: Categoria) => {
        const nuevoEstado: 'activo' | 'inactivo' = category.estado === 'activo' ? 'inactivo' : 'activo';
        // Si se activa, cerrar alerta de ese item
        if (nuevoEstado === 'activo' && blockedAlertId === category.id) setBlockedAlertId(null);
        setCategories(prev => prev.map(c => c.id === category.id ? { ...c, estado: nuevoEstado } : c));
        setTogglingIds(prev => new Set(prev).add(category.id));
        try {
            await updateCategoria(category.id, {
                nombreCategoria: category.nombreCategoria,
                descripcion: category.descripcion ?? '',
                estado: nuevoEstado,
            });
            toast.success(`Categoría ${nuevoEstado === 'activo' ? 'activada' : 'desactivada'} correctamente`);
        } catch (error: any) {
            setCategories(prev => prev.map(c => c.id === category.id ? { ...c, estado: category.estado } : c));
            toast.error(`Error al cambiar estado: ${error.message}`);
        } finally {
            setTogglingIds(prev => { const next = new Set(prev); next.delete(category.id); return next; });
        }
    };

    const filteredCategories = categories.filter((cat) => {
        const matchesSearch =
            cat.nombreCategoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cat.descripcion ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active'   && cat.estado === 'activo') ||
            (statusFilter === 'inactive' && cat.estado === 'inactivo');
        return matchesSearch && matchesStatus;
    });

    const totalPages   = Math.ceil(filteredCategories.length / itemsPerPage);
    const currentItems = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const resetForm = () => {
        setFormData({ nombreCategoria: '', descripcion: '', estado: 'activo' });
        setFormErrors({});
        setTouched({});
        setEditingCategory(null);
        setDuplicateOf(null);
        setShowModal(false);
    };

    const handleInputChange = (field: keyof FormData, value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const handleBlur = (field: keyof FormData) => setTouched((prev) => ({ ...prev, [field]: true }));
    const touchAll   = () => setTouched({ nombreCategoria: true, descripcion: true });

    const handleCreate = async () => {
        touchAll();
        const errors = validateCategoryForm(formData);
        if (Object.keys(errors).length > 0) { toast.error('Completa los campos obligatorios correctamente'); return; }
        if (duplicateOf) {
            toast.error(`Ya existe la categoría "${duplicateOf}". Los nombres son únicos sin importar mayúsculas o minúsculas.`);
            return;
        }
        try {
            setSaving(true);
            await createCategoria({ ...formData, nombreCategoria: formData.nombreCategoria.trim() });
            toast.success('Categoría creada exitosamente');
            resetForm();
            fetchCategorias();
        } catch (error: any) {
            if (error.message?.toLowerCase().includes('duplicate') || error.message?.toLowerCase().includes('duplicado') || error.status === 409)
                toast.error('Ya existe una categoría con ese nombre.');
            else if (error.errores && Array.isArray(error.errores))
                error.errores.forEach((e: { campo: string; mensaje: string }) => toast.error(`${e.campo}: ${e.mensaje}`));
            else
                toast.error(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        touchAll();
        const errors = validateCategoryForm(formData);
        if (!editingCategory || Object.keys(errors).length > 0) { toast.error('Completa los campos obligatorios correctamente'); return; }
        if (duplicateOf) {
            toast.error(`Ya existe la categoría "${duplicateOf}". Los nombres son únicos sin importar mayúsculas o minúsculas.`);
            return;
        }
        try {
            setSaving(true);
            await updateCategoria(editingCategory.id, { ...formData, nombreCategoria: formData.nombreCategoria.trim() });
            toast.success('Categoría actualizada exitosamente');
            resetForm();
            fetchCategorias();
        } catch (error: any) {
            if (error.message?.toLowerCase().includes('duplicate') || error.message?.toLowerCase().includes('duplicado') || error.status === 409)
                toast.error('Ya existe una categoría con ese nombre.');
            else if (error.errores && Array.isArray(error.errores))
                error.errores.forEach((e: { campo: string; mensaje: string }) => toast.error(`${e.campo}: ${e.mensaje}`));
            else
                toast.error(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const openViewDialog = async (category: Categoria) => {
        setShowDetailModal(true); setViewingCategory(null); setLoadingDetail(true);
        try { const detail = await getCategoriaById(category.id); setViewingCategory(detail); }
        catch (error: any) { toast.error(`Error al cargar detalle: ${error.message}`); }
        finally { setLoadingDetail(false); }
    };

    const openEditDialog = (category: Categoria) => {
        setEditingCategory(category);
        setFormData({ nombreCategoria: category.nombreCategoria, descripcion: category.descripcion ?? '', estado: category.estado ?? 'activo' });
        setFormErrors({}); setTouched({}); setDuplicateOf(null);
        setShowModal(true);
    };

    const openDeleteDialog = async (category: Categoria) => {
        setDeletingCategory(category);
        setDeleteHasProducts(false);
        setDeleteConfirmed(false);
        setShowDeleteModal(true);
        setLoadingDeleteCheck(true);
        try { const detail = await getCategoriaById(category.id); setDeleteHasProducts((detail.productos?.length ?? 0) > 0); }
        catch { /* backend rechazará si hay productos */ }
        finally { setLoadingDeleteCheck(false); }
    };

    const handleDelete = async () => {
        if (!deletingCategory || deleteHasProducts) return;
        try {
            setSaving(true);
            await deleteCategoria(deletingCategory.id);
            toast.success('Categoría eliminada exitosamente');
            setShowDeleteModal(false);
            setDeletingCategory(null);
            setDeleteConfirmed(false);
            fetchCategorias();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Helper para clic en botones bloqueados ────────────────────────────────
    const handleBlockedClick = (categoryId: number) => {
        setBlockedAlertId(prev => prev === categoryId ? null : categoryId);
    };

    return (
        <div className="p-6 space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de categorías</h1>
                    <p className="text-blue-800">Administra las categorías del catálogo de productos</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCategory(null);
                        setFormData({ nombreCategoria: '', descripcion: '', estado: 'activo' });
                        setFormErrors({}); setTouched({}); setDuplicateOf(null);
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Nueva categoría
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar por nombre o descripción..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-36"
                        >
                            <option value="all">Todos</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando categorías...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">ID</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Nombre</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Descripción</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((category) => {
                                        const isToggling = togglingIds.has(category.id);
                                        const isInactive = category.estado === 'inactivo';
                                        return (
                                            <React.Fragment key={category.id}>
                                                <tr className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                                    <td className="py-4 px-6"><span className="font-mono text-gray-500 text-sm">#{category.id}</span></td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Tag className="w-4 h-4 text-blue-600 shrink-0" />
                                                            <span className="font-semibold text-blue-900">{category.nombreCategoria}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-600 text-sm">
                                                            {category.descripcion ?? <em className="text-gray-400">Sin descripción</em>}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={category.estado === 'activo'}
                                                                onCheckedChange={() => handleToggleEstado(category)}
                                                                disabled={isToggling}
                                                            />
                                                            {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-2">
                                                            {/* VER — siempre activo */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openViewDialog(category)}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>

                                                            {/* EDITAR */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => isInactive ? handleBlockedClick(category.id) : openEditDialog(category)}
                                                                className={`border ${
                                                                    isInactive
                                                                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>

                                                            {/* ELIMINAR */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => isInactive ? handleBlockedClick(category.id) : openDeleteDialog(category)}
                                                                className={`border ${
                                                                    isInactive
                                                                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Fila de alerta de bloqueo */}
                                                {blockedAlertId === category.id && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 pb-3 pt-0">
                                                            <BlockedAlert
                                                                message="Categoría inactiva: No puedes editar ni eliminar una categoría inactiva. Actívala primero usando el interruptor de estado."
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
                            {filteredCategories.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p>No se encontraron categorías</p>
                                </div>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
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
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* MODAL — CREAR / EDITAR */}
            <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
                            <DialogDescription>
                                {editingCategory
                                    ? 'Modifica la información de la categoría.'
                                    : 'Completa el formulario para agregar una nueva categoría.'}
                            </DialogDescription>
                        </DialogHeader>

                        {Object.keys(touched).length > 0 && Object.keys(formErrors).length > 0 && (
                            <div className="mt-4">
                                <InfoAlert message="Algunos campos requieren atención antes de continuar." />
                            </div>
                        )}

                        <div className="mt-4">
                            <CategoryForm
                                formData={formData}
                                onChange={handleInputChange}
                                errors={formErrors}
                                touched={touched}
                                onBlur={handleBlur}
                                duplicateOf={duplicateOf}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button variant="outline" onClick={resetForm} disabled={saving}>Cancelar</Button>
                            <Button
                                disabled={saving || !!duplicateOf}
                                onClick={() => { editingCategory ? handleEdit() : handleCreate(); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {editingCategory ? 'Actualizar categoría' : 'Crear categoría'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL — VER DETALLE */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Detalles de la categoría</DialogTitle>
                            <DialogDescription>Información completa de la categoría seleccionada.</DialogDescription>
                        </DialogHeader>
                        {loadingDetail ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : viewingCategory ? (
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">ID</p>
                                        <p className="font-mono font-semibold">#{viewingCategory.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Estado</p>
                                        <Badge className={viewingCategory.estado === 'activo' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-500'}>
                                            {viewingCategory.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase">Nombre</p>
                                        <p className="font-semibold text-blue-900 text-lg">{viewingCategory.nombreCategoria}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase">Descripción</p>
                                        <p className="text-sm text-gray-700">{viewingCategory.descripcion ?? 'Sin descripción'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        Productos asociados ({viewingCategory.productos?.length ?? 0})
                                    </p>
                                    {viewingCategory.productos && viewingCategory.productos.length > 0 ? (
                                        <div className="max-h-36 overflow-y-auto rounded border divide-y">
                                            {viewingCategory.productos.map((p) => (
                                                <div key={p.id} className="flex justify-between items-center px-3 py-1.5 text-sm">
                                                    <span className="font-medium">{p.nombreProducto}</span>
                                                    <span className="text-gray-500">Stock: {p.stock}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Sin productos asociados</p>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                    {viewingCategory.estado === 'activo' && (
                                        <Button
                                            onClick={() => { openEditDialog(viewingCategory); setShowDetailModal(false); }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Editar categoría
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL — ELIMINAR */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
                if (!open) { setShowDeleteModal(false); setDeletingCategory(null); setDeleteConfirmed(false); }
            }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <Trash2 className="w-5 h-5" />Eliminar categoría
                            </DialogTitle>
                            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                        </DialogHeader>

                        {deletingCategory && (
                            <div className="mt-4 space-y-3">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-semibold text-blue-900">{deletingCategory.nombreCategoria}</p>
                                    <p className="text-sm text-blue-700 mt-1">{deletingCategory.descripcion ?? 'Sin descripción'}</p>
                                </div>

                                {loadingDeleteCheck ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        Verificando productos asociados...
                                    </div>
                                ) : deleteHasProducts ? (
                                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                                        <div className="text-sm space-y-1">
                                            <p className="font-semibold">No es posible eliminar esta categoría</p>
                                            <p className="text-amber-700">
                                                Tiene productos asociados. Reasígnalos o elimínalos en <strong>Gestión de productos</strong> primero.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <InfoAlert message="Esta categoría no tiene productos asociados y puede eliminarse." />
                                        {!deleteConfirmed ? (
                                            <p className="text-sm text-gray-600">
                                                ¿Estás seguro de que deseas eliminar esta categoría permanentemente?
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
                                onClick={() => { setShowDeleteModal(false); setDeletingCategory(null); setDeleteConfirmed(false); }}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>

                            {!deleteHasProducts && !loadingDeleteCheck && (
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
                                            onClick={handleDelete}
                                            disabled={saving}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            Confirmar eliminación
                                        </Button>
                                    )}
                                </>
                            )}

                            {deleteHasProducts && (
                                <Button disabled className="bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                                    No se puede eliminar
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}