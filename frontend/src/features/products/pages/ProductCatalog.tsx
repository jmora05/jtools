import React, { useState, useCallback, useEffect } from 'react';
import {
    Search, Plus, Edit, Eye, Package, FileText,
    ChevronLeft, ChevronRight, Loader2, CheckCircle2,
    Trash2, Lock, X, ImageOff, AlertTriangle,
} from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Card, CardContent } from '@/shared/components/ui/card';
import { toast } from 'sonner';

import { getProductos, getProductoById, createProducto, updateProducto, deleteProducto, getCategorias } from '../services/productosService';

import { ProductFormModal } from '../components/ProductFormModal';
import type { Categoria, Producto, ProductoForm } from '../components/ProductFormModal';

// ─── Componentes UI locales ───────────────────────────────────────────────────
const BlockedAlert = ({ message, onClose }: { message: string; onClose: () => void }) => (
    <div className="flex items-center justify-between bg-gray-100 border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-gray-500" /><span>{message}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 shrink-0">
            <X className="w-4 h-4" />
        </button>
    </div>
);

const ProductImage = ({ src, alt, className }: { src?: string | null; alt: string; className?: string }) => {
    const [error, setError] = useState(false);
    if (!src || error) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`}>
                <ImageOff className="w-5 h-5 text-gray-400" />
            </div>
        );
    }
    return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function ProductCatalog() {
    const [view, setView]         = useState<'table' | 'grid'>('table');
    const [products, setProducts] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingProduct, setEditingProduct]   = useState<Producto | null>(null);
    const [viewingProduct, setViewingProduct]   = useState<Producto | null>(null);
    const [loadingDetail, setLoadingDetail]     = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<Producto | null>(null);
    const [deleting, setDeleting]               = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);

    const [blockedAlertId, setBlockedAlertId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 5;

    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const showFeedback = (msg: string) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

    // ── Carga de datos ─────────────────────────────────────────────────────
    const fetchProductos = useCallback(async () => {
        try {
            setLoading(true);
            const [productosData, categoriasData] = await Promise.all([getProductos(), getCategorias()]);
            setProducts(productosData);
            setCategorias(categoriasData);
        } catch (error: any) {
            toast.error(`Error al cargar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProductos(); }, [fetchProductos]);

    // ── Guardar producto (crear o editar) ──────────────────────────────────
    const handleSaveProduct = async (form: ProductoForm) => {
        try {
            setSaving(true);

            if (editingProduct) {
                await updateProducto(editingProduct.id, {
                    nombreProducto:      form.nombreProducto.trim(),
                    referencia:          form.referencia.trim(),
                    categoriaProductoId: parseInt(form.categoriaProductoId),
                    descripcion:         form.descripcion.trim(),
                    precio:              parseFloat(form.precio),
                    stock:               parseInt(form.stock, 10) >= 0 ? parseInt(form.stock, 10) : editingProduct.stock,
                    estado:              form.estado,
                    imagenUrl:           form.imagenUrl.trim() || undefined,
                });
                showFeedback('✓ Producto actualizado correctamente');
                toast.success('Producto actualizado exitosamente');
            } else {
                await createProducto({
                    nombreProducto:      form.nombreProducto.trim(),
                    referencia:          form.referencia.trim(),
                    categoriaProductoId: parseInt(form.categoriaProductoId),
                    descripcion:         form.descripcion.trim(),
                    precio:              parseFloat(form.precio),
                    stock:               1,
                    estado:              form.estado,
                    imagenUrl:           form.imagenUrl.trim() || undefined,
                });
                showFeedback('✓ Producto creado exitosamente');
                toast.success('Producto creado exitosamente');
            }

            setShowModal(false);
            setEditingProduct(null);
            fetchProductos();
        } catch (error: any) {
            if (error.errores && Array.isArray(error.errores)) {
                error.errores.forEach((e: { campo: string; mensaje: string }) =>
                    toast.error(`${e.campo}: ${e.mensaje}`)
                );
            } else {
                toast.error(`Error: ${error.message}`);
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Cambiar estado activo/inactivo ─────────────────────────────────────
    const handleToggleEstado = async (product: Producto) => {
        const nuevoEstado: 'activo' | 'inactivo' = product.estado === 'activo' ? 'inactivo' : 'activo';
        if (nuevoEstado === 'activo' && blockedAlertId === product.id) setBlockedAlertId(null);

        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, estado: nuevoEstado } : p));
        setTogglingIds(prev => new Set(prev).add(product.id));

        try {
            await updateProducto(product.id, {
                nombreProducto:      product.nombreProducto,
                referencia:          product.referencia,
                categoriaProductoId: product.categoriaProductoId,
                descripcion:         product.descripcion ?? '',
                precio:              product.precio,
                stock:               product.stock,
                estado:              nuevoEstado,
            });
            toast.success(`Producto ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
        } catch (error: any) {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, estado: product.estado } : p));
            toast.error(`Error al cambiar estado: ${error.message}`);
        } finally {
            setTogglingIds(prev => { const next = new Set(prev); next.delete(product.id); return next; });
        }
    };

    // ── Ver detalle ────────────────────────────────────────────────────────
    const viewDetails = async (product: Producto) => {
        setShowDetailModal(true);
        setViewingProduct(null);
        setLoadingDetail(true);
        try {
            const detail = await getProductoById(product.id);
            setViewingProduct(detail);
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setLoadingDetail(false);
        }
    };

    // ── Abrir edición ──────────────────────────────────────────────────────
    const openEditDialog = (product: Producto) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    // ── Eliminar ───────────────────────────────────────────────────────────
    const openDeleteModal = (product: Producto) => {
        setDeletingProduct(product);
        setDeleteConfirmed(false);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!deletingProduct) return;
        try {
            setDeleting(true);
            await deleteProducto(deletingProduct.id);
            setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
            toast.success('Producto eliminado correctamente');
            setShowDeleteModal(false);
            setDeletingProduct(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleBlockedClick = (productId: number) =>
        setBlockedAlertId(prev => prev === productId ? null : productId);

    // ── Filtrado y paginación ──────────────────────────────────────────────
    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.referencia.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active'   && p.estado === 'activo') ||
            (statusFilter === 'inactive' && p.estado === 'inactivo');
        return matchesSearch && matchesStatus;
    });

    const totalPages      = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">

            {feedbackMsg && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{feedbackMsg}</span>
                </div>
            )}

            {/* ── Encabezado ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Productos</h1>
                    <p className="text-blue-800">Administra el catálogo completo de productos</p>
                </div>
                <Button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Nuevo Producto
                </Button>
            </div>

            {/* ── Filtros ── */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar por nombre o referencia..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 w-full"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40 shrink-0"><SelectValue placeholder="Estado" /></SelectTrigger>
                            <SelectContent position="popper" className="z-[9999]">
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Activos</SelectItem>
                                <SelectItem value="inactive">Inactivos</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2 shrink-0">
                            <Button
                                variant={view === 'table' ? 'default' : 'outline'} size="sm"
                                onClick={() => setView('table')}
                                className={view === 'table' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            ><FileText className="w-4 h-4" /></Button>
                            <Button
                                variant={view === 'grid' ? 'default' : 'outline'} size="sm"
                                onClick={() => setView('grid')}
                                className={view === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            ><Package className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Tabla / Grid ── */}
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
                                        <th className="text-left py-4 px-6 text-black font-semibold">ID</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Imagen</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Producto</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Categoría</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Precio / Stock</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProducts.map(product => {
                                        const disabled = product.estado === 'inactivo';
                                        return (
                                            <React.Fragment key={product.id}>
                                                <tr className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="font-mono text-sm text-gray-500">#{product.id}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <ProductImage
                                                            src={product.imagenUrl}
                                                            alt={product.nombreProducto}
                                                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    </td>
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
                                                            <span className="text-blue-900 font-semibold">${Number(product.precio).toLocaleString()}</span>
                                                            <span className="text-sm text-gray-500">Stock: {product.stock} und</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={product.estado === 'activo'}
                                                                onCheckedChange={() => handleToggleEstado(product)}
                                                                disabled={togglingIds.has(product.id)}
                                                            />
                                                            {togglingIds.has(product.id) && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => viewDetails(product)}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            ><Eye className="w-4 h-4" /></Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => disabled ? handleBlockedClick(product.id) : openEditDialog(product)}
                                                                className={`border ${disabled
                                                                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                    : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'}`}
                                                            ><Edit className="w-4 h-4" /></Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => disabled ? handleBlockedClick(product.id) : openDeleteModal(product)}
                                                                className={`border ${disabled
                                                                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                    : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'}`}
                                                            ><Trash2 className="w-4 h-4" /></Button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {blockedAlertId === product.id && (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 pb-3 pt-0">
                                                            <BlockedAlert
                                                                message="Producto inactivo: No puedes editar ni eliminar un producto inactivo. Actívalo primero usando el interruptor de estado."
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

                            {filteredProducts.length === 0 && (
                                <div className="text-center py-12 text-gray-500">No se encontraron productos</div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                ><ChevronLeft className="w-4 h-4" /></Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page} size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                                    >{page}</Button>
                                ))}
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                ><ChevronRight className="w-4 h-4" /></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                /* ── Vista Grid ── */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentProducts.map(product => {
                        const disabled = product.estado === 'inactivo';
                        return (
                            <Card key={product.id} className="overflow-hidden">
                                <ProductImage
                                    src={product.imagenUrl}
                                    alt={product.nombreProducto}
                                    className="w-full h-40 object-cover"
                                />
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{product.referencia}</code>
                                        <div className="flex items-center gap-1.5">
                                            <Switch
                                                checked={product.estado === 'activo'}
                                                onCheckedChange={() => handleToggleEstado(product)}
                                                disabled={togglingIds.has(product.id)}
                                            />
                                            <span className={`text-xs font-medium ${product.estado === 'activo' ? 'text-blue-700' : 'text-gray-400'}`}>
                                                {togglingIds.has(product.id)
                                                    ? <Loader2 className="w-3 h-3 animate-spin inline" />
                                                    : product.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono mb-1">#{product.id}</p>
                                    <h3 className="text-gray-900 font-semibold mb-1">{product.nombreProducto}</h3>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.descripcion}</p>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-lg text-blue-600 font-bold">${Number(product.precio).toLocaleString()}</span>
                                        <Badge variant="secondary">
                                            {product.categoria?.nombreCategoria ?? `Cat #${product.categoriaProductoId}`}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">Stock: {product.stock} und</p>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => viewDetails(product)} className="flex-1">
                                            <Eye className="w-4 h-4 mr-1" /> Ver
                                        </Button>
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => disabled ? handleBlockedClick(product.id) : openEditDialog(product)}
                                            className={`flex-1 ${disabled ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' : 'text-blue-600'}`}
                                        ><Edit className="w-4 h-4 mr-1" /> Editar</Button>
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => disabled ? handleBlockedClick(product.id) : openDeleteModal(product)}
                                            className={disabled ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' : 'text-blue-900 border-blue-900 hover:bg-blue-50'}
                                        ><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                    {blockedAlertId === product.id && (
                                        <div className="mt-2">
                                            <BlockedAlert
                                                message="Producto inactivo: Actívalo primero para editar o eliminar."
                                                onClose={() => setBlockedAlertId(null)}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ════ MODAL — CREAR / EDITAR (ProductFormModal) ════ */}
            <ProductFormModal
                open={showModal}
                editingProduct={editingProduct}
                categorias={categorias}
                products={products}
                saving={saving}
                onSave={handleSaveProduct}
                onClose={() => { setShowModal(false); setEditingProduct(null); }}
            />

            {/* ════ MODAL — VER DETALLE ════ */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Detalles del Producto</DialogTitle>
                            <DialogDescription>Información completa del producto seleccionado.</DialogDescription>
                        </DialogHeader>
                        {loadingDetail ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : viewingProduct ? (
                            <div className="space-y-4 mt-4">
                                {viewingProduct.imagenUrl && (
                                    <div className="flex justify-center">
                                        <ProductImage
                                            src={viewingProduct.imagenUrl}
                                            alt={viewingProduct.nombreProducto}
                                            className="w-48 h-48 object-cover rounded-xl border border-gray-200 shadow"
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Referencia</p>
                                        <p className="font-semibold">{viewingProduct.referencia}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase">Producto</p>
                                        <p className="font-semibold text-blue-900 text-lg">{viewingProduct.nombreProducto}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Precio</p>
                                        <p className="text-blue-600 font-bold text-xl">${Number(viewingProduct.precio).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Stock</p>
                                        <p className="font-semibold">{viewingProduct.stock} und</p>
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
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ════ MODAL — CONFIRMAR ELIMINACIÓN ════ */}
            <Dialog open={showDeleteModal} onOpenChange={open => {
                if (!open) { setShowDeleteModal(false); setDeletingProduct(null); setDeleteConfirmed(false); }
            }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <Trash2 className="w-5 h-5" />Eliminar producto
                            </DialogTitle>
                            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                        </DialogHeader>
                        {deletingProduct && (
                            <div className="mt-4 space-y-3">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-semibold text-blue-900">{deletingProduct.nombreProducto}</p>
                                    <p className="text-sm text-blue-700 mt-1">Ref: {deletingProduct.referencia}</p>
                                </div>
                                {!deleteConfirmed
                                    ? <p className="text-sm text-gray-600">¿Estás seguro de que deseas eliminar este producto permanentemente?</p>
                                    : (
                                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg px-4 py-3 text-sm">
                                            <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600" />
                                            Confirma que entiendes que esta acción es irreversible.
                                        </div>
                                    )
                                }
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                onClick={() => { setShowDeleteModal(false); setDeletingProduct(null); setDeleteConfirmed(false); }}
                                disabled={deleting}
                            >Cancelar</Button>
                            {!deleteConfirmed
                                ? (
                                    <Button
                                        onClick={() => setDeleteConfirmed(true)}
                                        className="bg-white hover:bg-red-50 text-blue-900 border border-blue-900"
                                    >Sí, eliminar</Button>
                                ) : (
                                    <Button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        Confirmar eliminación
                                    </Button>
                                )
                            }
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}