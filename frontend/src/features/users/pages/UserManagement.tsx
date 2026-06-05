import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '../../../shared/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { toast } from 'sonner';
import { Switch } from '@/shared/components/ui/switch';
import {
  PlusIcon, EyeIcon, EyeOffIcon, EditIcon, TrashIcon,
  UserIcon, AlertTriangleIcon, ChevronLeftIcon, ChevronRightIcon,
  CheckIcon, XIcon, LockIcon, Loader2Icon, ShieldOffIcon,
  MailIcon, PhoneIcon, MapPinIcon, HashIcon,
  CheckCircleIcon, XCircleIcon, ShieldIcon,
} from 'lucide-react';

// ─── Helper reutilizable para el modal de detalle ─────────────────────────────
function InfoItem({ icon, label, value, iconBg, iconColor }: {
  icon: React.ReactNode; label: string; value: string;
  iconBg: string; iconColor: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 160px' }}>
      <div style={{ background: iconBg, borderRadius: 8, padding: 8, display: 'flex', color: iconColor }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</div>
      </div>
    </div>
  );
}
import * as usuariosService from '@/features/users/services/usuariosService';
import * as rolesService from '@/features/roles/services/rolesService';

// ─── Constantes de roles protegidos ──────────────────────────────────────────
const ROLE_CLIENTE      = 'Cliente';
const ROLE_ADMINISTRADOR = 'Administrador';

// ─── Tipo interno de la tabla ─────────────────────────────────────────────────
interface TableUser {
  id:          number;
  email:       string;
  rolesId:     number;
  userType:    string;
  displayName: string;
  telefono:    string | null;
  ciudad:      string | null;
  documento:   string | null;
  estado:      'activo' | 'inactivo';
}

// ─── Usuario autenticado ──────────────────────────────────────────────────────
interface AuthUser {
  id:          number;
  email:       string;
  displayName: string;
  rolNombre:   string;
  rolesId:     number;
  telefono?:   string | null;
  ciudad?:     string | null;
  documento?:  string | null;
}

function useCurrentUser(): AuthUser | null {
  return (window as any).__currentUser ?? null;
}

// ─── Validación de formulario ─────────────────────────────────────────────────
interface FormErrors {
  rolesId?:         string;
  email?:           string;
  password?:        string;
  confirmPassword?: string;
}

function validarFormulario(
  data: { email: string; password: string; confirmPassword: string; rolesId: number | null },
  esEdicion: boolean
): FormErrors {
  const errs: FormErrors = {};

  // Tipo de usuario
  if (!data.rolesId)
    errs.rolesId = 'El tipo de usuario es obligatorio';

  // Email
  if (!data.email.trim())
    errs.email = 'El correo electrónico es obligatorio';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim()))
    errs.email = 'Formato de correo inválido';
  else if (data.email.trim().length > 100)
    errs.email = 'Máximo 100 caracteres';

  // Contraseña
  const PASSWORD_RULES = [
    { test: (p: string) => p.length >= 8,                                    msg: 'Mínimo 8 caracteres' },
    { test: (p: string) => /[A-Z]/.test(p),                                  msg: 'Al menos una letra mayúscula' },
    { test: (p: string) => /\d/.test(p),                                     msg: 'Al menos un número' },
    { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),                msg: 'Al menos un carácter especial (!@#$%^&*...)' },
  ];

  if (!esEdicion) {
    if (!data.password) {
      errs.password = 'La contraseña es obligatoria';
    } else {
      const failedRules = PASSWORD_RULES.filter((r) => !r.test(data.password));
      if (failedRules.length > 0)
        errs.password = failedRules[0].msg;
    }
  } else if (data.password) {
    const failedRules = PASSWORD_RULES.filter((r) => !r.test(data.password));
    if (failedRules.length > 0)
      errs.password = failedRules[0].msg;
  }

  // Confirmar contraseña (solo al crear, o si se ingresó nueva contraseña al editar)
  const requiereConfirm = !esEdicion || !!data.password;
  if (requiereConfirm) {
    if (!data.confirmPassword)
      errs.confirmPassword = 'Debes confirmar la contraseña';
    else if (data.password !== data.confirmPassword)
      errs.confirmPassword = 'Las contraseñas no coinciden';
  }

  return errs;
}

// ─── Componente de error de campo ─────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <XIcon className="w-3 h-3" />{msg}
    </p>
  );
}

// ─── Banner inline ────────────────────────────────────────────────────────────
type BannerVariant = 'error' | 'warning' | 'info';
interface BannerMsg { text: string; variant: BannerVariant; }
const bannerStyles: Record<BannerVariant, string> = {
  error:   'bg-red-50   border-red-200   text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50  border-blue-200  text-blue-800',
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function UserManagement() {
  const currentUser = useCurrentUser();
  const isCliente   = currentUser?.rolNombre === ROLE_CLIENTE;

  const [users,   setUsers]   = useState<TableUser[]>([]);
  const [roles,   setRoles]   = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Carga inicial
  useEffect(() => {
    let mounted = true;
    Promise.all([rolesService.getRoles(), usuariosService.getUsuarios()])
      .then(([rolesData, usersData]) => {
        if (!mounted) return;
        setRoles(rolesData.map((r) => ({ id: r.id, name: r.name })));
        setUsers(
          usersData.map((u) => ({
            id:          u.id,
            email:       u.email,
            rolesId:     u.rolesId,
            userType:    u.rolNombre ?? `Rol ${u.rolesId}`,
            displayName: u.displayName,
            telefono:    u.cliente?.telefono          ?? null,
            ciudad:      u.cliente?.ciudad            ?? null,
            documento:   u.cliente?.numero_documento  ?? null,
            estado:      (u as any).estado            ?? 'activo',
          }))
        );
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al cargar usuarios/roles'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // ── Estado del formulario ─────────────────────────────────────────────────
  const [showPassword,        setShowPassword]        = useState(false);
  const [showEditPassword,    setShowEditPassword]    = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation,  setPasswordValidation]  = useState({
    length: false, uppercase: false, numbers: false, special: false,
  });

  const [togglingIds,      setTogglingIds]      = useState<Set<number>>(new Set());
  const [showModal,        setShowModal]        = useState(false);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser,      setEditingUser]      = useState<TableUser | null>(null);
  const [viewingUser,      setViewingUser]      = useState<TableUser | null>(null);
  const [userToDelete,     setUserToDelete]     = useState<TableUser | null>(null);

  const [searchTerm,  setSearchTerm]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const emptyForm = {
    email:           '',
    rolesId:         null as number | null,
    password:        '',
    confirmPassword: '',
  };

  const [formData,        setFormData]        = useState(emptyForm);
  const [formErrors,      setFormErrors]      = useState<FormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [banner,          setBanner]          = useState<BannerMsg | null>(null);

  // Indicadores de fuerza de contraseña en tiempo real
  useEffect(() => {
    const p = formData.password;
    setPasswordValidation({
      length:    p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      numbers:   /\d/.test(p),
      special:   /[!@#$%^&*(),.?":{}|<>]/.test(p),
    });
  }, [formData.password]);

  // Revalidar en tiempo real después del primer intento de envío
  useEffect(() => {
    if (submitAttempted) {
      setFormErrors(validarFormulario(formData, !!editingUser));
    }
  }, [formData, submitAttempted, editingUser]);

  // ── Abrir modal "Crear" ───────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setSubmitAttempted(false);
    setBanner(null);
    setEditingUser(null);
    setShowModal(true);
  };

  // ── Toggle de estado ──────────────────────────────────────────────────────
  const handleToggleEstado = async (user: TableUser) => {
    const nuevoEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, estado: nuevoEstado } : u));
    setTogglingIds((prev) => new Set(prev).add(user.id));
    try {
      await usuariosService.toggleUsuarioEstado(user.id);
      toast.success(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`);
    } catch (err) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, estado: user.estado } : u));
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setTogglingIds((prev) => { const s = new Set(prev); s.delete(user.id); return s; });
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCliente) {
      toast.info('Los usuarios con rol Cliente no pueden registrar nuevos usuarios.');
      return;
    }

    setSubmitAttempted(true);
    const errs = validarFormulario(formData, !!editingUser);
    setFormErrors(errs);

    if (Object.keys(errs).length > 0) {
      setBanner({ text: 'Corrige los errores del formulario antes de continuar', variant: 'warning' });
      return;
    }

    const roleName = roles.find((r) => r.id === formData.rolesId)?.name ?? '';

    if (editingUser) {
      usuariosService
        .updateUsuario(editingUser.id, {
          rolesId: formData.rolesId!,
          email:   formData.email,
          ...(formData.password ? { password: formData.password } : {}),
        })
        .then((resp) => {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === editingUser.id
                ? { ...u, email: formData.email, rolesId: formData.rolesId!, userType: roleName,
                    displayName: resp.usuario.displayName }
                : u
            )
          );
          toast.success(resp.message || 'Usuario actualizado exitosamente');
          resetForm();
        })
        .catch((err) => {
          const msg = err instanceof Error ? err.message : 'Error al actualizar usuario';
          setBanner({ text: msg, variant: 'error' });
          if ((err as any).errores?.some((e: string) => e.toLowerCase().includes('correo') || e.toLowerCase().includes('email'))) {
            setFormErrors((prev) => ({ ...prev, email: 'Este correo ya está registrado' }));
          }
        });
    } else {
      usuariosService
        .createUsuario({ rolesId: formData.rolesId!, email: formData.email, password: formData.password })
        .then((resp) => {
          setUsers((prev) => [
            ...prev,
            {
              id:          resp.usuario.id,
              email:       resp.usuario.email,
              rolesId:     resp.usuario.rolesId,
              userType:    roleName,
              displayName: resp.usuario.displayName,
              telefono:    resp.usuario.cliente?.telefono         ?? null,
              ciudad:      resp.usuario.cliente?.ciudad           ?? null,
              documento:   resp.usuario.cliente?.numero_documento ?? null,
              estado:      'activo',
            },
          ]);
          toast.success(resp.message || 'Usuario creado exitosamente');
          resetForm();
        })
        .catch((err) => {
          const msg = err instanceof Error ? err.message : 'Error al crear usuario';
          setBanner({ text: msg, variant: 'error' });
          if ((err as any).errores?.some((e: string) => e.toLowerCase().includes('correo') || e.toLowerCase().includes('email'))) {
            setFormErrors((prev) => ({ ...prev, email: 'Este correo ya está registrado' }));
          }
        });
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setSubmitAttempted(false);
    setBanner(null);
    setShowPassword(false);
    setShowEditPassword(false);
    setShowConfirmPassword(false);
    setEditingUser(null);
    setShowModal(false);
  };

  // ── Editar — sólo usuarios activos ────────────────────────────────────────
  const handleEdit = (user: TableUser) => {
    if (user.estado === 'inactivo') {
      toast.warning('No se puede editar un usuario inactivo. Actívalo primero.');
      return;
    }
    setFormData({ email: user.email, rolesId: user.rolesId, password: '', confirmPassword: '' });
    setFormErrors({});
    setSubmitAttempted(false);
    setBanner(null);
    setEditingUser(user);
    setShowModal(true);
  };

  // ── Eliminar — sólo usuarios activos ─────────────────────────────────────
  const handleDeleteRequest = (user: TableUser) => {
    if (user.estado === 'inactivo') {
      toast.warning('No se puede eliminar un usuario inactivo.');
      return;
    }
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    usuariosService
      .deleteUsuario(userToDelete.id)
      .then((resp) => {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        toast.success(resp.message || 'Usuario eliminado exitosamente');
        setShowDeleteDialog(false);
        setUserToDelete(null);
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : 'Error al eliminar usuario')
      );
  };

  // ── Filtrado y paginación ─────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const totalPages   = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3)               pages.push(1, 2, 3, '...', totalPages);
      else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      else                                pages.push(1, '...', currentPage, '...', totalPages);
    }
    return pages;
  };

  const isUserInactive = (user: TableUser) => user.estado === 'inactivo';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-1">Gestión de Usuarios</h1>
            <p className="text-blue-900">Administra los usuarios del sistema</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
            onClick={handleOpenCreate}
          >
            <PlusIcon className="w-4 h-4 mr-2" />Nuevo Usuario
          </Button>
        </div>

        {/* ── Modal crear / editar ── */}
        <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
          <DialogContent className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuario' : isCliente ? 'Mi Información' : 'Crear Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
                {isCliente
                  ? 'Tu información está protegida y no puede ser modificada desde aquí.'
                  : editingUser
                    ? 'Modifica la información del usuario.'
                    : 'Completa el formulario para crear un nuevo usuario en el sistema.'}
              </DialogDescription>
            </DialogHeader>

            {/* Aviso visual cuando es Cliente */}
            {isCliente && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
                <LockIcon className="w-4 h-4 shrink-0" />
                <span>Los campos están bloqueados. Esta es tu información de cuenta.</span>
              </div>
            )}

            {/* Banner de validación */}
            {banner && (
              <div className={`flex items-center gap-3 border rounded-lg px-4 py-3 text-sm ${bannerStyles[banner.variant]}`}>
                <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{banner.text}</span>
                <button type="button" onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* ── Tipo de usuario ── */}
              <div className="space-y-2">
                <Label>Tipo de usuario *</Label>
                {isCliente ? (
                  <Input
                    value={roles.find((r) => r.id === formData.rolesId)?.name ?? ''}
                    disabled readOnly
                    className="bg-gray-100 cursor-not-allowed text-gray-500"
                  />
                ) : (
                  <Select
                    value={formData.rolesId ? String(formData.rolesId) : ''}
                    onValueChange={(v) => setFormData({ ...formData, rolesId: Number(v) })}
                  >
                    <SelectTrigger className={formErrors.rolesId ? 'border-red-400 focus:ring-red-300' : ''}>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!isCliente && <FieldError msg={formErrors.rolesId} />}
              </div>

              {/* ── Email ── */}
              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.replace(/\s/g, '') })}
                  placeholder="usuario@ejemplo.com"
                  disabled={isCliente}
                  readOnly={isCliente}
                  maxLength={100}
                  className={
                    isCliente
                      ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                      : formErrors.email ? 'border-red-400 focus-visible:ring-red-300' : ''
                  }
                />
                {!isCliente && <FieldError msg={formErrors.email} />}
              </div>

              {/* ── Contraseña — solo para admin ── */}
              {!isCliente && (
                <>
                  <div className="space-y-2">
                    <Label>
                      {editingUser
                        ? <><span>Nueva contraseña</span> <span className="text-gray-400 text-xs">(dejar vacío para no cambiar)</span></>
                        : 'Contraseña *'}
                    </Label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <Input
                        type={editingUser ? (showEditPassword ? 'text' : 'password') : (showPassword ? 'text' : 'password')}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 ${formErrors.password ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => editingUser ? setShowEditPassword(!showEditPassword) : setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {(editingUser ? showEditPassword : showPassword)
                          ? <EyeOffIcon className="w-4 h-4" />
                          : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                    <FieldError msg={formErrors.password} />

                    {/* Indicadores de fuerza de contraseña */}
                    {formData.password && (
                      <div className="space-y-1 p-3 bg-gray-50 rounded-lg border text-xs">
                        <p className="text-gray-500 mb-1">Requisitos:</p>
                        {[
                          { ok: passwordValidation.length,    label: 'Mínimo 8 caracteres' },
                          { ok: passwordValidation.uppercase, label: 'Al menos 1 mayúscula' },
                          { ok: passwordValidation.numbers,   label: 'Al menos 1 número' },
                          { ok: passwordValidation.special,   label: 'Al menos 1 carácter especial' },
                        ].map(({ ok, label }) => (
                          <div key={label} className="flex items-center gap-1.5">
                            {ok
                              ? <CheckIcon className="w-3 h-3 text-green-500" />
                              : <XIcon className="w-3 h-3 text-red-400" />}
                            <span className={ok ? 'text-green-700' : 'text-gray-500'}>{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Confirmar contraseña ── */}
                  <div className="space-y-2">
                    <Label>Confirmar contraseña {!editingUser && '*'}</Label>
                      <div className="relative">
                        <LockIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          className={`pl-10 pr-10 ${formErrors.confirmPassword ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Indicador de coincidencia en tiempo real */}
                      {formData.confirmPassword && !formErrors.confirmPassword && formData.password === formData.confirmPassword && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" />Las contraseñas coinciden
                        </p>
                      )}
                      <FieldError msg={formErrors.confirmPassword} />
                    </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                {!isCliente && (
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingUser ? 'Actualizar' : 'Crear'} Usuario
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Búsqueda ── */}
        <Card className="shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <span className="text-sm text-gray-600">{filteredUsers.length} usuario(s)</span>
          </div>
        </Card>

        {/* ── Tabla ── */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-900">
                <tr>
                  <th className="text-left py-4 px-6 text-black font-semibold">Usuario</th>
                  <th className="text-left py-4 px-6 text-black font-semibold">Contacto</th>
                  <th className="text-center py-4 px-6 text-black font-semibold">Estado</th>
                  <th className="px-6 py-4 text-center text-black font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => {
                    const inactive = isUserInactive(user);
                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${inactive ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}
                      >
                        {/* Nombre + Rol */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <UserIcon className={`w-5 h-5 shrink-0 ${inactive ? 'text-gray-400' : 'text-blue-600'}`} />
                            <div>
                              <p className={`text-sm font-medium ${inactive ? 'text-gray-400' : 'text-gray-900'}`}>
                                {user.displayName}
                              </p>
                              <Badge
                                variant={user.userType === ROLE_ADMINISTRADOR ? 'default' : 'secondary'}
                                className="mt-1"
                              >
                                {user.userType}
                              </Badge>
                            </div>
                          </div>
                        </td>

                        {/* Email + Ciudad */}
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <p>{user.email}</p>
                          {user.ciudad && <p className="text-xs text-gray-400">{user.ciudad}</p>}
                        </td>

                        {/* Estado con Switch */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={user.estado === 'activo'}
                              onCheckedChange={() => handleToggleEstado(user)}
                              disabled={togglingIds.has(user.id)}
                            />
                            {togglingIds.has(user.id) && (
                              <Loader2Icon className="w-3 h-3 animate-spin text-gray-400" />
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline" size="sm"
                                  onClick={() => { setViewingUser(user); setShowDetailModal(true); }}
                                  className="text-blue-900 border-blue-900 hover:bg-blue-50"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver detalle</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline" size="sm"
                                    onClick={() => !inactive && handleEdit(user)}
                                    disabled={inactive}
                                    className={
                                      inactive
                                        ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                                        : 'text-blue-900 border-blue-900 hover:bg-blue-50'
                                    }
                                  >
                                    <EditIcon className="w-4 h-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{inactive ? 'Usuario inactivo — actívalo para editar' : 'Editar usuario'}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline" size="sm"
                                    onClick={() => !inactive && handleDeleteRequest(user)}
                                    disabled={inactive}
                                    className={
                                      inactive
                                        ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                                        : 'text-blue-900 border-blue-900 hover:bg-blue-900'
                                    }
                                  >
                                    {inactive
                                      ? <ShieldOffIcon className="w-4 h-4" />
                                      : <TrashIcon className="w-4 h-4" />}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{inactive ? 'Usuario inactivo — no se puede eliminar' : 'Eliminar usuario'}</p>
                              </TooltipContent>
                            </Tooltip>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filteredUsers.length > 0 && (
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                {getPageNumbers().map((page, i) =>
                  page === '...' ? (
                    <span key={`e-${i}`} className="px-2 text-gray-500">•</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handlePageChange(Number(page))}
                      className={
                        currentPage === page
                          ? 'bg-blue-600 hover:bg-blue-700 min-w-[32px]'
                          : 'min-w-[32px]'
                      }
                    >
                      {currentPage === page ? page : '•'}
                    </Button>
                  )
                )}
                <Button
                  variant="outline" size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal detalle ── */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="p-0 max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ borderRadius: 16 }}>
            {viewingUser && (() => {
              const isActive = viewingUser.estado === 'activo';
              const cfg = isActive ? {
                headerBg:  'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                chipBg:    '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
                iconBg:    '#eff6ff', iconColor: '#1d4ed8', accentColor: '#2563eb',
              } : {
                headerBg:  'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                chipBg:    '#f1f5f9', chipText: '#475569', chipBorder: '#cbd5e1',
                iconBg:    '#f8fafc', iconColor: '#64748b', accentColor: '#64748b',
              };
              const hasContacto = viewingUser.telefono || viewingUser.ciudad || viewingUser.documento;
              return (
                <>
                  {/* Header */}
                  <div style={{ background: cfg.headerBg, color: '#fff', padding: '24px 28px 20px', position: 'relative', flexShrink: 0 }}>
                    <button onClick={() => setShowDetailModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                      <XIcon className="w-4 h-4" />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginRight: 36 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <UserIcon className="w-4 h-4" style={{ opacity: 0.75 }} />
                          <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Ficha del usuario
                          </span>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                          {viewingUser.displayName}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                          {viewingUser.userType}{viewingUser.ciudad ? ` · ${viewingUser.ciudad}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                        {isActive ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                        {isActive ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {!isActive && (
                      <div style={{ margin: '16px 24px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                        <XCircleIcon className="w-4 h-4 shrink-0" />
                        Este usuario está inactivo y no puede acceder al sistema.
                      </div>
                    )}

                    {/* Cuenta */}
                    <div style={{ padding: '16px 24px 0' }}>
                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Cuenta</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                          <InfoItem icon={<MailIcon className="w-4 h-4" />}   label="Correo electrónico" value={viewingUser.email}       iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                          <InfoItem icon={<ShieldIcon className="w-4 h-4" />} label="Rol"                 value={viewingUser.userType}   iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                        </div>
                      </div>
                    </div>

                    {/* Contacto (solo si existe info del cliente vinculado) */}
                    {hasContacto && (
                      <div style={{ padding: '12px 24px 0' }}>
                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Contacto</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                            {viewingUser.telefono && <InfoItem icon={<PhoneIcon className="w-4 h-4" />}  label="Teléfono"   value={viewingUser.telefono}  iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                            {viewingUser.ciudad   && <InfoItem icon={<MapPinIcon className="w-4 h-4" />} label="Ciudad"     value={viewingUser.ciudad}    iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                            {viewingUser.documento && <InfoItem icon={<HashIcon className="w-4 h-4" />}  label="Documento"  value={viewingUser.documento} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HashIcon className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                      <span style={{ fontSize: 11, color: '#cbd5e1' }}>Usuario ID #{viewingUser.id}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                    <Button variant="outline" onClick={() => setShowDetailModal(false)} style={{ fontSize: 13 }}>Cerrar</Button>
                    {isActive && (
                      <Button onClick={() => { handleEdit(viewingUser); setShowDetailModal(false); }} style={{ background: cfg.accentColor, color: '#fff', fontSize: 13, border: 'none' }}>
                        <EditIcon className="w-4 h-4 mr-2" />Editar usuario
                      </Button>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ── Confirmar eliminación ── */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-900">
                <AlertTriangleIcon className="w-5 h-5" />Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>¿Estás seguro de que deseas eliminar este usuario?</p>
                {userToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                    <p className="text-sm"><span className="text-gray-600">Nombre: </span>{userToDelete.displayName}</p>
                    <p className="text-sm"><span className="text-gray-600">Email: </span>{userToDelete.email}</p>
                    <p className="text-sm"><span className="text-gray-600">Tipo: </span>{userToDelete.userType}</p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-blue-900 hover:bg-blue-900 border-blue 900 text-black ">
                Eliminar Usuario
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
