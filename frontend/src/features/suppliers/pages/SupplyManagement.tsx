import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
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
  EyeIcon, 
  EditIcon, 
  TrashIcon,
  PackageIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PowerIcon
} from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';

export function SupplyManagement() {
  const [supplies, setSupplies] = useState([
    {
      id: 1,
      name: 'Aceite Motor 5W-30',
      description: 'Aceite sintético para motor de alta calidad',
      price: 45000,
      stockCurrent: 25,
      stockMin: 10,
      stockMax: 100,
      unit: 'Litros',
      status: true
    },
    {
      id: 2,
      name: 'Filtro de Aceite',
      description: 'Filtro compatible con vehículos Toyota',
      price: 18000,
      stockCurrent: 45,
      stockMin: 15,
      stockMax: 80,
      unit: 'Unidades',
      status: true
    },
    {
      id: 3,
      name: 'Pastillas de Freno',
      description: 'Juego de pastillas delanteras',
      price: 85000,
      stockCurrent: 30,
      stockMin: 12,
      stockMax: 60,
      unit: 'Juegos',
      status: false
    },
    {
      id: 4,
      name: 'Correa de Distribución',
      description: 'Correa de alta resistencia',
      price: 125000,
      stockCurrent: 8,
      stockMin: 5,
      stockMax: 40,
      unit: 'Unidades',
      status: true
    },
    {
      id: 5,
      name: 'Batería 12V 60Ah',
      description: 'Batería libre de mantenimiento',
      price: 320000,
      stockCurrent: 15,
      stockMin: 8,
      stockMax: 30,
      unit: 'Unidades',
      status: true
    },
    {
      id: 6,
      name: 'Refrigerante Motor',
      description: 'Anticongelante concentrado',
      price: 28000,
      stockCurrent: 50,
      stockMin: 20,
      stockMax: 100,
      unit: 'Litros',
      status: true
    },
    {
      id: 7,
      name: 'Bujías de Encendido',
      description: 'Juego de 4 bujías iridio',
      price: 65000,
      stockCurrent: 20,
      stockMin: 10,
      stockMax: 50,
      unit: 'Juegos',
      status: false
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [viewingSupply, setViewingSupply] = useState(null);
  const [supplyToDelete, setSupplyToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

const [formData, setFormData] = useState({
  name: '',
  description: '',
  price: '',
  stockCurrent: '',
  unit: 'Unidades',
  status: true
});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSupply) {
      setSupplies(supplies.map(sup => 
        sup.id === editingSupply.id 
          ? { 
              ...formData, 
              id: editingSupply.id,
              price: parseFloat(formData.price),
              stockCurrent: parseInt(formData.stockCurrent),
              status: formData.status
            }
          : sup
      ));
      toast.success('Insumo actualizado exitosamente');
    } else {
      setSupplies([...supplies, { 
        ...formData, 
        id: Date.now(),
        price: parseFloat(formData.price),
        stockCurrent: parseInt(formData.stockCurrent),
        stockMin: parseInt(formData.stockMin),
        stockMax: parseInt(formData.stockMax),
        status: formData.status
      }]);
      toast.success('Insumo creado exitosamente');
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stockCurrent: '',
      stockMin: '',
      stockMax: '',
      unit: 'Unidades',
      status: true
    });
    setEditingSupply(null);
    setShowModal(false);
  };

  const handleEdit = (supply) => {
    setFormData({
      name: supply.name,
      description: supply.description,
      price: supply.price.toString(),
      stockCurrent: supply.stockCurrent.toString(),
      stockMin: supply.stockMin.toString(),
      stockMax: supply.stockMax.toString(),
      unit: supply.unit,
      status: supply.status
    });
    setEditingSupply(supply);
    setShowModal(true);
  };

  const handleToggleStatus = (supply) => {
    setSupplies(supplies.map(sup => 
      sup.id === supply.id 
        ? { ...sup, status: !sup.status }
        : sup
    ));
    toast.success(`Insumo ${!supply.status ? 'activado' : 'desactivado'} exitosamente`);
  };

  const handleViewDetail = (supply) => {
    setViewingSupply(supply);
    setShowDetailModal(true);
  };

  const handleDelete = (supply) => {
    setSupplyToDelete(supply);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (supplyToDelete) {
      setSupplies(supplies.filter(sup => sup.id !== supplyToDelete.id));
      toast.success('Insumo eliminado exitosamente');
      setShowDeleteDialog(false);
      setSupplyToDelete(null);
    }
  };



  // Filtrado
  const filteredSupplies = supplies.filter(sup => {
    return sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sup.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Paginación
  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSupplies = filteredSupplies.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Generar array de páginas para paginación moderna
  const getPageNumbers = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Insumos</h1>
            <p className="text-gray-600">Administra el inventario de insumos</p>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Insumo
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSupply ? 'Editar Insumo' : 'Crear Nuevo Insumo'}
                </DialogTitle>
                <DialogDescription>
                  {editingSupply 
                    ? 'Modifica los datos del insumo en el formulario a continuación.' 
                    : 'Completa el formulario para agregar un nuevo insumo al inventario.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del insumo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Aceite Motor 5W-30"
                    required
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descripción detallada del insumo"
                    rows={3}
                    required
                  />
                </div>

                {/* Precio y Unidad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio unitario *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="45000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidad de medida *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({...formData, unit: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unidades">Unidades</SelectItem>
                        <SelectItem value="Litros">Litros</SelectItem>
                        <SelectItem value="Kilogramos">Kilogramos</SelectItem>
                        <SelectItem value="Metros">Metros</SelectItem>
                        <SelectItem value="Juegos">Juegos</SelectItem>
                        <SelectItem value="Cajas">Cajas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockCurrent">Stock actual *</Label>
                    <Input
                      id="stockCurrent"
                      type="number"
                      value={formData.stockCurrent}
                      onChange={(e) => setFormData({...formData, stockCurrent: e.target.value})}
                      placeholder="25"
                      required
                    />
                  </div>
                </div>

                {/* Estado */}
                {editingSupply !== null && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <Label>Estado del Insumo</Label>

                    <Switch
                      checked={formData.status}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, status: checked })
                      }
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingSupply ? 'Actualizar' : 'Crear'} Insumo
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
                placeholder="Buscar insumos por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-600">
              {filteredSupplies.length} insumo(s)
            </span>
          </div>
        </Card>

        {/* Tabla de Insumos */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Unidad</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentSupplies.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron insumos
                    </td>
                  </tr>
                ) : (
                  currentSupplies.map((supply) => {
                    return (
                      <tr key={supply.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <PackageIcon className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-gray-900">{supply.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {supply.description}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          ${supply.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">

                          {supply.stockCurrent} {supply.unit}

                          {supply.stockCurrent <= 10 && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 ml-2">
                              Bajo stock
                            </Badge>
                          )}

                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetail(supply)}
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
                                  onClick={() => handleEdit(supply)}
                                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Editar insumo</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(supply)}
                                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Eliminar insumo</p></TooltipContent>
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

          {/* Paginación Moderna */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-blue-600"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={
                        currentPage === page
                          ? "bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]"
                          : "text-gray-400 hover:text-gray-600 min-w-[32px]"
                      }
                    >
                      {currentPage === page ? page : '•'}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-blue-600"
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
              <DialogTitle>Detalles del Insumo</DialogTitle>
              <DialogDescription>
                Información completa del insumo seleccionado.
              </DialogDescription>
            </DialogHeader>
            {viewingSupply && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Nombre</Label>
                    <p className="text-gray-900 mt-1">{viewingSupply.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Precio unitario</Label>
                    <p className="text-gray-900 mt-1">${viewingSupply.price.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600">Descripción</Label>
                    <p className="text-gray-900 mt-1">{viewingSupply.description}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Unidad de medida</Label>
                    <p className="text-gray-900 mt-1">{viewingSupply.unit}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Stock actual</Label>
                    <p className="text-gray-900 mt-1">{viewingSupply.stockCurrent}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Estado</Label>
                    <div className="mt-1">
                      <Badge className={viewingSupply.status ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                        {viewingSupply.status ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
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
                <p>¿Estás seguro de que deseas eliminar este insumo?</p>
                {supplyToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Insumo: </span>
                        <span className="text-sm text-gray-900">{supplyToDelete.name}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Stock actual: </span>
                        <span className="text-sm text-gray-900">{supplyToDelete.stockCurrent} {supplyToDelete.unit}</span>
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
                Eliminar Insumo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
