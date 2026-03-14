import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '../../../shared/components/ui/switch';
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
import { Badge } from '@/shared/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from 'sonner@2.0.3';
import { 
  PlusIcon, 
  EyeIcon, 
  EditIcon, 
  TrashIcon,
  UserIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState([
    {
      id: 1,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@jrepuestos.com',
      phone: '+57 300 123 4567',
      userType: 'Administrador',
      isActive: true
    },
    {
      id: 2,
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@jrepuestos.com',
      phone: '+57 301 987 6543',
      userType: 'Administrador',
      isActive: true
    },
    {
      id: 3,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@jrepuestos.com',
      phone: '+57 302 456 7890',
      userType: 'Asistente',
      isActive: true
    },
    {
      id: 4,
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@jrepuestos.com',
      phone: '+57 303 234 5678',
      userType: 'Asistente',
      isActive: true
    },
    {
      id: 5,
      firstName: 'Luis',
      lastName: 'Hernández',
      email: 'luis.hernandez@jrepuestos.com',
      phone: '+57 304 345 6789',
      userType: 'Asistente',
      isActive: false
    },
    {
      id: 6,
      firstName: 'Patricia',
      lastName: 'López',
      email: 'patricia.lopez@jrepuestos.com',
      phone: '+57 305 456 7890',
      userType: 'Administrador',
      isActive: true
    },
    {
      id: 7,
      firstName: 'Roberto',
      lastName: 'Sánchez',
      email: 'roberto.sanchez@jrepuestos.com',
      phone: '+57 306 567 8901',
      userType: 'Asistente',
      isActive: true
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: 'Asistente',
    password: '',
    isActive: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingUser) {
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...formData, id: editingUser.id }
          : user
      ));
      toast.success('Usuario actualizado exitosamente');
    } else {
      // Cuando se crea un nuevo usuario, usamos el tipo de usuario seleccionado
      const newUser = {
        ...formData,
        firstName: 'Usuario',
        lastName: 'Nuevo',
        phone: 'N/A',
        isActive: true,
        id: Date.now()
      };
      setUsers([...users, newUser]);
      toast.success('Usuario creado exitosamente');
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      userType: 'Asistente',
      password: '',
      isActive: true
    });
    setEditingUser(null);
    setShowModal(false);
  };

  const handleEdit = (user) => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      password: '',
      isActive: user.isActive
    });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleViewDetail = (user) => {
    setViewingUser(user);
    setShowDetailModal(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(user => user.id !== userToDelete.id));
      toast.success('Usuario eliminado exitosamente');
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const toggleStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  // Filtrado
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

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
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra los usuarios del sistema</p>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Modifica la información del usuario.' : 'Completa el formulario para crear un nuevo usuario en el sistema.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {editingUser ? (
                  // Formulario completo para edición
                  <>
                    {/* Tipo de Usuario */}
                    <div className="space-y-2">
                      <Label htmlFor="userType">Tipo de usuario *</Label>
                      <Select
                        value={formData.userType}
                        onValueChange={(value) => setFormData({...formData, userType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrador">Administrador</SelectItem>
                          <SelectItem value="Asistente">Asistente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nombre y Apellido */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombre *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          placeholder="Juan"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellido *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          placeholder="Pérez"
                          required
                        />
                      </div>
                    </div>

                    {/* Email y Teléfono */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="usuario@jrepuestos.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="+57 300 123 4567"
                          required
                        />
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                      />
                      <Label>Usuario activo</Label>
                    </div>
                  </>
                ) : (
                  // Formulario simplificado para creación (solo correo y contraseña)
                  <>
                    {/* Tipo de Usuario */}
                    <div className="space-y-2">
                      <Label htmlFor="userType">Tipo de usuario *</Label>
                      <Select
                        value={formData.userType}
                        onValueChange={(value) => setFormData({...formData, userType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrador">Administrador</SelectItem>
                          <SelectItem value="Asistente">Asistente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Correo electrónico */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="usuario@jrepuestos.com"
                        required
                      />
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingUser ? 'Actualizar' : 'Crear'} Usuario
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
                placeholder="Buscar usuarios por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-600">
              {filteredUsers.length} usuario(s)
            </span>
          </div>
        </Card>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">contacto</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-900">
                            {user.firstName} {user.lastName}<br/><Badge variant={user.userType === 'Administrador' ? 'default' : 'secondary'}>
                          {user.userType}
                        </Badge>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}<br/>{user.phone}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(user)}
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
                                onClick={() => handleEdit(user)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-900"
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar usuario</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-900"
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
              <DialogTitle>Detalles del Usuario</DialogTitle>
              <DialogDescription>
                Información completa del usuario seleccionado.
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Nombre completo</Label>
                    <p className="text-gray-900 mt-1">{viewingUser.firstName} {viewingUser.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Tipo de usuario</Label>
                    <p className="mt-1">
                      <Badge variant={viewingUser.userType === 'Administrador' ? 'default' : 'secondary'}>
                        {viewingUser.userType}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="text-gray-900 mt-1">{viewingUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Teléfono</Label>
                    <p className="text-gray-900 mt-1">{viewingUser.phone}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Estado</Label>
                    <p className="mt-1">
                      <Badge variant={viewingUser.isActive ? "default" : "secondary"}>
                        {viewingUser.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </p>
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
              <AlertDialogTitle className="flex items-center gap-2 text-blue-900">
                <AlertTriangleIcon className="w-5 h-5" />
                Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>¿Estás seguro de que deseas eliminar este usuario?</p>
                {userToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Usuario: </span>
                        <span className="text-sm text-gray-900">
                          {userToDelete.firstName} {userToDelete.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Email: </span>
                        <span className="text-sm text-gray-900">{userToDelete.email}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Tipo: </span>
                        <span className="text-sm text-gray-900">{userToDelete.userType}</span>
                      </div>
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Eliminar Usuario
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}