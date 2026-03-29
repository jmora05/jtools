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
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} from '../services/clientesService';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  razon_social: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: 'activo' | 'inactivo';
  foto?: string | null;
  photoPreview?: string | null;
  clientType?: 'Particular' | 'Empresa';
}

interface FormData {
  nombres: string;
  apellidos: string;
  razon_social: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  clientType: 'Particular' | 'Empresa';
  estado: 'activo' | 'inactivo';
  foto: File | null;
  photoPreview: string | null;
}

export function ClientManagement({ onNavigateToSales }: { onNavigateToSales?: () => void }) {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPurchaseSummary, setShowPurchaseSummary] = useState(false);
  const [selectedClientForSummary, setSelectedClientForSummary] = useState<Cliente | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    apellidos: '',
    razon_social: '',
    tipo_documento: 'cedula',
    numero_documento: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    clientType: 'Particular',
    estado: 'activo',
    foto: null,
    photoPreview: null,
  });

  // ── Fetch clientes desde el backend ──────────────────────────────────────────
  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      // Enriquecer con clientType deducido de razon_social vs nombres
      const enriched = data.map((c: Cliente) => ({
        ...c,
        clientType: c.nombres === 'N/A' ? 'Empresa' : 'Particular',
        photoPreview: c.foto || null,
      }));
      setClients(enriched);
    } catch (error: any) {
      toast.error(`Error al cargar clientes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientes(); }, []);

  // ── Submit (crear / editar) ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nombres:          formData.clientType === 'Particular' ? formData.nombres : 'N/A',
      apellidos:        formData.clientType === 'Particular' ? formData.apellidos : 'N/A',
      razon_social:     formData.clientType === 'Empresa'
                          ? formData.razon_social
                          : `${formData.nombres} ${formData.apellidos}`.trim(),
      tipo_documento:   formData.tipo_documento,
      numero_documento: formData.numero_documento,
      telefono:         formData.telefono,
      email:            formData.email,
      direccion:        formData.direccion,
      ciudad:           formData.ciudad,
      estado:           formData.estado,
    };

    try {
      setSaving(true);
      if (editingClient) {
        await updateCliente(editingClient.id, payload);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await createCliente(payload);
        toast.success('Cliente creado exitosamente');
      }
      await fetchClientes();
      resetForm();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      razon_social: '',
      tipo_documento: 'cedula',
      numero_documento: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      clientType: 'Particular',
      estado: 'activo',
      foto: null,
      photoPreview: null,
    });
    setEditingClient(null);
    setShowModal(false);
  };

  const handleEdit = (client: Cliente) => {
    const isEmpresa = client.clientType === 'Empresa' || client.nombres === 'N/A';
    setFormData({
      nombres:          isEmpresa ? '' : client.nombres,
      apellidos:        isEmpresa ? '' : client.apellidos,
      razon_social:     isEmpresa ? client.razon_social : '',
      tipo_documento:   client.tipo_documento || 'cedula',
      numero_documento: client.numero_documento,
      telefono:         client.telefono,
      email:            client.email,
      direccion:        client.direccion || '',
      ciudad:           client.ciudad || '',
      clientType:       isEmpresa ? 'Empresa' : 'Particular',
      estado:           client.estado ?? 'activo',
      foto:             null,
      photoPreview:     client.foto || null,
    });
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDelete = (client: Cliente) => {
    setClientToDelete(client);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      setSaving(true);
      await deleteCliente(clientToDelete.id);
      toast.success('Cliente eliminado exitosamente');
      await fetchClientes();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
      setClientToDelete(null);
    }
  };

  const handleViewPurchaseSummary = (client: Cliente) => {
    setSelectedClientForSummary(client);
    setShowPurchaseSummary(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          foto: file,
          photoPreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, foto: null, photoPreview: null });
  };

  // ── Nombre para mostrar en la tabla ──────────────────────────────────────────
  const getDisplayName = (client: Cliente) => {
    if (client.clientType === 'Empresa' || client.nombres === 'N/A') {
      return client.razon_social;
    }
    return `${client.nombres} ${client.apellidos}`.trim();
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // ── Filtros y paginación ──────────────────────────────────────────────────────
  const filteredClients = clients.filter((client) => {
    const name = getDisplayName(client);
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.numero_documento.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active'   && client.estado === 'activo') ||
      (statusFilter === 'inactive' && client.estado === 'inactivo');
    return matchesSearch && matchesStatus;
  });

  const totalPages  = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Clientes</h1>
            <p className="text-gray-600">Administra la base de datos de clientes</p>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg" onClick={() => { resetForm(); setShowModal(true); }}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</DialogTitle>
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
                        onValueChange={(value: 'Particular' | 'Empresa') =>
                          setFormData({ ...formData, clientType: value })
                        }
                      >
                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
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
                        <Label htmlFor="nombres">Nombres *</Label>
                        <Input
                          id="nombres"
                          value={formData.nombres}
                          onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                          placeholder="Ej: Carlos"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellidos">Apellidos *</Label>
                        <Input
                          id="apellidos"
                          value={formData.apellidos}
                          onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                          placeholder="Ej: Medina López"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="razon_social">Razón Social *</Label>
                        <Input
                          id="razon_social"
                          value={formData.razon_social}
                          onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                          placeholder="Ej: Auto Servicio López S.A.S"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Documento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_documento">Tipo de documento *</Label>
                      <Select
                        value={formData.tipo_documento}
                        onValueChange={(value) => setFormData({ ...formData, tipo_documento: value })}
                      >
                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cedula">Cédula de Ciudadanía</SelectItem>
                          <SelectItem value="cedula de extranjeria">Cédula de Extranjería</SelectItem>
                          <SelectItem value="pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="rut">RUT</SelectItem>
                          <SelectItem value="nit">NIT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero_documento">Número de documento *</Label>
                      <Input
                        id="numero_documento"
                        value={formData.numero_documento}
                        onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                        placeholder="123456789"
                        required
                      />
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="cliente@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad *</Label>
                      <Input
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        placeholder="Medellín"
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="direccion">Dirección *</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Calle 50 #25-30"
                        required
                      />
                    </div>
                  </div>

                  {/* Foto del Cliente */}
                  <div className="border-t border-gray-200 pt-6">
                    <Label className="mb-3 block">Foto del Cliente</Label>
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                          {formData.photoPreview ? (
                            <div className="relative w-full h-full">
                              <img src={formData.photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
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
                      <div className="flex-1">
                        <div className="space-y-2">
                          <Input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                          <Label
                            htmlFor="photo"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <UploadIcon className="w-4 h-4 mr-2" />
                            {formData.photoPreview ? 'Cambiar foto' : 'Subir foto'}
                          </Label>
                          <p className="text-sm text-gray-500">Formatos permitidos: JPG, PNG. Tamaño máximo: 2MB</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estado - Solo visible al editar */}
                  {editingClient && (
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={formData.estado === 'activo'}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, estado: checked ? 'activo' : 'inactivo' })
                          }
                        />
                        <Label>Cliente activo</Label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                    {saving ? 'Guardando...' : editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}
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
            <span className="text-sm text-gray-600">{filteredClients.length} cliente(s)</span>
          </div>
        </Card>

        {/* Tabla */}
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
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Cargando clientes...</td>
                  </tr>
                ) : currentClients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No se encontraron clientes</td>
                  </tr>
                ) : (
                  currentClients.map((client) => {
                    const displayName = getDisplayName(client);
                    return (
                      <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-10 py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={client.photoPreview || undefined} alt={displayName} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm text-gray-900">{displayName}</p>
                              <p className="text-sm text-gray-500">{client.tipo_documento} {client.numero_documento}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-4 text-sm text-gray-600">
                          {client.email}<br />{client.telefono}
                        </td>
                        <td className="px-10 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline" size="sm"
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
                                  variant="outline" size="sm"
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
                                  variant="outline" size="sm"
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filteredClients.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline" size="sm"
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
                        variant={currentPage === page ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 min-w-[32px]' : 'min-w-[32px]'}
                      >
                        {currentPage === page ? page : '•'}
                      </Button>
                    )
                  ))}
                </div>
                <Button
                  variant="outline" size="sm"
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

        {/* Modal Ver Detalle */}
        <Dialog open={showPurchaseSummary} onOpenChange={setShowPurchaseSummary}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Cliente</DialogTitle>
            </DialogHeader>
            {selectedClientForSummary && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Información Personal</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={selectedClientForSummary.photoPreview || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                            {getInitials(getDisplayName(selectedClientForSummary))}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-gray-900">{getDisplayName(selectedClientForSummary)}</h3>
                          <p className="text-sm text-gray-500">{selectedClientForSummary.email}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-600">Documento</Label>
                        <p className="text-gray-900 mt-1">
                          {selectedClientForSummary.tipo_documento} {selectedClientForSummary.numero_documento}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Tipo de Cliente</Label>
                        <div className="mt-1">
                          <Badge variant="outline">{selectedClientForSummary.clientType || 'Particular'}</Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-600">Estado</Label>
                        <div className="mt-1">
                          <Badge className={
                            selectedClientForSummary.estado === 'activo'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }>
                            {selectedClientForSummary.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Información de Contacto</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-gray-600">Correo electrónico</Label>
                        <p className="text-gray-900 mt-1">{selectedClientForSummary.email}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Teléfono</Label>
                        <p className="text-gray-900 mt-1">{selectedClientForSummary.telefono}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Ciudad</Label>
                        <p className="text-gray-900 mt-1">{selectedClientForSummary.ciudad}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Dirección</Label>
                        <p className="text-gray-900 mt-1">{selectedClientForSummary.direccion}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Eliminar */}
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
                        <span className="text-sm text-gray-900">{getDisplayName(clientToDelete)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Documento: </span>
                        <span className="text-sm text-gray-900">
                          {clientToDelete.tipo_documento} {clientToDelete.numero_documento}
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
              <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? 'Eliminando...' : 'Eliminar Cliente'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
