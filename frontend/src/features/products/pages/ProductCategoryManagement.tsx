// src/features/products/ProductCategoryManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/shared/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { toast } from 'sonner';
import {
    PlusIcon, SearchIcon, EditIcon, TrashIcon, EyeIcon,
    TagIcon, ChevronLeft, ChevronRight, Loader2Icon
} from 'lucide-react';
import {
    getCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria,
} from '@/services/categoriaProductosService';

// ── Tipos ────────────────────────────────────────────────
interface Categoria {
    id: number;
    nombreCategoria: string;
    descripcion: string | null;
    productos?: { id: number; nombreProducto: string; precio: number; stock: number }[];
}

interface FormData {
    nombreCategoria: string;
    descripcion: string;
}

// ── Formulario FUERA del componente principal ────────────
// Esto evita que el input pierda el foco al escribir
interface CategoryFormProps {
    formData: FormData;
    onChange: (field: keyof FormData, value: string) => void;
}

const CategoryForm = ({ formData, onChange }: CategoryFormProps) => (
    <div className="grid gap-4">
        <div className="space-y-2">
            <Label htmlFor="nombreCategoria">Nombre de la categoría *</Label>
            <Input
                id="nombreCategoria"
                placeholder="Ej: Frenos"
                value={formData.nombreCategoria}
                onChange={(e) => onChange('nombreCategoria', e.target.value)}
                maxLength={50}
                autoFocus
            />
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
    </div>
);

// ── Componente principal ─────────────────────────────────
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

    const [formData, setFormData] = useState<FormData>({
        nombreCategoria: '',
        descripcion: '',
    });

    // ── Cargar categorías ────────────────────────────────
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

    useEffect(() => {
        fetchCategorias();
    }, [fetchCategorias]);

    // ── Filtrado y paginación ────────────────────────────
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

    // ── Formulario ───────────────────────────────────────
    const resetForm = () => setFormData({ nombreCategoria: '', descripcion: '' });

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // ── CREAR  →  POST /api/categorias ───────────────────
    const handleCreateCategory = async () => {
        if (!formData.nombreCategoria.trim()) {
            toast.error('El nombre de la categoría es obligatorio');
            return;
        }
        try {
            setSaving(true);
            await createCategoria(formData);
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

    // ── EDITAR  →  PUT /api/categorias/:id ───────────────
    const handleEditCategory = async () => {
        if (!selectedCategory || !formData.nombreCategoria.trim()) {
            toast.error('El nombre de la categoría es obligatorio');
            return;
        }
        try {
            setSaving(true);
            await updateCategoria(selectedCategory.id, formData);
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

    // ── ELIMINAR  →  DELETE /api/categorias/:id ──────────
    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;
        try {
            setSaving(true);
            await deleteCategoria(selectedCategory.id);
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

    // ── VER DETALLE  →  GET /api/categorias/:id ──────────
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
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (category: Categoria) => {
        setSelectedCategory(category);
        setIsDeleteDialogOpen(true);
    };

    const openCreateDialog = () => {
        resetForm();
        setIsCreateDialogOpen(true);
    };

    // ── RENDER ───────────────────────────────────────────
    return (
        <div className="space-y-6 p-6">

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
                                    <TableHeader className="bg-blue-900">
                                        <TableRow>
                                            <TableHead className="text-white font-semibold">ID</TableHead>
                                            <TableHead className="text-white font-semibold">Nombre</TableHead>
                                            <TableHead className="text-white font-semibold">Descripción</TableHead>
                                            <TableHead className="text-white font-semibold">Acciones</TableHead>
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
                                                            title="Ver detalle"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="outline" size="sm"
                                                            onClick={() => openEditDialog(category)}
                                                            className="border-blue-900 text-blue-900 hover:bg-blue-50"
                                                            title="Editar"
                                                        >
                                                            <EditIcon className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="outline" size="sm"
                                                            onClick={() => openDeleteDialog(category)}
                                                            className="border-red-500 text-red-600 hover:bg-red-50"
                                                            title="Eliminar"
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Nueva categoría</DialogTitle>
                        <DialogDescription>
                            Complete la información para crear una nueva categoría.
                        </DialogDescription>
                    </DialogHeader>
                    <CategoryForm formData={formData} onChange={handleInputChange} />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} disabled={saving}>
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
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar categoría</DialogTitle>
                        <DialogDescription>
                            Modifique los campos que desea actualizar.
                        </DialogDescription>
                    </DialogHeader>
                    <CategoryForm formData={formData} onChange={handleInputChange} />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleEditCategory}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {saving && <Loader2Icon className="w-4 h-4 animate-spin mr-2" />}
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG — VER DETALLE */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Detalle de categoría</DialogTitle>
                        <DialogDescription>Información completa incluyendo productos asociados.</DialogDescription>
                    </DialogHeader>
                    {loadingDetail ? (
                        <div className="flex justify-center py-8">
                            <Loader2Icon className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    ) : categoryDetail ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">ID</p>
                                    <p className="font-mono font-semibold">#{categoryDetail.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Nombre</p>
                                    <p className="font-semibold text-blue-900">{categoryDetail.nombreCategoria}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Descripción</p>
                                    <p className="text-sm">{categoryDetail.descripcion ?? 'Sin descripción'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                    Productos asociados ({categoryDetail.productos?.length ?? 0})
                                </p>
                                {categoryDetail.productos && categoryDetail.productos.length > 0 ? (
                                    <div className="max-h-48 overflow-y-auto rounded border divide-y">
                                        {categoryDetail.productos.map((p) => (
                                            <div key={p.id} className="flex justify-between items-center px-3 py-2 text-sm">
                                                <span className="font-medium">{p.nombreProducto}</span>
                                                <span className="text-gray-500">Stock: {p.stock}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Esta categoría no tiene productos</p>
                                )}
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG — ELIMINAR */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar categoría</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. ¿Confirma que desea eliminar esta categoría?
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCategory && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="font-semibold text-red-800">{selectedCategory.nombreCategoria}</p>
                            <p className="text-sm text-red-600 mt-1">{selectedCategory.descripcion ?? 'Sin descripción'}</p>
                            <p className="text-xs text-red-500 mt-2">
                                ⚠️ Solo se puede eliminar si no tiene productos asociados
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDeleteCategory}
                            disabled={saving}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {saving && <Loader2Icon className="w-4 h-4 animate-spin mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}