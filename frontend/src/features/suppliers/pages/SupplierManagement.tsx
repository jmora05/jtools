import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  PlusIcon, 
  EyeIcon, 
  EditIcon, 
  TrashIcon,
  BuildingIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  Building2Icon
} from 'lucide-react';

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      type: 'empresa',
      name: 'AutoPartes Central S.A.S.',
      documentType: 'NIT',
      documentNumber: '900123456-7',
      legalRepresentative: 'Juan Pérez',
      contact: 'Juan Pérez',
      email: 'ventas@autopartescentral.com',
      phone: '+57 300 123 4567',
      city: 'Medellín',
      address: 'Calle 45 #23-67',
      isActive: true
    },
    {
      id: 2,
      type: 'empresa',
      name: 'Repuestos del Norte Ltda.',
      documentType: 'NIT',
      documentNumber: '800987654-3',
      legalRepresentative: 'María González',
      contact: 'María González',
      email: 'contacto@repuestosnorte.com',
      phone: '+57 301 987 6543',
      city: 'Bogotá',
      address: 'Carrera 70 #45-23',
      isActive: true
    },
    {
      id: 3,
      type: 'persona',
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      name: 'Carlos Rodríguez',
      documentType: 'Cédula',
      documentNumber: '43567890',
      contact: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@gmail.com',
      phone: '+57 302 456 7890',
      city: 'Cali',
      address: 'Avenida 6 Norte #23-45',
      isActive: true
    },
    {
      id: 4,
      type: 'empresa',
      name: 'Suministros Automotrices S.A.',
      documentType: 'NIT',
      documentNumber: '890456789-2',
      legalRepresentative: 'Ana Martínez',
      contact: 'Ana Martínez',
      email: 'ventas@suministrosautomotrices.com',
      phone: '+57 303 234 5678',
      city: 'Medellín',
      address: 'Calle 52 #34-12',
      isActive: false
    },
    {
      id: 5,
      type: 'empresa',
      name: 'Comercializadora Global Parts',
      documentType: 'NIT',
      documentNumber: '900567890-1',
      legalRepresentative: 'Luis Hernández',
      contact: 'Luis Hernández',
      email: 'comercial@globalparts.com',
      phone: '+57 304 345 6789',
      city: 'Barranquilla',
      address: 'Carrera 45 #67-89',
      isActive: true
    },
    {
      id: 6,
      type: 'persona',
      firstName: 'Patricia',
      lastName: 'López',
      name: 'Patricia López',
      documentType: 'Cédula',
      documentNumber: '52678901',
      contact: 'Patricia López',
      email: 'patricia.lopez@hotmail.com',
      phone: '+57 305 456 7890',
      city: 'Medellín',
      address: 'Calle 67 #23-89',
      isActive: true
    },
    {
      id: 7,
      type: 'empresa',
      name: 'Proveedora Automotriz del Valle',
      documentType: 'NIT',
      documentNumber: '900789012-4',
      legalRepresentative: 'Roberto Sánchez',
      contact: 'Roberto Sánchez',
      email: 'ventas@automotrizvalle.com',
      phone: '+57 306 567 8901',
      city: 'Cali',
      address: 'Carrera 80 #45-12',
      isActive: true
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Estado para el tipo de proveedor
  const [supplierType, setSupplierType] = useState(null); // null, 'persona', 'empresa'

  const [formData, setFormData] = useState({
    type: '',
    // Campos para persona natural
    firstName: '',
    lastName: '',
    // Campos para empresa
    name: '',
    legalRepresentative: '',
    // Campos comunes
    documentType: 'Cédula',
    documentNumber: '',
    contact: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    isActive: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSupplier) {
      setSuppliers(suppliers.map(sup => 
        sup.id === editingSupplier.id 
          ? { ...formData, id: editingSupplier.id }
          : sup
      ));
      toast.success('Proveedor actualizado exitosamente');
    } else {
      setSuppliers([...suppliers, { ...formData, id: Date.now() }]);
      toast.success('Proveedor creado exitosamente');
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: '',
      firstName: '',
      lastName: '',
      name: '',
      legalRepresentative: '',
      documentType: 'Cédula',
      documentNumber: '',
      contact: '',
      email: '',
      phone: '',
      city: '',
      address: '',
      isActive: true
    });
    setEditingSupplier(null);
    setShowModal(false);
    setSupplierType(null);
  };

  const handleEdit = (supplier) => {
    setFormData({
      type: supplier.type,
      firstName: supplier.firstName || '',
      lastName: supplier.lastName || '',
      name: supplier.name || '',
      legalRepresentative: supplier.legalRepresentative || '',
      documentType: supplier.documentType,
      documentNumber: supplier.documentNumber,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      city: supplier.city,
      address: supplier.address,
      isActive: supplier.isActive
    });
    setEditingSupplier(supplier);
    setShowModal(true);
    setSupplierType(supplier.type);
  };

  const handleViewDetail = (supplier) => {
    setViewingSupplier(supplier);
    setShowDetailModal(true);
  };

  const handleDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (supplierToDelete) {
      setSuppliers(suppliers.filter(sup => sup.id !== supplierToDelete.id));
      toast.success('Proveedor eliminado exitosamente');
      setShowDeleteDialog(false);
      setSupplierToDelete(null);
    }
  };

  const toggleStatus = (supplierId) => {
    setSuppliers(suppliers.map(sup => 
      sup.id === supplierId ? { ...sup, isActive: !sup.isActive } : sup
    ));
  };

  // Filtrado
  const filteredSuppliers = suppliers.filter(sup => {
    return sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sup.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sup.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Paginación
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, endIndex);

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
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Proveedores</h1>
            <p className="text-gray-600">Administra los proveedores de la empresa</p>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
                </DialogTitle>
                <DialogDescription>
                  {editingSupplier ? 'Modifica la información del proveedor' : 'Completa el formulario para agregar un nuevo proveedor'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Proveedor */}
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de proveedor *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persona">Persona Natural</SelectItem>
                      <SelectItem value="empresa">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos para Persona Natural */}
                {formData.type === 'persona' && (
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
                )}

                {/* Campos para Empresa */}
                {formData.type === 'empresa' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la empresa *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ej: AutoPartes Central S.A.S."
                      required
                    />
                  </div>
                )}

                {/* Representante Legal */}
                {formData.type === 'empresa' && (
                  <div className="space-y-2">
                    <Label htmlFor="legalRepresentative">Representante Legal *</Label>
                    <Input
                      id="legalRepresentative"
                      value={formData.legalRepresentative}
                      onChange={(e) => setFormData({...formData, legalRepresentative: e.target.value})}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                )}

                {/* Tipo y Número de Documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Tipo de documento *</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) => setFormData({...formData, documentType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NIT">NIT</SelectItem>
                        <SelectItem value="Cédula">Cédula</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Número de documento *</Label>
                    <Input
                      id="documentNumber"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                      placeholder="900123456-7"
                      required
                    />
                  </div>
                </div>

                {/* Contacto y Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Persona de contacto *</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="ventas@proveedor.com"
                      required
                    />
                  </div>
                </div>

                {/* Teléfono y Ciudad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Medellín"
                      required
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Calle 45 #23-67"
                    required
                  />
                </div>

                {/* Estado */}
                  {editingSupplier && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                        />
                        <Label>Proveedor activo</Label>
                      </div>
                    </div>
                  )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
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
                placeholder="Buscar proveedores por nombre, contacto o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-600">
              {filteredSuppliers.length} proveedor(es)
            </span>
          </div>
        </Card>

        {/* Tabla de Proveedores */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-3 text-left text-xs text-blue-900 uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-3 text-left text-xs text-blue-900 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-3 text-center text-xs text-blue-900 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron proveedores
                    </td>
                  </tr>
                ) : (
                  currentSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <BuildingIcon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-900">{supplier.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{supplier.contact}</div>
                          <div className="text-xs text-gray-500">
                            {supplier.documentType} {supplier.documentNumber}
                          </div>
                        </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(supplier)}
                                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
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
                                onClick={() => handleEdit(supplier)}
                                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar proveedor</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(supplier)}
                                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar proveedor</p></TooltipContent>
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
          {filteredSuppliers.length > 0 && (
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
              <DialogTitle>Detalles del Proveedor</DialogTitle>
              <DialogDescription>
                Información completa del proveedor seleccionado
              </DialogDescription>
            </DialogHeader>
            {viewingSupplier && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Nombre de la empresa</Label>
                    <p className="text-gray-900 mt-1">{viewingSupplier.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Documento</Label>
                    <p className="text-gray-900 mt-1">
                      {viewingSupplier.documentType} {viewingSupplier.documentNumber}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Contacto</Label>
                    <p className="text-gray-900 mt-1">{viewingSupplier.contact}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="text-gray-900 mt-1">{viewingSupplier.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Teléfono</Label>
                    <p className="text-gray-900 mt-1">{viewingSupplier.phone}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Ciudad</Label>
                    <p className="text-gray-900 mt-1">{viewingSupplier.city}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600">Dirección</Label>
                    <p className="text-gray-900 mt-1">{viewingSupplier.address}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Estado</Label>
                    <p className="mt-1">
                      <Badge variant={viewingSupplier.isActive ? "default" : "secondary"}>
                        {viewingSupplier.isActive ? 'Activo' : 'Inactivo'}
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
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangleIcon className="w-5 h-5" />
                Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>¿Estás seguro de que deseas eliminar este proveedor?</p>
                {supplierToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Empresa: </span>
                        <span className="text-sm text-gray-900">{supplierToDelete.name}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Contacto: </span>
                        <span className="text-sm text-gray-900">{supplierToDelete.contact}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Email: </span>
                        <span className="text-sm text-gray-900">{supplierToDelete.email}</span>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-red-600">Esta acción no se puede deshacer.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar Proveedor
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}