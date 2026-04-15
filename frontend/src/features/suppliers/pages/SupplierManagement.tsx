// src/features/suppliers/SupplierManagement.tsx
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
    Building2,
} from 'lucide-react';
import {
    getProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    mapProveedorToSupplier,
    mapSupplierToDTO,
} from '../services/proveedoresService';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Supplier {
    id:                  number;
    type:                string;
    name:                string;
    firstName?:          string;
    lastName?:           string;
    legalRepresentative?: string;
    documentType:        string;
    documentNumber:      string;
    contact:             string;
    email:               string;
    phone:               string;
    city:                string;
    address:             string;
    isActive:            boolean;
}

interface FormData {
    type:                string;
    firstName:           string;
    lastName:            string;
    name:                string;
    legalRepresentative: string;
    documentType:        string;
    documentNumber:      string;
    contact:             string;
    email:               string;
    phone:               string;
    city:                string;
    address:             string;
    isActive:            boolean;
}

interface FormErrors {
    name?:                string;
    firstName?:           string;
    lastName?:            string;
    legalRepresentative?: string;
    documentType?:        string;
    documentNumber?:      string;
    contact?:             string;
    email?:               string;
    phone?:               string;
    city?:                string;
    address?:             string;
}

// ── Validación frontend ───────────────────────────────────────────────────────
function validarFormulario(data: FormData): FormErrors {
    const errs: FormErrors = {};

    if (data.type === 'empresa') {
        if (!data.name.trim())
            errs.name = 'El nombre de la empresa es obligatorio';
        else if (data.name.trim().length < 2)
            errs.name = 'Mínimo 2 caracteres';
        else if (data.name.trim().length > 100)
            errs.name = 'Máximo 100 caracteres';

        if (!data.legalRepresentative.trim())
            errs.legalRepresentative = 'El representante legal es obligatorio';
    } else {
        if (!data.firstName.trim())
            errs.firstName = 'El nombre es obligatorio';
        else if (data.firstName.trim().length < 2)
            errs.firstName = 'Mínimo 2 caracteres';

        if (!data.lastName.trim())
            errs.lastName = 'El apellido es obligatorio';
        else if (data.lastName.trim().length < 2)
            errs.lastName = 'Mínimo 2 caracteres';
    }

    if (!data.documentNumber.trim())
        errs.documentNumber = 'El número de documento es obligatorio';
    else if (data.documentNumber.trim().length < 2 || data.documentNumber.trim().length > 20)
        errs.documentNumber = 'Entre 2 y 20 caracteres';

    if (!data.contact.trim())
        errs.contact = 'La persona de contacto es obligatoria';
    else if (data.contact.trim().length < 2 || data.contact.trim().length > 100)
        errs.contact = 'Entre 2 y 100 caracteres';

    if (!data.email.trim())
        errs.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
        errs.email = 'Correo inválido';
    else if (data.email.trim().length > 50)
        errs.email = 'Máximo 50 caracteres';

    if (!data.phone.trim())
        errs.phone = 'El teléfono es obligatorio';
    else if (data.phone.trim().length < 2 || data.phone.trim().length > 10)
        errs.phone = 'Entre 2 y 10 caracteres';

    if (data.city && data.city.trim().length > 50)
        errs.city = 'Máximo 50 caracteres';

    if (data.address && data.address.trim().length > 200)
        errs.address = 'Máximo 200 caracteres';

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

// ── Helpers de input ──────────────────────────────────────────────────────────
const onlyLetters = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
const onlyPhone   = (v: string) => v.replace(/[^0-9+\s\-]/g, '');
const onlyDoc     = (v: string, tipo: string) => {
    if (tipo === 'CC' || tipo === 'RUN') return v.replace(/[^0-9]/g, '');
    if (tipo === 'NIT')                  return v.replace(/[^0-9\-]/g, '');
    return v;
};

// ─────────────────────────────────────────────────────────────────────────────
export function SupplierManagement() {
    const [suppliers, setSuppliers]     = useState<Supplier[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingSupplier, setEditingSupplier]   = useState<Supplier | null>(null);
    const [viewingSupplier, setViewingSupplier]   = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 5;

    // Banner global
    const [banner, setBanner] = useState<BannerMsg | null>(null);
    const showBanner = useCallback((text: string, variant: BannerVariant = 'info') => {
        setBanner({ text, variant });
        setTimeout(() => setBanner(null), 5000);
    }, []);

    // Banner de fila (inactivo al intentar editar)
    const [inactiveBannerId, setInactiveBannerId]         = useState<number | null>(null);
    const [inactiveBannerAction, setInactiveBannerAction] = useState<'edit' | null>(null);
    const triggerInactiveBanner = (id: number, action: 'edit') => {
        setInactiveBannerId(id);
        setInactiveBannerAction(action);
        setTimeout(() => { setInactiveBannerId(null); setInactiveBannerAction(null); }, 4000);
    };

    // Errores de formulario
    const [formErrors, setFormErrors]           = useState<FormErrors>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const emptyForm: FormData = {
        type: 'empresa', firstName: '', lastName: '', name: '',
        legalRepresentative: '', documentType: 'NIT', documentNumber: '',
        contact: '', email: '', phone: '', city: '', address: '', isActive: true,
    };
    const [formData, setFormData] = useState<FormData>(emptyForm);

    // Revalidar en tiempo real
    useEffect(() => {
        if (submitAttempted) setFormErrors(validarFormulario(formData));
    }, [formData, submitAttempted]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchProveedores = async () => {
        try {
            setLoading(true);
            const data = await getProveedores();
            setSuppliers(data.map(mapProveedorToSupplier));
        } catch (error: any) {
            toast.error(`Error al cargar proveedores: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProveedores(); }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const resetForm = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setSubmitAttempted(false);
        setEditingSupplier(null);
        setShowModal(false);
    };

    const handleTypeChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            type:           value,
            documentType:   value === 'empresa' ? 'NIT' : 'CC',
            documentNumber: '',
            name: '', firstName: '', lastName: '', legalRepresentative: '',
        }));
        if (submitAttempted) setFormErrors({});
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
            const dto = mapSupplierToDTO(formData);

            if (editingSupplier) {
                await updateProveedor(editingSupplier.id, dto);
                showBanner('Proveedor actualizado correctamente', 'success');
                toast.success('Proveedor actualizado exitosamente');
            } else {
                await createProveedor(dto);
                showBanner('Proveedor creado exitosamente', 'success');
                toast.success('Proveedor creado exitosamente');
            }
            await fetchProveedores();
            resetForm();
        } catch (error: any) {
            const errores: string[] = error.errores ?? [];
            if (errores.length > 0) {
                const backendFieldErrors: FormErrors = {};
                errores.forEach((msg: string) => {
                    const lower = msg.toLowerCase();
                    if (lower.includes('empresa'))
                        backendFieldErrors.name = msg;
                    else if (
                        lower.includes('número de doc') ||
                        lower.includes('numero de doc') ||
                        lower.includes('documento ya está') ||
                        lower.includes('documento ya esta')
                    )
                        backendFieldErrors.documentNumber = msg;
                    else if (lower.includes('contacto'))
                        backendFieldErrors.contact = msg;
                    else if (lower.includes('teléfono') || lower.includes('telefono'))
                        backendFieldErrors.phone = msg;
                    else if (lower.includes('email') || lower.includes('correo'))
                        backendFieldErrors.email = msg;
                    else if (lower.includes('direcci'))
                        backendFieldErrors.address = msg;
                    else if (lower.includes('ciudad'))
                        backendFieldErrors.city = msg;
                    else
                        toast.error(msg);
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
    const handleEdit = (supplier: Supplier) => {
        if (!supplier.isActive) {
            triggerInactiveBanner(supplier.id, 'edit');
            return;
        }
        setFormData({
            type:                supplier.type,
            firstName:           supplier.firstName           || '',
            lastName:            supplier.lastName            || '',
            name:                supplier.name                || '',
            legalRepresentative: supplier.legalRepresentative || '',
            documentType:        supplier.documentType,
            documentNumber:      supplier.documentNumber,
            contact:             supplier.contact,
            email:               supplier.email,
            phone:               supplier.phone,
            city:                supplier.city,
            address:             supplier.address,
            isActive:            supplier.isActive,
        });
        setFormErrors({});
        setSubmitAttempted(false);
        setEditingSupplier(supplier);
        setShowModal(true);
    };

    // ── Toggle estado ─────────────────────────────────────────────────────────
    const handleToggleEstado = async (supplier: Supplier) => {
        const nuevoEstado = supplier.isActive ? 'inactivo' : 'activo';
        setSuppliers(prev => prev.map(s =>
            s.id === supplier.id ? { ...s, isActive: !s.isActive } : s
        ));
        setTogglingIds(prev => new Set(prev).add(supplier.id));
        try {
            await updateProveedor(supplier.id, { estado: nuevoEstado as any });
            toast.success(`Proveedor ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
        } catch (error: any) {
            setSuppliers(prev => prev.map(s =>
                s.id === supplier.id ? { ...s, isActive: supplier.isActive } : s
            ));
            toast.error(`Error: ${error.message}`);
        } finally {
            setTogglingIds(prev => { const n = new Set(prev); n.delete(supplier.id); return n; });
        }
    };

    // ── Eliminar ──────────────────────────────────────────────────────────────
    // Cualquier proveedor (activo o inactivo) puede eliminarse si no tiene insumos
    const handleDelete = (supplier: Supplier) => {
        setDeletingSupplier(supplier);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingSupplier) return;
        try {
            setSaving(true);
            await deleteProveedor(deletingSupplier.id);
            // Elimina el registro del estado local (eliminación física)
            setSuppliers(prev => prev.filter(s => s.id !== deletingSupplier.id));
            showBanner('Proveedor eliminado correctamente', 'success');
            toast.success('Proveedor eliminado correctamente');
        } catch (error: any) {
            const errores: string[] = error.errores ?? [];
            const msg = errores[0] ?? error.message;
            toast.error(`No se puede eliminar: ${msg}`);
            showBanner(`No se puede eliminar: ${msg}`, 'error');
        } finally {
            setSaving(false);
            setShowDeleteModal(false);
            setDeletingSupplier(null);
        }
    };

    // ── Filtros y paginación ──────────────────────────────────────────────────
    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch =
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.documentNumber.includes(searchTerm);
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active'   && s.isActive) ||
            (statusFilter === 'inactive' && !s.isActive);
        return matchesSearch && matchesStatus;
    });

    const totalPages       = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const currentSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        return parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    };

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
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Proveedores</h1>
                    <p className="text-blue-800">Administra los proveedores de la empresa</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Nuevo Proveedor
                </Button>
            </div>

            {/* ── Filtros ─────────────────────────────────────────────────── */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative w-full sm:flex-[3]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <Input
                                placeholder="Buscar por nombre, contacto, email o documento..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 w-full"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-1/4 sm:w-40 sm:flex-[1]"
                        >
                            <option value="all">Todos</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* ── Tabla ───────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando proveedores...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Proveedor</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Contacto</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Tipo</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSuppliers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-gray-500">
                                                No se encontraron proveedores
                                            </td>
                                        </tr>
                                    ) : currentSuppliers.map((supplier) => {
                                        const isToggling    = togglingIds.has(supplier.id);
                                        const isInactive    = !supplier.isActive;
                                        const showRowBanner =
                                            inactiveBannerId === supplier.id && inactiveBannerAction !== null;

                                        return (
                                            <React.Fragment key={supplier.id}>
                                                <tr className={`border-b border-blue-100 transition-colors ${
                                                    isInactive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'
                                                }`}>

                                                    {/* Proveedor */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                                                                isInactive ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'
                                                            }`}>
                                                                {getInitials(supplier.name)}
                                                            </div>
                                                            <div>
                                                                <p className={`font-semibold text-sm ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                    {supplier.name}
                                                                </p>
                                                                <p className={`text-xs ${isInactive ? 'text-gray-400' : 'text-blue-900'}`}>
                                                                    {supplier.documentType} {supplier.documentNumber}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Contacto */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm ${isInactive ? 'text-gray-400' : 'text-gray-700'}`}>{supplier.email}</span>
                                                            <span className="text-xs text-gray-400">{supplier.phone}</span>
                                                        </div>
                                                    </td>

                                                    {/* Tipo */}
                                                    <td className="py-4 px-6">
                                                        <Badge variant="secondary">
                                                            {supplier.type === 'empresa' ? 'Empresa' : 'Persona Natural'}
                                                        </Badge>
                                                    </td>

                                                    {/* Estado */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={supplier.isActive}
                                                                onCheckedChange={() => handleToggleEstado(supplier)}
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
                                                                onClick={() => { setViewingSupplier(supplier); setShowDetailModal(true); }}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>

                                                            {/* Editar — solo activos */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleEdit(supplier)}
                                                                disabled={isToggling}
                                                                title={isInactive ? 'Proveedor inactivo' : 'Editar'}
                                                                className={`border transition-all duration-200 ${
                                                                    isInactive
                                                                        ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>

                                                            {/* Eliminar — disponible para activos e inactivos */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleDelete(supplier)}
                                                                disabled={isToggling}
                                                                title="Eliminar proveedor"
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50 transition-all duration-200"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>

                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Banner inline por fila (solo editar inactivo) ── */}
                                                {showRowBanner && (
                                                    <tr className="border-b border-amber-100">
                                                        <td colSpan={5} className="px-6 py-0">
                                                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                                                                <span>
                                                                    <strong>Proveedor inactivo:</strong>{' '}
                                                                    No puedes editar un proveedor inactivo. Actívalo primero usando el interruptor de estado.
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
                            <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
                            <DialogDescription>
                                {editingSupplier
                                    ? 'Modifica la información del proveedor.'
                                    : 'Completa el formulario para registrar un nuevo proveedor.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-4">

                            {/* Tipo de proveedor */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Tipo de proveedor <span className="text-red-500">*</span>
                                </label>
                                <Select value={formData.type} onValueChange={handleTypeChange}>
                                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="persona">Persona Natural</SelectItem>
                                        <SelectItem value="empresa">Empresa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tipo + Número de documento */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Tipo de documento <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={formData.documentType}
                                        onValueChange={(value) =>
                                            setFormData(prev => ({ ...prev, documentType: value, documentNumber: '' }))
                                        }
                                    >
                                        <SelectTrigger className={formErrors.documentType ? 'border-red-400' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formData.type === 'empresa' ? (
                                                <>
                                                    <SelectItem value="NIT">NIT</SelectItem>
                                                    <SelectItem value="RUN">RUN</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                                    <SelectItem value="PA">Pasaporte</SelectItem>
                                                    <SelectItem value="RUNT">RUNT</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FieldError msg={formErrors.documentType} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Número de documento <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={formData.documentNumber}
                                        onChange={(e) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                documentNumber: onlyDoc(e.target.value, prev.documentType),
                                            }))
                                        }
                                        maxLength={20}
                                        placeholder={formData.documentType === 'NIT' ? '900123456-7' : '123456789'}
                                        className={formErrors.documentNumber ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.documentNumber} />
                                </div>
                            </div>

                            {/* Nombre / Razón social */}
                            {formData.type === 'persona' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Nombre <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.firstName}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, firstName: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={100}
                                            placeholder="Juan"
                                            className={formErrors.firstName ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.firstName} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Apellido <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.lastName}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, lastName: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={100}
                                            placeholder="Pérez"
                                            className={formErrors.lastName ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.lastName} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Nombre de la empresa <span className="text-red-500">*</span>
                                            <span className="ml-1 text-xs text-gray-400">(2–100 caracteres)</span>
                                        </label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, name: e.target.value }))
                                            }
                                            maxLength={100}
                                            placeholder="AutoPartes Central S.A.S."
                                            className={formErrors.name ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.name} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Representante Legal <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.legalRepresentative}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, legalRepresentative: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={100}
                                            placeholder="Juan Pérez"
                                            className={formErrors.legalRepresentative ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.legalRepresentative} />
                                    </div>
                                </>
                            )}

                            {/* Persona de contacto */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Persona de contacto <span className="text-red-500">*</span>
                                    <span className="ml-1 text-xs text-gray-400">(2–100 caracteres)</span>
                                </label>
                                <Input
                                    value={formData.contact}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, contact: onlyLetters(e.target.value) }))
                                    }
                                    maxLength={100}
                                    placeholder="María García"
                                    className={formErrors.contact ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.contact} />
                            </div>

                            {/* Correo */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Correo electrónico <span className="text-red-500">*</span>
                                    <span className="ml-1 text-xs text-gray-400">(máx. 50 caracteres)</span>
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, email: e.target.value.replace(/\s/g, '') }))
                                    }
                                    maxLength={50}
                                    placeholder="ventas@proveedor.com"
                                    className={formErrors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.email} />
                            </div>

                            {/* Teléfono + Ciudad */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Teléfono <span className="text-red-500">*</span>
                                        <span className="ml-1 text-xs text-gray-400">(máx. 10 caracteres)</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, phone: onlyPhone(e.target.value) }))
                                        }
                                        maxLength={10}
                                        placeholder="3001234567"
                                        className={formErrors.phone ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.phone} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Ciudad
                                        <span className="ml-1 text-xs text-gray-400">(opcional)</span>
                                    </label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, city: onlyLetters(e.target.value) }))
                                        }
                                        maxLength={50}
                                        placeholder="Medellín"
                                        className={formErrors.city ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.city} />
                                </div>
                            </div>

                            {/* Dirección */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Dirección
                                    <span className="ml-1 text-xs text-gray-400">(opcional)</span>
                                </label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, address: e.target.value }))
                                    }
                                    maxLength={200}
                                    placeholder="Calle 45 #23-67"
                                    className={formErrors.address ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.address} />
                            </div>

                            {/* Estado — solo al editar */}
                            {editingSupplier && (
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center space-x-3">
                                        <Switch
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => ({ ...prev, isActive: checked }))
                                            }
                                        />
                                        <label className="text-sm text-gray-600">
                                            {formData.isActive ? 'Proveedor activo' : 'Proveedor inactivo'}
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
                                    {editingSupplier ? 'Actualizar Proveedor' : 'Crear Proveedor'}
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
                            <DialogTitle>Detalles del Proveedor</DialogTitle>
                            <DialogDescription>Información completa del proveedor seleccionado.</DialogDescription>
                        </DialogHeader>
                        {viewingSupplier && (
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                    <div className="col-span-2 flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl">
                                            {getInitials(viewingSupplier.name)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-blue-900 text-lg">{viewingSupplier.name}</p>
                                            <p className="text-sm text-gray-500">{viewingSupplier.email}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Documento</p>
                                        <p className="font-semibold text-sm">{viewingSupplier.documentType} {viewingSupplier.documentNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Tipo</p>
                                        <Badge variant="outline">
                                            {viewingSupplier.type === 'empresa' ? 'Empresa' : 'Persona Natural'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Contacto</p>
                                        <p className="font-semibold text-sm">{viewingSupplier.contact}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Teléfono</p>
                                        <p className="font-semibold text-sm">{viewingSupplier.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Ciudad</p>
                                        <p className="font-semibold text-sm">{viewingSupplier.city || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Dirección</p>
                                        <p className="font-semibold text-sm">{viewingSupplier.address || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Estado</p>
                                        <Badge className={viewingSupplier.isActive
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'bg-gray-100 text-gray-500'}>
                                            {viewingSupplier.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                    {viewingSupplier.isActive && (
                                        <Button
                                            onClick={() => { handleEdit(viewingSupplier); setShowDetailModal(false); }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Editar Proveedor
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── MODAL CONFIRMAR ELIMINACIÓN ─────────────────────────────── */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
                if (!open) { setShowDeleteModal(false); setDeletingSupplier(null); }
            }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <Trash2 className="w-5 h-5" />Eliminar Proveedor
                            </DialogTitle>
                            <DialogDescription>
                                Esta acción eliminará permanentemente al proveedor del sistema.
                            </DialogDescription>
                        </DialogHeader>
                        {deletingSupplier && (
                            <div className="mt-4 space-y-3">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-semibold text-blue-900">{deletingSupplier.name}</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {deletingSupplier.documentType} {deletingSupplier.documentNumber}
                                    </p>
                                    <p className="text-sm text-blue-700">{deletingSupplier.email}</p>
                                </div>
                                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold">¿Estás seguro?</p>
                                        <p className="text-red-700 mt-0.5">
                                            Esta acción es <strong>irreversible</strong>. El proveedor será eliminado
                                            permanentemente. Si tiene insumos asociados, no podrá eliminarse.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                onClick={() => { setShowDeleteModal(false); setDeletingSupplier(null); }}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                disabled={saving}
                                className="bg-red-600 hover:bg-red-700 text-white border-0"
                            >
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