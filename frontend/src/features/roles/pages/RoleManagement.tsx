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
import { Plus, Edit, Trash2, Shield, Eye, AlertTriangle, Search } from 'lucide-react';
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
  // Usamos useRef para las permissions para evitar el bucle de re-render
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
          // Los permisos ya vienen incluidos desde el backend
          permissions: (r.permisos ?? []).map(p => p.id),
          permissionCount: (r.permisos ?? []).length,
        })));
        setPermisos(permisosData.map(p => ({ id: p.id, name: p.name })));
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Resetear página al cambiar búsqueda
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
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description, permissions: [] });
    permissionsRef.current = [];
    setLoadingPerms(true);
    setShowModal(true);
    try {
      const permsDelRol = await rolesService.getRolPermisos(role.id);
      const ids = permsDelRol.map(p => p.id);
      permissionsRef.current = ids;
      // Forzamos un re-render sin tocar el array directamente en formData
      setFormData(prev => ({ ...prev, permissions: ids }));
    } catch {
      toast.error('No se pudieron cargar los permisos del rol');
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  // Toggle de permiso — usa input nativo para evitar el bucle de Radix Checkbox
  const togglePermission = useCallback((id: number) => {
    const current = permissionsRef.current;
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    permissionsRef.current = next;
    // Actualizamos formData con el nuevo array (snapshot, no referencia)
    setFormData(prev => ({ ...prev, permissions: [...next] }));
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('El nombre del rol es obligatorio'); return; }

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

        {/* ── Header: título + botón Nuevo Rol ─────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Roles</h1>
            <p className="text-blue-800">Administra los roles y permisos del sistema</p>
          </div>
          {/* Botón fuera del Dialog para evitar warning de refs */}
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo Rol
          </Button>
        </div>

        {/* ── Dialog de crear/editar (controlado, sin DialogTrigger) ───────── */}
        <Dialog open={showModal} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
              <DialogDescription>
                {editingRole ? 'Modifica la información del rol y sus permisos.' : 'Completa la información para crear un nuevo rol.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="role-name">Nombre del rol *</Label>
                <Input id="role-name" value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Vendedor, Gerente, Supervisor" required />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="role-desc">Descripción</Label>
                <Input id="role-desc" value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opcional" />
              </div>

              {/* Selector de permisos — usa <input type="checkbox"> nativo para evitar bucle de Radix */}
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
                          {/* input nativo — no dispara bucle de re-render */}
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

              {/* Acciones del formulario */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {editingRole ? 'Actualizar' : 'Crear'} Rol
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Barra de búsqueda ────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative w-full sm:flex-[3]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <Input placeholder="Buscar roles por nombre..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-full" />
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap self-center">{filteredRoles.length} rol(es)</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabla de roles ───────────────────────────────────────────────── */}
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
                      <tr><td colSpan={5} className="text-center py-12 text-gray-500">No se encontraron roles</td></tr>
                    ) : currentRoles.map(role => {
                      const isInactive = !role.isActive;
                      return (
                      <tr key={role.id} className={`border-b border-blue-100 transition-colors ${isInactive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 shrink-0 ${isInactive ? 'text-gray-400' : 'text-blue-600'}`} />
                            <span className={`text-sm font-semibold ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>{role.name}</span>
                          </div>
                        </td>
                        <td className={`py-4 px-6 text-sm ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                          {role.description || <span className="italic">Sin descripción</span>}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="secondary" className={isInactive ? 'bg-gray-100 text-gray-400 border border-gray-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}>
                            {role.permissionCount} permiso(s)
                          </Badge>
                        </td>
                        {/* Columna Estado con Switch */}
                        <td className="py-4 px-6">
                          <Switch
                            checked={role.isActive}
                            onCheckedChange={() => toggleStatus(role)}
                            disabled={togglingIds.has(role.id)}
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleViewDetail(role)}
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver detalle</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => !isInactive && handleEdit(role)}
                                  className={isInactive ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400'}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>{isInactive ? 'Rol inactivo' : 'Editar rol'}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => !isInactive && handleDelete(role)}
                                  className={isInactive ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400'}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>{isInactive ? 'Rol inactivo' : 'Eliminar rol'}</p></TooltipContent>
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

        {/* ── Modal de detalle del rol ─────────────────────────────────────── */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Rol</DialogTitle>
              <DialogDescription>Información completa del rol y sus permisos asignados.</DialogDescription>
            </DialogHeader>
            {viewingRole && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Nombre</Label>
                    <p className="text-gray-900 font-semibold mt-1">{viewingRole.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Descripción</Label>
                    <p className="text-gray-700 mt-1">{viewingRole.description || '—'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase tracking-wide mb-3 block">
                    Permisos asignados ({viewingRole.permissionsData?.length ?? viewingRole.permissionCount})
                  </Label>
                  {!viewingRole.permissionsData ? (
                    <p className="text-sm text-gray-500">Cargando permisos...</p>
                  ) : viewingRole.permissionsData.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin permisos asignados</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {viewingRole.permissionsData.map(perm => (
                        <div key={perm.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-sm text-gray-900">{perm.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Confirmar Eliminación
              </AlertDialogTitle>
              {/* asChild en Description para evitar <p> anidado */}
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <span className="block">¿Estás seguro de que deseas eliminar este rol?</span>
                  {roleToDelete && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1">
                      <p className="text-sm"><span className="text-gray-500">Rol: </span><span className="font-medium text-gray-900">{roleToDelete.name}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Permisos: </span><span className="text-gray-900">{roleToDelete.permissionCount}</span></p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setRoleToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Eliminar Rol</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}