import { useCallback, useEffect, useState } from 'react';
import { Button }      from '@/shared/components/ui/button';
import { Input }       from '@/shared/components/ui/input';
import { Label }       from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch }      from '@/shared/components/ui/switch';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge }       from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast }       from 'sonner';
import {
  Plus, Eye, Edit, Trash2, UserIcon, AlertTriangle,
  EyeIcon, EyeOffIcon, LockIcon, CheckIcon, XIcon,
  Search, Loader2, X, CheckCircle2, Info,
} from 'lucide-react';
import * as usuariosService from '@/features/users/services/usuariosService';
import * as rolesService    from '@/features/roles/services/rolesService';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface UserRow {
  id: number;
  email: string;
  rolesId: number;
  userType: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
}

interface FormState {
  email: string;
  rolesId: number | null;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
}

// ─── Banner inline (igual que Clientes) ──────────────────────────────────────
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY_FORM: FormState = { email: '', rolesId: null, password: '', firstName: '', lastName: '', phone: '', isActive: true };

// ─── Componente ───────────────────────────────────────────────────────────────
export function UserManagement() {

  // ── Estado principal ────────────────────────────────────────────────────────
  const [users,       setUsers]       = useState<UserRow[]>([]);
  const [roles,       setRoles]       = useState<Array<{ id: number; name: string }>>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving,      setSaving]      = useState(false);

  // ── Estado de modales ───────────────────────────────────────────────────────
  const [showModal,        setShowModal]        = useState(false);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser,      setEditingUser]      = useState<UserRow | null>(null);
  const [viewingUser,      setViewingUser]      = useState<UserRow | null>(null);
  const [userToDelete,     setUserToDelete]     = useState<UserRow | null>(null);

  // ── Estado de búsqueda y paginación ────────────────────────────────────────
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 5;

  // ── Estado del formulario ───────────────────────────────────────────────────
  const [formData,         setFormData]         = useState<FormState>(EMPTY_FORM);
  const [showPassword,     setShowPassword]     = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [pwdValidation,    setPwdValidation]    = useState({ length: false, upper: false, number: false, special: false });

  // ── Banner global ───────────────────────────────────────────────────────────
  const [banner, setBanner] = useState<BannerMsg | null>(null);
  const showBanner = useCallback((text: string, variant: BannerVariant = 'info') => {
    setBanner({ text, variant });
    setTimeout(() => setBanner(null), 5000);
  }, []);

  // ── Banner de fila (usuario inactivo) ───────────────────────────────────────
  const [inactiveBannerId,     setInactiveBannerId]     = useState<number | null>(null);
  const [inactiveBannerAction, setInactiveBannerAction] = useState<'edit' | 'delete' | null>(null);
  const triggerInactiveBanner = (id: number, action: 'edit' | 'delete') => {
    setInactiveBannerId(id);
    setInactiveBannerAction(action);
    setTimeout(() => { setInactiveBannerId(null); setInactiveBannerAction(null); }, 4000);
  };
  // ── Validación de contraseña en tiempo real ─────────────────────────────────
  useEffect(() => {
    const p = formData.password;
    setPwdValidation({
      length:  p.length >= 6,
      upper:   /[A-Z]/.test(p),
      number:  /\d/.test(p),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    });
  }, [formData.password]);

  // Resetear página al cambiar filtros
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  // ── Carga inicial ───────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setLoadingData(true);
    Promise.all([rolesService.getRoles(), usuariosService.getUsuarios()])
      .then(([rolesData, usersData]) => {
        const roleMap = new Map(rolesData.map((r: any) => [r.id, r.name]));
        setRoles(rolesData.map((r: any) => ({ id: r.id, name: r.name })));
        setUsers(usersData.map((u: any) => {
          const base = (u.email || '').split('@')[0] || 'Usuario';
          return {
            id: u.id, email: u.email, rolesId: u.rolesId,
            userType: roleMap.get(u.rolesId) || `Rol ${u.rolesId}`,
            firstName: base, lastName: '', phone: '', isActive: true,
          };
        }));
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers del formulario ──────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setShowPassword(false);
    setShowEditPassword(false);
    setEditingUser(null);
    setShowModal(false);
  }, []);

  const openCreate = useCallback(() => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((user: UserRow) => {
    if (!user.isActive) { triggerInactiveBanner(user.id, 'edit'); return; }
    setEditingUser(user);
    setFormData({ email: user.email, rolesId: user.rolesId, password: '', firstName: user.firstName, lastName: user.lastName, phone: user.phone, isActive: user.isActive });
    setShowModal(true);
  }, []);

  const handleViewDetail = useCallback((user: UserRow) => {
    setViewingUser(user);
    setShowDetailModal(true);
  }, []);

  // ── Submit crear/editar ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.rolesId) { toast.error('Debes seleccionar un rol'); return; }
    if (!formData.email.trim()) { toast.error('El correo es obligatorio'); return; }
    if (!EMAIL_RE.test(formData.email.trim())) { toast.error('El correo no tiene un formato válido'); return; }
    if (!editingUser) {
      if (!formData.password) { toast.error('La contraseña es obligatoria'); return; }
      if (formData.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    } else {
      if (formData.password && formData.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    }

    setSaving(true);
    try {
      if (editingUser) {
        const resp = await usuariosService.updateUsuario(editingUser.id, {
          rolesId: formData.rolesId,
          email: formData.email.trim(),
          ...(formData.password ? { password: formData.password } : {}),
        });
        const roleName = roles.find(r => r.id === formData.rolesId)?.name || '';
        setUsers(prev => prev.map(u =>
          u.id === editingUser.id
            ? { ...u, email: formData.email.trim(), rolesId: formData.rolesId!, userType: roleName }
            : u
        ));
        toast.success(resp.message || 'Usuario actualizado exitosamente');
        showBanner('Usuario actualizado correctamente', 'success');
      } else {
        const resp = await usuariosService.createUsuario({ rolesId: formData.rolesId, email: formData.email.trim(), password: formData.password });
        const roleName = roles.find(r => r.id === formData.rolesId)?.name || '';
        setUsers(prev => [...prev, {
          id: resp.usuario.id, email: resp.usuario.email,
          rolesId: resp.usuario.rolesId, userType: roleName,
          firstName: resp.usuario.email.split('@')[0], lastName: '', phone: '', isActive: true,
        }]);
        toast.success(resp.message || 'Usuario creado exitosamente');
        showBanner('Usuario creado exitosamente', 'success');
      }
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar usuario');
    } finally {
      setSaving(false);
    }
  }, [formData, editingUser, roles, resetForm, showBanner]);

  // ── Toggle estado activo/inactivo ───────────────────────────────────────────
  const toggleStatus = useCallback((userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  }, []);

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((user: UserRow) => {
    if (!user.isActive) { triggerInactiveBanner(user.id, 'delete'); return; }
    setUserToDelete(user);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!userToDelete) return;
    usuariosService.deleteUsuario(userToDelete.id)
      .then(resp => {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast.success(resp.message || 'Usuario eliminado exitosamente');
        showBanner('Usuario eliminado exitosamente', 'success');
        setShowDeleteDialog(false);
        setUserToDelete(null);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar usuario');
        setShowDeleteDialog(false);
        setUserToDelete(null);
      });
  }, [userToDelete, showBanner]);

  // ── Filtrado y paginación ───────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchSearch = name.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && u.isActive) || (statusFilter === 'inactive' && !u.isActive);
    return matchSearch && matchStatus;
  });
  const totalPages   = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* ── Banner global (igual que Clientes) ───────────────────────────── */}
        {banner && (
          <div className={`flex items-center gap-3 border rounded-xl px-5 py-3 shadow-sm ${bannerStyles[banner.variant]}`}>
            {bannerIcons[banner.variant]}
            <span className="text-sm font-medium flex-1">{banner.text}</span>
            <button onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── Header: título + botón Nuevo Usuario ─────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Usuarios</h1>
            <p className="text-blue-800">Administra los usuarios del sistema</p>
          </div>
          {/* Botón fuera del Dialog para evitar warning de refs */}
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo Usuario
          </Button>
        </div>

        {/* ── Dialog de crear/editar (controlado, sin DialogTrigger) ───────── */}
        <Dialog open={showModal} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Modifica la información del usuario.' : 'Completa el formulario para crear un nuevo usuario.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Rol */}
              <div className="space-y-2">
                <Label>Tipo de usuario *</Label>
                <Select value={formData.rolesId ? String(formData.rolesId) : ''} onValueChange={v => setFormData(prev => ({ ...prev, rolesId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="u-email">Correo electrónico *</Label>
                <Input id="u-email" type="email" value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@jrepuestos.com"
                  className={formData.email && !EMAIL_RE.test(formData.email) ? 'border-red-400' : ''} />
                {formData.email && !EMAIL_RE.test(formData.email) && (
                  <p className="text-xs text-red-500 flex items-center gap-1"><XIcon className="w-3 h-3" />Correo no válido</p>
                )}
              </div>

              {/* Campos extra solo en edición */}
              {editingUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="u-fname">Nombre</Label>
                    <Input id="u-fname" value={formData.firstName} onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="u-lname">Apellido</Label>
                    <Input id="u-lname" value={formData.lastName} onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Pérez" />
                  </div>
                </div>
              )}

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="u-pwd">
                  {editingUser ? <>Nueva contraseña <span className="text-gray-400 text-xs">(vacío = no cambiar)</span></> : 'Contraseña *'}
                </Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input id="u-pwd"
                    type={editingUser ? (showEditPassword ? 'text' : 'password') : (showPassword ? 'text' : 'password')}
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••" className="pl-10 pr-10"
                    required={!editingUser} />
                  <button type="button"
                    onClick={() => editingUser ? setShowEditPassword(p => !p) : setShowPassword(p => !p)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {(editingUser ? showEditPassword : showPassword) ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                {/* Indicador de fortaleza solo al crear */}
                {!editingUser && formData.password && (
                  <div className="space-y-1 p-3 bg-gray-50 rounded-lg border text-xs">
                    {[
                      { ok: pwdValidation.length,  label: 'Mínimo 6 caracteres' },
                      { ok: pwdValidation.upper,   label: 'Al menos 1 mayúscula' },
                      { ok: pwdValidation.number,  label: 'Al menos 1 número' },
                      { ok: pwdValidation.special, label: 'Al menos 1 carácter especial' },
                    ].map(({ ok, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        {ok ? <CheckIcon className="w-3 h-3 text-green-500" /> : <XIcon className="w-3 h-3 text-red-400" />}
                        <span className={ok ? 'text-green-700' : 'text-gray-500'}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {editingUser && formData.password && formData.password.length < 6 && (
                  <p className="text-xs text-red-500 flex items-center gap-1"><XIcon className="w-3 h-3" />Mínimo 6 caracteres</p>
                )}
              </div>

              {/* Estado (solo edición) */}
              {editingUser && (
                <div className="flex items-center gap-3">
                  <Switch checked={formData.isActive} onCheckedChange={v => setFormData(prev => ({ ...prev, isActive: v }))} />
                  <Label>Usuario activo</Label>
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')} Usuario
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Barra de filtros (ADN Clientes) ──────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative w-full sm:flex-[3]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <Input placeholder="Buscar por nombre o email..." value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10 w-full" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-40">
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
              <span className="text-sm text-gray-500 whitespace-nowrap self-center">{filteredUsers.length} usuario(s)</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabla de usuarios (ADN Clientes) ─────────────────────────────── */}
        {loadingData ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Cargando usuarios...</span>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-900">
                    <tr>
                      <th className="text-left py-4 px-6 text-black font-semibold">Usuario</th>
                      <th className="text-left py-4 px-6 text-black font-semibold">Contacto</th>
                      <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                      <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-gray-500">No se encontraron usuarios</td></tr>
                    ) : currentUsers.map(user => {
                      const isInactive    = !user.isActive;
                      const showRowBanner = inactiveBannerId === user.id;
                      return (
                        <>
                          <tr key={user.id} className={`border-b border-blue-100 transition-colors ${isInactive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'}`}>

                            {/* Columna Usuario */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <UserIcon className={`w-5 h-5 shrink-0 ${isInactive ? 'text-gray-400' : 'text-blue-600'}`} />
                                <div>
                                  <p className={`font-semibold text-sm ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {user.firstName} {user.lastName}
                                  </p>
                                  <Badge variant={user.userType === 'Administrador' ? 'default' : 'secondary'} className="text-xs">
                                    {user.userType}
                                  </Badge>
                                </div>
                              </div>
                            </td>

                            {/* Columna Contacto */}
                            <td className="py-4 px-6">
                              <span className={`text-sm block ${isInactive ? 'text-gray-400' : 'text-gray-700'}`}>{user.email}</span>
                              {user.phone && <span className="text-xs text-gray-400">{user.phone}</span>}
                            </td>

                            {/* Columna Estado con Switch */}
                            <td className="py-4 px-6">
                              <Switch checked={user.isActive} onCheckedChange={() => toggleStatus(user.id)} />
                            </td>

                            {/* Columna Acciones */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleViewDetail(user)}
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Ver detalle</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)}
                                      className={isInactive ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400'}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{isInactive ? 'Usuario inactivo' : 'Editar usuario'}</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(user)}
                                      className={isInactive ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400'}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{isInactive ? 'Usuario inactivo' : 'Eliminar usuario'}</p></TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>

                          {/* Banner de fila para usuario inactivo */}
                          {showRowBanner && (
                            <tr key={`banner-${user.id}`}>
                              <td colSpan={4} className="px-6 py-2">
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 text-sm">
                                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                  No se puede {inactiveBannerAction === 'edit' ? 'editar' : 'eliminar'} un usuario inactivo. Actívalo primero con el switch.
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {filteredUsers.length > itemsPerPage && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-blue-100">
                  <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                      ‹ Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                      Siguiente ›
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Modal de detalle del usuario ─────────────────────────────────── */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
              <DialogDescription>Información del usuario seleccionado.</DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-gray-500 text-xs uppercase">Nombre</Label><p className="text-gray-900 font-semibold mt-1">{viewingUser.firstName} {viewingUser.lastName}</p></div>
                  <div><Label className="text-gray-500 text-xs uppercase">Rol</Label><p className="mt-1"><Badge variant="secondary">{viewingUser.userType}</Badge></p></div>
                  <div><Label className="text-gray-500 text-xs uppercase">Email</Label><p className="text-gray-700 mt-1 text-sm">{viewingUser.email}</p></div>
                  <div><Label className="text-gray-500 text-xs uppercase">Estado</Label><p className="mt-1"><Badge variant={viewingUser.isActive ? 'default' : 'secondary'}>{viewingUser.isActive ? 'Activo' : 'Inactivo'}</Badge></p></div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── AlertDialog de confirmación de eliminación ───────────────────── */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-900">
                <AlertTriangle className="w-5 h-5 text-blue-500" />
                Confirmar Eliminación
              </AlertDialogTitle>
              {/* asChild para evitar <p> anidado */}
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <span className="block">¿Estás seguro de que deseas eliminar este usuario?</span>
                  {userToDelete && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1">
                      <p className="text-sm"><span className="text-gray-500">Usuario: </span><span className="font-medium text-gray-900">{userToDelete.firstName} {userToDelete.lastName}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Email: </span><span className="text-gray-900">{userToDelete.email}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Rol: </span><span className="text-gray-900">{userToDelete.userType}</span></p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setUserToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-blue-600 hover:bg-blue-700 text-white">Eliminar Usuario</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
