// src/features/products/ProductCategoryManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/shared/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import {
    PlusIcon, SearchIcon, EditIcon, TrashIcon, EyeIcon,
    TagIcon, ChevronLeft, ChevronRight, Loader2Icon,
    CheckCircle2, Info, AlertTriangle
} from 'lucide-react';
import {
    getCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria,
} from '../services/categoriaProductosService';

interface Categoria {
    id: number;
    nombreCategoria: string;
    descripcion: string | null;
    estado: 'activo' | 'inactivo';
    productos?: { id: number; nombreProducto: string; precio: number; stock: number }[];
}

interface FormData {
    nombreCategoria: string;
    descripcion: string;
    estado: 'activo' | 'inactivo';
}

interface FormErrors {
    nombreCategoria?: string;
}

// ── Validación ────────────────────────────────────────────────────────────────
function validateCategoryForm(form: FormData): FormErrors {
    const errors: FormErrors = {};
    if (!form.nombreCategoria.trim())
        errors.nombreCategoria = 'El nombre es obligatorio';
    else if (form.nombreCategoria.trim().length < 2)
        errors.nombreCategoria = 'Mínimo 2 caracteres';
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

// ── Bloqueo de dígitos en campos de texto ─────────────────────────────────────
const blockDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^\d$/.test(e.key)) e.preventDefault();
};

// ── Formulario de categoría ───────────────────────────────────────────────────
interface CategoryFormProps {
    formData: FormData;
    onChange: (field: keyof FormData, value: string) => void;
    errors: FormErrors;
    touched: Partial<Record<keyof FormData, boolean>>;
    onBlur: (field: keyof FormData) => void;
}

const CategoryForm = ({ formData, onChange, errors, touched, onBlur }: CategoryFormProps) => (
    <div className="grid gap-4">
        <div className="space-y-2">
            <Label htmlFor="nombreCategoria">
                Nombre de la categoría <span className="text-red-500">*</span>
            </Label>
            <Input
                id="nombreCategoria"
                placeholder="Ej: Frenos"
                value={formData.nombreCategoria}
                onChange={(e) => onChange('nombreCategoria', e.target.value)}
                onBlur={() => onBlur('nombreCategoria')}
                onKeyDown={blockDigits}
                maxLength={50}
                autoFocus
                className={touched.nombreCategoria && errors.nombreCategoria ? 'border-red-400 focus-visible:ring-red-300' : ''}
            />
            <FieldError message={touched.nombreCategoria ? errors.nombreCategoria : undefined} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
                id="descripcion"
                placeholder="Descripción de la categoría (opcional)"
                value={formData.descripcion}
                onChange={(e) => onChange('descripcion', e.target.value)}
                maxLength={255}
            />
        </div>
        <div className="space-y-2">
            <Label>Estado</Label>
            <div className="flex items-center space-x-2 pt-1">
                <Switch
                    checked={formData.estado === 'activo'}
                    onCheckedChange={(checked) => onChange('estado', checked ? 'activo' : 'inactivo')}
                />
                <span className="text-sm text-gray-600">
                    {formData.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </div>
        </div>
    </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export function ProductCategoryManagement() {

    const [categories, setCategories] = useState<Categoria[]>([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);

    const [searchTerm, setSearchTerm]   = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [selectedCategory, setSelectedCategory]     = useState<Categoria | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen]     = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen]     = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryDetail, setCategoryDetail]         = useState<Categoria | null>(null);
    const [loadingDetail, setLoadingDetail]           = useState(false);

    // Estado para verificar si la categoría tiene productos antes de eliminar
    const [deleteHasProducts, setDeleteHasProducts]   = useState(false);
    const [loadingDeleteCheck, setLoadingDeleteCheck] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        nombreCategoria: '',
        descripcion: '',
        estado: 'activo',
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [touched, setTouched]       = useState<Partial<Record<keyof FormData, boolean>>>({});

    // ── Feedback banner ───────────────────────────────────────────────────────
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const showFeedback = (msg: string) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

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

    // Re-validar en tiempo real
    useEffect(() => {
        setFormErrors(validateCategoryForm(formData));
    }, [formData]);

    const filteredCategories = categories.filter((cat) =>
        cat.nombreCategoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.descripcion ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const paginated  = filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const resetForm = () => {
        setFormData({ nombreCategoria: '', descripcion: '', estado: 'activo' });
        setFormErrors({});
        setTouched({});
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleBlur = (field: keyof FormData) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const touchAll = () => {
        setTouched({ nombreCategoria: true });
    };

    // ── Crear ─────────────────────────────────────────────────────────────────
    const handleCreateCategory = async () => {
        touchAll();
        const errors = validateCategoryForm(formData);
        if (Object.keys(errors).length > 0) {
            toast.error('Completa los campos obligatorios');
            return;
        }
        try {
            setSaving(true);
            await createCategoria({ ...formData, nombreCategoria: formData.nombreCategoria.trim() });
            showFeedback('✓ Categoría creada exitosamente');
            toast.success('Categoría creada exitosamente');
            setIsCreateDialogOpen(false);
            resetForm();
            fetchCategorias();
        } catch (error: any) {
            toast.error(`Error al crear: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Editar ────────────────────────────────────────────────────────────────
    const handleEditCategory = async () => {
        touchAll();
        const errors = validateCategoryForm(formData);
        if (!selectedCategory || Object.keys(errors).length > 0) {
            toast.error('Completa los campos obligatorios');
            return;
        }
        try {
            setSaving(true);
            await updateCategoria(selectedCategory.id, { ...formData, nombreCategoria: formData.nombreCategoria.trim() });
            showFeedback('✓ Categoría actualizada correctamente');
            toast.success('Categoría actualizada exitosamente');
            setIsEditDialogOpen(false);
            setSelectedCategory(null);
            resetForm();
            fetchCategorias();
        } catch (error: any) {
            toast.error(`Error al actualizar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Abrir diálogo eliminar: verificar si tiene productos ──────────────────
    const openDeleteDialog = async (category: Categoria) => {
        setSelectedCategory(category);
        setDeleteHasProducts(false);
        setIsDeleteDialogOpen(true);
        setLoadingDeleteCheck(true);
        try {
            const detail = await getCategoriaById(category.id);
            setDeleteHasProducts((detail.productos?.length ?? 0) > 0);
        } catch {
            // Si falla la verificación, el backend rechazará si hay productos
        } finally {
            setLoadingDeleteCheck(false);
        }
    };

    // ── Eliminar ──────────────────────────────────────────────────────────────
    const handleDeleteCategory = async () => {
        if (!selectedCategory || deleteHasProducts) return;
        try {
            setSaving(true);
            await deleteCategoria(selectedCategory.id);
            showFeedback('✓ Categoría eliminada exitosamente');
            toast.success('Categoría eliminada exitosamente');
            setIsDeleteDialogOpen(false);
            setSelectedCategory(null);
            fetchCategorias();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const openViewDialog = async (category: Categoria) => {
        setIsViewDialogOpen(true);
        setCategoryDetail(null);
        setLoadingDetail(true);
        try {
            const detail = await getCategoriaById(category.id);
            setCategoryDetail(detail);
        } catch (error: any) {
            toast.error(`Error al cargar detalle: ${error.message}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    const openEditDialog = (category: Categoria) => {
        setSelectedCategory(category);
        setFormData({
            nombreCategoria: category.nombreCategoria,
            descripcion: category.descripcion ?? '',
            estado: category.estado ?? 'activo',
        });
        setFormErrors({});
        setTouched({});
        setIsEditDialogOpen(true);
    };

    const openCreateDialog = () => {
        resetForm();
        setIsCreateDialogOpen(true);
    };

    return (
        <div className="space-y-6 p-6">

            {/* ── Feedback Banner ── */}
            {feedbackMsg && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{feedbackMsg}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TagIcon className="w-8 h-8 text-blue-900" />
                    <div>
                        <h1 className="text-3xl font-bold text-blue-900">Categorías de productos</h1>
                        <p className="text-gray-500">Gestión completa de categorías</p>
                    </div>
                </div>
                <Button
                    onClick={openCreateDialog}
                    className="bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
                >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Nueva categoría
                </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-blue-100">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-500">Total categorías</p>
                        <p className="text-2xl font-bold text-blue-900">{categories.length}</p>
                    </CardContent>
                </Card>
                <Card className="border border-blue-100">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Resultados filtrados</p>
                        <p className="text-2xl font-bold text-blue-900">{filteredCategories.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de categorías</CardTitle>
                    <CardDescription>Gestione todas las categorías de productos</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nombre o descripción..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-500">Cargando categorías...</span>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-black font-semibold">ID</TableHead>
                                            <TableHead className="text-black font-semibold">Nombre</TableHead>
                                            <TableHead className="text-black font-semibold">Descripción</TableHead>
                                            <TableHead className="text-black font-semibold">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.map((category) => (
                                            <TableRow key={category.id} className="hover:bg-blue-50 transition-colors">
                                                <TableCell className="font-mono text-gray-500 text-sm">
                                                    #{category.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <TagIcon className="w-4 h-4 text-blue-600 shrink-0" />
                                                        <span className="font-semibold text-blue-900">
                                                            {category.nombreCategoria}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-gray-600 text-sm">
                                                        {category.descripcion ?? <em className="text-gray-400">Sin descripción</em>}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm"
                                                            onClick={() => openViewDialog(category)}
                                                            className="border-blue-900 text-blue-900 hover:bg-blue-50"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="outline" size="sm"
                                                            onClick={() => openEditDialog(category)}
                                                            className="border-blue-900 text-blue-900 hover:bg-blue-50"
                                                        >
                                                            <EditIcon className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="outline" size="sm"
                                                            onClick={() => openDeleteDialog(category)}
                                                            className="border-blue-900 text-blue-900 hover:bg-blue-50"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {filteredCategories.length === 0 && (
                                <div className="text-center py-10">
                                    <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No se encontraron categorías</p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-6">
                                    <Button variant="outline" size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button key={page} size="sm"
                                            variant={currentPage === page ? 'default' : 'ghost'}
                                            onClick={() => handlePageChange(page)}
                                            className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                    <Button variant="outline" size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* DIALOG — CREAR */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) { setIsCreateDialogOpen(false); resetForm(); } }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Nueva categoría</DialogTitle>
                        <DialogDescription>Complete la información para crear una nueva categoría.</DialogDescription>
                    </DialogHeader>

                    {Object.keys(touched).length > 0 && Object.keys(formErrors).length > 0 && (
                        <InfoAlert message="Completa los campos obligatorios antes de continuar." />
                    )}

                    <CategoryForm
                        formData={formData}
                        onChange={handleInputChange}
                        errors={formErrors}
                        touched={touched}
                        onBlur={handleBlur}
                    />
                    <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateCategory}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {saving && <Loader2Icon className="w-4 h-4 animate-spin mr-2" />}
                            Crear categoría
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG — EDITAR */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) { setIsEditDialogOpen(false); resetForm(); } }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar categoría</DialogTitle>
                        <DialogDescription>Modifique los campos que desea actualizar.</DialogDescription>
                    </DialogHeader>

                    {Object.keys(touched).length > 0 && Object.keys(formErrors).length > 0 && (
                        <InfoAlert message="Completa los campos obligatorios antes de continuar." />
                    )}

                    <CategoryForm
                        formData={formData}
                        onChange={handleInputChange}
                        errors={formErrors}
                        touched={touched}
                        onBlur={handleBlur}
                    />
                    <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => { setIsEditDialogOpen(false); resetForm(); }} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleEditCategory}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-800 text-white"
                        >
                            {saving && <Loader2Icon className="w-4 h-4 animate-spin mr-2" />}
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG — VER DETALLE */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle de categoría</DialogTitle>
                    </DialogHeader>
                    {loadingDetail ? (
                        <div className="flex justify-center py-6">
                            <Loader2Icon className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    ) : categoryDetail ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-blue-50 p-3 rounded-lg text-sm">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">ID</p>
                                    <p className="font-mono font-semibold">#{categoryDetail.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Estado</p>
                                    <Badge className={
                                        categoryDetail.estado === 'activo'
                                            ? 'bg-blue-100 text-blue-900 border border-blue-300 mt-0.5'
                                            : 'bg-gray-100 text-gray-500 border border-gray-300 mt-0.5'
                                    }>
                                        {categoryDetail.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Nombre</p>
                                    <p className="font-semibold text-blue-900">{categoryDetail.nombreCategoria}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Descripción</p>
                                    <p className="text-gray-700">{categoryDetail.descripcion ?? 'Sin descripción'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                    Productos asociados ({categoryDetail.productos?.length ?? 0})
                                </p>
                                {categoryDetail.productos && categoryDetail.productos.length > 0 ? (
                                    <div className="max-h-36 overflow-y-auto rounded border divide-y">
                                        {categoryDetail.productos.map((p) => (
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
                        </div>
                    ) : null}
                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG — ELIMINAR */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className>
                    <DialogHeader>
                        <DialogTitle>Eliminar categoría</DialogTitle>
                        <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>

                    {selectedCategory && (
                        <div className="space-y-3">
                            {/* Datos de la categoría */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-semibold text-blue-900">{selectedCategory.nombreCategoria}</p>
                                <p className="text-sm text-blue-700 mt-1">{selectedCategory.descripcion ?? 'Sin descripción'}</p>
                            </div>

                            {/* Verificación de productos */}
                            {loadingDeleteCheck ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                    <Loader2Icon className="w-4 h-4 animate-spin text-blue-500" />
                                    Verificando productos asociados...
                                </div>
                            ) : deleteHasProducts ? (
                                // ── Tiene productos: advertencia clara para el usuario final ──
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                                    <div className="text-sm space-y-1">
                                        <p className="font-semibold">No es posible eliminar esta categoría</p>
                                        <p className="text-amber-700">
                                            Esta categoría está siendo utilizada por uno o más productos. Para poder
                                            eliminarla, primero debes ir al módulo de{' '}
                                            <span className="font-semibold">Gestión de Productos</span> y reasignar
                                            o eliminar los productos que pertenecen a esta categoría.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                // ── Sin productos: confirmación segura ──
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
                                    <Info className="w-4 h-4 shrink-0 text-blue-500" />
                                    <span>Esta categoría no tiene productos asociados y puede eliminarse sin problema.</span>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
    onClick={deleteHasProducts ? undefined : handleDeleteCategory}
    className={
        deleteHasProducts
            ? "bg-blue-100 text-blue-400 border border-blue-200 cursor-not-allowed hover:bg-blue-100 pointer-events-none"
            : "bg-blue-white hover:bg-blue-400 text-blue-900 border border-blue-900"
                        }
                    >
                        {saving && <Loader2Icon className="w-4 h-4 animate-spin mr-2" />}
                        {deleteHasProducts ? 'No se puede eliminar' : 'Sí, eliminar'}
                    </Button>
                                        </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}