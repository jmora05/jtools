import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/shared/components/ui/switch';
import { toast } from 'sonner';
import {
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  PackageIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';

// ─── Servicio ────────────────────────────────────────────────────────────────
import {
  getInsumos,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  cambiarEstadoInsumo,
  mapInsumoToSupply,
  mapSupplyToDTO,
} from '../services/insumosService';

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface Supply {
  id:           number;
  name:         string;
  description:  string;
  price:        number;
  unit:         string;
  status:       boolean;
  stockCurrent: number;
}

interface FormData {
  name:        string;
  description: string;
  price:       string;
  unit:        string;
  status:      boolean;
}

export function SupplyManagement() {
  // ─── Estado ───────────────────────────────────────────────────────────────
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading]   = useState(false);

  const [showModal, setShowModal]               = useState(false);
  const [showDetailModal, setShowDetailModal]   = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSupply, setEditingSupply]       = useState<Supply | null>(null);
  const [viewingSupply, setViewingSupply]       = useState<Supply | null>(null);
  const [supplyToDelete, setSupplyToDelete]     = useState<Supply | null>(null);
  const [searchTerm, setSearchTerm]             = useState('');
  const [currentPage, setCurrentPage]           = useState(1);
  const itemsPerPage = 5;

  const emptyForm: FormData = {
    name:        '',
    description: '',
    price:       '',
    unit:        'Unidades',
    status:      true,
  };

  const [formData, setFormData] = useState<FormData>(emptyForm);

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getInsumos();
        setSupplies(data.map(mapInsumoToSupply));
      } catch (e: any) {
        toast.error(e.message || 'Error al cargar los insumos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto = mapSupplyToDTO(formData);
      if (editingSupply) {
        const { insumo } = await updateInsumo(editingSupply.id, dto);
        setSupplies(supplies.map(s =>
          s.id === editingSupply.id ? mapInsumoToSupply(insumo) : s
        ));
        toast.success('Insumo actualizado exitosamente');
      } else {
        const { insumo } = await createInsumo(dto);
        setSupplies([mapInsumoToSupply(insumo), ...supplies]);
        toast.success('Insumo creado exitosamente');
      }
      resetForm();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar el insumo');
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingSupply(null);
    setShowModal(false);
  };

  const handleEdit = (supply: Supply) => {
    setFormData({
      name:        supply.name,
      description: supply.description,
      price:       supply.price.toString(),
      unit:        supply.unit,
      status:      supply.status,
    });
    setEditingSupply(supply);
    setShowModal(true);
  };

  const handleViewDetail = (supply: Supply) => {
    setViewingSupply(supply);
    setShowDetailModal(true);
  };

  const handleDelete = (supply: Supply) => {
    setSupplyToDelete(supply);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!supplyToDelete) return;
    try {
      await deleteInsumo(supplyToDelete.id);
      setSupplies(supplies.filter(s => s.id !== supplyToDelete.id));
      toast.success('Insumo eliminado exitosamente');
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar el insumo');
    } finally {
      setShowDeleteDialog(false);
      setSupplyToDelete(null);
    }
  };

  // Cambia estado disponible ↔ agotado directamente desde la tabla
  const handleToggleStatus = async (supply: Supply) => {
    const nuevoEstado = supply.status ? 'agotado' : 'disponible';
    try {
      const { insumo } = await cambiarEstadoInsumo(supply.id, nuevoEstado);
      setSupplies(supplies.map(s =>
        s.id === supply.id ? mapInsumoToSupply(insumo) : s
      ));
      toast.success(`Insumo marcado como ${nuevoEstado}`);
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar el estado');
    }
  };

  // ─── Filtrado y paginación ────────────────────────────────────────────────
  const filteredSupplies = supplies.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages       = Math.ceil(filteredSupplies.length / itemsPerPage);
  const startIndex       = (currentPage - 1) * itemsPerPage;
  const currentSupplies  = filteredSupplies.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Insumos</h1>
            <p className="text-gray-600">Administra el inventario de insumos</p>
          </div>

          <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Insumo
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSupply ? 'Editar Insumo' : 'Crear Nuevo Insumo'}</DialogTitle>
                <DialogDescription>
                  {editingSupply
                    ? 'Modifica los datos del insumo.'
                    : 'Completa el formulario para agregar un nuevo insumo.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label>Nombre del insumo *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Aceite Motor 5W-30"
                    required
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción detallada del insumo"
                    rows={3}
                  />
                </div>

                {/* Precio y Unidad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio unitario *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="45000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidad de medida *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
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

                {/* Estado — solo al editar */}
                {editingSupply && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <Label>Estado del Insumo</Label>
                    <Switch
                      checked={formData.status}
                      onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingSupply ? 'Actualizar' : 'Crear'} Insumo
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
                placeholder="Buscar insumos por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-600">{filteredSupplies.length} insumo(s)</span>
          </div>
        </Card>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Unidad</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <PackageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-pulse" />
                      <p>Cargando insumos...</p>
                    </td>
                  </tr>
                ) : currentSupplies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron insumos
                    </td>
                  </tr>
                ) : (
                  currentSupplies.map((supply) => (
                    <tr key={supply.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <PackageIcon className="w-5 h-5 text-blue-600 shrink-0" />
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
                        {supply.unit}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleToggleStatus(supply)}>
                              <Badge
                                className={
                                  supply.status
                                    ? 'bg-green-100 text-green-700 border-green-200 cursor-pointer hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 border-red-200 cursor-pointer hover:bg-red-200'
                                }
                              >
                                {supply.status ? 'Disponible' : 'Agotado'}
                              </Badge>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>Click para cambiar estado</p></TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline" size="sm"
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
                                variant="outline" size="sm"
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
                                variant="outline" size="sm"
                                onClick={() => handleDelete(supply)}
                                disabled={supply.status}
                                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{supply.status ? 'Márcalo como agotado para eliminar' : 'Eliminar insumo'}</p>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-blue-600"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant="ghost" size="sm"
                      onClick={() => handlePageChange(page)}
                      className={
                        currentPage === page
                          ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]'
                          : 'text-gray-400 hover:text-gray-600 min-w-[32px]'
                      }
                    >
                      {currentPage === page ? page : '•'}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline" size="sm"
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

        {/* Modal Detalle */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Insumo</DialogTitle>
              <DialogDescription>Información completa del insumo seleccionado.</DialogDescription>
            </DialogHeader>
            {viewingSupply && (
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
                  <p className="text-gray-900 mt-1">{viewingSupply.description || '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Unidad de medida</Label>
                  <p className="text-gray-900 mt-1">{viewingSupply.unit}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <div className="mt-1">
                    <Badge className={
                      viewingSupply.status
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }>
                      {viewingSupply.status ? 'Disponible' : 'Agotado'}
                    </Badge>
                  </div>
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
                Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>¿Estás seguro de que deseas eliminar este insumo?</p>
                {supplyToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Insumo: </span>
                      <span className="text-sm text-gray-900">{supplyToDelete.name}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Unidad: </span>
                      <span className="text-sm text-gray-900">{supplyToDelete.unit}</span>
                    </div>
                  </div>
                )}
                <p className="text-sm text-red-600">Esta acción no se puede deshacer.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Eliminar Insumo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
