import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
    Dialog, DialogContent, DialogDescription, DialogTitle,
} from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import {
    Package, Info, Loader2, LinkIcon, Upload, ImageOff,
    ChevronDown, Check, AlertTriangle, Tag,
} from 'lucide-react';

// ─── Tipos exportados ─────────────────────────────────────────────────────────
export interface Categoria { id: number; nombreCategoria: string; descripcion: string | null; }
export interface Producto {
    id: number; nombreProducto: string; referencia: string;
    categoriaProductoId: number; descripcion: string | null;
    precio: number; stock: number; estado: 'activo' | 'inactivo';
    categoria?: Categoria;
    imagenUrl?: string | null;
}
// Nota: estado y stock NO están en el form.
// - Estado: siempre 'activo' al crear; se cambia desde el switch del listado.
// - Stock: valor inicial fijo al crear; se modifica desde otras pantallas (ventas, ajustes, etc.).
export interface ProductoForm {
    nombreProducto: string;
    referencia: string;
    categoriaProductoId: string;
    descripcion: string;
    precio: string;
    imagenUrl: string;
}
interface FormErrors {
    nombreProducto?: string; referencia?: string; categoriaProductoId?: string;
    descripcion?: string; precio?: string; imagenUrl?: string;
}
interface DuplicateErrors { nombreProducto?: string; referencia?: string; }

// ─── Constantes ───────────────────────────────────────────────────────────────
const PRECIO_MAXIMO = 99_999_999.99;
const DESC_MAX      = 255;

// ─── Regex ────────────────────────────────────────────────────────────────────
const SOLO_TEXTO_REGEX       = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]*$/;
const SOLO_REFERENCIA_REGEX  = /^[a-zA-Z0-9\-_./]*$/;
const SOLO_DESCRIPCION_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]*$/;
const CHARS_BLOQUEADOS_TEXTO = /[$%@#&*|\\^`~<>=+{}[\]!?¡¿"';:]/;
const CHARS_BLOQUEADOS_REF   = /[$%@#&*|\\^`~<>=+{}[\]!?¡¿"';: áéíóúÁÉÍÓÚñÑüÜ]/;
const CHARS_BLOQUEADOS_DESC  = /[$%@#&*|\\^`~<>=+{}[\]¡¿]/;

// ─── Validador ────────────────────────────────────────────────────────────────
function validateProductoForm(form: ProductoForm): FormErrors {
    const errors: FormErrors = {};

    if (!form.nombreProducto.trim())
        errors.nombreProducto = 'El nombre es obligatorio.';
    else if (form.nombreProducto.trim().length < 2)
        errors.nombreProducto = 'Mínimo 2 caracteres.';
    else if (form.nombreProducto.trim().length > 30)
        errors.nombreProducto = 'Máximo 30 caracteres.';
    else if (!SOLO_TEXTO_REGEX.test(form.nombreProducto))
        errors.nombreProducto = 'No puede contener caracteres especiales.';
    else if ((form.nombreProducto.match(/[0-9]/g) || []).length > 2)
        errors.nombreProducto = 'El nombre no puede contener más de 2 números.';
    else if ((form.nombreProducto.match(/[-.,()]/g) || []).length > 1)
        errors.nombreProducto = 'El nombre no puede contener más de 1 carácter especial (-, ., ,, paréntesis).';

    if (!form.referencia.trim())
        errors.referencia = 'La referencia es obligatoria.';
    else if (form.referencia.trim().length < 2)
        errors.referencia = 'Mínimo 2 caracteres.';
    else if (form.referencia.trim().length > 50)
        errors.referencia = 'Máximo 50 caracteres.';
    else if (!SOLO_REFERENCIA_REGEX.test(form.referencia))
        errors.referencia = 'Solo letras, números, guiones, _ , . y /.';

    if (!form.categoriaProductoId)
        errors.categoriaProductoId = 'Selecciona una categoría.';

    if (form.descripcion.trim().length > 0 && form.descripcion.trim().length < 5)
        errors.descripcion = 'La descripción debe tener al menos 5 caracteres.';
    else if (form.descripcion && !SOLO_DESCRIPCION_REGEX.test(form.descripcion))
        errors.descripcion = 'La descripción contiene caracteres no permitidos.';

    if (form.precio === '') {
        errors.precio = 'El precio es obligatorio.';
    } else if (/^0/.test(form.precio)) {
        errors.precio = 'El precio no puede empezar con 0.';
    } else if (isNaN(parseFloat(form.precio)) || parseFloat(form.precio) <= 0) {
        errors.precio = 'El precio debe ser mayor a 0.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.precio)) {
        errors.precio = 'Máximo 2 decimales permitidos.';
    } else if (parseFloat(form.precio) > PRECIO_MAXIMO) {
        errors.precio = 'El precio no puede superar $99,999,999.99.';
    }

    if (form.imagenUrl.trim()) {
    const url = form.imagenUrl.trim();
    if (!url.startsWith('data:image/')) {
        try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                errors.imagenUrl = 'Solo se permiten links directos de imágenes válidas (.png, .jpg, .jpeg, .webp...)';
            } else {
                const pathname = parsed.pathname.toLowerCase().split('?')[0];
                const EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
                if (!EXTS.some(ext => pathname.endsWith(ext))) {
                    errors.imagenUrl = 'Solo se permiten links directos de imágenes válidas (.png, .jpg, .jpeg, .webp...)';
                }
            }
        } catch {
            errors.imagenUrl = 'Solo se permiten links directos de imágenes válidas (.png, .jpg, .jpeg, .webp...)';
        }
    }
}

    return errors;
}

// ─── Bloqueadores de teclado ──────────────────────────────────────────────────
const bloquearTexto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
    if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (CHARS_BLOQUEADOS_TEXTO.test(e.key)) { e.preventDefault(); toast.warning(`El carácter "${e.key}" no está permitido.`); }
};
const bloquearReferencia = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (CHARS_BLOQUEADOS_REF.test(e.key)) { e.preventDefault(); toast.warning(`El carácter "${e.key}" no está permitido.`); }
};
const bloquearDescripcion = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
    if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (CHARS_BLOQUEADOS_DESC.test(e.key)) { e.preventDefault(); toast.warning(`El carácter "${e.key}" no está permitido.`); }
};
const bloquearPrecio = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/[\d.]/.test(e.key)) { e.preventDefault(); return; }
    const input = e.currentTarget;
    if (e.key === '.' && input.value.includes('.')) { e.preventDefault(); return; }
    if (e.key === '0' && (input.value === '' || (input.selectionStart === 0 && input.selectionEnd === input.value.length))) {
        e.preventDefault(); toast.warning('El precio no puede empezar con 0.');
    }
};

// ─── Estilos reutilizables ────────────────────────────────────────────────────
const S = {
    label: {
        fontSize: 11, fontWeight: 600, color: '#6b7280',
        textTransform: 'uppercase' as const, letterSpacing: '0.05em',
        marginBottom: 6, display: 'block',
    },
    fieldGroup: { marginBottom: 18 },
    error: {
        color: '#ef4444', fontSize: 11, marginTop: 4,
        display: 'flex', alignItems: 'center', gap: 4,
    },
};

// ─── Componentes pequeños ─────────────────────────────────────────────────────
const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p style={S.error}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
            {message}
        </p>
    ) : null;

const DupWarning = ({ show }: { show: boolean }) =>
    show ? (
        <p style={{ color: '#d97706', fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle style={{ width: 11, height: 11, flexShrink: 0 }} />
            Ya existe un producto con ese valor.
        </p>
    ) : null;

// ─── CustomSelect ──────────────────────────────────────────────────────────────
interface CustomSelectProps {
    value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string; hasError?: boolean;
}
const CustomSelect = ({ value, onChange, options, placeholder = 'Seleccionar...', hasError }: CustomSelectProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(o => o.value === value)?.label;

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen(p => !p)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', height: 40, padding: '0 12px', borderRadius: 6,
                    border: `1px solid ${hasError ? '#f87171' : open ? '#60a5fa' : '#e5e7eb'}`,
                    background: '#fff', fontSize: 14, cursor: 'pointer',
                    color: selectedLabel ? '#111827' : '#9ca3af',
                    outline: open ? '2px solid #bfdbfe' : 'none',
                    outlineOffset: 1, transition: 'border-color 0.15s',
                }}
            >
                <span>{selectedLabel ?? placeholder}</span>
                <ChevronDown style={{
                    width: 14, height: 14, color: '#9ca3af',
                    transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
                }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', zIndex: 9999, width: '100%', marginTop: 4,
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    maxHeight: 160, overflowY: 'auto',
                }}>
                    {options.length === 0
                        ? <div style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Sin categorías</div>
                        : options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    width: '100%', padding: '8px 16px', fontSize: 14,
                                    border: 'none', cursor: 'pointer', textAlign: 'left',
                                    background: value === opt.value ? '#dbeafe' : '#fff',
                                    color: value === opt.value ? '#1e3a8a' : '#1f2937',
                                    fontWeight: value === opt.value ? 600 : 400,
                                }}
                                onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = '#eff6ff'; }}
                                onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = '#fff'; }}
                            >
                                {opt.label}
                                {value === opt.value && <Check style={{ width: 12, height: 12, color: '#1d4ed8' }} />}
                            </button>
                        ))
                    }
                </div>
            )}
        </div>
    );
};

// ─── Imagen con fallback ───────────────────────────────────────────────────────
const ProductImagePreview = ({ src }: { src?: string | null }) => {
    const [error, setError] = useState(false);
    useEffect(() => setError(false), [src]);

    if (!src || error) {
        return (
            <div style={{
                width: '100%', height: 160,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', background: '#f9fafb', gap: 8,
            }}>
                <ImageOff style={{ width: 28, height: 28, color: '#d1d5db' }} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Sin imagen</span>
            </div>
        );
    }
    return (
        <img
            src={src} alt="Preview"
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
            onError={() => setError(true)}
        />
    );
};

// ─── Props del modal ──────────────────────────────────────────────────────────
export interface ProductFormModalProps {
    open: boolean;
    editingProduct: Producto | null;
    categorias: Categoria[];
    products: Producto[];
    saving: boolean;
    onSave: (form: ProductoForm) => void;
    onClose: () => void;
}

const emptyForm: ProductoForm = {
    nombreProducto: '',
    referencia: '',
    categoriaProductoId: '',
    descripcion: '',
    precio: '',
    imagenUrl: '',
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function ProductFormModal({
    open, editingProduct, categorias, products, saving, onSave, onClose,
}: ProductFormModalProps) {

    const [form, setForm]             = useState<ProductoForm>(emptyForm);
    const [errors, setErrors]         = useState<FormErrors>({});
    const [touched, setTouched]       = useState<Partial<Record<keyof ProductoForm, boolean>>>({});
    const [duplicates, setDuplicates] = useState<DuplicateErrors>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [imageMode, setImageMode]   = useState<'url' | 'file'>('url');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Reset al abrir ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        if (editingProduct) {
            const f: ProductoForm = {
                nombreProducto:      editingProduct.nombreProducto,
                referencia:          editingProduct.referencia,
                categoriaProductoId: editingProduct.categoriaProductoId.toString(),
                descripcion:         editingProduct.descripcion ?? '',
                precio:              editingProduct.precio.toString(),
                imagenUrl:           editingProduct.imagenUrl ?? '',
            };
            setForm(f);
            setImageMode(f.imagenUrl.startsWith('data:image/') ? 'file' : 'url');
        } else {
            setForm(emptyForm);
            setImageMode('url');
        }
        setErrors({});
        setTouched({});
        setDuplicates({});
        setSubmitAttempted(false);
    }, [open, editingProduct]);

    // ── Validación en vivo ────────────────────────────────────────────────────
    useEffect(() => { setErrors(validateProductoForm(form)); }, [form]);

    // ── Verificación de duplicados ────────────────────────────────────────────
    useEffect(() => {
        const nombre = form.nombreProducto.trim().toLowerCase();
        const ref    = form.referencia.trim().toLowerCase();
        const newDups: DuplicateErrors = {};

        if (nombre) {
            const dup = products.find(p => {
                if (editingProduct && p.id === editingProduct.id) return false;
                return p.nombreProducto.trim().toLowerCase() === nombre;
            });
            if (dup) newDups.nombreProducto = dup.nombreProducto;
        }
        if (ref) {
            const dup = products.find(p => {
                if (editingProduct && p.id === editingProduct.id) return false;
                return p.referencia.trim().toLowerCase() === ref;
            });
            if (dup) newDups.referencia = dup.referencia;
        }
        setDuplicates(newDups);
    }, [form.nombreProducto, form.referencia, products, editingProduct]);

    const handleChange = (f: keyof ProductoForm, v: string) =>
        setForm(p => ({ ...p, [f]: v }));

    const handleBlur = (f: keyof ProductoForm) =>
        setTouched(p => ({ ...p, [f]: true }));

    const touchAll = () => setTouched({
        nombreProducto: true, referencia: true, categoriaProductoId: true,
        precio: true, descripcion: true, imagenUrl: true,
    });

    const hasDuplicates = !!(duplicates.nombreProducto || duplicates.referencia);
    const totalErrors   = Object.keys(errors).length;

    // ── File upload ───────────────────────────────────────────────────────────
    const handleFileButtonClick = () => {
        (window as any)._filePickerOpen = true;
        const clear = () => { (window as any)._filePickerOpen = false; window.removeEventListener('focus', clear); };
        window.addEventListener('focus', clear);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        (window as any)._filePickerOpen = false;
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.warning('Solo se permiten imágenes.'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.warning('La imagen no puede superar 5 MB.'); return; }
        const reader = new FileReader();
        reader.onload = ev => { handleChange('imagenUrl', ev.target?.result as string); handleBlur('imagenUrl'); };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const switchImageMode = (mode: 'url' | 'file') => {
        setImageMode(mode);
        handleChange('imagenUrl', '');
    };

    const handlePrecioChange = (raw: string) => {
        const sanitized = raw.replace(/^0+(\d)/, '$1');
        const [intPart] = sanitized.split('.');
        if (intPart && intPart.length > 8) return;
        handleChange('precio', sanitized);
    };

    // ── Guardar ───────────────────────────────────────────────────────────────
    const handleSave = () => {
        setSubmitAttempted(true);
        touchAll();
        const errs = validateProductoForm(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) { toast.error('Completa los campos obligatorios correctamente.'); return; }
        if (duplicates.nombreProducto) { toast.error(`Ya existe el producto "${duplicates.nombreProducto}".`); return; }
        if (duplicates.referencia)     { toast.error(`Ya existe un producto con la referencia "${duplicates.referencia}".`); return; }
        onSave(form);
    };

    // ── Derivados ─────────────────────────────────────────────────────────────
    const categoriaOptions  = categorias.map(c => ({ value: c.id.toString(), label: c.nombreCategoria }));
    const selectedCategoria = categorias.find(c => c.id.toString() === form.categoriaProductoId);
    const precioValido      = form.precio && !errors.precio;
    const precioFormateado  = precioValido
        ? `$${parseFloat(form.precio).toLocaleString('es-CO', { maximumFractionDigits: 2 })}`
        : '—';

    return (
        <Dialog
            open={open}
            onOpenChange={o => { if (!o && !(window as any)._filePickerOpen) onClose(); }}
        >
            <DialogContent
                className="p-0 gap-0 overflow-hidden"
                style={{
                    width: '98vw', maxWidth: '1600px', height: '92vh', maxHeight: '92vh',
                    display: 'flex', flexDirection: 'column', padding: 0, gap: 0,
                }}
                onInteractOutside={e => { if ((window as any)._filePickerOpen) e.preventDefault(); }}
            >

                {/* ════ HEADER ════ */}
                <header style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
                    flexShrink: 0, background: '#fff',
                }}>
                    <div style={{
                        width: 40, height: 40, background: '#1d4ed8', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Package style={{ width: 20, height: 20, color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
                        <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.2, margin: 0 }}>
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </DialogTitle>
                        <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            {editingProduct
                                ? 'Modifica la información del producto en el catálogo.'
                                : 'Completa el formulario para registrar un nuevo producto en el catálogo.'}
                        </DialogDescription>
                    </div>
                </header>

                {/* ════ ALERTA ════ */}
                {submitAttempted && totalErrors > 0 && (
                    <div style={{
                        padding: '8px 24px', background: '#fffbeb', borderBottom: '1px solid #fde68a',
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
                        fontSize: 12, color: '#92400e',
                    }}>
                        <Info style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0 }} />
                        <span>{totalErrors} campo(s) requieren atención antes de continuar.</span>
                    </div>
                )}

                {/* ════ BODY ════ */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                    {/* ── SIDEBAR IZQUIERDO ── */}
                    <aside style={{
                        width: 320, flexShrink: 0,
                        borderRight: '1px solid #e5e7eb', background: '#f9fafb',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                            {/* Nombre */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>Nombre <span style={{ color: '#f87171' }}>*</span></label>
                                <Input
                                    value={form.nombreProducto}
                                    onChange={e => handleChange('nombreProducto', e.target.value)}
                                    onBlur={() => handleBlur('nombreProducto')}
                                    onKeyDown={bloquearTexto}
                                    placeholder="Ej: Filtro de Aceite Toyota"
                                    maxLength={30} autoFocus
                                    style={{
                                        height: 40, fontSize: 14, background: '#fff',
                                        borderColor: (touched.nombreProducto && errors.nombreProducto)
                                            ? '#f87171' : duplicates.nombreProducto ? '#f59e0b' : undefined,
                                    }}
                                />
                                <FieldError message={touched.nombreProducto ? errors.nombreProducto : undefined} />
                                <DupWarning show={!!duplicates.nombreProducto && !errors.nombreProducto} />
                            </div>

                            {/* Referencia */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>Referencia <span style={{ color: '#f87171' }}>*</span></label>
                                <Input
                                    value={form.referencia}
                                    onChange={e => handleChange('referencia', e.target.value)}
                                    onBlur={() => handleBlur('referencia')}
                                    onKeyDown={bloquearReferencia}
                                    placeholder="Ej: FO-TOY-001" maxLength={50}
                                    style={{
                                        height: 40, fontSize: 14, background: '#fff',
                                        borderColor: (touched.referencia && errors.referencia)
                                            ? '#f87171' : duplicates.referencia ? '#f59e0b' : undefined,
                                    }}
                                />
                                <FieldError message={touched.referencia ? errors.referencia : undefined} />
                                <DupWarning show={!!duplicates.referencia && !errors.referencia} />
                            </div>

                            {/* Categoría */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>Categoría <span style={{ color: '#f87171' }}>*</span></label>
                                <CustomSelect
                                    value={form.categoriaProductoId}
                                    onChange={v => { handleChange('categoriaProductoId', v); handleBlur('categoriaProductoId'); }}
                                    options={categoriaOptions} placeholder="Seleccionar categoría"
                                    hasError={!!(touched.categoriaProductoId && errors.categoriaProductoId)}
                                />
                                <FieldError message={touched.categoriaProductoId ? errors.categoriaProductoId : undefined} />
                            </div>

                            {/* Descripción */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>
                                    Descripción{' '}
                                    <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', textTransform: 'none', letterSpacing: 0 }}>
                                        (opcional)
                                    </span>
                                </label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={e => handleChange('descripcion', e.target.value)}
                                    onKeyDown={bloquearDescripcion}
                                    onBlur={e => {
                                        handleBlur('descripcion');
                                        e.currentTarget.style.borderColor = (touched.descripcion && errors.descripcion) ? '#f87171' : '#e5e7eb';
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#60a5fa'; }}
                                    placeholder="Descripción del producto..."
                                    rows={4} maxLength={DESC_MAX + 1}
                                    style={{
                                        width: '100%', fontSize: 14, background: '#fff', resize: 'none',
                                        padding: '8px 12px',
                                        border: `1px solid ${touched.descripcion && errors.descripcion ? '#f87171' : '#e5e7eb'}`,
                                        borderRadius: 6, outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                                        transition: 'border-color 0.15s',
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                    <FieldError message={touched.descripcion ? errors.descripcion : undefined} />
                                    <span style={{
                                        fontSize: 11, marginLeft: 'auto',
                                        color: form.descripcion.length > DESC_MAX ? '#ef4444' : '#9ca3af',
                                    }}>
                                        {form.descripcion.length}/{DESC_MAX}
                                    </span>
                                </div>
                            </div>

                            {/* Info banner: estado y stock */}
                            <div style={{
                                marginTop: 4,
                                padding: '10px 12px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: 8,
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                            }}>
                                <Info style={{ width: 14, height: 14, color: '#1d4ed8', flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: 11, color: '#1e3a8a', lineHeight: 1.4, margin: 0 }}>
                                    {editingProduct
                                        ? 'El estado y el stock se gestionan desde el listado de productos.'
                                        : 'Los productos nuevos se crean como activos. El estado se gestiona desde el listado.'}
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* ── PANEL DERECHO ── */}
                    <section style={{
                        flex: 1, minWidth: 0, display: 'flex',
                        flexDirection: 'column', overflow: 'hidden', background: '#fff',
                    }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                            <h3 style={{ fontWeight: 700, color: '#111827', fontSize: 16, margin: 0, lineHeight: 1.2 }}>
                                Precio e imagen del producto
                            </h3>
                            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, margin: 0 }}>
                                Define el precio y agrega una imagen para el catálogo.
                            </p>
                        </div>

                        <div style={{
                            flex: 1, overflowY: 'auto', padding: 24,
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignContent: 'start',
                        }}>

                            {/* Precio */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={S.label}>Precio del producto <span style={{ color: '#f87171' }}>*</span></label>
                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    border: `2px solid ${touched.precio && errors.precio ? '#f87171' : '#e5e7eb'}`,
                                    borderRadius: 10, background: '#fff', overflow: 'hidden', transition: 'border-color 0.15s',
                                }}>
                                    <div style={{
                                        padding: '0 18px', background: '#f9fafb', borderRight: '2px solid #e5e7eb',
                                        height: 56, display: 'flex', alignItems: 'center',
                                        fontSize: 20, fontWeight: 700, color: '#9ca3af', flexShrink: 0,
                                    }}>$</div>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={form.precio}
                                        onChange={e => handlePrecioChange(e.target.value)}
                                        onBlur={e => {
                                            handleBlur('precio');
                                            const p = e.currentTarget.parentElement as HTMLElement;
                                            if (p) p.style.borderColor = errors.precio ? '#f87171' : '#e5e7eb';
                                        }}
                                        onFocus={e => {
                                            const p = e.currentTarget.parentElement as HTMLElement;
                                            if (p) p.style.borderColor = '#60a5fa';
                                        }}
                                        onKeyDown={bloquearPrecio}
                                        onPaste={e => {
                                            const pasted = e.clipboardData.getData('text');
                                            if (/^0\d/.test(pasted) || !/^\d*\.?\d{0,2}$/.test(pasted) || parseFloat(pasted) > PRECIO_MAXIMO) {
                                                e.preventDefault(); toast.warning('Precio no válido. Máximo $99,999,999.99.');
                                            }
                                        }}
                                        placeholder="0.00"
                                        style={{
                                            flex: 1, height: 56, padding: '0 16px',
                                            fontSize: 24, fontWeight: 700, color: '#111827',
                                            border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit',
                                        }}
                                    />
                                    <div style={{ padding: '0 18px', fontSize: 13, color: '#9ca3af', fontWeight: 600, flexShrink: 0 }}>COP</div>
                                </div>
                                <FieldError message={touched.precio ? errors.precio : undefined} />
                                {precioValido && (
                                    <p style={{ fontSize: 12, color: '#10b981', marginTop: 4, fontWeight: 500 }}>✓ {precioFormateado} COP</p>
                                )}
                            </div>

                            {/* Imagen */}
                            <div>
                                <label style={S.label}>
                                    Imagen{' '}
                                    <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                                </label>
                                <div style={{
                                    display: 'flex', borderRadius: 8, border: '1px solid #e5e7eb',
                                    overflow: 'hidden', width: 'fit-content', marginBottom: 10,
                                }}>
                                    {(['url', 'file'] as const).map(mode => (
                                        <button key={mode} type="button" onClick={() => switchImageMode(mode)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                                                background: imageMode === mode ? '#1d4ed8' : '#fff',
                                                color: imageMode === mode ? '#fff' : '#6b7280',
                                                borderRight: mode === 'url' ? '1px solid #e5e7eb' : 'none', transition: 'all 0.15s',
                                            }}>
                                            {mode === 'url'
                                                ? <><LinkIcon style={{ width: 12, height: 12 }} /> Enlace URL</>
                                                : <><Upload style={{ width: 12, height: 12 }} /> Archivo local</>}
                                        </button>
                                    ))}
                                </div>

                                {imageMode === 'url' ? (
                                    <Input type="url" value={form.imagenUrl}
                                        onChange={e => { handleChange('imagenUrl', e.target.value); handleBlur('imagenUrl'); }}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        style={{ height: 40, fontSize: 13, background: '#fff', borderColor: touched.imagenUrl && errors.imagenUrl ? '#f87171' : undefined }}
                                    />
                                ) : (
                                    <>
                                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                        <button type="button" onClick={handleFileButtonClick}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                width: '100%', padding: '12px', fontSize: 13, fontWeight: 500,
                                                border: '2px dashed #d1d5db', borderRadius: 8, cursor: 'pointer',
                                                color: '#6b7280', background: '#fafafa', transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.color = '#1d4ed8'; e.currentTarget.style.background = '#eff6ff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = '#fafafa'; }}>
                                            <Upload style={{ width: 15, height: 15 }} />
                                            {form.imagenUrl ? 'Cambiar imagen' : 'Seleccionar imagen'}
                                        </button>
                                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>JPG, PNG, WEBP, GIF · máx. 5 MB</p>
                                    </>
                                )}
                                <FieldError message={touched.imagenUrl ? errors.imagenUrl : undefined} />

                                {form.imagenUrl && !errors.imagenUrl && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 10, marginTop: 10,
                                        padding: '8px 10px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb',
                                    }}>
                                        <img src={form.imagenUrl} alt="thumb"
                                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', flexShrink: 0 }}
                                            onError={e => { e.currentTarget.style.display = 'none'; }} />
                                        <span style={{ fontSize: 11, color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {form.imagenUrl.startsWith('data:') ? 'Imagen cargada desde archivo' : form.imagenUrl}
                                        </span>
                                        <button type="button" onClick={() => handleChange('imagenUrl', '')}
                                            style={{ fontSize: 11, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                                            Quitar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Vista previa */}
                            <div>
                                <label style={S.label}>Vista previa</label>
                                <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <ProductImagePreview src={form.imagenUrl || null} />
                                    <div style={{ padding: '14px 16px' }}>
                                        <code style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, color: '#6b7280', fontFamily: 'monospace', display: 'inline-block', marginBottom: 8 }}>
                                            {form.referencia || 'REF-000'}
                                        </code>
                                        <h4 style={{ fontWeight: 600, color: '#111827', fontSize: 14, marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {form.nombreProducto || 'Nombre del producto'}
                                        </h4>
                                        {form.descripcion && (
                                            <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {form.descripcion}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                            <span style={{ fontSize: 18, fontWeight: 700, color: '#1d4ed8' }}>{precioFormateado}</span>
                                            {selectedCategoria && (
                                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#f3f4f6', color: '#374151', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Tag style={{ width: 10, height: 10 }} />{selectedCategoria.nombreCategoria}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>
                </div>

                {/* ════ FOOTER ════ */}
                <footer style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 16, padding: '12px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
                }}>
                    <p style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                        <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                        Todos los precios están en COP
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <Button variant="outline" onClick={onClose} disabled={saving} style={{ height: 36, padding: '0 16px' }}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave} disabled={saving || hasDuplicates}
                            style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px', opacity: hasDuplicates ? 0.6 : 1 }}
                        >
                            {saving && <Loader2 style={{ width: 16, height: 16, marginRight: 8 }} className="animate-spin" />}
                            {editingProduct ? 'Actualizar producto' : 'Crear producto'}
                        </Button>
                    </div>
                </footer>

            </DialogContent>
        </Dialog>
    );
}