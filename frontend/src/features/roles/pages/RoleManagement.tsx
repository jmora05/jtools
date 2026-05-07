import { useCallback, useEffect, useRef, useState } from 'react';
import * as permisosService from '@/features/permisos/services/permisosService';
import * as rolesService    from '@/features/roles/services/rolesService';
import { Button }      from '@/shared/components/ui/button';
import { Input }       from '@/shared/components/ui/input';
import { Label }       from '@/shared/components/ui/label';
import { Switch }      from '@/shared/components/ui/switch';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge }       from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Shield, Eye, AlertTriangle, Search, RefreshCw, Lock } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface RoleRow {
  id: number;
  name: string;
  description: string;
  permissions: number[];
  permissionCount: number;
  isActive: boolean;
}
interface PermisoRow { id: number; name: string; description?: string | null; moduleKey?: string | null; }
interface FormState  { name: string; description: string; permissions: number[]; }

const EMPTY_FORM: FormState = { name: '', description: '', permissions: [] };

// ─── Componente principal ─────────────────────────────────────────────────────
export function RoleManagement() {

  // ── Estado de roles ─────────────────────────────────────────────────────────
  const [roles,        setRoles]        = useState<RoleRow[]>([]);
  const [permisos,     setPermisos]     = useState<PermisoRow[]>([]);
  const [loadingData,  setLoadingData]  = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [togglingIds,  setTogglingIds]  = useState<Set<number>>(new Set());
  const [syncing,      setSyncing]      = useState(false);

  // ── Estado de modales ───────────────────────────────────────────────────────
  const [showModal,        setShowModal]        = useState(false);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRole,      setEditingRole]      = useState<RoleRow | null>(null);
  const [viewingRole,      setViewingRole]      = useState<(RoleRow & { permissionsData?: PermisoRow[] }) | null>(null);
  const [roleToDelete,     setRoleToDelete]     = useState<RoleRow | null>(null);

  // ── Búsqueda y paginación ───────────────────────────────────────────────────
  const [searchTerm,  setSearchTerm]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ── Formulario ──────────────────────────────────────────────────────────────
  const [formData,      setFormData]      = useState<FormState>(EMPTY_FORM);
  const [permError,     setPermError]     = useState('');   // error de validación de permisos
  const permissionsRef = useRef<number[]>([]);
  // ── Carga inicial ───────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setLoadingData(true);
    Promise.all([rolesService.getRoles(), permisosService.getPermisos()])
      .then(([rolesData, permisosData]) => {
        setRoles(rolesData.map(r => ({
          id: r.id, name: r.name,
          description: r.description ?? '',
          isActive: r.isActive !== false,
          permissions: (r.permisos ?? []).map(p => p.id),
          permissionCount: (r.permisos ?? []).length,
        })));
        setPermisos(permisosData.map(p => ({ id: p.id, name: p.name, description: p.description, moduleKey: p.moduleKey })));
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // ── Sincronizar módulos del sistema ─────────────────────────────────────────
  const handleSync = useCallback(() => {
    setSyncing(true);
    permisosService.syncSystemModules()
      .then(resp => {
        toast.success(resp.created.length > 0
          ? `Sincronizado: ${resp.created.length} nuevo(s) permiso(s) creado(s)`
          : 'Todos los módulos ya están sincronizados');
        loadData();
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al sincronizar'))
      .finally(() => setSyncing(false));
  }, [loadData]);

  // ── Helpers del formulario ──────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setPermError('');
    permissionsRef.current = [];
    setEditingRole(null);
    setShowModal(false);
  }, []);

  const openCreate = useCallback(() => {
    setEditingRole(null);
    setFormData(EMPTY_FORM);
    setPermError('');
    permissionsRef.current = [];
    setShowModal(true);
  }, []);

  const handleEdit = useCallback(async (role: RoleRow) => {
    if (!role.isActive) { toast.warning('Activa el rol antes de editarlo.'); return; }
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description, permissions: [] });
    setPermError('');
    permissionsRef.current = [];
    setLoadingPerms(true);
    setShowModal(true);
    try {
      const permsDelRol = await rolesService.getRolPermisos(role.id);
      const ids = permsDelRol.map(p => p.id);
      permissionsRef.current = ids;
      setFormData(prev => ({ ...prev, permissions: [...ids] }));
    } catch { toast.error('No se pudieron cargar los permisos del rol'); }
    finally { setLoadingPerms(false); }
  }, []);

  // Toggle de permiso — input nativo para evitar bucle de Radix
  const togglePermission = useCallback((id: number) => {
    const next = permissionsRef.current.includes(id)
      ? permissionsRef.current.filter(x => x !== id)
      : [...permissionsRef.current, id];
    permissionsRef.current = next;
    setFormData(prev => ({ ...prev, permissions: [...next] }));
    if (next.length > 0) setPermError('');
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('El nombre del rol es obligatorio'); return; }

    // Validación: mínimo 1 permiso
    if (permissionsRef.current.length === 0) {
      setPermError('Debes seleccionar al menos un permiso para este rol');
      return;
    }

    const selectedPerms = permissionsRef.current;
    const payload = { name: formData.name.trim(), description: formData.description.trim() || null };

    try {
      let roleId: number;
      if (editingRole) {
        const resp = await rolesService.updateRole(editingRole.id, payload);
        roleId = editingRole.id;
        setRoles(prev => prev.map(r =>
          r.id === editingRole.id ? { ...r, name: resp.role.name, description: resp.role.description ?? '' } : r
        ));
        toast.success(resp.message || 'Rol actualizado exitosamente');
      } else {
        // Al crear, enviamos los permisos en el mismo request
        const resp = await rolesService.createRole({ ...payload, permisosIds: selectedPerms });
        roleId = resp.role.id;
        setRoles(prev => [...prev, {
          id: resp.role.id, name: resp.role.name,
          description: resp.role.description ?? '',
          isActive: true,
          permissions: selectedPerms,
          permissionCount: selectedPerms.length,
        }]);
        toast.success(resp.message || 'Rol creado exitosamente');
        resetForm();
        return;
      }
      // En edición, actualizamos permisos por separado
      await rolesService.setRolPermisos(roleId, selectedPerms);
      setRoles(prev => prev.map(r =>
        r.id === roleId ? { ...r, permissions: selectedPerms, permissionCount: selectedPerms.length } : r
      ));
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el rol');
    }
  }, [formData, editingRole, resetForm]);

  // ── Ver detalle ─────────────────────────────────────────────────────────────
  const handleViewDetail = useCallback(async (role: RoleRow) => {
    setViewingRole(role);
    setShowDetailModal(true);
    try {
      const permsDelRol = await rolesService.getRolPermisos(role.id);
      setViewingRole({ ...role, permissionsData: permsDelRol.map(p => ({ id: p.id, name: p.name })) });
    } catch { /* muestra con datos existentes */ }
  }, []);

  // ── Toggle activo/inactivo ──────────────────────────────────────────────────
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

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((role: RoleRow) => { setRoleToDelete(role); setShowDeleteDialog(true); }, []);

  const confirmDelete = useCallback(() => {
    if (!roleToDelete) return;
    rolesService.deleteRole(roleToDelete.id)
      .then(resp => {
        setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
        toast.success(resp.message || 'Rol eliminado');
        setShowDeleteDialog(false); setRoleToDelete(null);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar rol');
        setShowDeleteDialog(false); setRoleToDelete(null);
      });
  }, [roleToDelete]);

  // ── Filtrado y paginación ───────────────────────────────────────────────────
  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages    = Math.ceil(filteredRoles.length / itemsPerPage);
  const currentRoles  = filteredRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-2">Roles y Permisos</h1>
            <p className="text-blue-800">Gestiona los roles del sistema y los permisos de cada módulo</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo Rol
          </Button>
        </div>

        {/* ── Tabs: Roles | Permisos del sistema ── */}
        <Tabs defaultValue="roles">
          <TabsList className="mb-4">
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permisos">Módulos del sistema</TabsTrigger>
          </TabsList>

          {/* ════════════════ TAB ROLES ════════════════ */}
          <TabsContent value="roles" className="space-y-4">

            {/* Búsqueda */}
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

            {/* Tabla de roles */}
            <Card>
              <CardContent className="p-0">
                {loadingData ? (
                  <div className="flex justify-center items-center py-16 text-gray-500">Cargando roles...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-blue-900">
                        <tr>
                          <th className="text-left py-4 px-6 text-white font-semibold">Rol</th>
                          <th className="text-left py-4 px-6 text-white font-semibold">Descripción</th>
                          <th className="text-left py-4 px-6 text-white font-semibold">Permisos</th>
                          <th className="text-left py-4 px-6 text-white font-semibold">Estado</th>
                          <th className="text-left py-4 px-6 text-white font-semibold">Acciones</th>
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
                              <td className="py-4 px-6">
                                <Switch checked={role.isActive} onCheckedChange={() => toggleStatus(role)} disabled={togglingIds.has(role.id)} />
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
                                      <Button variant="outline" size="sm" onClick={() => !isInactive && handleEdit(role)}
                                        className={isInactive ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400'}>
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{isInactive ? 'Rol inactivo' : 'Editar rol'}</p></TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" onClick={() => !isInactive && handleDelete(role)}
                                        className={isInactive ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400'}>
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
                {filteredRoles.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-blue-100">
                    <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="border-blue-200 text-blue-700 hover:bg-blue-50">‹ Anterior</Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="border-blue-200 text-blue-700 hover:bg-blue-50">Siguiente ›</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════════ TAB MÓDULOS DEL SISTEMA ════════════════ */}
          <TabsContent value="permisos" className="space-y-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Estos son los permisos del sistema. Cada uno corresponde a un módulo de la aplicación.
                  Se asignan a los roles al crearlos o editarlos.
                </p>
                <Button variant="outline" onClick={handleSync} disabled={syncing}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 ml-4 shrink-0">
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sincronizar módulos
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-900">
                      <tr>
                        <th className="text-left py-4 px-6 text-white font-semibold">Módulo</th>
                        <th className="text-left py-4 px-6 text-white font-semibold">Descripción</th>
                        <th className="text-left py-4 px-6 text-white font-semibold">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permisos.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-12 text-gray-500">No hay módulos sincronizados. Usa el botón "Sincronizar módulos".</td></tr>
                      ) : permisos.map(p => (
                        <tr key={p.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{p.description ?? <span className="italic text-gray-400">Sin descripción</span>}</td>
                          <td className="py-4 px-6">
                            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 gap-1">
                              <Lock className="w-3 h-3" />Sistema
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Dialog crear/editar rol ── */}
        <Dialog open={showModal} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
              <DialogDescription>
                {editingRole ? 'Modifica la información del rol y sus permisos.' : 'Completa la información y selecciona al menos un permiso.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role-name">Nombre del rol *</Label>
                <Input id="role-name" value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Vendedor, Gerente, Supervisor" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-desc">Descripción</Label>
                <Input id="role-desc" value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opcional" />
              </div>
              <div className="space-y-3">
                <Label>Permisos de módulos *</Label>
                {loadingPerms ? (
                  <p className="text-sm text-gray-500">Cargando permisos...</p>
                ) : permisos.length === 0 ? (
                  <p className="text-sm text-amber-600">No hay módulos sincronizados. Ve a la pestaña "Módulos del sistema" y sincroniza primero.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {permisos.map(permiso => {
                      const checked = formData.permissions.includes(permiso.id);
                      return (
                        <label key={permiso.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${checked ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/40'}`}>
                          <input type="checkbox" checked={checked} onChange={() => togglePermission(permiso.id)} className="w-4 h-4 accent-blue-600" />
                          <span className="text-sm text-gray-900">{permiso.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {/* Error de validación de permisos */}
                {permError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />{permError}
                  </p>
                )}
                <p className="text-sm text-gray-500">{formData.permissions.length} módulo(s) seleccionado(s)</p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {editingRole ? 'Actualizar' : 'Crear'} Rol
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Modal detalle ── */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Rol</DialogTitle>
              <DialogDescription>Información completa del rol y sus permisos asignados.</DialogDescription>
            </DialogHeader>
            {viewingRole && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-gray-500 text-xs uppercase">Nombre</Label><p className="text-gray-900 font-semibold mt-1">{viewingRole.name}</p></div>
                  <div><Label className="text-gray-500 text-xs uppercase">Descripción</Label><p className="text-gray-700 mt-1">{viewingRole.description || '—'}</p></div>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs uppercase mb-3 block">
                    Permisos asignados ({viewingRole.permissionsData?.length ?? viewingRole.permissionCount})
                  </Label>
                  {!viewingRole.permissionsData ? (
                    <p className="text-sm text-gray-500">Cargando...</p>
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

        {/* ── Confirm delete ── */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-900">
                <AlertTriangle className="w-5 h-5 text-amber-500" />Confirmar Eliminación
              </AlertDialogTitle>
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
