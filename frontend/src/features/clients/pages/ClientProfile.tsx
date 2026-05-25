import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { toast } from 'sonner';
import {
    AlertTriangle, CheckCircle2, Info, X, Loader2, Edit,
    Phone, Mail, MapPin, Building2, FileText, User,
} from 'lucide-react';
import { getClienteMe, updateClienteMe } from '../services/clientesService';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface ClienteData {
    id: number;
    nombres: string;
    apellidos: string;
    razon_social: string;
    tipo_documento: string;
    numero_documento: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
    estado: 'activo' | 'inactivo';
    contacto?: string | null;
    clientType?: 'Persona natural' | 'Empresa';
}

interface FormData {
    nombres: string;
    apellidos: string;
    razon_social: string;
    contacto: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
}

interface FormErrors {
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
}

// ── Validación ────────────────────────────────────────────────────────────────
const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

function validar(data: FormData, isEmpresa: boolean): FormErrors {
    const e: FormErrors = {};
    if (isEmpresa) {
        if (!data.razon_social.trim()) e.razon_social = 'La razón social es obligatoria';
        if (!data.contacto.trim()) e.contacto = 'El contacto es obligatorio';
        else if (!soloLetras.test(data.contacto.trim())) e.contacto = 'Solo letras y espacios';
    } else {
        if (!data.nombres.trim()) e.nombres = 'El nombre es obligatorio';
        else if (data.nombres.trim().length < 2) e.nombres = 'Mínimo 2 caracteres';
        else if (!soloLetras.test(data.nombres.trim())) e.nombres = 'Solo letras y espacios';
        if (!data.apellidos.trim()) e.apellidos = 'Los apellidos son obligatorios';
        else if (data.apellidos.trim().length < 2) e.apellidos = 'Mínimo 2 caracteres';
        else if (!soloLetras.test(data.apellidos.trim())) e.apellidos = 'Solo letras y espacios';
    }
    if (!data.telefono.trim()) e.telefono = 'El teléfono es obligatorio';
    else if (data.telefono.trim().length < 7) e.telefono = 'Mínimo 7 dígitos';
    if (!data.email.trim()) e.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) e.email = 'Correo inválido';
    if (!data.ciudad.trim()) e.ciudad = 'La ciudad es obligatoria';
    else if (!soloLetras.test(data.ciudad.trim())) e.ciudad = 'Solo letras y espacios';
    if (!data.direccion.trim()) e.direccion = 'La dirección es obligatoria';
    return e;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
type BannerVariant = 'success' | 'error' | 'warning' | 'info';
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

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{msg}</p>;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || '—'}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export function ClientProfile() {
    const [cliente, setCliente] = useState<ClienteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    const [form, setForm]         = useState<FormData>({ nombres: '', apellidos: '', razon_social: '', contacto: '', telefono: '', email: '', direccion: '', ciudad: '' });
    const [errors, setErrors]     = useState<FormErrors>({});
    const [submitted, setSubmitted] = useState(false);

    const [banner, setBanner] = useState<{ text: string; variant: BannerVariant } | null>(null);
    const showBanner = useCallback((text: string, variant: BannerVariant = 'info') => {
        setBanner({ text, variant });
        setTimeout(() => setBanner(null), 5000);
    }, []);

    const fetchCliente = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getClienteMe() as any;
            const isEmpresa = data.nombres === 'N/A';
            setCliente({ ...data, clientType: isEmpresa ? 'Empresa' : 'Persona natural' });
        } catch {
            toast.error('Error al cargar tu información');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCliente(); }, [fetchCliente]);

    const isEmpresa = cliente?.clientType === 'Empresa';

    const getDisplayName = (c: ClienteData) =>
        c.clientType === 'Empresa' ? c.razon_social : `${c.nombres} ${c.apellidos}`.trim();

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    };

    const openEdit = () => {
        if (!cliente) return;
        setForm({
            nombres:      cliente.nombres === 'N/A' ? '' : cliente.nombres,
            apellidos:    cliente.apellidos === 'N/A' ? '' : cliente.apellidos,
            razon_social: cliente.razon_social,
            contacto:     cliente.contacto ?? '',
            telefono:     cliente.telefono,
            email:        cliente.email,
            direccion:    cliente.direccion ?? '',
            ciudad:       cliente.ciudad ?? '',
        });
        setErrors({});
        setSubmitted(false);
        setShowEdit(true);
    };

    useEffect(() => {
        if (submitted) setErrors(validar(form, isEmpresa));
    }, [form, submitted, isEmpresa]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const errs = validar(form, isEmpresa);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        try {
            setSaving(true);
            await updateClienteMe({
                nombres:      isEmpresa ? 'N/A' : form.nombres,
                apellidos:    isEmpresa ? 'N/A' : form.apellidos,
                razon_social: isEmpresa ? form.razon_social : '',
                contacto:     isEmpresa ? form.contacto : undefined,
                telefono:     form.telefono,
                email:        form.email,
                direccion:    form.direccion,
                ciudad:       form.ciudad,
            });
            await fetchCliente();
            setShowEdit(false);
            showBanner('Información actualizada correctamente', 'success');
            toast.success('Datos actualizados exitosamente');
        } catch (err: any) {
            showBanner(`Error: ${err.message}`, 'error');
            toast.error(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const onlyLettersInput = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    const onlyPhone        = (v: string) => v.replace(/[^0-9+\s\-]/g, '');
    const onlyAddress      = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s#\-\.]/g, '');

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-500">Cargando tu información...</span>
            </div>
        );
    }

    if (!cliente) {
        return <div className="p-6 text-center text-gray-500">No se pudo cargar la información del perfil.</div>;
    }

    const displayName = getDisplayName(cliente);

    return (
        <div className="p-6 space-y-6">

            {/* Banner */}
            {banner && (
                <div className={`flex items-center gap-3 border rounded-xl px-5 py-3 shadow-sm ${bannerStyles[banner.variant]}`}>
                    {bannerIcons[banner.variant]}
                    <span className="text-sm font-medium flex-1">{banner.text}</span>
                    <button onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-1">Mi Información</h1>
                    <p className="text-blue-800">Consulta y actualiza tus datos personales</p>
                </div>
                <Button onClick={openEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Edit className="w-4 h-4 mr-2" />Editar información
                </Button>
            </div>

            {/* Tarjeta principal */}
            <Card>
                <CardContent className="p-0">

                    {/* Cabecera de perfil */}
                    <div className="flex items-center gap-5 p-6 border-b border-gray-100">
                        <Avatar className="w-20 h-20 shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xl font-bold text-gray-900 truncate">{displayName}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{cliente.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{cliente.clientType ?? 'Persona natural'}</Badge>
                                <Badge className={cliente.estado === 'activo'
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-gray-100 text-gray-500'}>
                                    {cliente.estado}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Detalle de datos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-6 py-2">

                        <InfoRow
                            icon={<FileText className="w-4 h-4 text-blue-600" />}
                            label="Documento"
                            value={`${cliente.tipo_documento.toUpperCase()} ${cliente.numero_documento}`}
                        />
                        <InfoRow
                            icon={<Phone className="w-4 h-4 text-blue-600" />}
                            label="Teléfono"
                            value={cliente.telefono}
                        />
                        <InfoRow
                            icon={<Mail className="w-4 h-4 text-blue-600" />}
                            label="Correo electrónico"
                            value={cliente.email}
                        />
                        <InfoRow
                            icon={<MapPin className="w-4 h-4 text-blue-600" />}
                            label="Ciudad"
                            value={cliente.ciudad}
                        />
                        <InfoRow
                            icon={<Building2 className="w-4 h-4 text-blue-600" />}
                            label="Dirección"
                            value={cliente.direccion}
                        />
                        {isEmpresa && cliente.contacto && (
                            <InfoRow
                                icon={<User className="w-4 h-4 text-blue-600" />}
                                label="Persona de contacto"
                                value={cliente.contacto}
                            />
                        )}

                    </div>
                </CardContent>
            </Card>

            {/* ── Modal Editar ─────────────────────────────────────────────── */}
            <Dialog open={showEdit} onOpenChange={(open) => { if (!open) setShowEdit(false); }}>
                <DialogContent
                    className="p-0 gap-0 overflow-hidden"
                    style={{ width: '96vw', maxWidth: 800, height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
                >
                    <div className="overflow-y-auto flex-1 p-6">
                        <DialogHeader>
                            <DialogTitle>Editar mi información</DialogTitle>
                            <DialogDescription>Actualiza tus datos de contacto y dirección.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-4">

                            {isEmpresa ? (
                                <>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Razón Social <span className="text-red-500">*</span></label>
                                        <Input
                                            value={form.razon_social}
                                            onChange={(e) => setForm(p => ({ ...p, razon_social: e.target.value.slice(0, 100) }))}
                                            maxLength={100}
                                            className={errors.razon_social ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={errors.razon_social} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Persona de contacto <span className="text-red-500">*</span></label>
                                        <Input
                                            value={form.contacto}
                                            onChange={(e) => setForm(p => ({ ...p, contacto: onlyLettersInput(e.target.value) }))}
                                            maxLength={100}
                                            className={errors.contacto ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={errors.contacto} />
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Nombres <span className="text-red-500">*</span></label>
                                        <Input
                                            value={form.nombres}
                                            onChange={(e) => setForm(p => ({ ...p, nombres: onlyLettersInput(e.target.value) }))}
                                            maxLength={50}
                                            className={errors.nombres ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={errors.nombres} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">Apellidos <span className="text-red-500">*</span></label>
                                        <Input
                                            value={form.apellidos}
                                            onChange={(e) => setForm(p => ({ ...p, apellidos: onlyLettersInput(e.target.value) }))}
                                            maxLength={50}
                                            className={errors.apellidos ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={errors.apellidos} />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">Teléfono <span className="text-red-500">*</span></label>
                                    <Input
                                        value={form.telefono}
                                        onChange={(e) => setForm(p => ({ ...p, telefono: onlyPhone(e.target.value) }))}
                                        maxLength={20}
                                        placeholder="+57 300 123 4567"
                                        className={errors.telefono ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={errors.telefono} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">Correo electrónico <span className="text-red-500">*</span></label>
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm(p => ({ ...p, email: e.target.value.replace(/\s/g, '') }))}
                                        maxLength={100}
                                        className={errors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={errors.email} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">Ciudad <span className="text-red-500">*</span></label>
                                    <Input
                                        value={form.ciudad}
                                        onChange={(e) => setForm(p => ({ ...p, ciudad: onlyLettersInput(e.target.value) }))}
                                        maxLength={50}
                                        placeholder="Medellín"
                                        className={errors.ciudad ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={errors.ciudad} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">Dirección <span className="text-red-500">*</span></label>
                                    <Input
                                        value={form.direccion}
                                        onChange={(e) => setForm(p => ({ ...p, direccion: onlyAddress(e.target.value) }))}
                                        maxLength={100}
                                        placeholder="Calle 50 #25-30"
                                        className={errors.direccion ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={errors.direccion} />
                                </div>
                            </div>

                            {/* Documento — solo lectura */}
                            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Dato no editable</p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium capitalize">{cliente.tipo_documento}</span>: {cliente.numero_documento}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowEdit(false)} disabled={saving}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    Guardar cambios
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
