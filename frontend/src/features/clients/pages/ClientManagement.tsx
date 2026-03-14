import React, { useState, useEffect } from 'react';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';
import {
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  UploadIcon,
  UserIcon,
  XIcon
} from 'lucide-react';

export function ClientManagement({ onNavigateToSales }) {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPurchaseSummary, setShowPurchaseSummary] = useState(false);
  const [selectedClientForSummary, setSelectedClientForSummary] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [clientToDelete, setClientToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    identification: '',
    documentType: 'Cédula',
    phone: '',
    email: '',
    address: '',
    city: '',
    clientType: 'Particular',
    isActive: true,
    photo: null,
    photoPreview: null
  });

  useEffect(() => {
    // Load demo clients
    setClients([
      {
        id: 1,
        name: 'Carlos Medina',
        identification: '12345678',
        documentType: 'Cédula',
        phone: '3001234567',
        email: 'carlos@email.com',
        address: 'Calle 50 #25-30, Medellín',
        clientType: 'Particular',
        totalPurchases: 850000,
        lastPurchase: '2024-01-15',
        isActive: true,
        purchaseCount: 8,
        averagePurchase: 106250,
        photoPreview: null
      },
      {
        id: 2,
        name: 'Auto Servicio López',
        identification: '900123456',
        documentType: 'NIT',
        phone: '3007654321',
        email: 'gerencia@autoserviciolopez.com',
        address: 'Carrera 70 #45-20, Medellín',
        clientType: 'Empresa',
        totalPurchases: 2500000,
        lastPurchase: '2024-01-18',
        isActive: true,
        purchaseCount: 15,
        averagePurchase: 166667,
        photoPreview: null
      },
      {
        id: 3,
        name: 'María González',
        identification: '87654321',
        documentType: 'Cédula',
        phone: '3009876543',
        email: 'maria.gonzalez@email.com',
        address: 'Avenida 80 #30-15, Medellín',
        clientType: 'Particular',
        totalPurchases: 320000,
        lastPurchase: '2024-01-10',
        isActive: false,
        purchaseCount: 4,
        averagePurchase: 80000,
        photoPreview: null
      },
      {
        id: 4,
        name: 'Taller El Repuesto',
        identification: '900987654',
        documentType: 'NIT',
        phone: '3005555555',
        email: 'contacto@tallerelrepuesto.com',
        address: 'Calle 10 Sur #25-40, Medellín',
        clientType: 'Empresa',
        totalPurchases: 1800000,
        lastPurchase: '2024-01-17',
        isActive: true,
        purchaseCount: 12,
        averagePurchase: 150000,
        photoPreview: null
      },
      {
        id: 5,
        name: 'Roberto Sánchez',
        identification: '45678912',
        documentType: 'Cédula',
        phone: '3012345678',
        email: 'roberto.sanchez@email.com',
        address: 'Carrera 65 #23-45, Medellín',
        clientType: 'Particular',
        totalPurchases: 450000,
        lastPurchase: '2024-01-12',
        isActive: true,
        purchaseCount: 5,
        averagePurchase: 90000,
        photoPreview: null
      },
      {
        id: 6,
        name: 'Laura Fernández',
        identification: '98765432',
        documentType: 'Cédula',
        phone: '3023456789',
        email: 'laura.fernandez@email.com',
        address: 'Calle 34 #56-78, Medellín',
        clientType: 'Particular',
        totalPurchases: 680000,
        lastPurchase: '2024-01-09',
        isActive: true,
        purchaseCount: 7,
        averagePurchase: 97143,
        photoPreview: null
      },
      {
        id: 7,
        name: 'Repuestos Medellín S.A.S',
        identification: '900555666',
        documentType: 'NIT',
        phone: '3034567890',
        email: 'ventas@repuestosmed.com',
        address: 'Avenida 33 #12-90, Medellín',
        clientType: 'Empresa',
        totalPurchases: 3200000,
        lastPurchase: '2024-01-16',
        isActive: true,
        purchaseCount: 20,
        averagePurchase: 160000,
        photoPreview: null
      }
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Construir el nombre completo basado en el tipo de cliente
    const fullName = formData.clientType === 'Particular' 
      ? `${formData.firstName} ${formData.lastName}`.trim()
      : formData.businessName;
    
    const clientData = {
      ...formData,
      name: fullName,
      totalPurchases: editingClient?.totalPurchases || 0,
      lastPurchase: editingClient?.lastPurchase || null
    };

    if (editingClient) {
      setClients(clients.map(client => 
        client.id === editingClient.id 
          ? { ...clientData, id: editingClient.id }
          : client
      ));
      toast.success('Cliente actualizado exitosamente');
    } else {
      setClients([...clients, { ...clientData, id: Date.now() }]);
      toast.success('Cliente creado exitosamente');
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      businessName: '',
      identification: '',
      documentType: 'Cédula',
      phone: '',
      email: '',
      address: '',
      city: '',
      clientType: 'Particular',
      isActive: true,
      photo: null,
      photoPreview: null
    });
    setEditingClient(null);
    setShowModal(false);
  };

  const handleEdit = (client) => {
    // Separar el nombre si es Particular
    let firstName = '';
    let lastName = '';
    let businessName = '';
    
    if (client.clientType === 'Particular' && client.name) {
      const nameParts = client.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    } else if (client.clientType === 'Empresa') {
      businessName = client.name || '';
    }
    
    setFormData({
      firstName,
      lastName,
      businessName,
      identification: client.identification,
      documentType: client.documentType || 'Cédula',
      phone: client.phone,
      email: client.email,
      address: client.address,
      city: client.city || '',
      clientType: client.clientType,
      isActive: client.isActive,
      photo: client.photo || null,
      photoPreview: client.photoPreview || null
    });
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDelete = (client) => {
    setClientToDelete(client);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      setClients(clients.filter(client => client.id !== clientToDelete.id));
      toast.success('Cliente eliminado exitosamente');
      setShowDeleteDialog(false);
      setClientToDelete(null);
    }
  };

  const handleViewPurchaseSummary = (client) => {
    setSelectedClientForSummary(client);
    setShowPurchaseSummary(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          photo: file,
          photoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData({
      ...formData,
      photo: null,
      photoPreview: null
    });
  };

  const handleStatusChange = (clientId, newStatus) => {
    setClients(clients.map(client => 
      client.id === clientId 
        ? { ...client, isActive: newStatus }
        : client
    ));
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.identification.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm);
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && client.isActive) ||
      (statusFilter === 'inactive' && !client.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Reset a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Clientes</h1>
            <p className="text-gray-600">Administra la base de datos de clientes</p>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Modifica los datos del cliente.' : 'Completa el formulario para registrar un nuevo cliente.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6 py-4">
                  {/* Tipo de Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientType">Tipo de cliente *</Label>
                      <Select
                        value={formData.clientType}
                        onValueChange={(value) => setFormData({...formData, clientType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Particular">Particular</SelectItem>
                          <SelectItem value="Empresa">Empresa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Nombre o Razón Social */}
                  {formData.clientType === 'Particular' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombres *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          placeholder="Ej: Carlos"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellidos *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          placeholder="Ej: Medina López"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Razón Social *</Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                          placeholder="Ej: Auto Servicio López S.A.S"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Documento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documentType">Tipo de documento *</Label>
                      <Select
                        value={formData.documentType}
                        onValueChange={(value) => setFormData({...formData, documentType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cédula">Cédula de Ciudadanía</SelectItem>
                          <SelectItem value="Cédula de Extranjería">Cédula de Extranjería</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="RUT">RUT</SelectItem>
                          <SelectItem value="NIT">NIT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="identification">Número de documento *</Label>
                      <Input
                        id="identification"
                        value={formData.identification}
                        onChange={(e) => setFormData({...formData, identification: e.target.value})}
                        placeholder="123456789"
                        required
                      />
                    </div>
                  </div>

                  {/* Contacto */}
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
                      <Label htmlFor="email">Correo electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="cliente@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Dirección *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="Calle 50 #25-30"
                        required
                      />
                    </div>
                  </div>

                  {/* Foto del Cliente */}
                  <div className="border-t border-gray-200 pt-6">
                    <Label className="mb-3 block">Foto del Cliente</Label>
                    <div className="flex items-start gap-6">
                      {/* Vista previa de la foto */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                          {formData.photoPreview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={formData.photoPreview}
                                alt="Vista previa"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={removePhoto}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <UserIcon className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Botón de carga */}
                      <div className="flex-1">
                        <div className="space-y-2">
                          <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <Label
                            htmlFor="photo"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <UploadIcon className="w-4 h-4 mr-2" />
                            {formData.photoPreview ? 'Cambiar foto' : 'Subir foto'}
                          </Label>
                          <p className="text-sm text-gray-500">
                            Formatos permitidos: JPG, PNG. Tamaño máximo: 2MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estado */}
                  {/* Estado - Solo visible al editar */}
                  {editingClient && (
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, isActive: checked })
                          }
                        />
                        <Label>Cliente activo</Label>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingClient ? 'Actualizar' : 'Crear'} Cliente
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
                placeholder="Buscar clientes por nombre, identificación, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-600">
              {filteredClients.length} cliente(s)
            </span>
          </div>
        </Card>

        {/* Clients Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-10 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-10 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Contacto</th>
                  <th className="px-10 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentClients.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  currentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-10 py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={client.photoPreview} alt={client.name} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.documentType} {client.identification}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-4 text-sm text-gray-600">
                        {client.email}<br/>{client.phone}
                      </td>
                      
                      <td className="px-10 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPurchaseSummary(client)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
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
                                onClick={() => handleEdit(client)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar cliente</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(client)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar cliente</p></TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
{/* PAGINACION */}
          {/* Paginación */}
          {filteredClients.length > 0 && (
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
{/* DETALLE DEL CLIENTE */}
        {/* Modal de Detalle del Cliente */}
        <Dialog open={showPurchaseSummary} onOpenChange={setShowPurchaseSummary}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Cliente</DialogTitle>
            </DialogHeader>
            
            {selectedClientForSummary && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={selectedClientForSummary.photoPreview} alt={selectedClientForSummary.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                            {getInitials(selectedClientForSummary.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-gray-900">{selectedClientForSummary.name}</h3>
                          <p className="text-sm text-gray-500">{selectedClientForSummary.email}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-600">Documento</Label>
                        <p className="text-gray-900 mt-1">
                          {selectedClientForSummary.documentType} {selectedClientForSummary.identification}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Tipo de Cliente</Label>
                        <div className="mt-1">
                          <Badge variant="outline">{selectedClientForSummary.clientType}</Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-600">Estado</Label>
                        <div className="mt-1">
                          <Badge 
                            className={
                              selectedClientForSummary.isActive
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                              }
                            >
                              {selectedClientForSummary.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-gray-600">Correo electrónico</Label>
                        <p className="text-gray-900 mt-1">{selectedClientForSummary.email}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Teléfono</Label>
                        <p className="text-gray-900 mt-1">{selectedClientForSummary.phone}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Dirección</Label>
                        <p className="text-gray-900 mt-1">{selectedClientForSummary.address}</p>
                      </div>
                    </CardContent>
                  </Card>
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
                <p>¿Estás seguro de que deseas eliminar este cliente?</p>
                {clientToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Cliente: </span>
                        <span className="text-sm text-gray-900">{clientToDelete.name}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Documento: </span>
                        <span className="text-sm text-gray-900">
                          {clientToDelete.documentType} {clientToDelete.identification}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Email: </span>
                        <span className="text-sm text-gray-900">{clientToDelete.email}</span>
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
                Eliminar Cliente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}