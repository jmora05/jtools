import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
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
import { toast } from 'sonner';
import { PlusIcon, EditIcon, TrashIcon, ShieldIcon, AlertTriangleIcon, RefreshCwIcon, LockIcon } from 'lucide-react';
import * as permisosService from '@/features/permisos/services/permisosService';

export function PermissionManagement() {
  const [permisos, setPermisos] = useState<permisosService.Permiso[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPermiso, setEditingPermiso] = useState<permisosService.Permiso | null>(null);
  const [permisoToDelete, setPermisoToDelete] = useState<permisosService.Permiso | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');

  const [formData, setFormData] = useState({ name: '', description: '' });

  const loadPermisos = () => {
    permisosService
      .getPermisos()
      .then((data) => setPermisos(data))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al cargar permisos'));
  };

  useEffect(() => {
    loadPermisos();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingPermiso(null);
    setShowModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() && !editingPermiso?.isSystem) {
      toast.error('El nombre del permiso es obligatorio');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || null,
    };

    if (editingPermiso) {
      permisosService
        .updatePermiso(editingPermiso.id, payload)
        .then((resp) => {
          setPermisos(permisos.map((p) => (p.id === editingPermiso.id ? resp.permiso : p)));
          toast.success(resp.message || 'Permiso actualizado');
          resetForm();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al actualizar permiso'));
    } else {
      permisosService
        .createPermiso(payload)
        .then((resp) => {
          setPermisos([...permisos, resp.permiso]);
          toast.success(resp.message || 'Permiso creado');
          resetForm();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al crear permiso'));
    }
  };

  const handleEdit = (permiso: permisosService.Permiso) => {
    setEditingPermiso(permiso);
    setFormData({ name: permiso.name || '', description: permiso.description || '' });
    setShowModal(true);
  };

  const handleDelete = (permiso: permisosService.Permiso) => {
    if (permiso.isSystem) {
      toast.error('Los permisos del sistema no se pueden eliminar');
      return;
    }
    setPermisoToDelete(permiso);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!permisoToDelete) return;
    permisosService
      .deletePermiso(permisoToDelete.id)
      .then((resp) => {
        setPermisos(permisos.filter((p) => p.id !== permisoToDelete.id));
        toast.success(resp.message || 'Permiso eliminado');
        setShowDeleteDialog(false);
        setPermisoToDelete(null);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al eliminar permiso'));
  };

  const handleSyncModules = () => {
    setSyncing(true);
    permisosService
      .syncSystemModules()
      .then((resp) => {
        toast.success(
          resp.created.length > 0
            ? `Sincronizado: ${resp.created.length} nuevo(s) permiso(s) de módulo creado(s)`
            : 'Todos los módulos ya están sincronizados'
        );
        loadPermisos();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al sincronizar'))
      .finally(() => setSyncing(false));
  };

  const filtered = permisos.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType =
      filterType === 'all' ||
      (filterType === 'system' && p.isSystem) ||
      (filterType === 'custom' && !p.isSystem);
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Gestión de Permisos</h1>
          <p className="text-gray-600">Administra los permisos del sistema</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSyncModules}
            disabled={syncing}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar Módulos
          </Button>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Permiso
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingPermiso ? 'Editar Permiso' : 'Crear Nuevo Permiso'}</DialogTitle>
                <DialogDescription>
                  {editingPermiso?.isSystem
                    ? 'Los permisos del sistema solo permiten editar la descripción.'
                    : editingPermiso
                    ? 'Modifica la información del permiso.'
                    : 'Completa el formulario para crear un permiso personalizado.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del permiso *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!!editingPermiso?.isSystem}
                    required={!editingPermiso?.isSystem}
                    className={
                      !editingPermiso?.isSystem && formData.name && (formData.name.trim().length < 2 || formData.name.trim().length > 50)
                        ? 'border-red-400'
                        : ''
                    }
                    maxLength={50}
                  />
                  {editingPermiso?.isSystem ? (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <LockIcon className="w-3 h-3" /> El nombre de los permisos del sistema no se puede modificar.
                    </p>
                  ) : formData.name && formData.name.trim().length < 2 ? (
                    <p className="text-xs text-red-500">Mínimo 2 caracteres</p>
                  ) : formData.name && formData.name.trim().length > 50 ? (
                    <p className="text-xs text-red-500">Máximo 50 caracteres</p>
                  ) : (
                    <p className="text-xs text-gray-400 text-right">{formData.name.length}/50</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción <span className="text-gray-400 text-xs">(opcional)</span></Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe para qué sirve este permiso"
                    maxLength={200}
                    className={formData.description.length > 200 ? 'border-red-400' : ''}
                  />
                  <p className={`text-xs text-right ${formData.description.length > 180 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {formData.description.length}/200
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingPermiso ? 'Actualizar' : 'Crear'} Permiso
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <Input
              type="text"
              placeholder="Buscar permisos por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'system', 'custom'] as const).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
                className={filterType === type ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {type === 'all' ? 'Todos' : type === 'system' ? 'Sistema' : 'Personalizados'}
              </Button>
            ))}
          </div>
          <span className="text-sm text-gray-600">{filtered.length} permiso(s)</span>
        </div>
      </Card>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Permiso</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron permisos
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <ShieldIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.description || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {p.isSystem ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          <LockIcon className="w-3 h-3 mr-1" />
                          Sistema
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Personalizado</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(p)}
                          className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(p)}
                          disabled={p.isSystem}
                          className={p.isSystem ? 'opacity-30 cursor-not-allowed' : 'text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50'}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-900">
              <AlertTriangleIcon className="w-5 h-5" />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el permiso "{permisoToDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-blue-600 hover:bg-blue-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
