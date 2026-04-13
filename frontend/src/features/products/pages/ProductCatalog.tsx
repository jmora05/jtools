import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Search, Plus, Edit, Eye, Package, FileText,
    ChevronLeft, ChevronRight, Loader2, CheckCircle2, Info, ChevronDown, Check, AlertTriangle, Trash2, Lock, X
} from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Card, CardContent } from '@/shared/components/ui/card';
import { toast } from 'sonner';

import { getProductos, getProductoById, createProducto, updateProducto, deleteProducto, getCategorias } from '../services/productosService';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Categoria { id: number; nombreCategoria: string; descripcion: string | null; }
interface Producto {
    id: number; nombreProducto: string; referencia: string;
    categoriaProductoId: number; descripcion: string | null;
    precio: number; stock: number; estado: 'activo' | 'inactivo';
    categoria?: Categoria;
}
interface ProductoForm {
    nombreProducto: string; referencia: string; categoriaProductoId: string;
    descripcion: string; precio: string; stock: string; estado: 'activo' | 'inactivo';
}
const emptyForm: ProductoForm = {
    nombreProducto: '', referencia: '', categoriaProductoId: '',
    descripcion: '', precio: '', stock: '', estado: 'activo',
};
interface FormErrors {
    nombreProducto?: string; referencia?: string; categoriaProductoId?: string;
    descripcion?: string; precio?: string; stock?: string;
}

interface DuplicateErrors {
    nombreProducto?: string;
    referencia?: string;
}

// ─── Regex ────────────────────────────────────────────────────────────────────
const SOLO_TEXTO_REGEX       = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]*$/;
const SOLO_REFERENCIA_REGEX  = /^[a-zA-Z0-9\-_./]*$/;
const SOLO_DESCRIPCION_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]*$/;
const CHARS_BLOQUEADOS_TEXTO = /[$%@#&*|\\^`~<>=+{}[\]!?¡¿"';:]/;
const CHARS_BLOQUEADOS_REF   = /[$%@#&*|\\^`~<>=+{}[\]!?¡¿"';: áéíóúÁÉÍÓÚñÑüÜ]/;
const CHARS_BLOQUEADOS_DESC  = /[$%@#&*|\\^`~<>=+{}[\]¡¿]/;

// ─── Validación de formulario ─────────────────────────────────────────────────
function validateProductoForm(form: ProductoForm): FormErrors {
    const errors: FormErrors = {};

    if (!form.nombreProducto.trim())
        errors.nombreProducto = 'El nombre es obligatorio.';
    else if (form.nombreProducto.trim().length < 2)
        errors.nombreProducto = 'Mínimo 2 caracteres.';
    else if (form.nombreProducto.trim().length > 100)
        errors.nombreProducto = 'El nombre no puede superar 100 caracteres.';
    else if (!SOLO_TEXTO_REGEX.test(form.nombreProducto))
        errors.nombreProducto = 'El nombre no puede contener caracteres especiales.';

    if (!form.referencia.trim())
        errors.referencia = 'La referencia es obligatoria.';
    else if (form.referencia.trim().length < 2)
        errors.referencia = 'Mínimo 2 caracteres.';
    else if (form.referencia.trim().length > 50)
        errors.referencia = 'La referencia no puede superar 50 caracteres.';
    else if (!SOLO_REFERENCIA_REGEX.test(form.referencia))
        errors.referencia = 'Solo letras, números, guiones (-), guión bajo (_), punto (.) y barra (/).';

    if (!form.categoriaProductoId)
        errors.categoriaProductoId = 'Selecciona una categoría.';

    if (form.descripcion && form.descripcion.trim().length > 0 && form.descripcion.trim().length < 5)
        errors.descripcion = 'La descripción debe tener al menos 5 caracteres si se ingresa.';
    else if (form.descripcion && !SOLO_DESCRIPCION_REGEX.test(form.descripcion))
        errors.descripcion = 'La descripción contiene caracteres no permitidos.';

    if (form.precio === '') {
        errors.precio = 'El precio es obligatorio.';
    } else if (/^0/.test(form.precio)) {
        errors.precio = 'El precio no puede empezar con 0 (ej: use 1.5 en lugar de 01.5).';
    } else if (isNaN(parseFloat(form.precio)) || parseFloat(form.precio) <= 0) {
        errors.precio = 'El precio debe ser mayor a 0.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.precio)) {
        errors.precio = 'Máximo 2 decimales permitidos.';
    } else if (parseFloat(form.precio) > 999999999.99) {
        errors.precio = 'El precio supera el máximo permitido.';
    }

    if (form.stock === '') {
        errors.stock = 'El stock es obligatorio.';
    } else if (!/^\d+$/.test(form.stock)) {
        errors.stock = 'El stock debe ser un número entero sin decimales.';
    } else if (Number(form.stock) < 0) {
        errors.stock = 'El stock no puede ser negativo.';
    } else if (Number(form.stock) > 999999) {
        errors.stock = 'El stock no puede superar 999,999 unidades.';
    }

    return errors;
}

// ─── Handlers de teclado ──────────────────────────────────────────────────────
const bloquearCaracteresTexto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const ctrl = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
    if (ctrl.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (CHARS_BLOQUEADOS_TEXTO.test(e.key)) { e.preventDefault(); toast.warning(`El carácter "${e.key}" no está permitido.`); }
};
const bloquearCaracteresReferencia = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const ctrl = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
    if (ctrl.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (CHARS_BLOQUEADOS_REF.test(e.key)) { e.preventDefault(); toast.warning(`El carácter "${e.key}" no está permitido.`); }
};
const bloquearCaracteresDescripcion = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ctrl = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
    if (ctrl.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (CHARS_BLOQUEADOS_DESC.test(e.key)) { e.preventDefault(); toast.warning(`El carácter "${e.key}" no está permitido.`); }
};

const bloquearNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/[\d.]/.test(e.key)) { e.preventDefault(); return; }
    const input = e.currentTarget;
    const val   = input.value;
    if (e.key === '.' && val.includes('.')) { e.preventDefault(); return; }
    if (e.key === '0' && (val === '' || (input.selectionStart === 0 && input.selectionEnd === val.length))) {
        e.preventDefault();
        toast.warning('El precio no puede empezar con 0.');
    }
};

const bloquearNonInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
    if (!allowed.includes(e.key) && !/\d/.test(e.key)) e.preventDefault();
};

// ─── Componentes UI ───────────────────────────────────────────────────────────
const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />{message}
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

// ── CustomSelect ──────────────────────────────────────────────────────────────
interface CustomSelectProps {
    value: string; onChange: (value: string) => void;
    options: { value: string; label: string }[]; placeholder?: string; hasError?: boolean;
}
const CustomSelect = ({ value, onChange, options, placeholder = 'Seleccionar...', hasError }: CustomSelectProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(o => o.value === value)?.label;
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(p => !p)}
                className={`flex w-full items-center justify-between gap-2 rounded-md border bg-[#f3f3f5] px-3 py-2 text-sm h-9 outline-none transition-colors
                    ${hasError ? 'border-red-400' : 'border-gray-200'}
                    ${open ? 'ring-2 ring-blue-300 border-blue-400' : 'hover:border-gray-300'}`}>
                <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>{selectedLabel ?? placeholder}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg z-50 max-h-52 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-gray-400 text-center">Sin opciones</div>
                    ) : options.map(option => (
                        <button key={option.value} type="button"
                            onClick={() => { onChange(option.value); setOpen(false); }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-900 transition-colors
                                ${value === option.value ? 'bg-blue-50 text-blue-900 font-medium' : 'text-gray-700'}`}>
                            {option.label}
                            {value === option.value && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Formulario de producto ────────────────────────────────────────────────────
interface ProductFormProps {
    form: ProductoForm; categorias: Categoria[];
    onChange: (field: keyof ProductoForm, value: string) => void;
    errors: FormErrors; touched: Partial<Record<keyof ProductoForm, boolean>>;
    onBlur: (field: keyof ProductoForm) => void;
    duplicates: DuplicateErrors;
}
const ProductForm = ({ form, categorias, onChange, errors, touched, onBlur, duplicates }: ProductFormProps) => {
    const categoriaOptions = categorias.map(cat => ({ value: cat.id.toString(), label: cat.nombreCategoria }));

    const handlePrecioChange = (raw: string) => {
        const sanitized = raw.replace(/^0+(\d)/, '$1');
        onChange('precio', sanitized);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-700 mb-2">Nombre <span className="text-red-500">*</span></label>
                    <Input
                        value={form.nombreProducto}
                        onChange={(e) => onChange('nombreProducto', e.target.value)}
                        onBlur={() => onBlur('nombreProducto')}
                        onKeyDown={bloquearCaracteresTexto}
                        placeholder="Ej: Filtro de Aceite Toyota"
                        maxLength={100} autoFocus
                        className={(touched.nombreProducto && errors.nombreProducto) || duplicates.nombreProducto ? 'border-amber-400 focus-visible:ring-amber-300' : ''}
                    />
                    <FieldError message={touched.nombreProducto ? errors.nombreProducto : undefined} />
                    {duplicates.nombreProducto && !errors.nombreProducto && (
                        <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Ya existe un producto con ese nombre.
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm text-gray-700 mb-2">Referencia <span className="text-red-500">*</span></label>
                    <Input
                        value={form.referencia}
                        onChange={(e) => onChange('referencia', e.target.value)}
                        onBlur={() => onBlur('referencia')}
                        onKeyDown={bloquearCaracteresReferencia}
                        placeholder="Ej: FO-TOY-001" maxLength={50}
                        className={(touched.referencia && errors.referencia) || duplicates.referencia ? 'border-amber-400 focus-visible:ring-amber-300' : ''}
                    />
                    <FieldError message={touched.referencia ? errors.referencia : undefined} />
                    {duplicates.referencia && !errors.referencia && (
                        <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Ya existe un producto con esa referencia.
                        </p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-700 mb-2">Categoría <span className="text-red-500">*</span></label>
                    <CustomSelect
                        value={form.categoriaProductoId}
                        onChange={(v) => { onChange('categoriaProductoId', v); onBlur('categoriaProductoId'); }}
                        options={categoriaOptions} placeholder="Seleccionar categoría"
                        hasError={!!(touched.categoriaProductoId && errors.categoriaProductoId)}
                    />
                    <FieldError message={touched.categoriaProductoId ? errors.categoriaProductoId : undefined} />
                </div>
                <div>
                    <label className="block text-sm text-gray-700 mb-2">Estado</label>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch checked={form.estado === 'activo'} onCheckedChange={(checked) => onChange('estado', checked ? 'activo' : 'inactivo')} />
                        <span className="text-sm text-gray-600">{form.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm text-gray-700 mb-2">Descripción</label>
                <Textarea value={form.descripcion} onChange={(e) => onChange('descripcion', e.target.value)}
                    onKeyDown={bloquearCaracteresDescripcion} rows={3} maxLength={255}
                    placeholder="Descripción del producto (sin caracteres especiales como $, %, @, #...)"
                    className={touched.descripcion && errors.descripcion ? 'border-red-400 focus-visible:ring-red-300' : ''} />
                <FieldError message={touched.descripcion ? errors.descripcion : undefined} />
                <p className="text-xs text-gray-400 mt-1">{form.descripcion.length}/255 caracteres</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-700 mb-2">Precio <span className="text-red-500">*</span></label>
                    <Input
                        type="text" inputMode="decimal"
                        value={form.precio}
                        onChange={(e) => handlePrecioChange(e.target.value)}
                        onBlur={() => onBlur('precio')}
                        onKeyDown={bloquearNonNumeric}
                        onPaste={(e) => {
                            const pasted = e.clipboardData.getData('text');
                            if (/^0\d/.test(pasted) || !/^\d*\.?\d{0,2}$/.test(pasted)) {
                                e.preventDefault();
                                toast.warning('Valor de precio no válido. No puede empezar con 0 ni tener más de 2 decimales.');
                            }
                        }}
                        placeholder="Ej: 15000" min="0.01" step="0.01"
                        className={touched.precio && errors.precio ? 'border-red-400 focus-visible:ring-red-300' : ''}
                    />
                    <FieldError message={touched.precio ? errors.precio : undefined} />
                </div>
                <div>
                    <label className="block text-sm text-gray-700 mb-2">Stock <span className="text-red-500">*</span></label>
                    <Input
                        type="text" inputMode="numeric"
                        value={form.stock}
                        onChange={(e) => onChange('stock', e.target.value)}
                        onBlur={() => onBlur('stock')}
                        onKeyDown={bloquearNonInteger}
                        onPaste={(e) => {
                            const pasted = e.clipboardData.getData('text');
                            if (!/^\d+$/.test(pasted)) {
                                e.preventDefault();
                                toast.warning('El stock solo acepta números enteros.');
                            }
                        }}
                        placeholder="0" min="0"
                        className={touched.stock && errors.stock ? 'border-red-400 focus-visible:ring-red-300' : ''}
                    />
                    <FieldError message={touched.stock ? errors.stock : undefined} />
                </div>
            </div>
        </div>
    );
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

    // ── Estado para alerta de bloqueo ─────────────────────────────────────────
    const [blockedAlertId, setBlockedAlertId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm]         = useState('');
    const [statusFilter, setStatusFilter]     = useState('all');
    const [currentPage, setCurrentPage]       = useState(1);
    const itemsPerPage = 5;

    const [productForm, setProductForm] = useState<ProductoForm>(emptyForm);
    const [formErrors, setFormErrors]   = useState<FormErrors>({});
    const [touched, setTouched]         = useState<Partial<Record<keyof ProductoForm, boolean>>>({});
    const [duplicates, setDuplicates]   = useState<DuplicateErrors>({});

    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const showFeedback = (msg: string) => { setFeedbackMsg(msg); setTimeout(() => setFeedbackMsg(null), 4000); };

    const fetchProductos = useCallback(async () => {
        try {
            setLoading(true);
            const [productosData, categoriasData] = await Promise.all([getProductos(), getCategorias()]);
            setProducts(productosData); setCategorias(categoriasData);
        } catch (error: any) { toast.error(`Error al cargar: ${error.message}`); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchProductos(); }, [fetchProductos]);
    useEffect(() => { setFormErrors(validateProductoForm(productForm)); }, [productForm]);

    useEffect(() => {
        const nombre = productForm.nombreProducto.trim().toLowerCase();
        const ref    = productForm.referencia.trim().toLowerCase();
        const newDups: DuplicateErrors = {};

        if (nombre) {
            const dup = products.find((p) => {
                if (editingProduct && p.id === editingProduct.id) return false;
                return p.nombreProducto.trim().toLowerCase() === nombre;
            });
            if (dup) newDups.nombreProducto = dup.nombreProducto;
        }

        if (ref) {
            const dup = products.find((p) => {
                if (editingProduct && p.id === editingProduct.id) return false;
                return p.referencia.trim().toLowerCase() === ref;
            });
            if (dup) newDups.referencia = dup.referencia;
        }

        setDuplicates(newDups);
    }, [productForm.nombreProducto, productForm.referencia, products, editingProduct]);

    const hasDuplicates = !!(duplicates.nombreProducto || duplicates.referencia);

    const handleToggleEstado = async (product: Producto) => {
        const nuevoEstado: 'activo' | 'inactivo' = product.estado === 'activo' ? 'inactivo' : 'activo';
        // Si se activa, cerrar alerta de ese producto
        if (nuevoEstado === 'activo' && blockedAlertId === product.id) setBlockedAlertId(null);
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, estado: nuevoEstado } : p));
        setTogglingIds(prev => new Set(prev).add(product.id));
        try {
            await updateProducto(product.id, { nombreProducto: product.nombreProducto, referencia: product.referencia, categoriaProductoId: product.categoriaProductoId, descripcion: product.descripcion ?? '', precio: product.precio, stock: product.stock, estado: nuevoEstado });
            toast.success(`Producto ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
        } catch (error: any) {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, estado: product.estado } : p));
            toast.error(`Error al cambiar estado: ${error.message}`);
        } finally {
            setTogglingIds(prev => { const next = new Set(prev); next.delete(product.id); return next; });
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase()) || p.referencia.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && p.estado === 'activo') || (statusFilter === 'inactive' && p.estado === 'inactivo');
        return matchesSearch && matchesStatus;
    });

    const totalPages      = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleFormChange = (field: keyof ProductoForm, value: string) =>
        setProductForm((prev) => ({ ...prev, [field]: value }));

    const handleBlur = (field: keyof ProductoForm) => setTouched((prev) => ({ ...prev, [field]: true }));

    const touchAll = () => setTouched({ nombreProducto: true, referencia: true, categoriaProductoId: true, precio: true, stock: true, descripcion: true });

    const resetForm = () => {
        setProductForm(emptyForm); setEditingProduct(null);
        setFormErrors({}); setTouched({}); setDuplicates({});
        setShowModal(false);
    };

    const handleCreate = async () => {
        touchAll();
        const errors = validateProductoForm(productForm);
        if (Object.keys(errors).length > 0) { toast.error('Completa los campos obligatorios correctamente'); return; }
        if (duplicates.nombreProducto) { toast.error(`Ya existe el producto "${duplicates.nombreProducto}". El nombre debe ser único.`); return; }
        if (duplicates.referencia)     { toast.error(`Ya existe un producto con la referencia "${duplicates.referencia}". La referencia debe ser única.`); return; }

        try {
            setSaving(true);
            await createProducto({
                nombreProducto: productForm.nombreProducto.trim(), referencia: productForm.referencia.trim(),
                categoriaProductoId: parseInt(productForm.categoriaProductoId), descripcion: productForm.descripcion.trim(),
                precio: parseFloat(productForm.precio), stock: parseInt(productForm.stock), estado: productForm.estado,
            });
            showFeedback('✓ Producto creado exitosamente');
            toast.success('Producto creado exitosamente');
            resetForm(); fetchProductos();
        } catch (error: any) {
            if (error.errores && Array.isArray(error.errores))
                error.errores.forEach((e: { campo: string; mensaje: string }) => toast.error(`${e.campo}: ${e.mensaje}`));
            else toast.error(`Error: ${error.message}`);
        } finally { setSaving(false); }
    };

    const handleEdit = async () => {
        touchAll();
        const errors = validateProductoForm(productForm);
        if (!editingProduct || Object.keys(errors).length > 0) { toast.error('Completa los campos obligatorios correctamente'); return; }
        if (duplicates.nombreProducto) { toast.error(`Ya existe el producto "${duplicates.nombreProducto}". El nombre debe ser único.`); return; }
        if (duplicates.referencia)     { toast.error(`Ya existe un producto con la referencia "${duplicates.referencia}". La referencia debe ser única.`); return; }

        try {
            setSaving(true);
            await updateProducto(editingProduct.id, {
                nombreProducto: productForm.nombreProducto.trim(), referencia: productForm.referencia.trim(),
                categoriaProductoId: parseInt(productForm.categoriaProductoId), descripcion: productForm.descripcion.trim(),
                precio: parseFloat(productForm.precio), stock: parseInt(productForm.stock), estado: productForm.estado,
            });
            showFeedback('✓ Producto actualizado correctamente');
            toast.success('Producto actualizado exitosamente');
            resetForm(); fetchProductos();
        } catch (error: any) {
            if (error.errores && Array.isArray(error.errores))
                error.errores.forEach((e: { campo: string; mensaje: string }) => toast.error(`${e.campo}: ${e.mensaje}`));
            else toast.error(`Error: ${error.message}`);
        } finally { setSaving(false); }
    };

    const viewDetails = async (product: Producto) => {
        setShowDetailModal(true); setViewingProduct(null); setLoadingDetail(true);
        try { const detail = await getProductoById(product.id); setViewingProduct(detail); }
        catch (error: any) { toast.error(`Error: ${error.message}`); }
        finally { setLoadingDetail(false); }
    };

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

    const openEditDialog = (product: Producto) => {
        setEditingProduct(product);
        setProductForm({ nombreProducto: product.nombreProducto, referencia: product.referencia, categoriaProductoId: product.categoriaProductoId.toString(), descripcion: product.descripcion ?? '', precio: product.precio.toString(), stock: product.stock.toString(), estado: product.estado });
        setFormErrors({}); setTouched({}); setDuplicates({});
        setShowModal(true);
    };

    // ── Helper para manejar clic en botones bloqueados ─────────────────────────
    const handleBlockedClick = (productId: number) => {
        setBlockedAlertId(prev => prev === productId ? null : productId);
    };

    return (
        <div className="p-6 space-y-6">

            {feedbackMsg && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{feedbackMsg}</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Productos</h1>
                    <p className="text-blue-800">Administra el catálogo completo de productos</p>
                </div>
                <Button onClick={() => { setEditingProduct(null); setProductForm(emptyForm); setFormErrors({}); setTouched({}); setDuplicates({}); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />Nuevo Producto
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar por nombre o referencia..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
                            <Button variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setView('table')} className={view === 'table' ? 'bg-blue-600 hover:bg-blue-700' : ''}><FileText className="w-4 h-4" /></Button>
                            <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setView('grid')} className={view === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : ''}><Package className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" /><span className="ml-2 text-gray-500">Cargando productos...</span>
                </div>
            ) : view === 'table' ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">ID</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Producto</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Categoría</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Precio / Stock</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProducts.map((product) => {
                                        const disabled = product.estado === 'inactivo';
                                        return (
                                            <React.Fragment key={product.id}>
                                                <tr className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="font-mono text-sm text-gray-500">#{product.id}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900">{product.nombreProducto}</span>
                                                            <span className="text-sm text-blue-900">Ref: {product.referencia}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <Badge variant="secondary">{product.categoria?.nombreCategoria ?? `#${product.categoriaProductoId}`}</Badge>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-blue-900 font-semibold">${Number(product.precio).toLocaleString()}</span>
                                                            <span className="text-sm text-gray-500">Stock: {product.stock} und</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Switch checked={product.estado === 'activo'} onCheckedChange={() => handleToggleEstado(product)} disabled={togglingIds.has(product.id)} />
                                                            {togglingIds.has(product.id) && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-2">
                                                            {/* VER — siempre activo */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => viewDetails(product)}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>

                                                            {/* EDITAR */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => disabled ? handleBlockedClick(product.id) : openEditDialog(product)}
                                                                className={`border ${
                                                                    disabled
                                                                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>

                                                            {/* ELIMINAR */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => disabled ? handleBlockedClick(product.id) : openDeleteModal(product)}
                                                                className={`border ${
                                                                    disabled
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
                                                {blockedAlertId === product.id && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 pb-3 pt-0">
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
                            {filteredProducts.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron productos</div>}
                        </div>
                        {totalPages > 1 && (
                            <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}>{page}</Button>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                // ── Vista Grid ────────────────────────────────────────────────
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentProducts.map((product) => {
                        const disabled = product.estado === 'inactivo';
                        return (
                            <Card key={product.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{product.referencia}</code>
                                        <div className="flex items-center gap-1.5">
                                            <Switch checked={product.estado === 'activo'} onCheckedChange={() => handleToggleEstado(product)} disabled={togglingIds.has(product.id)} />
                                            <span className={`text-xs font-medium ${product.estado === 'activo' ? 'text-blue-700' : 'text-gray-400'}`}>
                                                {togglingIds.has(product.id) ? <Loader2 className="w-3 h-3 animate-spin inline" /> : product.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono mb-1">#{product.id}</p>
                                    <h3 className="text-gray-900 font-semibold mb-1">{product.nombreProducto}</h3>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.descripcion}</p>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-lg text-blue-600 font-bold">${Number(product.precio).toLocaleString()}</span>
                                        <Badge variant="secondary">{product.categoria?.nombreCategoria ?? `Cat #${product.categoriaProductoId}`}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">Stock: {product.stock} und</p>

                                    <div className="flex space-x-2">
                                        {/* VER */}
                                        <Button variant="outline" size="sm" onClick={() => viewDetails(product)} className="flex-1">
                                            <Eye className="w-4 h-4 mr-1" /> Ver
                                        </Button>

                                        {/* EDITAR */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => disabled ? handleBlockedClick(product.id) : openEditDialog(product)}
                                            className={`flex-1 ${
                                                disabled
                                                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                    : 'text-blue-600'
                                            }`}
                                        >
                                            <Edit className="w-4 h-4 mr-1" /> Editar
                                        </Button>

                                        {/* ELIMINAR */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => disabled ? handleBlockedClick(product.id) : openDeleteModal(product)}
                                            className={disabled
                                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                : 'text-blue-900 border-blue-900 hover:bg-blue-50'
                                            }
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Alerta de bloqueo en grid */}
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

            {/* MODAL — CREAR / EDITAR */}
            <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                            <DialogDescription>{editingProduct ? 'Modifica la información del producto.' : 'Completa el formulario para agregar un nuevo producto.'}</DialogDescription>
                        </DialogHeader>

                        {Object.keys(touched).length > 0 && Object.keys(formErrors).length > 0 && (
                            <div className="mt-4"><InfoAlert message="Algunos campos requieren atención antes de continuar." /></div>
                        )}

                        <div className="mt-4">
                            <ProductForm form={productForm} categorias={categorias} onChange={handleFormChange}
                                errors={formErrors} touched={touched} onBlur={handleBlur} duplicates={duplicates} />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button variant="outline" onClick={resetForm} disabled={saving}>Cancelar</Button>
                            <Button
                                type="button"
                                disabled={saving || hasDuplicates}
                                onClick={() => { editingProduct ? handleEdit() : handleCreate(); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL — VER DETALLE */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible p-0">
                    <div className="overflow-y-auto max-h-[90vh] p-6">
                        <DialogHeader>
                            <DialogTitle>Detalles del Producto</DialogTitle>
                            <DialogDescription>Información completa del producto seleccionado.</DialogDescription>
                        </DialogHeader>
                        {loadingDetail ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                        ) : viewingProduct ? (
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                    <div><p className="text-xs text-gray-500 uppercase">Referencia</p><p className="font-semibold">{viewingProduct.referencia}</p></div>
                                    <div className="col-span-2"><p className="text-xs text-gray-500 uppercase">Producto</p><p className="font-semibold text-blue-900 text-lg">{viewingProduct.nombreProducto}</p></div>
                                    <div><p className="text-xs text-gray-500 uppercase">Precio</p><p className="text-blue-600 font-bold text-xl">${Number(viewingProduct.precio).toLocaleString()}</p></div>
                                    <div><p className="text-xs text-gray-500 uppercase">Stock</p><p className="font-semibold text-xl">{viewingProduct.stock} und</p></div>
                                    <div><p className="text-xs text-gray-500 uppercase">Categoría</p><Badge variant="secondary">{viewingProduct.categoria?.nombreCategoria ?? `#${viewingProduct.categoriaProductoId}`}</Badge></div>
                                    <div><p className="text-xs text-gray-500 uppercase">Estado</p><Badge className={viewingProduct.estado === 'activo' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-500'}>{viewingProduct.estado}</Badge></div>
                                    {viewingProduct.descripcion && (<div className="col-span-2"><p className="text-xs text-gray-500 uppercase">Descripción</p><p className="text-sm text-gray-700">{viewingProduct.descripcion}</p></div>)}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL — CONFIRMAR ELIMINACIÓN */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
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
                                {!deleteConfirmed ? (
                                    <p className="text-sm text-gray-600">¿Estás seguro de que deseas eliminar este producto permanentemente?</p>
                                ) : (
                                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg px-4 py-3 text-sm">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600" />
                                        Confirma que entiendes que esta acción es irreversible.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button variant="outline" onClick={() => { setShowDeleteModal(false); setDeletingProduct(null); setDeleteConfirmed(false); }} disabled={deleting}>
                                Cancelar
                            </Button>
                            {!deleteConfirmed ? (
                                <Button onClick={() => setDeleteConfirmed(true)} className="bg-white hover:bg-red-50 text-blue-900 border border-blue-900">
                                    Sí, eliminar
                                </Button>
                            ) : (
                                <Button onClick={handleDelete} disabled={deleting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    Confirmar eliminación
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}