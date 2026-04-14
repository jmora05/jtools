import { useEffect, useState } from 'react';
import { Button }      from '@/shared/components/ui/button';
import { Input }       from '@/shared/components/ui/input';
import { Label }       from '@/shared/components/ui/label';
import { Badge }       from '@/shared/components/ui/badge';
import { Switch }      from '@/shared/components/ui/switch';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { toast }       from 'sonner';
import { Plus, Edit, Trash2, Shield, AlertTriangle, RefreshCw, Lock, Search } from 'lucide-react';
import * as permisosService from '@/features/permisos/services/permisosService';

// ─── Componente ───────────────────────────────────────────────────────────────
export function PermissionManagement() {

  // ── Estado principal ────────────────────────────────────────────────────────
  const [permisos, setPermisos]               = useState<permisosService.Permiso[]>([]);
  const [showModal, setShowModal]             = useState(false);
  const [editingPermiso, setEditingPermiso]   = useState<permisosService.Permiso | null>(null);
  const [permisoToDelete, setPermisoToDelete] = useState<permisosService.Permiso | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [syncing, setSyncing]                 = useState(false);
  const [filterType, setFilterType]           = useState<'all' | 'system' | 'custom'>('all');
  const [currentPage, setCurrentPage]         = useState(1);
  const itemsPerPage = 5;
  const [formData, setFormData]               = useState({ name: '', description: '' });
  const [togglingIds, setTogglingIds]         = useState<Set<number>>(new Set());

  // ── Carga inicial ───────────────────────────────────────────────────────────
  const loadPermisos = () => {
    permisosService.getPermisos()
      .then(setPermisos)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al cargar permisos'));
  };

  useEffect(() => { loadPermisos(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType]);

  // ── Formulario ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingPermiso(null);
    setShowModal(false);
  };

  const openCreate = () => {
    setEditingPermiso(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (permiso: permisosService.Permiso) => {
    setEditingPermiso(permiso);
    setFormData({ name: permiso.name ?? '', description: permiso.description ?? '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPermiso?.isSystem && !formData.name.trim()) {
      toast.error('El nombre del permiso es obligatorio');
      return;
    }
    const payload = { name: formData.name.trim(), description: formData.description.trim() || null };

    if (editingPermiso) {
      permisosService.updatePermiso(editingPermiso.id, payload)
        .then(resp => {
          setPermisos(prev => prev.map(p => p.id === editingPermiso.id ? resp.permiso : p));
          toast.success(resp.message || 'Permiso actualizado');
          resetForm();
        })
        .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al actualizar permiso'));
    } else {
      permisosService.createPermiso(payload)
        .then(resp => {
          setPermisos(prev => [...prev, resp.permiso]);
          toast.success(resp.message || 'Permiso creado');
          resetForm();
        })
        .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al crear permiso'));
    }
  };

  // ── Toggle activo/inactivo ─────────────────────────────────────────────────
  const toggleStatus = (permiso: permisosService.Permiso) => {
    if (permiso.isSystem) { toast.error('No se puede cambiar el estado de un permiso del sistema'); return; }
    setTogglingIds(prev => new Set(prev).add(permiso.id));
    permisosService.togglePermisoActivo(permiso.id)
      .then(resp => {
        setPermisos(prev => prev.map(p => p.id === permiso.id ? resp.permiso : p));
        toast.success(resp.message);
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al cambiar estado'))
      .finally(() => setTogglingIds(prev => { const s = new Set(prev); s.delete(permiso.id); return s; }));
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = (permiso: permisosService.Permiso) => {
    if (permiso.isSystem) { toast.error('Los permisos del sistema no se pueden eliminar'); return; }
    setPermisoToDelete(permiso);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!permisoToDelete) return;
    permisosService.deletePermiso(permisoToDelete.id)
      .then(resp => {
        setPermisos(prev => prev.filter(p => p.id !== permisoToDelete.id));
        toast.success(resp.message || 'Permiso eliminado');
        setShowDeleteDialog(false);
        setPermisoToDelete(null);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar permiso');
        setShowDeleteDialog(false);
        setPermisoToDelete(null);
      });
  };

  // ── Sincronizar módulos ────────────────────────────────────────────────────
  const handleSyncModules = () => {
    setSyncing(true);
    permisosService.syncSystemModules()
      .then(resp => {
        toast.success(
          resp.created.length > 0
            ? `Sincronizado: ${resp.created.length} nuevo(s) permiso(s) creado(s)`
            : 'Todos los módulos ya están sincronizados'
        );
        loadPermisos();
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al sincronizar'))
      .finally(() => setSyncing(false));
  };

  // ── Filtrado y paginación ──────────────────────────────────────────────────
  const filtered = permisos.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType =
      filterType === 'all' ||
      (filterType === 'system' && p.isSystem) ||
      (filterType === 'custom' && !p.isSystem);
    return matchSearch && matchType;
  });

  const totalPages      = Math.ceil(filtered.length / itemsPerPage);
  const currentPermisos = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Permisos</h1>
          <p className="text-blue-800">Administra los permisos del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón nuevo permiso — fuera del Dialog */}
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Permiso
          </Button>
        </div>
      </div>

      {/* ── Dialog crear/editar (controlado, sin DialogTrigger) ── */}
      <Dialog open={showModal} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingPermiso ? 'Editar Permiso' : 'Crear Nuevo Permiso'}</DialogTitle>
            <DialogDescription>
              {editingPermiso?.isSystem
                ? 'Los permisos del sistema solo permiten editar la descripción.'
                : editingPermiso ? 'Modifica la información del permiso.'
                : 'Completa el formulario para crear un permiso personalizado.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="perm-name">Nombre del permiso *</Label>
              <Input
                id="perm-name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!!editingPermiso?.isSystem}
                required={!editingPermiso?.isSystem}
                maxLength={50}
                className={
                  !editingPermiso?.isSystem && formData.name &&
                  (formData.name.trim().length < 2 || formData.name.trim().length > 50)
                    ? 'border-red-400' : ''
                }
              />
              {editingPermiso?.isSystem ? (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> El nombre no se puede modificar.
                </p>
              ) : formData.name && formData.name.trim().length < 2 ? (
                <p className="text-xs text-red-500">Mínimo 2 caracteres</p>
              ) : formData.name && formData.name.trim().length > 50 ? (
                <p className="text-xs text-red-500">Máximo 50 caracteres</p>
              ) : (
                <p className="text-xs text-gray-400 text-right">{formData.name.length}/50</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="perm-desc">
                Descripción <span className="text-gray-400 text-xs">(opcional)</span>
              </Label>
              <Input
                id="perm-desc"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe para qué sirve este permiso"
                maxLength={200}
                className={formData.description.length > 200 ? 'border-red-400' : ''}
              />
              <p className={`text-xs text-right ${formData.description.length > 180 ? 'text-orange-500' : 'text-gray-400'}`}>
                {formData.description.length}/200
              </p>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingPermiso ? 'Actualizar' : 'Crear'} Permiso
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Barra de filtros ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative w-full sm:flex-[3]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                placeholder="Buscar permisos por nombre..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as 'all' | 'system' | 'custom')}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-40"
            >
              <option value="all">Todos</option>
              <option value="system">Sistema</option>
              <option value="custom">Personalizados</option>
            </select>
            <span className="text-sm text-gray-500 whitespace-nowrap self-center">
              {filtered.length} permiso(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabla ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-900">
                <tr>
                  <th className="text-left py-4 px-6 text-black font-semibold">Permiso</th>
                  <th className="text-left py-4 px-6 text-black font-semibold">Descripción</th>
                  <th className="text-left py-4 px-6 text-black font-semibold">Tipo</th>
                  <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                  <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentPermisos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      No se encontraron permisos
                    </td>
                  </tr>
                ) : currentPermisos.map(p => {
                  const isInactive = p.isActive === false;
                  return (
                  <tr key={p.id} className={`border-b border-blue-100 transition-colors ${isInactive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'}`}>
                    {/* Nombre del permiso */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 shrink-0 ${isInactive ? 'text-gray-400' : 'text-blue-600'}`} />
                        <span className={`text-sm font-semibold ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>{p.name}</span>
                      </div>
                    </td>
                    {/* Descripción */}
                    <td className={`py-4 px-6 text-sm ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                      {p.description ?? <span className="italic">Sin descripción</span>}
                    </td>
                    {/* Tipo: Sistema o Personalizado */}
                    <td className="py-4 px-6">
                      {p.isSystem ? (
                        <Badge className={`gap-1 ${isInactive ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                          <Lock className="w-3 h-3" />Sistema
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className={isInactive ? 'text-gray-400' : ''}>Personalizado</Badge>
                      )}
                    </td>
                    {/* Estado activo/inactivo */}
                    <td className="py-4 px-6">
                      <Switch
                        checked={!isInactive}
                        onCheckedChange={() => toggleStatus(p)}
                        disabled={p.isSystem || togglingIds.has(p.id)}
                        className={p.isSystem ? 'opacity-40 cursor-not-allowed' : ''}
                      />
                    </td>
                    {/* Acciones */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => !isInactive && handleEdit(p)}
                          className={isInactive ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => !isInactive && !p.isSystem && handleDelete(p)}
                          disabled={p.isSystem}
                          className={
                            p.isSystem || isInactive
                              ? 'opacity-30 cursor-not-allowed border-gray-200 text-gray-400'
                              : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filtered.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-blue-100">
              <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  ‹ Anterior
                </Button>
                <Button variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  Siguiente ›
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── AlertDialog confirmar eliminación ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-900">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                ¿Estás seguro de que deseas eliminar el permiso{' '}
                <span className="font-semibold">"{permisoToDelete?.name}"</span>?
                Esta acción no se puede deshacer.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setPermisoToDelete(null); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-blue-600 hover:bg-blue-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}