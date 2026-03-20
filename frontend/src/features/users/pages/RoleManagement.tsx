import React, { useEffect, useState } from 'react';
import * as permisosService from '@/services/permisosService';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Switch } from '@/shared/components/ui/switch';
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
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from 'sonner@2.0.3';
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon,
  ShieldIcon,
  UsersIcon,
  EyeIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboard,
  PackageIcon,
  UserIcon,
  Building2Icon,
  TruckIcon,
  FactoryIcon,
  FolderIcon,
  TagIcon,
  ShoppingCartIcon
} from 'lucide-react';
import * as rolesService from '@/services/rolesService';

const availableModules = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'employees', name: 'Empleados', icon: UsersIcon },
  { id: 'roles', name: 'Roles', icon: ShieldIcon },
  { id: 'catalog', name: 'Catálogo de Productos', icon: PackageIcon },
  { id: 'product-categories', name: 'Categorías de Productos', icon: TagIcon },
  { id: 'clients', name: 'Clientes', icon: UserIcon },
  { id: 'suppliers', name: 'Proveedores', icon: Building2Icon },
  { id: 'supplies', name: 'Insumos', icon: TruckIcon },
  { id: 'purchases', name: 'Compras', icon: ShoppingCartIcon },
  { id: 'sales', name: 'Ventas', icon: ShoppingCartIcon }
];

export function RoleManagement() {
  const [roles, setRoles] = useState([
    { 
      id: 1, 
      name: 'Administrador', 
      permissions: availableModules.map(m => m.id),
      isActive: true,
      permissionCount: availableModules.length
    },
    { 
      id: 2, 
      name: 'Vendedor', 
      permissions: ['dashboard', 'catalog', 'clients', 'sales'],
      isActive: true,
      permissionCount: 4
    },
    { 
      id: 3, 
      name: 'Inventario', 
      permissions: ['dashboard', 'catalog', 'supplies', 'purchases'],
      isActive: true,
      permissionCount: 4
    },
    { 
      id: 4, 
      name: 'Supervisor', 
      permissions: ['dashboard', 'employees', 'production'],
      isActive: false,
      permissionCount: 3
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [permisos, setPermisos] = useState<Array<{ id: number; name: string }>>([]);const [loadingPermisos, setLoadingPermisos] = useState(false);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    name: '',
    permissions: [],
    description: ''
  });

  useEffect(() => {
    let mounted = true;
    rolesService
      .getRoles()
      .then((data) => {
        if (!mounted) return;
        setRoles(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            permissions: [],
            isActive: true,
            permissionCount: 0,
            description: r.description || '',
          }))
        );
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Error al cargar roles');
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    // Cargar roles Y permisos disponibles en paralelo
    Promise.all([
        rolesService.getRoles(),
        permisosService.getPermisos()   // ← agrega esto
    ]).then(([rolesData, permisosData]) => {
        if (!mounted) return;
        setRoles(
            rolesData.map((r) => ({
                id: r.id,
                name: r.name,
                permissions: [],
                isActive: true,
                permissionCount: 0,
                description: r.description || '',
            }))
        );
        setPermisos(permisosData.map((p) => ({ id: p.id, name: p.name })));
    }).catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Error al cargar datos');
    });

    return () => { mounted = false; };
}, []);

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.name.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
  }

  const payload = { name: formData.name, description: formData.description || null };

  try {
      let roleId;

      if (editingRole) {
          const resp = await rolesService.updateRole(editingRole.id, payload);
          roleId = editingRole.id;
          setRoles(roles.map((role) =>
              role.id === editingRole.id
                  ? { ...role, name: resp.role.name, description: resp.role.description || '' }
                  : role
          ));
          toast.success(resp.message || 'Rol actualizado exitosamente');
      } else {
          const resp = await rolesService.createRole(payload);
          roleId = resp.role.id;
          setRoles([...roles, {
              id: resp.role.id,
              name: resp.role.name,
              description: resp.role.description || '',
              permissions: [],
              permissionCount: 0,
              isActive: true,
          }]);
          toast.success(resp.message || 'Rol creado exitosamente');
      }

      // Guardar permisos seleccionados
      await rolesService.setRolPermisos(roleId, formData.permissions);

      // Actualizar el conteo de permisos en la tabla
      setRoles(prev => prev.map(r =>
          r.id === roleId
              ? { ...r, permissions: formData.permissions, permissionCount: formData.permissions.length }
              : r
      ));

      resetForm();
  } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
  }
};

  const resetForm = () => {
    setFormData({ name: '', permissions: [], description: '' });
    setEditingRole(null);
    setShowModal(false);
  };

  const handleEdit = async (role) => {
    setFormData({
        name: role.name,
        permissions: [],
        description: role.description || ''
    });
    setEditingRole(role);
    setLoadingPermisos(true);
    setShowModal(true);

    try {
        const permsDelRol = await rolesService.getRolPermisos(role.id);
        setFormData(prev => ({
            ...prev,
            permissions: permsDelRol.map((p) => p.id)
        }));
    } catch {
        toast.error('No se pudieron cargar los permisos del rol');
    } finally {
        setLoadingPermisos(false);
    }
};

  const handleViewDetail = (role) => {
    setViewingRole(role);
    setShowDetailModal(true);
  };

  const handleDelete = (role) => {
    setRoleToDelete(role);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      rolesService
        .deleteRole(roleToDelete.id)
        .then((resp) => {
          setRoles(roles.filter((role) => role.id !== roleToDelete.id));
          toast.success(resp.message || 'Rol eliminado exitosamente');
          setShowDeleteDialog(false);
          setRoleToDelete(null);
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al eliminar rol'));
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setRoleToDelete(null);
  };

  const toggleStatus = (roleId) => {
    setRoles(roles.map(role => 
      role.id === roleId ? { ...role, isActive: !role.isActive } : role
    ));
  };

  const togglePermission = (moduleId) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(moduleId)
        ? formData.permissions.filter(id => id !== moduleId)
        : [...formData.permissions, moduleId]
    });
  };

  // Filtrado
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRoles = filteredRoles.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Roles</h1>
            <p className="text-gray-600">Administra los roles y permisos del sistema</p>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              {/* roles button create rol */}
              <Button className="bg-blue-600 hover:bg-blue-900" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Rol
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
                </DialogTitle>
                <DialogDescription>
                  {editingRole ? 'Modifica la información del rol y sus permisos.' : 'Completa la información para crear un nuevo rol en el sistema.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre del Rol */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del rol *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Vendedor, Gerente, Supervisor"
                    required
                  />
                </div>

                {/* Descripción (persistida en backend) */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>

                {/* Seleccionar Permisos */}
                <div className="space-y-3">
                  <Label>Seleccionar permisos (módulos) *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {loadingPermisos ? (
                          <p className="text-sm text-gray-500 col-span-2">Cargando permisos...</p>
                      ) : permisos.length === 0 ? (
                          <p className="text-sm text-gray-500 col-span-2">
                              No hay permisos disponibles. Crea permisos primero en Gestión de Permisos.
                          </p>
                      ) : (
                          permisos.map((permiso) => (
                            <Card
                                key={permiso.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                    formData.permissions.includes(permiso.id)
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'border-gray-200'
                                }`}
                            >
                                <div className="p-4 flex items-center space-x-3">
                                    <Checkbox
                                        checked={formData.permissions.includes(permiso.id)}
                                        onCheckedChange={() => togglePermission(permiso.id)}
                                    />
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => togglePermission(permiso.id)}
                                    >
                                        <p className="text-sm text-gray-900">{permiso.name}</p>
                                    </div>
                                </div>
                            </Card>
                          ))
                      )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formData.permissions.length} módulo(s) seleccionado(s)
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingRole ? 'Actualizar' : 'Crear'} Rol
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar roles por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-600">
              {filteredRoles.length} rol(es) encontrado(s)
            </span>
          </div>
        </Card>

        {/* Tabla de Roles */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Nombre Rol</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRoles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron roles
                    </td>
                  </tr>
                ) : (
                  currentRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {/* nombre de rol y cantidad de permisos */}
                        <div className="flex items-center space-x-2">
                          <ShieldIcon className="w-5 h-5 text-blue-600 px-6 py-4 text-center" />
                          <span className="text-sm text-gray-900">{role.name}<br/><Badge variant="secondary">{role.permissionCount}</Badge></span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(role)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-900"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver detalle</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(role)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-900"
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar rol</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(role)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-900"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar rol</p></TooltipContent>
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
          {filteredRoles.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-500">•</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page ? "bg-blue-600 hover:bg-blue-700 min-w-[32px]" : "min-w-[32px]"}
                      >
                        {currentPage === page ? page : '•'}
                      </Button>
                    )
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalle */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Rol</DialogTitle>
              <DialogDescription>
                Información completa del rol y sus permisos asignados.
              </DialogDescription>
            </DialogHeader>
            {viewingRole && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Nombre del rol</Label>
                    <p className="text-gray-900 mt-1">{viewingRole.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Estado</Label>
                    <p className="mt-1">
                      <Badge variant={viewingRole.isActive ? "default" : "secondary"}>
                        {viewingRole.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600 mb-3 block">
                    Permisos asignados ({viewingRole.permissionCount})
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableModules
                      .filter(module => viewingRole.permissions.includes(module.id))
                      .map(module => {
                        const IconComponent = module.icon;
                        return (
                          <div key={module.id} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <IconComponent className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">{module.name}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmación de Eliminación */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
                <AlertTriangleIcon className="w-5 h-5" />
                Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>¿Estás seguro de que deseas eliminar este rol?</p>
                {roleToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Rol: </span>
                        <span className="text-sm text-gray-900">{roleToDelete.name}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Permisos: </span>
                        <span className="text-sm text-gray-900">{roleToDelete.permissionCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-blue-600 hover:bg-blue-700"
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
