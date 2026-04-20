import { useCallback, useEffect, useRef, useState } from 'react';
import * as permisosService from '@/features/permisos/services/permisosService';
import { Button }      from '@/shared/components/ui/button';
import { Input }       from '@/shared/components/ui/input';
import { Label }       from '@/shared/components/ui/label';
import { Switch }      from '@/shared/components/ui/switch';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge }       from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast }       from 'sonner';
import { Plus, Edit, Trash2, Shield, Eye, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import * as rolesService from '@/features/roles/services/rolesService';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface RoleRow {
  id: number;
  name: string;
  description: string;
  permissions: number[];
  permissionCount: number;
  isActive: boolean;
}
interface PermisoRow { id: number; name: string; }
interface FormState  { name: string; description: string; permissions: number[]; }

const EMPTY_FORM: FormState = { name: '', description: '', permissions: [] };

// ─── Componente ───────────────────────────────────────────────────────────────
export function RoleManagement() {

  // ── Estado principal ────────────────────────────────────────────────────────
  const [roles,          setRoles]          = useState<RoleRow[]>([]);
  const [permisos,       setPermisos]       = useState<PermisoRow[]>([]);
  const [loadingData,    setLoadingData]    = useState(true);
  const [loadingPerms,   setLoadingPerms]   = useState(false);
  const [togglingIds,    setTogglingIds]    = useState<Set<number>>(new Set());

  // ── Estado de modales ───────────────────────────────────────────────────────
  const [showModal,        setShowModal]        = useState(false);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRole,      setEditingRole]      = useState<RoleRow | null>(null);
  const [viewingRole,      setViewingRole]      = useState<(RoleRow & { permissionsData?: PermisoRow[] }) | null>(null);
  const [roleToDelete,     setRoleToDelete]     = useState<RoleRow | null>(null);

  // ── Estado de búsqueda y paginación ────────────────────────────────────────
  const [searchTerm,   setSearchTerm]   = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 5;

  // ── Estado del formulario ───────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const permissionsRef = useRef<number[]>([]);

  // ── Carga inicial de datos ──────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setLoadingData(true);
    Promise.all([rolesService.getRoles(), permisosService.getPermisos()])
      .then(([rolesData, permisosData]) => {
        setRoles(rolesData.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description ?? '',
          isActive: r.isActive !== false,
          permissions: (r.permisos ?? []).map(p => p.id),
          permissionCount: (r.permisos ?? []).length,
        })));
        setPermisos(permisosData.map(p => ({ id: p.id, name: p.name })));
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // ── Helpers del formulario ──────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    permissionsRef.current = [];
    setEditingRole(null);
    setShowModal(false);
  }, []);

  const openCreate = useCallback(() => {
    setEditingRole(null);
    setFormData(EMPTY_FORM);
    permissionsRef.current = [];
    setShowModal(true);
  }, []);

  const handleEdit = useCallback(async (role: RoleRow) => {
    if (!role.isActive) {
      toast.warning('No se puede editar un rol inactivo. Actívalo primero.');
      return;
    }
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description, permissions: [] });
    permissionsRef.current = [];
    setLoadingPerms(true);
    setShowModal(true);
    try {
      const permsDelRol = await rolesService.getRolPermisos(role.id);
      const ids = permsDelRol.map(p => p.id);
      permissionsRef.current = ids;
      setFormData(prev => ({ ...prev, permissions: ids }));
    } catch {
      toast.error('No se pudieron cargar los permisos del rol');
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  const togglePermission = useCallback((id: number) => {
    const current = permissionsRef.current;
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    permissionsRef.current = next;
    setFormData(prev => ({ ...prev, permissions: [...next] }));
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('El nombre del rol es obligatorio'); return; }
    if (formData.name.trim().length < 2) { toast.error('El nombre debe tener al menos 2 caracteres'); return; }

    const payload = { name: formData.name.trim(), description: formData.description.trim() || null };
    try {
      let roleId: number;
      if (editingRole) {
        const resp = await rolesService.updateRole(editingRole.id, payload);
        roleId = editingRole.id;
        setRoles(prev => prev.map(r =>
          r.id === editingRole.id
            ? { ...r, name: resp.role.name, description: resp.role.description ?? '' }
            : r
        ));
        toast.success(resp.message || 'Rol actualizado exitosamente');
      } else {
        const resp = await rolesService.createRole(payload);
        roleId = resp.role.id;
        setRoles(prev => [...prev, {
          id: resp.role.id, name: resp.role.name,
          description: resp.role.description ?? '',
          isActive: resp.role.isActive !== false,
          permissions: [], permissionCount: 0,
        }]);
        toast.success(resp.message || 'Rol creado exitosamente');
      }
      const selectedPerms = permissionsRef.current;
      await rolesService.setRolPermisos(roleId, selectedPerms);
      setRoles(prev => prev.map(r =>
        r.id === roleId
          ? { ...r, permissions: selectedPerms, permissionCount: selectedPerms.length }
          : r
      ));
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el rol');
    }
  }, [formData, editingRole, resetForm]);

  // ── Toggle activo/inactivo ─────────────────────────────────────────────────
  const toggleStatus = useCallback((role: RoleRow) => {
    setTogglingIds(prev => new Set(prev).add(role.id));
    rolesService.toggleRolActivo(role.id)
      .then(resp => {
        setRoles(prev => prev.map(r => r.id === role.id ? { ...r, isActive: resp.role.isActive !== false } : r));
        toast.success(resp.message);
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al cambiar estado'))
      .finally(() => setTogglingIds(prev => { const s = new Set(prev); s.delete(role.id); return s; }));
  }, []);

  // ── Ver detalle ─────────────────────────────────────────────────────────────
  const handleViewDetail = useCallback(async (role: RoleRow) => {
    setViewingRole(role);
    setShowDetailModal(true);
    try {
      const permsDelRol = await rolesService.getRolPermisos(role.id);
      setViewingRole({ ...role, permissionsData: permsDelRol.map(p => ({ id: p.id, name: p.name })) });
    } catch { /* muestra con datos existentes */ }
  }, []);

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((role: RoleRow) => {
    if (!role.isActive) {
      toast.warning('No se puede eliminar un rol inactivo. Actívalo primero.');
      return;
    }
    setRoleToDelete(role);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!roleToDelete) return;
    rolesService.deleteRole(roleToDelete.id)
      .then(resp => {
        setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
        toast.success(resp.message || 'Rol eliminado');
        setShowDeleteDialog(false);
        setRoleToDelete(null);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar rol');
        setShowDeleteDialog(false);
        setRoleToDelete(null);
      });
  }, [roleToDelete]);

  // ── Filtrado y paginación ───────────────────────────────────────────────────
  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages   = Math.ceil(filteredRoles.length / itemsPerPage);
  const currentRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Roles</h1>
            <p className="text-blue-800">Administra los roles y permisos del sistema</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo Rol
          </Button>
        </div>

        {/* ── Dialog crear/editar ─────────────────────────────────────────────── */}
        <Dialog open={showModal} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
              <DialogDescription>
                {editingRole
                  ? 'Modifica la información del rol y sus permisos.'
                  : 'Completa la información para crear un nuevo rol.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="role-name">Nombre del rol *</Label>
                <Input
                  id="role-name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Vendedor, Gerente, Supervisor"
                  maxLength={50}
                  required
                  className={
                    formData.name && (formData.name.trim().length < 2 || formData.name.trim().length > 50)
                      ? 'border-red-400' : ''
                  }
                />
                {formData.name && formData.name.trim().length < 2 ? (
                  <p className="text-xs text-red-500">Mínimo 2 caracteres</p>
                ) : formData.name && formData.name.trim().length > 50 ? (
                  <p className="text-xs text-red-500">Máximo 50 caracteres</p>
                ) : (
                  <p className="text-xs text-gray-400 text-right">{formData.name.length}/50</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="role-desc">
                  Descripción <span className="text-gray-400 text-xs">(opcional)</span>
                </Label>
                <Input
                  id="role-desc"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe para qué sirve este rol"
                  maxLength={200}
                  className={formData.description.length > 200 ? 'border-red-400' : ''}
                />
                <p className={`text-xs text-right ${formData.description.length > 180 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {formData.description.length}/200
                </p>
              </div>

              {/* Selector de permisos */}
              <div className="space-y-3">
                <Label>Seleccionar permisos</Label>
                {loadingPerms ? (
                  <p className="text-sm text-gray-500">Cargando permisos...</p>
                ) : permisos.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay permisos disponibles. Crea permisos primero.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {permisos.map(permiso => {
                      const checked = formData.permissions.includes(permiso.id);
                      return (
                        <label
                          key={permiso.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm select-none ${
                            checked ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permiso.id)}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <span className="text-sm text-gray-900">{permiso.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-sm text-gray-500">{formData.permissions.length} módulo(s) seleccionado(s)</p>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {editingRole ? 'Actualizar' : 'Crear'} Rol
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Barra de búsqueda ───────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative w-full sm:flex-[3]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <Input
                  placeholder="Buscar roles por nombre..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap self-center">
                {filteredRoles.length} rol(es)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabla de roles ──────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-0">
            {loadingData ? (
              <div className="flex justify-center items-center py-16 text-gray-500">Cargando roles...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-900">
                    <tr>
                      <th className="text-left py-4 px-6 text-black font-semibold">Rol</th>
                      <th className="text-left py-4 px-6 text-black font-semibold">Descripción</th>
                      <th className="text-left py-4 px-6 text-black font-semibold">Permisos</th>
                      <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                      <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRoles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500">
                          No se encontraron roles
                        </td>
                      </tr>
                    ) : currentRoles.map(role => {
                      const isInactive = !role.isActive;
                      return (
                        <tr
                          key={role.id}
                          className={`border-b border-blue-100 transition-colors ${
                            isInactive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'
                          }`}
                        >
                          {/* Nombre */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Shield className={`w-4 h-4 shrink-0 ${isInactive ? 'text-gray-400' : 'text-blue-600'}`} />
                              <span className={`text-sm font-semibold ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
                                {role.name}
                              </span>
                            </div>
                          </td>
                          {/* Descripción */}
                          <td className={`py-4 px-6 text-sm ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                            {role.description || <span className="italic">Sin descripción</span>}
                          </td>
                          {/* Permisos */}
                          <td className="py-4 px-6">
                            <Badge
                              variant="secondary"
                              className={
                                isInactive
                                  ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }
                            >
                              {role.permissionCount} permiso(s)
                            </Badge>
                          </td>
                          {/* Estado */}
                          <td className="py-4 px-6">
                            <Switch
                              checked={role.isActive}
                              onCheckedChange={() => toggleStatus(role)}
                              disabled={togglingIds.has(role.id)}
                            />
                          </td>
                          {/* Acciones */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {/* Ver detalle — siempre habilitado */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => handleViewDetail(role)}
                                    className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Ver detalle</p></TooltipContent>
                              </Tooltip>

                              {/* Editar */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEdit(role)}
                                    disabled={togglingIds.has(role.id)}
                                    className={
                                      isInactive
                                        ? 'bg-gray-100 text-gray-300 border border-gray-200 opacity-40 cursor-not-allowed'
                                        : 'bg-white text-blue-900 border border-blue-900 hover:bg-blue-50'
                                    }
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isInactive ? 'Activa el rol para editar' : 'Editar rol'}</p>
                                </TooltipContent>
                              </Tooltip>

                              {/* Eliminar */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDelete(role)}
                                    disabled={togglingIds.has(role.id)}
                                    className={
                                      isInactive
                                        ? 'bg-gray-100 text-gray-300 border border-gray-200 opacity-40 cursor-not-allowed'
                                        : 'bg-white text-blue-900 border border-blue-900 hover:bg-blue-50'
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isInactive ? 'Activa el rol para eliminar' : 'Eliminar rol'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {filteredRoles.length > itemsPerPage && (
              <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Modal de detalle del rol ────────────────────────────────────────── */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Rol</DialogTitle>
              <DialogDescription>Información completa del rol y sus permisos asignados.</DialogDescription>
            </DialogHeader>
            {viewingRole && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Nombre</Label>
                    <p className="text-gray-900 font-semibold mt-1">{viewingRole.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Descripción</Label>
                    <p className="text-gray-700 mt-1">{viewingRole.description || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Estado</Label>
                    <div className="mt-1">
                      <Badge
                        className={
                          viewingRole.isActive
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }
                      >
                        {viewingRole.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Total de permisos</Label>
                    <p className="text-gray-900 font-semibold mt-1">
                      {viewingRole.permissionsData?.length ?? viewingRole.permissionCount}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wide mb-3 block">
                    Permisos asignados
                  </Label>
                  {!viewingRole.permissionsData ? (
                    <p className="text-sm text-gray-500">Cargando permisos...</p>
                  ) : viewingRole.permissionsData.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-sm text-gray-500">Este rol no tiene permisos asignados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {viewingRole.permissionsData.map(perm => (
                        <div
                          key={perm.id}
                          className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-sm text-gray-900">{perm.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── AlertDialog confirmar eliminación ──────────────────────────────── */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-900">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <span className="block">¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.</span>
                  {roleToDelete && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1">
                      <p className="text-sm">
                        <span className="text-gray-500">Rol: </span>
                        <span className="font-medium text-gray-900">{roleToDelete.name}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Permisos asignados: </span>
                        <span className="text-gray-900">{roleToDelete.permissionCount}</span>
                      </p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setRoleToDelete(null); }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-900"
              >
                Eliminar Rol
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}