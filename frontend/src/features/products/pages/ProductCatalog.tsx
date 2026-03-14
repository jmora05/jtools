import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/shared/components/figma/ImageWithFallback';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Package,
  FileText,
  Image as ImageIcon,
  Upload,
  Download,
  ToggleLeft,
  ToggleRight,
  X,
  FlaskConical,
  Scale,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button'; // ✅ FALTABA
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function ProductCatalog() {
  const [view, setView] = useState('table'); // 'table' or 'grid'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [productForm, setProductForm] = useState({
    name: '',
    reference: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    status: true,
    image: '',
    documents: [],
    images: [],
    supplyRequirements: []
  });

  const [newSupplyRequirement, setNewSupplyRequirement] = useState({ 
    supplyId: '', 
    quantity: '', 
    unit: 'ml'
  });

  useEffect(() => {
    // Load demo data - supplies
    setSupplies([
      { id: 1, name: 'Aceite Motor 5W-30', code: 'AC-001', unit: 'ml', stock: 5000 },
      { id: 2, name: 'Líquido de Frenos DOT-4', code: 'LF-002', unit: 'ml', stock: 2500 },
      { id: 3, name: 'Refrigerante Motor', code: 'RF-003', unit: 'ml', stock: 3200 },
      { id: 4, name: 'Grasa Multiusos', code: 'GR-004', unit: 'g', stock: 8000 },
      { id: 5, name: 'Sellador de Juntas', code: 'SJ-005', unit: 'ml', stock: 1800 },
      { id: 6, name: 'Desengrasante Industrial', code: 'DI-006', unit: 'ml', stock: 4500 }
    ]);

    // Load demo data - categories
    setCategories([
      { id: 1, name: 'Motor', description: 'Repuestos del sistema del motor' },
      { id: 2, name: 'Frenos', description: 'Sistema de frenado' },
      { id: 3, name: 'Filtros', description: 'Filtros de aire, aceite y combustible' },
      { id: 4, name: 'Suspensión', description: 'Amortiguadores y sistema de suspensión' },
      { id: 5, name: 'Transmisión', description: 'Caja de cambios y embrague' }
    ]);

    setProducts([
      {
        id: 1,
        name: 'Filtro de Aceite Toyota',
        reference: 'FO-TOY-001',
        description: 'Filtro de aceite original para vehículos Toyota modelo 2015-2023',
        price: 25000,
        stock: 15,
        category: 'Filtros',
        status: true,
        image: 'https://images.unsplash.com/photo-1563450217324-3891a89b8223?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBmaWx0ZXJzJTIwYXV0b21vdGl2ZXxlbnwxfHx8fDE3NTU2MzA2NDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        documents: [
          { name: 'Manual de instalación', url: '#', type: 'PDF' },
          { name: 'Certificado de calidad', url: '#', type: 'PDF' }
        ],
        images: [
          'https://images.unsplash.com/photo-1563450217324-3891a89b8223?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBmaWx0ZXJzJTIwYXV0b21vdGl2ZXxlbnwxfHx8fDE3NTU2MzA2NDB8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        supplyRequirements: [
          { supplyId: 1, quantity: 1000, unit: 'ml' },
          { supplyId: 3, quantity: 500, unit: 'ml' }
        ]
      },
      {
        id: 2,
        name: 'Pastillas de Freno Honda',
        reference: 'PF-HON-002',
        description: 'Pastillas de freno delanteras originales para Honda Civic',
        price: 85000,
        stock: 8,
        category: 'Frenos',
        status: true,
        image: 'https://images.unsplash.com/photo-1704297277008-e4c29a46fe82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFrZSUyMHBhZHMlMjBhdXRvbW90aXZlfGVufDF8fHx8MTc1NTYzMDYzOHww&ixlib=rb-4.1.0&q=80&w=1080',
        documents: [],
        images: [],
        supplyRequirements: [
          { supplyId: 2, quantity: 500, unit: 'ml' }
        ]
      },
      {
        id: 3,
        name: 'Kit de Motor Chevrolet',
        reference: 'KM-CHE-003',
        description: 'Kit completo de motor para Chevrolet Aveo 1.6L',
        price: 450000,
        stock: 3,
        category: 'Motor',
        status: false,
        image: 'https://images.unsplash.com/photo-1633281256183-c0f106f70d76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBwYXJ0cyUyMGVuZ2luZSUyMGF1dG9tb3RpdmV8ZW58MXx8fHwxNzU1NjMwNjM1fDA&ixlib=rb-4.1.0&q=80&w=1080',
        documents: [],
        images: [],
        supplyRequirements: [
          { supplyId: 4, quantity: 200, unit: 'g' },
          { supplyId: 5, quantity: 100, unit: 'ml' }
        ]
      },
      {
        id: 4,
        name: 'Amortiguador Delantero KYB',
        reference: 'AD-KYB-004',
        description: 'Amortiguador delantero KYB Gas-a-Just universal',
        price: 120000,
        stock: 6,
        category: 'Suspensión',
        status: true,
        image: 'https://images.unsplash.com/photo-1727413434026-0f8314c037d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvJTIwcGFydHMlMjBjYXIlMjByZXBhaXJ8ZW58MXx8fHwxNzU1NjMwNTE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
        documents: [],
        images: [],
        supplyRequirements: [
          { supplyId: 6, quantity: 300, unit: 'ml' }
        ]
      }
    ]);
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.status) ||
                         (statusFilter === 'inactive' && !product.status);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      id: editingProduct ? editingProduct.id : Date.now()
    };

    if (editingProduct) {
      setProducts(products.map(product =>
        product.id === editingProduct.id ? productData : product
      ));
    } else {
      setProducts([...products, productData]);
    }
    resetForm();
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      reference: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      status: true,
      image: '',
      documents: [],
      images: [],
      supplyRequirements: []
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleEdit = (product) => {
    setProductForm(product);
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter(product => product.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setProducts(products.map(product =>
      product.id === id ? { ...product, status: !product.status } : product
    ));
  };

  const viewDetails = (product) => {
    setViewingProduct(product);
    setShowDetailModal(true);
  };

  const addDocument = () => {
    const newDocument = {
      name: '',
      url: '',
      type: 'PDF'
    };
    setProductForm({
      ...productForm,
      documents: [...productForm.documents, newDocument]
    });
  };

  const removeDocument = (index) => {
    setProductForm({
      ...productForm,
      documents: productForm.documents.filter((_, i) => i !== index)
    });
  };

  const addImage = () => {
    const newImage = '';
    setProductForm({
      ...productForm,
      images: [...productForm.images, newImage]
    });
  };

  const removeImage = (index) => {
    setProductForm({
      ...productForm,
      images: productForm.images.filter((_, i) => i !== index)
    });
  };

  const addSupplyRequirement = () => {
    const newRequirement = {
      supplyId: newSupplyRequirement.supplyId,
      quantity: parseFloat(newSupplyRequirement.quantity),
      unit: newSupplyRequirement.unit
    };
    setProductForm({
      ...productForm,
      supplyRequirements: [...productForm.supplyRequirements, newRequirement]
    });
    setNewSupplyRequirement({ supplyId: '', quantity: '', unit: 'ml' });
  };

  const removeSupplyRequirement = (index) => {
    setProductForm({
      ...productForm,
      supplyRequirements: productForm.supplyRequirements.filter((_, i) => i !== index)
    });
  };

  // Función para convertir unidades
  const convertToDisplayUnit = (quantity, unit) => {
    if (unit === 'g' && quantity >= 1000) {
      return `${(quantity / 1000).toFixed(2)} kg`;
    } else if (unit === 'mg' && quantity >= 1000) {
      return `${(quantity / 1000).toFixed(2)} g`;
    }
    return `${quantity} ${unit}`;
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPageNumbers = () => {
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

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Productos</h1>
          <p className="text-blue-800">Administra el catálogo completo de productos con sus requerimientos de insumos</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar productos por nombre o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant={view === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('table')}
                className={view === 'table' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('grid')}
                className={view === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <Package className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {view === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-900 border-b border-blue-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-black font-semibold">Producto</th>        
                    <th className="text-left py-4 px-6 text-black font-semibold">Precio / Stock</th>
                    <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            <ImageWithFallback
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                              {product.name}
                            </span>
                             <span className="text-sm text-blue-900">
                              Ref: {product.reference}
                            </span>
                          </div>
                        </div>
                      </td>
                        <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-blue-900 font-semibold">
                            ${product.price.toLocaleString()}
                          </span>
                           <span className="text-sm text-blue-900">
                            Stock: {product.stock} und
                          </span>
                        </div>
                      </td>
                                            
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                      <Button
                      size="sm"
                      onClick={() => viewDetails(product)}
                      className="bg-white text-blue-900 border border-black hover:shadow-md hover:bg-blue-50 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="bg-white text-blue-900 border border-black hover:shadow-md hover:bg-blue-50 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="bg-white text-blue-900 border border-black hover:shadow-md hover:bg-blue-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No se encontraron productos
                </div>
              )}
            </div>
            
            {/* Paginación */}
            {filteredProducts.length > 0 && (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-48">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant={product.stock > 10 ? 'default' : product.stock > 5 ? 'secondary' : 'destructive'}
                  >
                    {product.stock} und
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {product.reference}
                  </code>
                </div>
                <h3 className="text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg text-blue-600">${product.price.toLocaleString()}</span>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDetails(product)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1 text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Modifica la información del producto en el formulario a continuación.' 
                : 'Completa el formulario para agregar un nuevo producto al catálogo.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Tabs defaultValue="basic" className="w-full">
              <div className="border-b border-gray-200 mb-8">
                <TabsList className="w-full justify-start bg-transparent p-0 border-0 gap-8">
                  <TabsTrigger 
                    value="basic" 
                    className="px-0 py-4 border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Información Básica
                  </TabsTrigger>
                  <TabsTrigger 
                    value="media" 
                    className="px-0 py-4 border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Imágenes y Documentos
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="basic" className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Nombre del producto</label>
                    <Input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Referencia</label>
                    <Input
                      type="text"
                      value={productForm.reference}
                      onChange={(e) => setProductForm({...productForm, reference: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Categoría</label>
                    <Select 
                      value={productForm.category} 
                      onValueChange={(value) => setProductForm({...productForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Descripción</label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Precio</label>
                    <Input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Stock</label>
                    <Input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Estado</label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={productForm.status}
                        onCheckedChange={(checked) => setProductForm({...productForm, status: checked})}
                      />
                      <span className="text-sm text-gray-600">
                        {productForm.status ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">URL de imagen principal</label>
                  <Input
                    type="url"
                    value={productForm.image}
                    onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                {/* Sección de Insumos Requeridos */}
                <div className="pt-6 border-t">
                  <h3 className="text-lg text-gray-900 mb-4 flex items-center">
                    <FlaskConical className="w-5 h-5 mr-2 text-purple-600" />
                    Insumos Requeridos
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Define los insumos necesarios y sus cantidades para producir una unidad de este producto</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                    <div className="md:col-span-6">
                      <label className="block text-sm text-gray-700 mb-2">Insumo</label>
                      <Select
                        value={newSupplyRequirement.supplyId}
                        onValueChange={(value) => setNewSupplyRequirement({...newSupplyRequirement, supplyId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar insumo" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplies.map(supply => (
                            <SelectItem key={supply.id} value={supply.id.toString()}>
                              {supply.name} ({supply.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm text-gray-700 mb-2">Cantidad</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={newSupplyRequirement.quantity}
                        onChange={(e) => setNewSupplyRequirement({...newSupplyRequirement, quantity: e.target.value})}
                        placeholder="0.000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-2">Unidad</label>
                      <Select
                        value={newSupplyRequirement.unit}
                        onValueChange={(value) => setNewSupplyRequirement({...newSupplyRequirement, unit: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="l">l</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        onClick={addSupplyRequirement}
                        disabled={!newSupplyRequirement.supplyId || !newSupplyRequirement.quantity}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {productForm.supplyRequirements?.map((req, index) => {
                      const supply = supplies.find(s => s.id.toString() === req.supplyId.toString());
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center space-x-3">
                            <FlaskConical className="w-4 h-4 text-purple-600" />
                            <div>
                              <span className="text-gray-900">{supply?.name || 'Insumo desconocido'}</span>
                              <div className="text-sm text-gray-600">
                                {req.quantity} {req.unit} por unidad de producto
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSupplyRequirement(index)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                    {(!productForm.supplyRequirements || productForm.supplyRequirements.length === 0) && (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                        <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No hay insumos requeridos configurados</p>
                        <p className="text-sm">Agrega los insumos necesarios para producir este producto</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-6 mt-8">
                <div>
                  <h3 className="text-lg text-gray-900 mb-4">Imágenes Adicionales</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Arrastra imágenes aquí o haz clic para subir</p>
                    <Button type="button" variant="outline" onClick={addImage}>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Imágenes
                    </Button>
                  </div>
                  <div className="space-y-2 mt-4">
                    {productForm.images.map((image, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <ImageIcon className="w-4 h-4 text-gray-600" />
                          <div>
                            <span className="text-gray-900">Imagen {index + 1}</span>
                            <div className="text-sm text-gray-600">
                              {image}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg text-gray-900 mb-4">Documentos</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Sube manuales, certificados o documentos técnicos</p>
                    <Button type="button" variant="outline" onClick={addDocument}>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Documentos
                    </Button>
                  </div>
                  <div className="space-y-2 mt-4">
                    {productForm.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <div>
                            <span className="text-gray-900">{doc.name}</span>
                            <div className="text-sm text-gray-600">
                              {doc.url}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription>
              Información completa del producto seleccionado.
            </DialogDescription>
          </DialogHeader>

          {viewingProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                    <ImageWithFallback
                      src={viewingProduct.image}
                      alt={viewingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl text-gray-900 mb-2">{viewingProduct.name}</h2>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                      {viewingProduct.reference}
                    </code>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">{viewingProduct.category}</Badge>
                    <Badge variant={viewingProduct.status ? 'default' : 'destructive'}>
                      {viewingProduct.status ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">{viewingProduct.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Precio</p>
                      <p className="text-2xl text-blue-600">${viewingProduct.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Stock</p>
                      <p className="text-2xl text-gray-900">{viewingProduct.stock} und</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Especificaciones Técnicas con Consumo de Insumos */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Scale className="w-5 h-5 mr-2 text-blue-600" />
                      Especificaciones Técnicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingProduct.specifications?.map((spec, index) => (
                        <div key={index} className="border border-gray-200 rounded p-3">
                          <p className="text-sm text-gray-500">{spec.name}</p>
                          <p className="text-gray-900">{spec.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sección de Insumos Requeridos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FlaskConical className="w-5 h-5 mr-2 text-purple-600" />
                      Consumo de Insumos por Unidad Producida
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewingProduct.supplyRequirements && viewingProduct.supplyRequirements.length > 0 ? (
                      <div className="space-y-3">
                        {viewingProduct.supplyRequirements.map((req, index) => {
                          const supply = supplies.find(s => s.id.toString() === req.supplyId.toString());
                          return (
                          <div key={index} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <FlaskConical className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-gray-900">{supply?.name || 'Insumo desconocido'}</p>
                                <p className="text-sm text-gray-600">
                                  Consumo: {convertToDisplayUnit(req.quantity, req.unit)} por unidad
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-purple-600 border-purple-300">
                                {req.quantity} {req.unit}
                              </Badge>
                            </div>
                          </div>
                          );
                        })}

                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm text-blue-800 mb-2">📊 Resumen de Producción</h4>
                          <p className="text-sm text-blue-700">
                            Para producir <strong>10 unidades</strong> de este producto se requiere:
                          </p>
                          <ul className="text-sm text-blue-700 mt-2 space-y-1">
                            {viewingProduct.supplyRequirements.map((req, index) => {
                              const supply = supplies.find(s => s.id.toString() === req.supplyId.toString());
                              return (
                              <li key={index} className="flex justify-between">
                                <span>• {supply?.name || 'Insumo desconocido'}:</span>
                                <span>{convertToDisplayUnit(req.quantity * 10, req.unit)}</span>
                              </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No hay insumos configurados para este producto</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowDetailModal(false)} className="flex-1">
                  Cerrar
                </Button>
                <Button onClick={() => { handleEdit(viewingProduct); setShowDetailModal(false); }} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Editar Producto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}