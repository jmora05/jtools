import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { toast } from 'sonner';
import {
    Mail, ShieldCheck, KeyRound, Eye, EyeOff,
    CheckIcon, XIcon, Lock, Phone, MapPin, Building2,
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { changePassword } from '@/features/auth/services/authService';

// ── Constantes ────────────────────────────────────────────────────────────────
const PASSWORD_RULES = [
    { key: 'length',    label: 'Mínimo 8 caracteres',  test: (p: string) => p.length >= 8 },
    { key: 'uppercase', label: '1 letra mayúscula',     test: (p: string) => /[A-Z]/.test(p) },
    { key: 'number',    label: '1 número',              test: (p: string) => /\d/.test(p) },
    { key: 'special',   label: '1 carácter especial',   test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {ok
                ? <CheckIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                : <XIcon className="w-3 h-3 text-red-400 flex-shrink-0" />}
            <span className={ok ? 'text-green-600' : 'text-gray-500'}>{label}</span>
        </div>
    );
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

interface UserData {
    email: string;
    role: string;
    userType: string;
    name: string;
    phone?: string;
    city?: string;
    address?: string;
    creadoPorAdmin?: boolean;
}

// ── Componente principal ──────────────────────────────────────────────────────
export function AdminProfile() {
    const [userData, setUserData] = useState<UserData | null>(null);

    const [showModal, setShowModal]     = useState(false);
    const [form, setForm]               = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew]         = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving]           = useState(false);

    const validation = PASSWORD_RULES.reduce((acc, r) => {
        acc[r.key] = r.test(form.newPassword);
        return acc;
    }, {} as Record<string, boolean>);

    const passwordValid  = Object.values(validation).every(Boolean);
    const confirmMatch   = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0;
    const sameAsCurrent  = form.currentPassword.length > 0 && form.newPassword === form.currentPassword;

    useEffect(() => {
        try {
            const raw = localStorage.getItem('jrepuestos_user');
            if (raw) setUserData(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        return parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    };

    const puedeCambiarPassword = userData?.creadoPorAdmin ?? true;

    const displayName = userData?.name || userData?.email || '—';
    const initials = userData?.name
        ? getInitials(userData.name)
        : (userData?.email?.slice(0, 2).toUpperCase() ?? 'U');

    const openModal = () => {
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.currentPassword) { toast.error('Ingresa tu contraseña actual'); return; }
        if (sameAsCurrent)         { toast.error('La nueva contraseña no puede ser igual a la contraseña actual'); return; }
        if (!passwordValid)        { toast.error('La nueva contraseña no cumple los requisitos'); return; }
        if (!confirmMatch)         { toast.error('Las contraseñas no coinciden'); return; }

        setSaving(true);
        try {
            const resp = await changePassword(form.currentPassword, form.newPassword, form.confirmPassword);
            toast.success(resp.message || 'Contraseña actualizada');
            setShowModal(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cambiar contraseña');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl text-blue-900 font-bold mb-1">Mi Información</h1>
                <p className="text-blue-800">Consulta tus datos personales y seguridad</p>
            </div>

            {/* Tarjeta perfil */}
            <Card>
                <CardContent className="p-0">
                    <div className="flex items-center gap-5 p-6 border-b border-gray-100">
                        <Avatar className="w-20 h-20 shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xl font-bold text-gray-900 truncate">{displayName}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{userData?.email || '—'}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                    {userData?.role || 'Administrador'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-6 py-2">
                        <InfoRow
                            icon={<Mail className="w-4 h-4 text-blue-600" />}
                            label="Correo electrónico"
                            value={userData?.email || '—'}
                        />
                        <InfoRow
                            icon={<ShieldCheck className="w-4 h-4 text-blue-600" />}
                            label="Rol"
                            value={userData?.role || 'Administrador'}
                        />
                        {userData?.phone && (
                            <InfoRow
                                icon={<Phone className="w-4 h-4 text-blue-600" />}
                                label="Teléfono"
                                value={userData.phone}
                            />
                        )}
                        {userData?.city && (
                            <InfoRow
                                icon={<MapPin className="w-4 h-4 text-blue-600" />}
                                label="Ciudad"
                                value={userData.city}
                            />
                        )}
                        {userData?.address && (
                            <InfoRow
                                icon={<Building2 className="w-4 h-4 text-blue-600" />}
                                label="Dirección"
                                value={userData.address}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Sección Cambiar Contraseña */}
            {puedeCambiarPassword && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                    <Lock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Cambiar Contraseña</p>
                                    <p className="text-xs text-gray-500">Actualiza tu contraseña de acceso</p>
                                </div>
                            </div>
                            <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <KeyRound className="w-4 h-4 mr-2" />Cambiar Contraseña
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modal Cambiar Contraseña */}
            <Dialog open={puedeCambiarPassword && showModal} onOpenChange={(open: boolean) => { if (!open) setShowModal(false); }}>
                <DialogContent className="max-w-md p-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-blue-600" />Cambiar Contraseña
                        </DialogTitle>
                        <DialogDescription>
                            Ingresa tu contraseña actual y elige una nueva contraseña segura.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">

                        {/* Contraseña actual */}
                        <div className="space-y-1.5">
                            <Label htmlFor="adm-current-pwd" className="text-sm">
                                Contraseña actual <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="adm-current-pwd"
                                    type={showCurrent ? 'text' : 'password'}
                                    value={form.currentPassword}
                                    onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                                    placeholder="••••••••"
                                    className="pr-10 h-9"
                                />
                                <button type="button" onClick={() => setShowCurrent(v => !v)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Nueva contraseña */}
                        <div className="space-y-1.5">
                            <Label htmlFor="adm-new-pwd" className="text-sm">
                                Nueva contraseña <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="adm-new-pwd"
                                    type={showNew ? 'text' : 'password'}
                                    value={form.newPassword}
                                    onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                                    placeholder="••••••••"
                                    className="pr-10 h-9"
                                />
                                <button type="button" onClick={() => setShowNew(v => !v)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.newPassword && (
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    {PASSWORD_RULES.map(r => (
                                        <RuleItem key={r.key} ok={validation[r.key]} label={r.label} />
                                    ))}
                                </div>
                            )}
                            {sameAsCurrent && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <XIcon className="w-3 h-3" />La nueva contraseña no puede ser igual a la contraseña actual
                                </p>
                            )}
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="space-y-1.5">
                            <Label htmlFor="adm-confirm-pwd" className="text-sm">
                                Confirmar contraseña <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="adm-confirm-pwd"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                    placeholder="••••••••"
                                    className="pr-10 h-9"
                                />
                                <button type="button" onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.confirmPassword && !confirmMatch && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <XIcon className="w-3 h-3" />Las contraseñas no coinciden
                                </p>
                            )}
                            {form.confirmPassword && confirmMatch && (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckIcon className="w-3 h-3" />Las contraseñas coinciden
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1"
                                onClick={() => setShowModal(false)} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving || !passwordValid || !confirmMatch || !form.currentPassword || sameAsCurrent}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {saving
                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Guardando...</>
                                    : 'Actualizar contraseña'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
