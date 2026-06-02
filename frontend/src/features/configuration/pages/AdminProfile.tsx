import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { toast } from 'sonner';
import {
    Mail, ShieldCheck, KeyRound, Eye, EyeOff,
    CheckIcon, XIcon,
} from 'lucide-react';
import { changePassword } from '@/features/auth/services/authService';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Componente principal ──────────────────────────────────────────────────────
export function AdminProfile() {
    const [userData, setUserData] = useState<{
        email: string; role: string; userType: string; name: string;
    } | null>(null);

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew]         = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving]           = useState(false);

    const validation = PASSWORD_RULES.reduce((acc, r) => {
        acc[r.key] = r.test(form.newPassword);
        return acc;
    }, {} as Record<string, boolean>);

    const passwordValid = Object.values(validation).every(Boolean);
    const confirmMatch  = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0;

    useEffect(() => {
        try {
            const raw = localStorage.getItem('jrepuestos_user');
            if (raw) setUserData(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    const initials = userData?.email?.slice(0, 2).toUpperCase() ?? 'U';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.currentPassword) { toast.error('Ingresa tu contraseña actual'); return; }
        if (!passwordValid)        { toast.error('La nueva contraseña no cumple los requisitos'); return; }
        if (!confirmMatch)         { toast.error('Las contraseñas no coinciden'); return; }

        setSaving(true);
        try {
            const resp = await changePassword(
                form.currentPassword,
                form.newPassword,
                form.confirmPassword,
            );
            toast.success(resp.message || 'Contraseña actualizada');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cambiar contraseña');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">

            {/* ── Cabecera ── */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Ajustes de cuenta</h1>
                <p className="text-sm text-gray-500 mt-1">Gestiona tu información personal y seguridad</p>
            </div>

            {/* ── Tarjeta perfil ── */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                            <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-900">
                                {userData?.name || userData?.email || '—'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{userData?.email || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                    {userData?.role || 'Administrador'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Cambiar contraseña ── */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <KeyRound className="w-5 h-5 text-gray-600" />
                        <h2 className="text-base font-semibold text-gray-900">Cambiar contraseña</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Contraseña actual */}
                        <div className="space-y-1.5">
                            <Label htmlFor="current-pwd" className="text-sm">
                                Contraseña actual <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="current-pwd"
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
                            <Label htmlFor="new-pwd" className="text-sm">
                                Nueva contraseña <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="new-pwd"
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

                            {/* Indicador de requisitos */}
                            {form.newPassword && (
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    {PASSWORD_RULES.map(r => (
                                        <RuleItem key={r.key} ok={validation[r.key]} label={r.label} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-pwd" className="text-sm">
                                Confirmar contraseña <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirm-pwd"
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

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={saving || !passwordValid || !confirmMatch || !form.currentPassword}
                                className="bg-blue-600 hover:bg-blue-700 h-9"
                            >
                                {saving
                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Guardando...</>
                                    : 'Actualizar contraseña'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
