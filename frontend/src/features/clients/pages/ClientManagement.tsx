// src/features/clients/ClientManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';
import {
    Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
    AlertTriangle, User, X, Search, Loader2,
    CheckCircle2, Info, Lock,
} from 'lucide-react';
import {
    getClientes, createCliente, updateCliente,
    deleteCliente, forceDeleteCliente,
} from '../services/clientesService';

// ── Tipos de documento ────────────────────────────────────────────────────────
const DOCS_PERSONA_NATURAL = [
    { value: 'cedula',                label: 'Cédula de Ciudadanía'  },
    { value: 'cedula de extranjeria', label: 'Cédula de Extranjería' },
    { value: 'pasaporte',             label: 'Pasaporte'             },
    { value: 'rut',                   label: 'RUT'                   },
];
const DOCS_EMPRESA = [
    { value: 'nit', label: 'NIT' },
    { value: 'rut', label: 'RUT' },
];

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Cliente {
    id: number;
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    razon_social: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
    estado: 'activo' | 'inactivo';
    clientType?: 'Persona natural' | 'Empresa';
    contacto?: string | null;
}

interface FormData {
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    razon_social: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
    clientType: 'Persona natural' | 'Empresa';
    estado: 'activo' | 'inactivo';
    contacto: string;
}

// ── Validación de formulario en el frontend ───────────────────────────────────
interface FormErrors {
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    contacto?: string;
    numero_documento?: string;
    email?: string;
    telefono?: string;
    ciudad?: string;
    direccion?: string;
}

function validarFormulario(data: FormData): FormErrors {
    const errs: FormErrors = {};
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

    if (data.clientType === 'Persona natural') {
        if (!data.nombres.trim())
            errs.nombres = 'El nombre es obligatorio';
        else if (data.nombres.trim().length < 2)
            errs.nombres = 'Mínimo 2 caracteres';
        else if (!soloLetras.test(data.nombres.trim()))
            errs.nombres = 'Solo letras y espacios';

        if (!data.apellidos.trim())
            errs.apellidos = 'Los apellidos son obligatorios';
        else if (data.apellidos.trim().length < 2)
            errs.apellidos = 'Mínimo 2 caracteres';
        else if (!soloLetras.test(data.apellidos.trim()))
            errs.apellidos = 'Solo letras y espacios';
    } else {
        if (!data.razon_social.trim())
            errs.razon_social = 'La razón social es obligatoria';
        else if (data.razon_social.trim().length > 100)
            errs.razon_social = 'Máximo 100 caracteres';

        if (!data.contacto.trim())
            errs.contacto = 'El contacto es obligatorio';
        else if (!soloLetras.test(data.contacto.trim()))
            errs.contacto = 'Solo letras y espacios';
    }

    if (!data.numero_documento.trim())
        errs.numero_documento = 'El número de documento es obligatorio';
    else if (data.numero_documento.trim().length < 5)
        errs.numero_documento = 'Mínimo 5 caracteres';
    else if (data.tipo_documento === 'nit' && !/^\d{9,10}(-\d)?$/.test(data.numero_documento.trim()))
        errs.numero_documento = 'Formato: 900123456-7';

    if (!data.email.trim())
        errs.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
        errs.email = 'Correo inválido';

    if (!data.telefono.trim())
        errs.telefono = 'El teléfono es obligatorio';
    else if (data.telefono.trim().length < 7)
        errs.telefono = 'Mínimo 7 dígitos';

    if (!data.ciudad.trim())
        errs.ciudad = 'La ciudad es obligatoria';
    else if (!soloLetras.test(data.ciudad.trim()))
        errs.ciudad = 'Solo letras y espacios';

    if (!data.direccion.trim())
        errs.direccion = 'La dirección es obligatoria';

    return errs;
}

// ── Banner de notificación inline ─────────────────────────────────────────────
type BannerVariant = 'success' | 'error' | 'warning' | 'info';

interface BannerMsg {
    text: string;
    variant: BannerVariant;
}

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

// ── Componente de campo con error ─────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{msg}</p>;
}

// ─────────────────────────────────────────────────────────────────────────────
export function ClientManagement({ onNavigateToSales }: { onNavigateToSales?: () => void }) {
    const [clients, setClients]         = useState<Cliente[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingClient, setEditingClient]   = useState<Cliente | null>(null);
    const [viewingClient, setViewingClient]   = useState<Cliente | null>(null);
    const [deletingClient, setDeletingClient] = useState<Cliente | null>(null);

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 5;

    // Banner global (encima de la tabla)
    const [banner, setBanner] = useState<BannerMsg | null>(null);
    const showBanner = useCallback((text: string, variant: BannerVariant = 'info') => {
        setBanner({ text, variant });
        setTimeout(() => setBanner(null), 5000);
    }, []);

    // Banner de fila (cliente inactivo al intentar editar/eliminar)
    const [inactiveBannerId, setInactiveBannerId] = useState<number | null>(null);
    const [inactiveBannerAction, setInactiveBannerAction] = useState<'edit' | 'delete' | null>(null);

    const triggerInactiveBanner = (id: number, action: 'edit' | 'delete') => {
        setInactiveBannerId(id);
        setInactiveBannerAction(action);
        setTimeout(() => { setInactiveBannerId(null); setInactiveBannerAction(null); }, 4000);
    };

    // Errores de formulario
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const emptyForm: FormData = {
        nombres: '', apellidos: '', razon_social: '',
        tipo_documento: 'cedula', numero_documento: '',
        telefono: '', email: '', direccion: '', ciudad: '',
        clientType: 'Persona natural', estado: 'activo',
        contacto: '',
    };
    const [formData, setFormData] = useState<FormData>(emptyForm);

    // Revalidar en tiempo real cuando el usuario ya intentó enviar
    useEffect(() => {
        if (submitAttempted) setFormErrors(validarFormulario(formData));
    }, [formData, submitAttempted]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchClientes = async () => {
        try {
            setLoading(true);
            const data = await getClientes();
            const enriched = data.map((c: Cliente) => ({
                ...c,
                clientType: c.nombres === 'N/A' ? 'Empresa' : 'Persona natural',
            }));
            setClients(enriched);
        } catch (error: any) {
            toast.error(`Error al cargar clientes: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClientes(); }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getDisplayName = (client: Cliente) =>
        client.clientType === 'Empresa' || client.nombres === 'N/A'
            ? client.razon_social
            : `${client.nombres} ${client.apellidos}`.trim();

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setSubmitAttempted(false);
        setEditingClient(null);
        setShowModal(false);
    };

    const handleClientTypeChange = (value: 'Persona natural' | 'Empresa') => {
        setFormData(prev => ({
            ...prev,
            clientType:       value,
            tipo_documento:   value === 'Empresa' ? 'nit' : 'cedula',
            numero_documento: '',
            nombres: '', apellidos: '', razon_social: '', contacto: '',
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

        const isEmpresa = formData.clientType === 'Empresa';
        const payload = {
            nombres:          isEmpresa ? 'N/A' : formData.nombres,
            apellidos:        isEmpresa ? 'N/A' : formData.apellidos,
            razon_social:     isEmpresa ? formData.razon_social : '',
            tipo_documento:   formData.tipo_documento,
            numero_documento: formData.numero_documento,
            telefono:         formData.telefono,
            email:            formData.email,
            direccion:        formData.direccion,
            ciudad:           formData.ciudad,
            estado:           formData.estado,
            ...(isEmpresa ? { contacto: formData.contacto } : {}),
        };

        try {
            setSaving(true);
            if (editingClient) {
                await updateCliente(editingClient.id, payload);
                showBanner('Cliente actualizado correctamente', 'success');
                toast.success('Cliente actualizado exitosamente');
            } else {
                await createCliente(payload);
                showBanner('Cliente creado exitosamente', 'success');
                toast.success('Cliente creado exitosamente');
            }
            await fetchClientes();
            resetForm();
        } catch (error: any) {
            // ── Duplicados ────────────────────────────────────────────────
            const msg: string = error.message?.toLowerCase() ?? '';
            const errores: string[] = error.errores ?? [];

            const emailDuplicado = errores.some((e: string) =>
                e.toLowerCase().includes('correo') || e.toLowerCase().includes('email')
            ) || msg.includes('email') || msg.includes('correo');

            const docDuplicado = errores.some((e: string) =>
                e.toLowerCase().includes('documento')
            ) || msg.includes('documento') || msg.includes('duplicate') || error.status === 409;

            if (emailDuplicado && docDuplicado) {
                showBanner('El correo electrónico y el número de documento ya están registrados', 'error');
                setFormErrors(prev => ({
                    ...prev,
                    email:            'Este correo ya está registrado',
                    numero_documento: 'Este documento ya está registrado',
                }));
            } else if (emailDuplicado) {
                showBanner('Ya existe un cliente registrado con ese correo electrónico', 'error');
                setFormErrors(prev => ({ ...prev, email: 'Este correo ya está registrado' }));
            } else if (docDuplicado) {
                showBanner('Ya existe un cliente registrado con ese número de documento', 'error');
                setFormErrors(prev => ({ ...prev, numero_documento: 'Este documento ya está registrado' }));
            } else if (errores.length > 0) {
                errores.forEach((err: string) => toast.error(err));
                showBanner(errores[0], 'error');
            } else {
                showBanner(`Error: ${error.message}`, 'error');
                toast.error(`Error: ${error.message}`);
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Editar ────────────────────────────────────────────────────────────────
    const handleEdit = (client: Cliente) => {
        if (client.estado === 'inactivo') {
            triggerInactiveBanner(client.id, 'edit');
            return;
        }
        const isEmpresa = client.clientType === 'Empresa' || client.nombres === 'N/A';
        setFormData({
            nombres:          isEmpresa ? '' : client.nombres,
            apellidos:        isEmpresa ? '' : client.apellidos,
            razon_social:     isEmpresa ? client.razon_social : '',
            tipo_documento:   client.tipo_documento || (isEmpresa ? 'nit' : 'cedula'),
            numero_documento: client.numero_documento,
            telefono:         client.telefono,
            email:            client.email,
            direccion:        client.direccion || '',
            ciudad:           client.ciudad || '',
            clientType:       isEmpresa ? 'Empresa' : 'Persona natural',
            estado:           client.estado ?? 'activo',
            contacto:         client.contacto || '',
        });
        setFormErrors({});
        setSubmitAttempted(false);
        setEditingClient(client);
        setShowModal(true);
    };

    // ── Toggle estado ─────────────────────────────────────────────────────────
    const handleToggleEstado = async (client: Cliente) => {
        const nuevoEstado: 'activo' | 'inactivo' = client.estado === 'activo' ? 'inactivo' : 'activo';
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, estado: nuevoEstado } : c));
        setTogglingIds(prev => new Set(prev).add(client.id));
        try {
            await updateCliente(client.id, { ...client, estado: nuevoEstado });
            toast.success(`Cliente ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
        } catch (error: any) {
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, estado: client.estado } : c));
            toast.error(`Error: ${error.message}`);
        } finally {
            setTogglingIds(prev => { const next = new Set(prev); next.delete(client.id); return next; });
        }
    };

    // ── Eliminar ──────────────────────────────────────────────────────────────
    const handleDelete = (client: Cliente) => {
        if (client.estado === 'inactivo') {
            triggerInactiveBanner(client.id, 'delete');
            return;
        }
        setDeletingClient(client);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingClient) return;
        try {
            setSaving(true);
            await forceDeleteCliente(deletingClient.id);
            showBanner('Cliente eliminado exitosamente', 'success');
            toast.success('Cliente eliminado exitosamente');
            await fetchClientes();
        } catch (error: any) {
            toast.error(`No se puede eliminar: ${error.message}`);
            showBanner(`No se puede eliminar: ${error.message}`, 'error');
        } finally {
            setSaving(false);
            setShowDeleteModal(false);
            setDeletingClient(null);
        }
    };

    // ── Filtros y paginación ──────────────────────────────────────────────────
    const filteredClients = clients.filter((client) => {
        const name = getDisplayName(client);
        const matchesSearch =
            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.numero_documento.includes(searchTerm) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.telefono.includes(searchTerm);
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active'   && client.estado === 'activo') ||
            (statusFilter === 'inactive' && client.estado === 'inactivo');
        return matchesSearch && matchesStatus;
    });

    const totalPages     = Math.ceil(filteredClients.length / itemsPerPage);
    const currentClients = filteredClients.slice(
        (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const docsDisponibles = formData.clientType === 'Empresa' ? DOCS_EMPRESA : DOCS_PERSONA_NATURAL;

    // ── Helpers de input con restricciones ───────────────────────────────────
    const onlyLetters   = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    const onlyPhone     = (v: string) => v.replace(/[^0-9+\s\-]/g, '');
    const onlyDoc       = (v: string, tipo: string) => {
        if (tipo === 'cedula' || tipo === 'rut') return v.replace(/[^0-9]/g, '');
        if (tipo === 'nit')                       return v.replace(/[^0-9\-]/g, '');
        return v.replace(/[^a-zA-Z0-9]/g, '');
    };
    const onlyAddress   = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s#\-\.]/g, '');
    const noSpaces      = (v: string) => v.replace(/\s/g, '');

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
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Clientes</h1>
                    <p className="text-blue-800">Administra la base de datos de clientes</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Nuevo Cliente
                </Button>
            </div>

            {/* ── Filtros ─────────────────────────────────────────────────── */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

                        {/* 🔍 Búsqueda */}
                        <div className="relative w-full sm:flex-[3]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <Input
                                placeholder="Buscar por nombre, documento, email o teléfono..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 w-full"
                            />
                        </div>

                        {/* ⚙️ Filtro */}
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
                    <span className="ml-2 text-gray-500">Cargando clientes...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Cliente</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Contacto</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Tipo</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentClients.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-gray-500">
                                                No se encontraron clientes
                                            </td>
                                        </tr>
                                    ) : currentClients.map((client) => {
                                        const displayName  = getDisplayName(client);
                                        const isToggling   = togglingIds.has(client.id);
                                        const isInactive   = client.estado === 'inactivo';
                                        const showRowBanner =
                                            inactiveBannerId === client.id && inactiveBannerAction !== null;

                                        return (
                                            <React.Fragment key={client.id}>
                                                <tr className={`border-b border-blue-100 transition-colors ${
                                                    isInactive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'
                                                }`}>
                                                    {/* Cliente */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-3">
                                                            <Avatar className="w-9 h-9">
                                                                <AvatarFallback className={`text-sm ${isInactive ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                                                                    {getInitials(displayName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className={`font-semibold text-sm ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                    {displayName}
                                                                </p>
                                                                <p className={`text-xs ${isInactive ? 'text-gray-400' : 'text-blue-900'}`}>
                                                                    {client.tipo_documento} {client.numero_documento}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Contacto */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm ${isInactive ? 'text-gray-400' : 'text-gray-700'}`}>{client.email}</span>
                                                            <span className="text-xs text-gray-400">{client.telefono}</span>
                                                        </div>
                                                    </td>

                                                    {/* Tipo */}
                                                    <td className="py-4 px-6">
                                                        <Badge variant="secondary">{client.clientType ?? 'Persona natural'}</Badge>
                                                    </td>

                                                    {/* Estado */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={client.estado === 'activo'}
                                                                onCheckedChange={() => handleToggleEstado(client)}
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
                                                                onClick={() => { setViewingClient(client); setShowDetailModal(true); }}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>

                                                            {/* Editar */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleEdit(client)}
                                                                disabled={isToggling}
                                                                title={isInactive ? 'Cliente inactivo' : 'Editar'}
                                                                className={`border transition-all duration-200 ${
                                                                    isInactive
                                                                        ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>

                                                            {/* Eliminar */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleDelete(client)}
                                                                disabled={isToggling}
                                                                title={isInactive ? 'Cliente inactivo' : 'Eliminar'}
                                                                className={`border transition-all duration-200 ${
                                                                    isInactive
                                                                        ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>

                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Banner inline por fila (cliente inactivo) ── */}
                                                {showRowBanner && (
                                                    <tr className="border-b border-amber-100">
                                                        <td colSpan={5} className="px-6 py-0">
                                                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                                                                <span>
                                                                    <strong>Cliente inactivo:</strong>{' '}
                                                                    {inactiveBannerAction === 'edit'
                                                                        ? 'No puedes editar un cliente inactivo. Actívalo primero usando el interruptor de estado.'
                                                                        : 'No puedes eliminar un cliente inactivo. Actívalo primero usando el interruptor de estado.'}
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
                            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                            <DialogDescription>
                                {editingClient
                                    ? 'Modifica los datos del cliente.'
                                    : 'Completa el formulario para registrar un nuevo cliente.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-4">

                            {/* Tipo de cliente */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Tipo de cliente <span className="text-red-500">*</span>
                                </label>
                                <Select value={formData.clientType} onValueChange={handleClientTypeChange}>
                                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Persona natural">Persona natural</SelectItem>
                                        <SelectItem value="Empresa">Empresa</SelectItem>
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
                                        value={formData.tipo_documento}
                                        onValueChange={(value) =>
                                            setFormData(prev => ({ ...prev, tipo_documento: value, numero_documento: '' }))
                                        }
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {docsDisponibles.map(doc => (
                                                <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Número de documento <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={formData.numero_documento}
                                        onChange={(e) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                numero_documento: onlyDoc(e.target.value, prev.tipo_documento),
                                            }))
                                        }
                                        maxLength={20}
                                        placeholder={formData.tipo_documento === 'nit' ? '900123456-7' : '123456789'}
                                        className={formErrors.numero_documento ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.numero_documento} />
                                </div>
                            </div>

                            {/* Nombre / Razón social + Contacto */}
                            {formData.clientType === 'Persona natural' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Nombres <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.nombres}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, nombres: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={50}
                                            placeholder="Ej: Carlos"
                                            className={formErrors.nombres ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.nombres} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Apellidos <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.apellidos}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, apellidos: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={50}
                                            placeholder="Ej: Medina López"
                                            className={formErrors.apellidos ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.apellidos} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Razón Social <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.razon_social}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, razon_social: e.target.value.slice(0, 100) }))
                                            }
                                            maxLength={100}
                                            placeholder="Ej: Auto Servicio López S.A.S"
                                            className={formErrors.razon_social ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.razon_social} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Persona de contacto <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.contacto}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, contacto: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={100}
                                            placeholder="Ej: María García"
                                            className={formErrors.contacto ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Nombre del representante o contacto principal de la empresa
                                        </p>
                                        <FieldError msg={formErrors.contacto} />
                                    </div>
                                </>
                            )}

                            {/* Correo */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Correo electrónico <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, email: noSpaces(e.target.value) }))
                                    }
                                    maxLength={100}
                                    placeholder="cliente@email.com"
                                    className={formErrors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.email} />
                            </div>

                            {/* Teléfono + Ciudad */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Teléfono <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        value={formData.telefono}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, telefono: onlyPhone(e.target.value) }))
                                        }
                                        maxLength={20}
                                        placeholder="+57 300 123 4567"
                                        className={formErrors.telefono ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.telefono} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Ciudad <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={formData.ciudad}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, ciudad: onlyLetters(e.target.value) }))
                                        }
                                        maxLength={50}
                                        placeholder="Medellín"
                                        className={formErrors.ciudad ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.ciudad} />
                                </div>
                            </div>

                            {/* Dirección */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formData.direccion}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, direccion: onlyAddress(e.target.value) }))
                                    }
                                    maxLength={100}
                                    placeholder="Calle 50 #25-30"
                                    className={formErrors.direccion ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.direccion} />
                            </div>

                            {/* Estado — solo al editar */}
                            {editingClient && (
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center space-x-3">
                                        <Switch
                                            checked={formData.estado === 'activo'}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => ({ ...prev, estado: checked ? 'activo' : 'inactivo' }))
                                            }
                                        />
                                        <label className="text-sm text-gray-600">Cliente activo</label>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}
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
                            <DialogTitle>Detalles del Cliente</DialogTitle>
                            <DialogDescription>Información completa del cliente seleccionado.</DialogDescription>
                        </DialogHeader>
                        {viewingClient && (
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                    <div className="col-span-2 flex items-center gap-4">
                                        <Avatar className="w-16 h-16">
                                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                                                {getInitials(getDisplayName(viewingClient))}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-blue-900 text-lg">{getDisplayName(viewingClient)}</p>
                                            <p className="text-sm text-gray-500">{viewingClient.email}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 capitalize">Documento</p>
                                        <p className="font-semibold text-sm">{viewingClient.tipo_documento} {viewingClient.numero_documento}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 capitalize">Tipo</p>
                                        <Badge variant="outline">{viewingClient.clientType ?? 'Persona natural'}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 capitalize">Teléfono</p>
                                        <p className="font-semibold text-sm">{viewingClient.telefono}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 capitalize">Ciudad</p>
                                        <p className="font-semibold text-sm">{viewingClient.ciudad}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 capitalize">Dirección</p>
                                        <p className="font-semibold text-sm">{viewingClient.direccion}</p>
                                    </div>
                                    {viewingClient.clientType === 'Empresa' && viewingClient.contacto && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 capitalize">Persona de contacto</p>
                                            <p className="font-semibold text-sm">{viewingClient.contacto}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 capitalize">Estado</p>
                                        <Badge className={viewingClient.estado === 'activo'
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'bg-gray-100 text-gray-500'}>
                                            {viewingClient.estado}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                    {viewingClient.estado === 'activo' && (
                                        <Button
                                            onClick={() => { handleEdit(viewingClient); setShowDetailModal(false); }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Editar Cliente
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
                if (!open) { setShowDeleteModal(false); setDeletingClient(null); }
            }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <Trash2 className="w-5 h-5" />Eliminar Cliente
                            </DialogTitle>
                            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                        </DialogHeader>
                        {deletingClient && (
                            <div className="mt-4 space-y-3">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-semibold text-blue-900">{getDisplayName(deletingClient)}</p>
                                    <p className="text-sm text-blue-700 mt-1">{deletingClient.tipo_documento} {deletingClient.numero_documento}</p>
                                    <p className="text-sm text-blue-700">{deletingClient.email}</p>
                                </div>
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold">¿Estás seguro?</p>
                                        <p className="text-amber-700 mt-0.5">El cliente será eliminado permanentemente del sistema.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button variant="outline"
                                onClick={() => { setShowDeleteModal(false); setDeletingClient(null); }}
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