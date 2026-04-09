import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
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
import { Card } from '@/shared/components/ui/card';
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
} from 'lucide-react';

// ─── Servicio ────────────────────────────────────────────────────────────────
import {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  mapProveedorToSupplier,
  mapSupplierToDTO,
} from '../services/proveedoresService';

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface Supplier {
  id: number;
  type: string;
  name: string;
  firstName?: string;
  lastName?: string;
  legalRepresentative?: string;
  documentType: string;
  documentNumber: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  isActive: boolean;
}

interface FormData {
  type: string;
  firstName: string;
  lastName: string;
  name: string;
  legalRepresentative: string;
  documentType: string;
  documentNumber: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  isActive: boolean;
}

export function SupplierManagement() {
  // ─── Estado ───────────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(false);

  const [showModal, setShowModal]             = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const emptyForm: FormData = {
    type: 'empresa',
    firstName: '',
    lastName: '',
    name: '',
    legalRepresentative: '',
    documentType: 'NIT',
    documentNumber: '',
    contact: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    isActive: true,
  };

  const [formData, setFormData] = useState<FormData>(emptyForm);

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadProveedores = async () => {
      setLoading(true);
      try {
        const data = await getProveedores();
        setSuppliers(data.map(mapProveedorToSupplier));
      } catch (e: any) {
        toast.error(e.message || 'Error al cargar los proveedores');
      } finally {
        setLoading(false);
      }
    };
    loadProveedores();
  }, []);

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto = mapSupplierToDTO(formData);
      if (editingSupplier) {
        const { proveedor } = await updateProveedor(editingSupplier.id, dto);
        setSuppliers(suppliers.map(s =>
          s.id === editingSupplier.id ? mapProveedorToSupplier(proveedor) : s
        ));
        toast.success('Proveedor actualizado exitosamente');
      } else {
        const { proveedor } = await createProveedor(dto);
        setSuppliers([mapProveedorToSupplier(proveedor), ...suppliers]);
        toast.success('Proveedor creado exitosamente');
      }
      resetForm();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar el proveedor');
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingSupplier(null);
    setShowModal(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      type:                supplier.type,
      firstName:           supplier.firstName           || '',
      lastName:            supplier.lastName            || '',
      name:                supplier.name                || '',
      legalRepresentative: supplier.legalRepresentative || '',
      documentType:        supplier.documentType,
      documentNumber:      supplier.documentNumber,
      contact:             supplier.contact,
      email:               supplier.email,
      phone:               supplier.phone,
      city:                supplier.city,
      address:             supplier.address,
      isActive:            supplier.isActive,
    });
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleViewDetail = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setShowDetailModal(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteProveedor(supplierToDelete.id);
      // El backend desactiva en lugar de borrar
      setSuppliers(suppliers.map(s =>
        s.id === supplierToDelete.id ? { ...s, isActive: false } : s
      ));
      toast.success('Proveedor desactivado exitosamente');
    } catch (e: any) {
      toast.error(e.message || 'Error al desactivar el proveedor');
    } finally {
      setShowDeleteDialog(false);
      setSupplierToDelete(null);
    }
  };

  // ─── Filtrado y paginación ────────────────────────────────────────────────
  const filteredSuppliers = suppliers.filter(sup =>
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages  = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);

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

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Proveedores</h1>
            <p className="text-gray-600">Administra los proveedores de la empresa</p>
          </div>

          <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}</DialogTitle>
                <DialogDescription>
                  {editingSupplier ? 'Modifica la información del proveedor' : 'Completa el formulario para agregar un nuevo proveedor'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Proveedor */}
                <div className="space-y-2">
                  <Label>Tipo de proveedor *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persona">Persona Natural</SelectItem>
                      <SelectItem value="empresa">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Persona Natural */}
                {formData.type === 'persona' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Juan"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellido *</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Pérez"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Empresa */}
                {formData.type === 'empresa' && (
                  <>
                    <div className="space-y-2">
                      <Label>Nombre de la empresa *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: AutoPartes Central S.A.S."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Representante Legal *</Label>
                      <Input
                        value={formData.legalRepresentative}
                        onChange={(e) => setFormData({ ...formData, legalRepresentative: e.target.value })}
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de documento *</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NIT">NIT</SelectItem>
                        <SelectItem value="Cédula">Cédula</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Número de documento *</Label>
                    <Input
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      placeholder="900123456-7"
                      required
                    />
                  </div>
                </div>

                {/* Contacto y Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Persona de contacto *</Label>
                    <Input
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Correo electrónico *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ventas@proveedor.com"
                      required
                    />
                  </div>
                </div>

                {/* Teléfono y Ciudad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teléfono *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+57 300 123 4567"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Medellín"
                      required
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                  <Label>Dirección *</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle 45 #23-67"
                    required
                  />
                </div>

                {/* Estado (solo al editar) */}
                {editingSupplier && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label>Proveedor activo</Label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Búsqueda */}
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
            <span className="text-sm text-gray-600">{filteredSuppliers.length} proveedor(es)</span>
          </div>
        </Card>

        {/* Tabla */}
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
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                      <BuildingIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-pulse" />
                      <p>Cargando proveedores...</p>
                    </td>
                  </tr>
                ) : currentSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron proveedores
                    </td>
                  </tr>
                ) : (
                  currentSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <BuildingIcon className="w-5 h-5 text-blue-600" />
                          <div>
                            <span className="text-sm text-gray-900">{supplier.name}</span>
                            <div className="mt-0.5">
                              <Badge variant={supplier.isActive ? 'default' : 'secondary'} className="text-xs">
                                {supplier.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </div>
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
                                variant="outline" size="sm"
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
                                variant="outline" size="sm"
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
                                variant="outline" size="sm"
                                onClick={() => handleDelete(supplier)}
                                disabled={!supplier.isActive}
                                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{supplier.isActive ? 'Desactivar proveedor' : 'Ya desactivado'}</p>
                            </TooltipContent>
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
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, index) =>
                    page === '...' ? (
                      <span key={`e-${index}`} className="px-2 text-gray-500">•</span>
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
                  )}
                </div>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Detalle */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Proveedor</DialogTitle>
              <DialogDescription>Información completa del proveedor seleccionado</DialogDescription>
            </DialogHeader>
            {viewingSupplier && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Nombre de la empresa</Label>
                  <p className="text-gray-900 mt-1">{viewingSupplier.name}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Documento</Label>
                  <p className="text-gray-900 mt-1">{viewingSupplier.documentType} {viewingSupplier.documentNumber}</p>
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
                    <Badge variant={viewingSupplier.isActive ? 'default' : 'secondary'}>
                      {viewingSupplier.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Eliminar */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangleIcon className="w-5 h-5" />
                Confirmar Desactivación
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>¿Estás seguro de que deseas desactivar este proveedor?</p>
                {supplierToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                    <div><span className="text-sm text-gray-600">Empresa: </span><span className="text-sm text-gray-900">{supplierToDelete.name}</span></div>
                    <div><span className="text-sm text-gray-600">Contacto: </span><span className="text-sm text-gray-900">{supplierToDelete.contact}</span></div>
                    <div><span className="text-sm text-gray-600">Email: </span><span className="text-sm text-gray-900">{supplierToDelete.email}</span></div>
                  </div>
                )}
                <p className="text-sm text-red-600">El proveedor quedará inactivo y no podrá usarse en nuevas compras.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Desactivar Proveedor
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
