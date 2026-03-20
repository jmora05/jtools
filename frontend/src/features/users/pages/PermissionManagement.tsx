import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
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
import { toast } from 'sonner@2.0.3';
import { PlusIcon, EditIcon, TrashIcon, ShieldIcon, AlertTriangleIcon } from 'lucide-react';
import * as permisosService from '@/services/permisosService';

export function PermissionManagement() {
  const [permisos, setPermisos] = useState<Array<{ id: number; name: string; description?: string }>>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPermiso, setEditingPermiso] = useState<any>(null);
  const [permisoToDelete, setPermisoToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    let mounted = true;
    permisosService
      .getPermisos()
      .then((data) => {
        if (!mounted) return;
        setPermisos(data.map((p) => ({ id: p.id, name: p.name, description: p.description || '' })));
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al cargar permisos'));
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingPermiso(null);
    setShowModal(false);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre del permiso es obligatorio');
      return;
    }

    const payload = { name: formData.name, description: formData.description || null };

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

  const handleEdit = (permiso: any) => {
    setEditingPermiso(permiso);
    setFormData({ name: permiso.name || '', description: permiso.description || '' });
    setShowModal(true);
  };

  const handleDelete = (permiso: any) => {
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

  const filtered = permisos.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Gestión de Permisos</h1>
          <p className="text-gray-600">Administra los permisos del sistema</p>
        </div>

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
                {editingPermiso ? 'Modifica la información del permiso.' : 'Completa el formulario para crear un permiso.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del permiso *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opcional"
                />
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

      <Card className="shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar permisos por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
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
                <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(p)}
                          className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-900"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(p)}
                          className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-900"
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
              ¿Estás seguro de que deseas eliminar este permiso?
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

