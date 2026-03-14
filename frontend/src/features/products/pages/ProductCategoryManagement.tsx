import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  PlusIcon, 
  SearchIcon, 
  EditIcon, 
  TrashIcon, 
  EyeIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function ProductCategoryManagement() {
  const [categories, setCategories] = useState([
    {
      id: '1',
      name: 'Frenos',
      description: 'Componentes del sistema de frenado',
      code: 'FRE',
      totalProducts: 45,
      createdDate: '2024-01-15',
      updatedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Motor',
      description: 'Repuestos para motor y combustión',
      code: 'MOT',
      status: 'active',
      totalProducts: 128,
      createdDate: '2024-01-10',
      updatedDate: '2024-02-20'
    },
    {
      id: '3',
      name: 'Suspensión',
      description: 'Sistema de suspensión y amortiguadores',
      code: 'SUS',
      status: 'active',
      totalProducts: 67,
      createdDate: '2024-01-08',
      updatedDate: '2024-01-08'
    },
    {
      id: '4',
      name: 'Eléctrico',
      description: 'Componentes eléctricos y electrónicos',
      code: 'ELE',
      status: 'inactive',
      totalProducts: 23,
      createdDate: '2024-01-05',
      updatedDate: '2024-03-01'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    status: 'active'
  });

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || category.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePageChange = (newPage) => {
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredCategories.length);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      status: 'active'
    });
  };

  const generateCode = (name) => {
    return name.substring(0, 3).toUpperCase();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && { code: generateCode(value) })
    }));
  };

  const handleCreateCategory = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    const newCategory = {
      id: Date.now().toString(),
      ...formData,
      totalProducts: 0,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };

    setCategories(prev => [...prev, newCategory]);
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success('Categoría creada exitosamente');
  };

  const handleEditCategory = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    setCategories(prev => prev.map(category => 
      category.id === selectedCategory.id 
        ? { 
            ...category, 
            ...formData,
            updatedDate: new Date().toISOString().split('T')[0]
          }
        : category
    ));

    setIsEditDialogOpen(false);
    setSelectedCategory(null);
    resetForm();
    toast.success('Categoría actualizada exitosamente');
  };

  const handleDeleteCategory = () => {
    if (selectedCategory.totalProducts > 0) {
      toast.error('No se puede eliminar una categoría que tiene productos asociados');
      return;
    }

    setCategories(prev => prev.filter(category => category.id !== selectedCategory.id));
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
    toast.success('Categoría eliminada exitosamente');
  };


  const openEditDialog = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      code: category.code
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (category) => {
    setSelectedCategory(category);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const CategoryFormContent = ({ isEdit = false }) => (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la categoría *</Label>
          <Input
            id="name"
            placeholder="Ej: Frenos"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            placeholder="Generado automáticamente"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descripción *</Label>
        <Input
          id="description"
          placeholder="Descripción de la categoría"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
        />
      </div>

      {/* Estado solo aparece al editar */}
      {isEdit && (
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        Activo
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircleIcon className="w-3 h-3 mr-1" />
        Inactivo
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TagIcon className="w-8 h-8 text-blue-900" />
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Categorías de productos</h1>
            <p className="text-gray-800">Gestión completa de categorías de productos</p>
          </div>
        </div>
        <Button
        onClick={openCreateDialog}
        className="bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
      >
        <PlusIcon className="w-4 h-4 mr-2 text-white" />
        Nueva categoría
      </Button>
      </div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card className="border border-blue-100">
    <CardContent className="p-4">
      <p className="text-sm text-blue-500">Total categorías</p>
      <p className="text-2xl font-bold text-blue-900">
        {categories.length}
      </p>
    </CardContent>
  </Card>

  <Card className="border border-blue-100">
    <CardContent className="p-4">
      <p className="text-sm text-gray-500">Total productos asociados</p>
      <p className="text-2xl font-bold text-blue-900">
        {categories.reduce((acc, cat) => acc + cat.totalProducts, 0)}
      </p>
    </CardContent>
  </Card>

  <Card className="border border-blue-100">
    <CardContent className="p-4">
      <p className="text-sm text-gray-500">Promedio productos por categoría</p>
      <p className="text-2xl font-bold text-blue-900">
        {Math.round(
          categories.reduce((acc, cat) => acc + cat.totalProducts, 0) /
          categories.length
        )}
      </p>
    </CardContent>
  </Card>
</div>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Listar categorías */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de categorías</CardTitle>
                  <CardDescription>
                    Gestione todas las categorías de productos desde aquí
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre, código o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <FilterIcon className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categories Table */}
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader className="bg-blue-900">
  <TableRow>
    <TableHead className="text-black font-semibold">Categoría</TableHead>
    <TableHead className="text-black font-semibold">Descripción</TableHead>
    <TableHead className="text-black font-semibold">Código / Productos</TableHead>
    <TableHead className="text-black font-semibold">Acciones</TableHead>
  </TableRow>
</TableHeader>
                  <TableBody>
                    {filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((category) => (
                      <TableRow key={category.id} className="hover:bg-blue-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <TagIcon className="w-4 h-4 text-blue-600" />
                            <div>
                              <div>
  <div className="font-semibold text-blue-900">
    {category.name}
  </div>
  <div className="text-xs text-gray-500">
    Creado: {new Date(category.createdDate).toLocaleDateString('es-CO')}
  </div>
</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600 max-w-xs truncate">
                            {category.description}
                          </div>
                        </TableCell>
                        <TableCell>
  <div className="flex flex-col">
    <span className="text-blue-900 font-semibold">
      {category.code}
    </span>
    <span className="text-sm text-gray-500">
      {category.totalProducts} productos
    </span>
  </div>
</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewDialog(category)}
                              className="bg-white border border-blue-900 text-blue-900 hover:bg-blue-50 hover:shadow-md transition-all"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                              className="bg-white border border-blue-900 text-blue-900 hover:bg-blue-50 hover:shadow-md transition-all"
                            >
                              <EditIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(category)}
                              className="bg-white border border-blue-900 text-blue-900 hover:bg-blue-50 hover:shadow-md transition-all"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredCategories.length === 0 && (
                <div className="text-center py-8">
                  <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron categorías</p>
                </div>
              )}

              {/* Pagination */}
              {filteredCategories.length > 0 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
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
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crear categoría */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crear nueva categoría</CardTitle>
              <CardDescription>
                Complete la información para crear una nueva categoría de productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryFormContent />
            </CardContent>
            <CardFooter>
              <div className="flex gap-3 w-full">
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Limpiar formulario
                </Button>
                <Button
  onClick={handleCreateCategory}
  className="!bg-blue-600 !text-white hover:!bg-blue-700 hover:!text-white shadow-md hover:shadow-lg transition-all"
>
  Crear categoría
</Button>
                </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Consultar categoría */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consultar categoría</CardTitle>
              <CardDescription>
                Busque y visualice información detallada de las categorías
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar categoría por nombre, código o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCategories.map((category) => (
                    <Card key={category.id} className="border border-blue-100 hover:border-blue-900 hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TagIcon className="w-5 h-5 text-blue-600" />
                            <h3 className="font-medium">{category.name}</h3>
                          </div>
                          {getStatusBadge(category.status)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><strong>Código:</strong> {category.code}</div>
                          <div><strong>Descripción:</strong> {category.description}</div>
                          <div><strong>Productos asociados:</strong> {category.totalProducts}</div>
                          <div><strong>Fecha de creación:</strong> {new Date(category.createdDate).toLocaleDateString('es-CO')}</div>
                          <div><strong>Última actualización:</strong> {new Date(category.updatedDate).toLocaleDateString('es-CO')}</div>
                        </div>
                        <Button 
                          onClick={() => openViewDialog(category)} 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-3"
                        >
                          Ver detalles completos
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actualizar categoría */}
        <TabsContent value="update" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actualizar categoría</CardTitle>
              <CardDescription>
                Seleccione una categoría para editar su información
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id} className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEditDialog(category)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TagIcon className="w-4 h-4 text-blue-600" />
                            <h3 className="font-medium">{category.name}</h3>
                          </div>
                          {getStatusBadge(category.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                        <Button size="sm" variant="outline" className="w-full">
                          <EditIcon className="w-4 h-4 mr-2" />
                          Editar categoría
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cambiar estado */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar estado de categorías</CardTitle>
              <CardDescription>
                Active o desactive categorías según sea necesario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TagIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                        <p className="text-xs text-gray-500">Código: {category.code} • {category.totalProducts} productos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(category.status)}
                      <Switch
                        checked={category.status === 'active'}
                        onCheckedChange={() => handleToggleStatus(category)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl border border-blue-100 shadow-xl">
          <DialogHeader>
            <DialogTitle>Crear nueva categoría</DialogTitle>
            <DialogDescription>
              Complete la información para crear una nueva categoría de productos.
            </DialogDescription>
          </DialogHeader>
          <CategoryFormContent />
          <DialogFooter>
            <Button
  variant="ghost"
  onClick={() => setIsCreateDialogOpen(false)}
  className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all"
>
  Cancelar
</Button>
            <Button
  variant="default"
  onClick={handleCreateCategory}
  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
>
  Crear categoría
</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl border border-blue-100 shadow-xl">
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
            <DialogDescription>
              Modifique la información de la categoría seleccionada.
            </DialogDescription>
          </DialogHeader>
          <CategoryFormContent isEdit={true} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
            onClick={handleEditCategory}
            className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-900 shadow-md hover:shadow-lg transition-all"
          >
            Guardar cambios
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles de la categoría</DialogTitle>
            <DialogDescription>
              Información completa de la categoría seleccionada.
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{selectedCategory.name}</h3>
                {getStatusBadge(selectedCategory.status)}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <p className="text-sm">{selectedCategory.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <p className="text-sm">{selectedCategory.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Productos asociados</label>
                  <p className="text-sm">{selectedCategory.totalProducts} productos</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de creación</label>
                  <p className="text-sm">{new Date(selectedCategory.createdDate).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Última actualización</label>
                  <p className="text-sm">{new Date(selectedCategory.updatedDate).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">{selectedCategory.name}</h3>
              <p className="text-sm text-gray-600">{selectedCategory.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Esta categoría tiene {selectedCategory.totalProducts} productos asociados.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteCategory} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Eliminar categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}