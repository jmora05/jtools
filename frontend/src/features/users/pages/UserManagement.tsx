import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from 'sonner';
import { Switch } from '@/shared/components/ui/switch';
import {
  PlusIcon,
  EyeIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  UserIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XIcon,
  LockIcon,
  Loader2Icon,
} from 'lucide-react';
import * as usuariosService from '@/features/users/services/usuariosService';
import * as rolesService from '@/features/roles/services/rolesService';

// ── Tipo interno de la tabla ───────────────────────────────────────────────────
interface TableUser {
  id: number;
  email: string;
  rolesId: number;
  userType: string;   // nombre del rol
  displayName: string;
  telefono: string | null;
  ciudad: string | null;
  estado: 'activo' | 'inactivo';
}

export function UserManagement() {
  const [users, setUsers]   = useState<TableUser[]>([]);
  const [roles, setRoles]   = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Cargar roles + usuarios y construir la tabla
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
            telefono:    u.cliente?.telefono ?? null,
            ciudad:      u.cliente?.ciudad   ?? null,
            estado:      (u as any).estado ?? 'activo',   // ← NUEVO
          }))
        );

      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al cargar usuarios/roles'))
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  // ── Estado del formulario ──────────────────────────────────────────────────
  const [showPassword,     setShowPassword]     = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false, uppercase: false, numbers: false, special: false,
  });

  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [showModal,       setShowModal]       = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser,  setEditingUser]  = useState<TableUser | null>(null);
  const [viewingUser,  setViewingUser]  = useState<TableUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<TableUser | null>(null);

  const [searchTerm,   setSearchTerm]   = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    email:   '',
    rolesId: null as number | null,
    password: '',
  });

  useEffect(() => {
    const p = formData.password;
    setPasswordValidation({
      length:    p.length >= 6,
      uppercase: /[A-Z]/.test(p),
      numbers:   (p.match(/\d/g) || []).length >= 1,
      special:   /[!@#$%^&*(),.?":{}|<>]/.test(p),
    });
  }, [formData.password]);

  // ── Envío ──────────────────────────────────────────────────────────────────
const handleToggleEstado = async (user: TableUser) => {
  const nuevoEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
  // Optimistic update
  setUsers(prev => prev.map(u => u.id === user.id ? { ...u, estado: nuevoEstado } : u));
  setTogglingIds(prev => new Set(prev).add(user.id));
  try {
    await usuariosService.toggleUsuarioEstado(user.id);
    toast.success(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`);
  } catch (err) {
    // Revertir si falla
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, estado: user.estado } : u));
    toast.error(err instanceof Error ? err.message : 'Error al cambiar estado');
  } finally {
    setTogglingIds(prev => { const s = new Set(prev); s.delete(user.id); return s; });
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!formData.rolesId) { toast.error('Debes seleccionar un tipo de usuario'); return; }
    if (!formData.email.trim()) { toast.error('El correo electrónico es obligatorio'); return; }
    if (!emailRegex.test(formData.email.trim())) { toast.error('El correo electrónico no tiene un formato válido'); return; }

    if (!editingUser) {
      if (!formData.password) { toast.error('La contraseña es obligatoria'); return; }
      if (formData.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    } else if (formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres'); return;
    }

    const roleName = roles.find((r) => r.id === formData.rolesId)?.name ?? '';

    if (editingUser) {
      usuariosService
        .updateUsuario(editingUser.id, {
          rolesId: formData.rolesId,
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
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al actualizar usuario'));
    } else {
      usuariosService
        .createUsuario({ rolesId: formData.rolesId, email: formData.email, password: formData.password })
        .then((resp) => {
          setUsers((prev) => [
            ...prev,
            {
              id:          resp.usuario.id,
              email:       resp.usuario.email,
              rolesId:     resp.usuario.rolesId,
              userType:    roleName,
              displayName: resp.usuario.displayName,
              telefono:    resp.usuario.cliente?.telefono ?? null,
              ciudad:      resp.usuario.cliente?.ciudad   ?? null,
            },
          ]);
          toast.success(resp.message || 'Usuario creado exitosamente');
          resetForm();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al crear usuario'));
    }
  };

  const resetForm = () => {
    setFormData({ email: '', rolesId: roles.length > 0 ? roles[0].id : null, password: '' });
    setShowPassword(false);
    setShowEditPassword(false);
    setEditingUser(null);
    setShowModal(false);
  };

  const handleEdit = (user: TableUser) => {
    setFormData({ email: user.email, rolesId: user.rolesId, password: '' });
    setEditingUser(user);
    setShowModal(true);
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
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al eliminar usuario'));
  };

  // ── Filtrado y paginación ──────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const totalPages    = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers  = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (p: number) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, '...', totalPages);
      else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, '...', currentPage, '...', totalPages);
    }
    return pages;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra los usuarios del sistema</p>
          </div>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />Nuevo Usuario
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? 'Modifica la información del usuario.'
                    : 'Completa el formulario para crear un nuevo usuario en el sistema.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de usuario */}
                <div className="space-y-2">
                  <Label>Tipo de usuario *</Label>
                  <Select
                    value={formData.rolesId ? String(formData.rolesId) : ''}
                    onValueChange={(v) => setFormData({ ...formData, rolesId: Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label>Correo electrónico *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@jrepuestos.com"
                    className={
                      formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)
                        ? 'border-red-400' : ''
                    }
                    required
                  />
                  {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email) && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <XIcon className="w-3 h-3" /> Correo no válido
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <Label>
                    {editingUser
                      ? <>Nueva contraseña <span className="text-gray-400 text-xs">(dejar vacío para no cambiar)</span></>
                      : 'Contraseña *'}
                  </Label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type={editingUser ? (showEditPassword ? 'text' : 'password') : (showPassword ? 'text' : 'password')}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required={!editingUser}
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
                  {/* Indicadores solo al crear */}
                  {!editingUser && formData.password && (
                    <div className="space-y-1 p-3 bg-gray-50 rounded-lg border text-xs">
                      <p className="text-gray-500 mb-1">Requisitos:</p>
                      {[
                        { ok: passwordValidation.length,    label: 'Mínimo 6 caracteres' },
                        { ok: passwordValidation.uppercase, label: 'Al menos 1 mayúscula' },
                        { ok: passwordValidation.numbers,   label: 'Al menos 1 número' },
                        { ok: passwordValidation.special,   label: 'Al menos 1 carácter especial' },
                      ].map(({ ok, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          {ok ? <CheckIcon className="w-3 h-3 text-green-500" /> : <XIcon className="w-3 h-3 text-red-400" />}
                          <span className={ok ? 'text-green-700' : 'text-gray-500'}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {editingUser && formData.password && formData.password.length < 6 && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <XIcon className="w-3 h-3" /> Mínimo 6 caracteres
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingUser ? 'Actualizar' : 'Crear'} Usuario
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Búsqueda */}
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

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400">Cargando usuarios...</td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No se encontraron usuarios</td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {/* Nombre + Rol */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="w-5 h-5 text-blue-600 shrink-0" />
                          <div>
                            {/* ✅ Nombre real desde el cliente */}
                            <p className="text-sm text-gray-900 font-medium">{user.displayName}</p>
                            <Badge variant={user.userType === 'Administrador' ? 'default' : 'secondary'} className="mt-1">
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
                          {togglingIds.has(user.id) && <Loader2Icon className="w-3 h-3 animate-spin text-gray-400" />}
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
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleEdit(user)}
                                className="text-blue-900 border-blue-900 hover:bg-blue-50"
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar usuario</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline" size="sm"
                                onClick={() => { setUserToDelete(user); setShowDeleteDialog(true); }}
                                className="text-blue-900 border-blue-900 hover:bg-blue-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar usuario</p></TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filteredUsers.length > 0 && (
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
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
                      className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 min-w-[32px]' : 'min-w-[32px]'}
                    >
                      {currentPage === page ? page : '•'}
                    </Button>
                  )
                )}
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal detalle */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
              <DialogDescription>Información completa del usuario seleccionado.</DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-xs text-gray-500">Nombre</Label>
                    <p className="text-sm font-medium">{viewingUser.displayName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Tipo de usuario</Label>
                    <Badge variant={viewingUser.userType === 'Administrador' ? 'default' : 'secondary'}>
                      {viewingUser.userType}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="text-sm">{viewingUser.email}</p>
                  </div>
                  {viewingUser.ciudad && (
                    <div>
                      <Label className="text-xs text-gray-500">Ciudad</Label>
                      <p className="text-sm">{viewingUser.ciudad}</p>
                    </div>
                  )}
                  {viewingUser.telefono && (
                    <div>
                      <Label className="text-xs text-gray-500">Teléfono</Label>
                      <p className="text-sm">{viewingUser.telefono}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmar eliminación */}
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
              <AlertDialogAction onClick={confirmDelete} className="bg-blue-600 hover:bg-blue-700">
                Eliminar Usuario
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
