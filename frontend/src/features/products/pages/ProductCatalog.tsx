// src/features/products/ProductCatalog.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import {
    Search, Plus, Edit, Trash2, Eye, Package, FileText,
    FlaskConical, ChevronLeft, ChevronRight, Loader2, X
} from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from 'sonner';

import {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto,
    getCategorias,
} from '@/services/productosService';

// ── Tipos ────────────────────────────────────────────────
interface Categoria {
    id: number;
    nombreCategoria: string;
    descripcion: string | null;
}

interface Producto {
    id: number;
    nombreProducto: string;
    referencia: string;
    categoriaProductoId: number;
    descripcion: string | null;
    precio: number;
    stock: number;
    estado: 'activo' | 'inactivo';
    categoria?: Categoria;
}

interface ProductoForm {
    nombreProducto: string;
    referencia: string;
    categoriaProductoId: string;
    descripcion: string;
    precio: string;
    stock: string;
    estado: 'activo' | 'inactivo';
}

const emptyForm: ProductoForm = {
    nombreProducto: '',
    referencia: '',
    categoriaProductoId: '',
    descripcion: '',
    precio: '',
    stock: '',
    estado: 'activo',
};

// ── Formulario fuera del componente (evita pérdida de foco) ──
interface ProductFormProps {
    form: ProductoForm;
    categorias: Categoria[];
    onChange: (field: keyof ProductoForm, value: string) => void;
}

const ProductForm = ({ form, categorias, onChange }: ProductFormProps) => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-gray-700 mb-2">Nombre del producto *</label>
                <Input
                    value={form.nombreProducto}
                    onChange={(e) => onChange('nombreProducto', e.target.value)}
                    placeholder="Ej: Filtro de Aceite Toyota"
                    maxLength={100}
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-sm text-gray-700 mb-2">Referencia *</label>
                <Input
                    value={form.referencia}
                    onChange={(e) => onChange('referencia', e.target.value)}
                    placeholder="Ej: FO-TOY-001"
                    maxLength={50}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-gray-700 mb-2">Categoría *</label>
                <Select
                    value={form.categoriaProductoId}
                    onValueChange={(value) => onChange('categoriaProductoId', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.nombreCategoria}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {form.referencia !== '' && (
    <div>
        <label className="block text-sm text-gray-700 mb-2">Estado</label>
        <div className="flex items-center space-x-2 pt-2">
            <Switch
                checked={form.estado === 'activo'}
                onCheckedChange={(checked) => onChange('estado', checked ? 'activo' : 'inactivo')}
            />
            <span className="text-sm text-gray-600">
                {form.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
        </div>
    </div>
)}
        </div>

        <div>
            <label className="block text-sm text-gray-700 mb-2">Descripción</label>
            <Textarea
                value={form.descripcion}
                onChange={(e) => onChange('descripcion', e.target.value)}
                rows={3}
                placeholder="Descripción del producto"
                maxLength={255}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-gray-700 mb-2">Precio *</label>
                <Input
                    type="number"
                    value={form.precio}
                    onChange={(e) => onChange('precio', e.target.value)}
                    placeholder="0"
                    min="0"
                />
            </div>
            <div>
                <label className="block text-sm text-gray-700 mb-2">Stock *</label>
                <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => onChange('stock', e.target.value)}
                    placeholder="0"
                    min="0"
                />
            </div>
        </div>
    </div>
);

// ── Componente principal ─────────────────────────────────
export function ProductCatalog() {
    const [view, setView]             = useState<'table' | 'grid'>('table');
    const [products, setProducts]     = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingProduct, setEditingProduct]   = useState<Producto | null>(null);
    const [viewingProduct, setViewingProduct]   = useState<Producto | null>(null);
    const [loadingDetail, setLoadingDetail]     = useState(false);

    const [searchTerm, setSearchTerm]       = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter]   = useState('all');
    const [currentPage, setCurrentPage]     = useState(1);
    const itemsPerPage = 5;

    const [productForm, setProductForm] = useState<ProductoForm>(emptyForm);

    // ── Cargar datos ─────────────────────────────────────
    const fetchProductos = useCallback(async () => {
        try {
            setLoading(true);
            const [productosData, categoriasData] = await Promise.all([
                getProductos(),
                getCategorias(),
            ]);
            setProducts(productosData);
            setCategorias(categoriasData);
        } catch (error: any) {
            toast.error(`Error al cargar productos: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    // ── Filtrado ─────────────────────────────────────────
    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.referencia.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            categoryFilter === 'all' || p.categoriaProductoId.toString() === categoryFilter;
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && p.estado === 'activo') ||
            (statusFilter === 'inactive' && p.estado === 'inactivo');
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const totalPages      = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // ── Formulario ───────────────────────────────────────
    const handleFormChange = (field: keyof ProductoForm, value: string) => {
        setProductForm((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setProductForm(emptyForm);
        setEditingProduct(null);
        setShowModal(false);
    };

    // ── CREAR  →  POST /api/productos ────────────────────
    const handleCreate = async () => {
        if (!productForm.nombreProducto.trim() || !productForm.referencia.trim() ||
            !productForm.categoriaProductoId || !productForm.precio || !productForm.stock) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }
        try {
            setSaving(true);
            await createProducto({
                nombreProducto: productForm.nombreProducto,
                referencia: productForm.referencia,
                categoriaProductoId: parseInt(productForm.categoriaProductoId),
                descripcion: productForm.descripcion,
                precio: parseFloat(productForm.precio),
                stock: parseInt(productForm.stock),
                estado: productForm.estado,
            });
            toast.success('Producto creado exitosamente');
            resetForm();
            fetchProductos();
        } catch (error: any) {
            toast.error(`Error al crear: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── EDITAR  →  PUT /api/productos/:id ────────────────
    const handleEdit = async () => {
        if (!editingProduct) return;
        if (!productForm.nombreProducto.trim() || !productForm.referencia.trim()) {
            toast.error('El nombre y la referencia son obligatorios');
            return;
        }
        try {
            setSaving(true);
            await updateProducto(editingProduct.id, {
                nombreProducto: productForm.nombreProducto,
                referencia: productForm.referencia,
                categoriaProductoId: parseInt(productForm.categoriaProductoId),
                descripcion: productForm.descripcion,
                precio: parseFloat(productForm.precio),
                stock: parseInt(productForm.stock),
                estado: productForm.estado,
            });
            toast.success('Producto actualizado exitosamente');
            resetForm();
            fetchProductos();
        } catch (error: any) {
            toast.error(`Error al actualizar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── DESACTIVAR  →  DELETE /api/productos/:id ─────────
    const handleDelete = async (id: number) => {
        if (!confirm('¿Desactivar este producto?')) return;
        try {
            await deleteProducto(id);
            toast.success('Producto desactivado correctamente');
            fetchProductos();
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }
    };

    // ── VER DETALLE  →  GET /api/productos/:id ───────────
    const viewDetails = async (product: Producto) => {
        setShowDetailModal(true);
        setViewingProduct(null);
        setLoadingDetail(true);
        try {
            const detail = await getProductoById(product.id);
            setViewingProduct(detail);
        } catch (error: any) {
            toast.error(`Error al cargar detalle: ${error.message}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    const openEditDialog = (product: Producto) => {
        setEditingProduct(product);
        setProductForm({
            nombreProducto: product.nombreProducto,
            referencia: product.referencia,
            categoriaProductoId: product.categoriaProductoId.toString(),
            descripcion: product.descripcion ?? '',
            precio: product.precio.toString(),
            stock: product.stock.toString(),
            estado: product.estado,
        });
        setShowModal(true);
    };

    // ── RENDER ───────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Productos</h1>
                    <p className="text-blue-800">Administra el catálogo completo de productos</p>
                </div>
                <Button
    onClick={() => {
        setEditingProduct(null);
        setProductForm(emptyForm);
        setShowModal(true);
    }}
    className="bg-blue-600 hover:bg-blue-700 text-white"
>
    <Plus className="w-4 h-4 mr-2" />
    Nuevo Producto
</Button>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Buscar por nombre o referencia..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las categorías</SelectItem>
                                    {categorias.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.nombreCategoria}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-32">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="active">Activos</SelectItem>
                                    <SelectItem value="inactive">Inactivos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button variant={view === 'table' ? 'default' : 'outline'} size="sm"
                                onClick={() => setView('table')}
                                className={view === 'table' ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                                <FileText className="w-4 h-4" />
                            </Button>
                            <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm"
                                onClick={() => setView('grid')}
                                className={view === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                                <Package className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contenido */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando productos...</span>
                </div>
            ) : view === 'table' ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-white font-semibold">Producto</th>
                                        <th className="text-left py-4 px-6 text-white font-semibold">Categoría</th>
                                        <th className="text-left py-4 px-6 text-white font-semibold">Precio / Stock</th>
                                        <th className="text-left py-4 px-6 text-white font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-white font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProducts.map((product) => (
                                        <tr key={product.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">{product.nombreProducto}</span>
                                                    <span className="text-sm text-blue-900">Ref: {product.referencia}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge variant="secondary">
                                                    {product.categoria?.nombreCategoria ?? `#${product.categoriaProductoId}`}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-blue-900 font-semibold">
                                                        ${Number(product.precio).toLocaleString()}
                                                    </span>
                                                    <span className="text-sm text-gray-500">Stock: {product.stock} und</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge className={product.estado === 'activo' 
    ? 'bg-blue-100 text-blue-900 border border-blue-900' 
    : 'bg-gray-100 text-gray-500 border border-gray-300'}>
    {product.estado === 'activo' ? 'Activo' : 'Inactivo'}
</Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-2">
                                                    <Button size="sm" onClick={() => viewDetails(product)}
                                                        className="bg-white text-blue-900 border border-black hover:bg-blue-50">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" onClick={() => openEditDialog(product)}
                                                        className="bg-white text-blue-900 border border-black hover:bg-blue-50">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleDelete(product.id)}
                                                        className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredProducts.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No se encontraron productos
                                </div>
                            )}
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="border-t border-gray-200 px-6 py-4 flex justify-center items-center gap-2">
                                <Button variant="outline" size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button key={page} size="sm"
                                        variant={currentPage === page ? 'default' : 'ghost'}
                                        onClick={() => handlePageChange(page)}
                                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                                        {page}
                                    </Button>
                                ))}
                                <Button variant="outline" size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{product.referencia}</code>
                                    <Badge className={product.estado === 'activo'
                                        ? 'bg-blue-100 text-blue-900 border border-blue-900'
                                        : 'bg-gray-100 text-gray-500 border border-gray-300'}>
                                        {product.estado}
                                    </Badge>
                                </div>
                                <h3 className="text-gray-900 font-semibold mb-1">{product.nombreProducto}</h3>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.descripcion}</p>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-lg text-blue-600 font-bold">
                                        ${Number(product.precio).toLocaleString()}
                                    </span>
                                    <Badge variant="secondary">
                                        {product.categoria?.nombreCategoria ?? `Cat #${product.categoriaProductoId}`}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">Stock: {product.stock} und</p>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => viewDetails(product)} className="flex-1">
                                        <Eye className="w-4 h-4 mr-1" /> Ver
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)} className="flex-1 text-blue-600">
                                        <Edit className="w-4 h-4 mr-1" /> Editar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ════ MODAL — CREAR / EDITAR ════ */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct
                                ? 'Modifica la información del producto.'
                                : 'Completa el formulario para agregar un nuevo producto.'}
                        </DialogDescription>
                    </DialogHeader>

                    <ProductForm form={productForm} categorias={categorias} onChange={handleFormChange} />

                    <div className="flex space-x-4 pt-4 border-t">
                        <Button variant="outline" onClick={resetForm} className="flex-1" disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={editingProduct ? handleEdit : handleCreate}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ════ MODAL — VER DETALLE ════ */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalles del Producto</DialogTitle>
                        <DialogDescription>Información completa del producto seleccionado.</DialogDescription>
                    </DialogHeader>

                    {loadingDetail ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : viewingProduct ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">ID</p>
                                    <p className="font-mono font-semibold">#{viewingProduct.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Referencia</p>
                                    <p className="font-semibold">{viewingProduct.referencia}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Nombre</p>
                                    <p className="font-semibold text-blue-900 text-lg">{viewingProduct.nombreProducto}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Precio</p>
                                    <p className="text-blue-600 font-bold text-xl">
                                        ${Number(viewingProduct.precio).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Stock</p>
                                    <p className="font-semibold text-xl">{viewingProduct.stock} und</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Categoría</p>
                                    <Badge variant="secondary">
                                        {viewingProduct.categoria?.nombreCategoria ?? `#${viewingProduct.categoriaProductoId}`}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Estado</p>
                                    <Badge className={viewingProduct.estado === 'activo' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-500'}>
                                        {viewingProduct.estado}
                                    </Badge>
                                </div>
                                {viewingProduct.descripcion && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase">Descripción</p>
                                        <p className="text-sm text-gray-700">{viewingProduct.descripcion}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-4">
                                <Button variant="outline" onClick={() => setShowDetailModal(false)} className="flex-1">
                                    Cerrar
                                </Button>
                                <Button
                                    onClick={() => { openEditDialog(viewingProduct); setShowDetailModal(false); }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Editar Producto
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
