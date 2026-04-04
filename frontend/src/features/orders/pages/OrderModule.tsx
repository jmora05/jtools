// ped
import React, { useState, useEffect } from 'react';
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
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from 'sonner@2.0.3';
import { 
  PlusIcon, 
  SearchIcon, 
  ShoppingCartIcon, 
  EyeIcon, 
  XIcon, 
  EditIcon, 
  ClipboardIcon, 
  PackageIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  RotateCcwIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  MinusIcon,
  UserIcon
} from 'lucide-react';

export function OrderModule() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderModalOpen, setIsViewOrderModalOpen] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [orderForm, setOrderForm] = useState({
    clientId: '',
    clientName: '',
    clientDocument: '',
    clientPhone: '',
    deliveryAddress: '',
    deliveryCity: 'Medellín',
    deliveryInstructions: '',
    paymentMethod: 'Efectivo',
    status: 'completo',
    items: [],
    notes: ''
  });

  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Mock data initialization
  useEffect(() => {
    // Initialize mock orders
    const mockOrders = [
      {
        id: 'ORD-2024-001',
        clientName: 'Carlos Medina',
        orderType: 'Pedido',
        status: 'Completo',
        isCompleted: false,
        total: 320000,
        date: '2024-01-15',
        items: 3,
        contactPhone: '300 123 4567',
        deliveryAddress: 'Calle 123 #45-67',
        notes: 'Entregar en horario de oficina'
      },
      {
        id: 'ORD-2024-002',
        clientName: 'Auto Servicio López',
        orderType: 'Pedido',
        status: 'Completo',
        isCompleted: true,
        total: 850000,
        date: '2024-01-14',
        items: 8,
        contactPhone: '301 987 6543',
        deliveryAddress: 'Carrera 80 #56-23',
        notes: 'Entregado satisfactoriamente'
      },
      {
        id: 'ORD-2024-003',
        clientName: 'María González',
        orderType: 'Pedido',
        status: 'Completo',
        isCompleted: false,
        total: 450000,
        date: '2024-01-13',
        items: 5,
        contactPhone: '302 456 7890',
        deliveryAddress: 'Carrera 50 #34-12',
        notes: ''
      },
      {
        id: 'ORD-2024-004',
        clientName: 'Taller Mecánico El Buen Motor',
        orderType: 'Pedido',
        status: 'Completo',
        isCompleted: true,
        total: 1200000,
        date: '2024-01-10',
        items: 12,
        contactPhone: '303 567 8901',
        deliveryAddress: 'Avenida 80 #25-90',
        notes: 'Pedido entregado satisfactoriamente'
      },
      {
        id: 'ORD-2024-005',
        clientName: 'Roberto Sánchez',
        orderType: 'Pedido',
        status: 'Completo',
        isCompleted: false,
        total: 675000,
        date: '2024-01-12',
        items: 7,
        contactPhone: '304 678 9012',
        deliveryAddress: 'Calle 70 #23-45',
        notes: 'Cliente solicita llamar antes de entregar'
      },
      {
        id: 'ORD-2024-006',
        clientName: 'Diana Ramírez',
        orderType: 'Pedido',
        status: 'Completo',
        isCompleted: true,
        total: 280000,
        date: '2024-01-08',
        items: 4,
        contactPhone: '305 789 0123',
        deliveryAddress: 'Carrera 65 #45-12',
        notes: ''
      },
      {
        id: 'ORD-2024-007',
        clientName: 'Andrés Castro',
        orderType: 'Pedido',
        status: 'Completo',
        isCompleted: false,
        total: 920000,
        date: '2024-01-11',
        items: 9,
        contactPhone: '306 890 1234',
        deliveryAddress: 'Calle 52 #67-89',
        notes: ''
      },
      {
        id: 'ORD-2024-008',
        clientName: 'Luis Fernando Vélez',
        orderType: 'Pedido',
        status: 'Cancelado',
        isCompleted: false,
        total: 540000,
        date: '2024-01-09',
        items: 6,
        contactPhone: '307 123 4567',
        deliveryAddress: 'Carrera 43 #12-34',
        notes: 'Anulado por el cliente',
        cancelReason: 'Cliente solicitó anulación - cambió de proveedor',
        cancelledAt: '2024-01-10'
      }
    ];
    
    setOrders(mockOrders);

    // Initialize mock products
    setProducts([
      { id: 1, name: 'Filtro de Aceite Toyota', code: 'FO-TOY-001', price: 25000, stock: 15, category: 'Filtros' },
      { id: 2, name: 'Pastillas de Freno Honda', code: 'PF-HON-002', price: 85000, stock: 8, category: 'Frenos' },
      { id: 3, name: 'Amortiguador Delantero', code: 'AM-DEL-003', price: 150000, stock: 5, category: 'Suspensión' },
      { id: 4, name: 'Bujía NGK', code: 'BU-NGK-004', price: 12000, stock: 30, category: 'Sistema eléctrico' },
      { id: 5, name: 'Correa de Distribución', code: 'CD-UNI-005', price: 95000, stock: 12, category: 'Motor' }
    ]);

    // Initialize mock clients
    setClients([
      { id: 'CLI-2024-001', name: 'Carlos Medina', document: 'CC 123456789', phone: '300 123 4567' },
      { id: 'CLI-2024-002', name: 'Auto Servicio López', document: 'NIT 987654321', phone: '301 987 6543' },
      { id: 'CLI-2024-003', name: 'María González', document: 'CC 111222333', phone: '302 456 7890' },
      { id: 'CLI-2024-004', name: 'Taller Mecánico El Buen Motor', document: 'NIT 444555666', phone: '303 567 8901' },
      { id: 'CLI-2024-005', name: 'Roberto Sánchez', document: 'CC 555666777', phone: '304 678 9012' },
      { id: 'CLI-2024-006', name: 'Diana Ramírez', document: 'CC 666777888', phone: '305 789 0123' },
      { id: 'CLI-2024-007', name: 'Andrés Castro', document: 'CC 777888999', phone: '306 890 1234' },
      { id: 'CLI-2024-008', name: 'Luis Fernando Vélez', document: 'CC 888999000', phone: '307 123 4567' }
    ]);
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

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

  const handleCreateOrder = (e) => {
    e.preventDefault();
    
    if (!orderForm.clientName.trim()) {
      toast.error('Debes ingresar el nombre del cliente');
      return;
    }
    
    if (orderForm.items.length === 0) {
      toast.error('Debe agregar al menos un producto al pedido');
      return;
    }

    const subtotal = orderForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * 0.19;
    const total = subtotal + taxAmount;

    const newOrder = {
      id: `ORD-2024-${String(orders.length + 1).padStart(3, '0')}`,
      clientName: orderForm.clientName,
      orderType: 'Pedido',
      status: 'Pendiente',
      isCompleted: false,
      total: Math.round(total),
      date: new Date().toISOString().split('T')[0],
      items: orderForm.items.length,
      contactPhone: orderForm.clientPhone,
      deliveryAddress: orderForm.deliveryAddress,
      notes: orderForm.notes
    };

    setOrders([newOrder, ...orders]);

    resetOrderForm();
    setIsNewOrderDialogOpen(false);
    
    toast.success(`Pedido creado exitosamente: ${newOrder.id}`);
  };

  const resetOrderForm = () => {
    setOrderForm({
      clientId: '',
      clientName: '',
      clientDocument: '',
      clientPhone: '',
      deliveryAddress: '',
      deliveryCity: 'Medellín',
      deliveryInstructions: '',
      paymentMethod: 'Efectivo',
      status: 'Pendiente',
      items: [],
      notes: ''
    });
    setProductSearch('');
    setClientSearch('');
  };

  const addProductToOrder = (product) => {
    const existingItem = orderForm.items.find(item => item.id === product.id);
    if (existingItem) {
      setOrderForm({
        ...orderForm,
        items: orderForm.items.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      setOrderForm({
        ...orderForm,
        items: [...orderForm.items, {
          id: product.id,
          name: product.name,
          code: product.code,
          price: product.price,
          quantity: 1
        }]
      });
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setOrderForm({
        ...orderForm,
        items: orderForm.items.filter(item => item.id !== itemId)
      });
    } else {
      setOrderForm({
        ...orderForm,
        items: orderForm.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      });
    }
  };

  const removeItemFromOrder = (itemId) => {
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter(item => item.id !== itemId)
    });
  };

  const handleViewDetail = (order) => {
    setSelectedOrderForView(order);
    setIsViewOrderModalOpen(true);
  };

  const handleEdit = (order) => {
    setSelectedOrderForEdit(order);
    setOrderForm({
      clientId: order.clientId || '',
      clientName: order.clientName,
      clientDocument: order.clientDocument || '',
      clientPhone: order.contactPhone || '',
      deliveryAddress: order.deliveryAddress || '',
      deliveryCity: order.deliveryCity || 'Medellín',
      deliveryInstructions: order.deliveryInstructions || '',
      paymentMethod: order.paymentMethod || 'Efectivo',
      status: order.status,
      items: [],
      notes: order.notes || ''
    });
    setIsEditOrderDialogOpen(true);
  };

  const handleUpdateOrder = (e) => {
    e.preventDefault();
    
    if (!orderForm.clientName.trim()) {
      toast.error('Debes ingresar el nombre del cliente');
      return;
    }

    setOrders(orders.map(ord => 
      ord.id === selectedOrderForEdit.id 
        ? { 
            ...ord,
            clientName: orderForm.clientName,
            contactPhone: orderForm.clientPhone,
            deliveryAddress: orderForm.deliveryAddress,
            status: orderForm.status,
            notes: orderForm.notes
          } 
        : ord
    ));
    
    toast.success('Pedido actualizado exitosamente');
    setIsEditOrderDialogOpen(false);
    setSelectedOrderForEdit(null);
    resetOrderForm();
  };

  const handleCancel = (order) => {
    setOrderToCancel(order);
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    if (orderToCancel) {
      if (!cancelReason.trim()) {
        toast.error('Por favor indica el motivo de cancelación');
        return;
      }

      setOrders(orders.map(ord => 
        ord.id === orderToCancel.id 
          ? { 
              ...ord, 
              status: 'Cancelado',
              isCompleted: false,
              cancelReason: cancelReason,
              cancelledAt: new Date().toISOString().split('T')[0]
            } 
          : ord
      ));
      
      toast.success('Pedido cancelado exitosamente');
      setShowCancelDialog(false);
      setOrderToCancel(null);
      setCancelReason('');
    }
  };

  const handleViewPDF = (order) => {
    // Simulación de generación de PDF
    toast.success(`Generando PDF para ${order.id}...`);
    
    // En producción aquí se generaría el PDF real
    setTimeout(() => {
      toast.success(`PDF generado exitosamente`);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-blue-50 text-blue-700 border-blue-5';
      case 'Completo': return 'bg-blue-100 text-blue-700 border-blue-5';
      case 'Cancelado': return 'bg-gray-100 text-gray-700 border-gray-5';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Gestión de Pedidos</h1>
            <p className="text-gray-600">Administra pedidos y cotizaciones de clientes</p>
          </div>
          
          <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Pedido / Cotización
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full w-screen h-screen m-0 p-0 rounded-none flex flex-col">
              <DialogHeader className="border-b border-gray-200 pb-5 px-8 pt-8 flex-shrink-0">
                <DialogTitle className="text-3xl text-center text-gray-900">Nuevo Pedido / Cotización</DialogTitle>
                <DialogDescription className="text-center">
                  Completa el formulario para crear un nuevo pedido o cotización.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateOrder} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-8 py-8">
                  <div className="space-y-8 max-w-7xl mx-auto">
                    {/* Carrito de Compra */}
                    <Card className="shadow-2xl border-2 border-blue-100">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg border-b-2 border-blue-300 py-6 px-8">
                        <CardTitle className="text-2xl flex items-center text-blue-900">
                          <ShoppingCartIcon className="w-5 h-5 mr-2" />
                          Carrito de Pedido
                          {orderForm.items.length > 0 && (
                            <Badge className="ml-2 bg-blue-600 text-white">
                              {orderForm.items.reduce((sum, item) => sum + item.quantity, 0)} items
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="p-0">
                        <div className="space-y-6">
                          {/* Selección de Productos */}
                          <div className="p-8 border-b border-gray-200">
                            <div className="space-y-5">
                              <div className="space-y-2">
                                <Label htmlFor="productSearch" className="text-base">🔍 Buscar Productos</Label>
                                <div className="relative">
                                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                  <Input
                                    id="productSearch"
                                    placeholder="Buscar por nombre o código..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-12 h-12 text-base"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-3 border rounded-lg p-4 bg-gray-50">
                                {filteredProducts.map(product => (
                                  <Card key={product.id} className="border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all">
                                    <CardContent className="p-5">
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                          <div className="space-y-1 flex-1">
                                            <h4 className="text-base text-gray-900">{product.name}</h4>
                                            <p className="text-sm text-gray-500">{product.code}</p>
                                            <Badge variant="outline" className="text-xs">
                                              {product.category}
                                            </Badge>
                                          </div>
                                          <div className="text-right ml-3">
                                            <Badge variant="secondary" className="text-blue-600 mb-2 text-sm px-3 py-1">
                                              ${product.price.toLocaleString()}
                                            </Badge>
                                            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          size="default"
                                          variant="outline"
                                          onClick={() => addProductToOrder(product)}
                                          className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 h-10"
                                        >
                                          <PlusIcon className="w-4 h-4 mr-2" />
                                          Agregar
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Lista de Items en el Carrito */}
                          <div className="space-y-3 p-8 border-b border-gray-200 bg-gray-50">
                            {orderForm.items.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No hay productos en el carrito</p>
                                <p className="text-sm">Busca y agrega productos arriba</p>
                              </div>
                            ) : (
                              orderForm.items.map(item => (
                                <div key={item.id} className="bg-white rounded-lg p-3 border">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <h4 className="text-sm text-gray-900">{item.name}</h4>
                                      <p className="text-xs text-gray-500">{item.code}</p>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeItemFromOrder(item.id)}
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 w-8 h-8 p-0"
                                    >
                                      <XIcon className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 p-0 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                                      >
                                        -
                                      </Button>
                                      <span className="text-sm w-10 text-center bg-white px-2 py-1 border rounded">{item.quantity}</span>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 p-0 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                                      >
                                        +
                                      </Button>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-900">${(item.quantity * item.price).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Resumen Total */}
                          {orderForm.items.length > 0 && (
                            <div className="px-8 pb-8">
                              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                                <div className="space-y-3">
                                  <div className="flex justify-between text-base">
                                    <span className="text-gray-700">Subtotal:</span>
                                    <span className="text-gray-900">
                                      ${orderForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-base">
                                    <span className="text-gray-700">IVA (19%):</span>
                                    <span className="text-gray-900">
                                      ${Math.round(orderForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0) * 0.19).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="border-t-2 border-blue-300 pt-3 flex justify-between text-xl">
                                    <span className="text-gray-900">Total:</span>
                                    <span className="text-blue-600">
                                      ${Math.round(orderForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0) * 1.19).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Información del Cliente */}
                    <Card className="shadow-lg border-2 border-gray-100">
                      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <CardTitle className="text-xl text-gray-900">👤 Información del Cliente</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5 pt-8 px-10 pb-10">
                        <div className="space-y-2">
                          <Label htmlFor="clientName" className="text-sm">Nombre Completo *</Label>
                          <Input
                            id="clientName"
                            placeholder="Juan Pérez"
                            value={orderForm.clientName}
                            onChange={(e) => setOrderForm({...orderForm, clientName: e.target.value})}
                            required
                            className="h-12 text-base"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="documentType" className="text-sm">Tipo de Documento</Label>
                            <Select 
                              value={orderForm.documentType} 
                              onValueChange={(value) => setOrderForm({...orderForm, documentType: value})}
                            >
                              <SelectTrigger id="documentType" className="h-12">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                <SelectItem value="NIT">NIT</SelectItem>
                                <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="documentNumber" className="text-sm">Número de Documento</Label>
                            <Input
                              id="documentNumber"
                              placeholder="Escribir número..."
                              value={orderForm.documentNumber}
                              onChange={(e) => setOrderForm({...orderForm, documentNumber: e.target.value})}
                              className="h-12 text-base"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="contactPhone" className="text-sm">Teléfono Principal *</Label>
                            <Input
                              id="contactPhone"
                              placeholder="300 123 4567"
                              value={orderForm.contactPhone}
                              onChange={(e) => setOrderForm({...orderForm, contactPhone: e.target.value})}
                              required
                              className="h-12 text-base"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm">Correo Electrónico</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="cliente@email.com"
                              value={orderForm.email}
                              onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
                              className="h-12 text-base"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dirección de Entrega */}
                    <Card className="shadow-lg border-2 border-gray-100">
                      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <CardTitle className="text-xl text-gray-900">🚚 Dirección de Entrega</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5 pt-8 px-10 pb-10">
                        <div className="space-y-2">
                          <Label htmlFor="deliveryAddress" className="text-sm">Dirección *</Label>
                          <Input
                            id="deliveryAddress"
                            placeholder="Calle 123 #45-67"
                            value={orderForm.deliveryAddress}
                            onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                            required
                            className="h-12 text-base"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="deliveryCity" className="text-sm">Ciudad</Label>
                            <Input
                              id="deliveryCity"
                              placeholder="Medellín"
                              value={orderForm.deliveryCity}
                              onChange={(e) => setOrderForm({...orderForm, deliveryCity: e.target.value})}
                              className="h-12 text-base"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="deliveryNeighborhood" className="text-sm">Barrio</Label>
                            <Input
                              id="deliveryNeighborhood"
                              placeholder="El Poblado"
                              value={orderForm.deliveryNeighborhood}
                              onChange={(e) => setOrderForm({...orderForm, deliveryNeighborhood: e.target.value})}
                              className="h-12 text-base"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="deliveryInstructions" className="text-sm">Instrucciones de Entrega</Label>
                          <Textarea
                            id="deliveryInstructions"
                            placeholder="Portería, piso, referencias adicionales..."
                            value={orderForm.deliveryInstructions}
                            onChange={(e) => setOrderForm({...orderForm, deliveryInstructions: e.target.value})}
                            rows={3}
                            className="text-base"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notas y Observaciones */}
                    <Card className="shadow-lg border-2 border-gray-100">
                      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <CardTitle className="text-xl text-gray-900">📝 Notas y Observaciones</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5 pt-8 px-10 pb-10">
                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm">Notas del Pedido</Label>
                          <Textarea
                            id="notes"
                            placeholder="Instrucciones especiales, comentarios adicionales..."
                            value={orderForm.notes}
                            onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                            rows={4}
                            className="text-base"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Botones de Acción - Footer Fijo */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-6 border-t border-gray-200 bg-white px-8 py-6 shadow-lg">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetOrderForm();
                      setIsNewOrderDialogOpen(false);
                    }}
                    className="flex-1 h-14 border-gray-300 hover:bg-gray-100 text-base"
                  >
                    <RotateCcwIcon className="w-5 h-5 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-lg shadow-md"
                    disabled={orderForm.items.length === 0}
                  >
                    <ShoppingCartIcon className="w-5 h-5 mr-2" />
                    Crear Pedido
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar pedidos por cliente o número de pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Completo">Completo</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-gray-600 text-center sm:text-left">
              {filteredOrders.length} pedido(s)
            </span>
          </div>
        </Card>

        {/* Tabla de Pedidos */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <PackageIcon className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-gray-900">No se encontraron pedidos</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => (
                    <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${order.status === 'Anulado' || order.status === 'Cancelado' ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm text-blue-600">{order.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{order.clientName}</div>
                        <div className="text-sm text-gray-500">{order.contactPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{order.date}</div>
                        
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">${order.total.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{order.items} productos</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(order)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver detalles</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(order)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar pedido</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPDF(order)}
                                className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-blue-50"
                              >
                                <FileTextIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver PDF</p></TooltipContent>
                          </Tooltip>

                          {order.status !== 'Anulado' && order.status !== 'Cancelado' && order.status !== 'Completo' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancel(order)}
                                  className="text-blue-900 hover:text-blue-900 border-blue-900 hover:border-blue-900 hover:bg-red-50"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Cancelar pedido</p></TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filteredOrders.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
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
                        className={currentPage === page ? "bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]" : "min-w-[32px]"}
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
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* View Order Modal */}
        <Dialog open={isViewOrderModalOpen} onOpenChange={setIsViewOrderModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Detalles del {selectedOrderForView?.orderType} #{selectedOrderForView?.id}
              </DialogTitle>
              <DialogDescription>
                Información completa del pedido
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrderForView && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Cliente:</p>
                        <p className="text-gray-900">{selectedOrderForView.clientName}</p>
                      </div>
                      {selectedOrderForView.contactPhone && (
                        <div>
                          <p className="text-sm text-gray-500">Teléfono:</p>
                          <p className="text-gray-900">{selectedOrderForView.contactPhone}</p>
                        </div>
                      )}
                      {selectedOrderForView.deliveryAddress && (
                        <div>
                          <p className="text-sm text-gray-500">Dirección de Entrega:</p>
                          <p className="text-gray-900">{selectedOrderForView.deliveryAddress}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información del Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Estado:</p>
                        <Badge className={getStatusColor(selectedOrderForView.status)}>
                          {selectedOrderForView.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fecha:</p>
                        <p className="text-gray-900">{selectedOrderForView.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Items:</p>
                        <p className="text-gray-900">{selectedOrderForView.items} productos</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total:</p>
                        <p className="text-blue-600 text-xl">${selectedOrderForView.total.toLocaleString()}</p>
                      </div>
                      {selectedOrderForView.validUntil && (
                        <div>
                          <p className="text-sm text-gray-500">Válida hasta:</p>
                          <p className="text-blue-600">{selectedOrderForView.validUntil}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {selectedOrderForView.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notas y Observaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedOrderForView.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {(selectedOrderForView.status === 'Anulado' || selectedOrderForView.status === 'Cancelado') && selectedOrderForView.cancelReason && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                        <XCircleIcon className="w-5 h-5" />
                        Información de Cancelación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-blue-600">Motivo de Cancelación:</p>
                        <p className="text-gray-900 mt-1">{selectedOrderForView.cancelReason}</p>
                      </div>
                      {selectedOrderForView.cancelledAt && (
                        <div>
                          <p className="text-sm text-blue-600">Fecha de Cancelación:</p>
                          <p className="text-gray-900 mt-1">{selectedOrderForView.cancelledAt}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Order Modal */}
        <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => {
          setIsEditOrderDialogOpen(open);
          if (!open) {
            setSelectedOrderForEdit(null);
            resetOrderForm();
          }
        }}>
          <DialogContent className="max-w-full w-screen h-screen m-0 p-0 rounded-none flex flex-col">
            <DialogHeader className="border-b border-gray-200 pb-5 px-8 pt-8 flex-shrink-0">
              <DialogTitle className="text-3xl text-center text-gray-900">
                Editar Pedido #{selectedOrderForEdit?.id}
              </DialogTitle>
              <DialogDescription className="text-center">
                Modifica la información del pedido y su estado.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdateOrder} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="space-y-8 max-w-7xl mx-auto">
                  {/* Información del Cliente */}
                  <Card className="shadow-lg border-2 border-gray-100">
                    <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                      <CardTitle className="text-xl text-gray-900">👤 Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-8 px-10 pb-10">
                      <div className="space-y-2">
                        <Label htmlFor="editClientName" className="text-sm">Nombre Completo *</Label>
                        <Input
                          id="editClientName"
                          placeholder="Juan Pérez"
                          value={orderForm.clientName}
                          onChange={(e) => setOrderForm({...orderForm, clientName: e.target.value})}
                          required
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="editDocumentType" className="text-sm">Tipo de Documento</Label>
                          <Select 
                            value={orderForm.documentType} 
                            onValueChange={(value) => setOrderForm({...orderForm, documentType: value})}
                          >
                            <SelectTrigger id="editDocumentType" className="h-12">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                              <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                              <SelectItem value="NIT">NIT</SelectItem>
                              <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="editDocumentNumber" className="text-sm">Número de Documento</Label>
                          <Input
                            id="editDocumentNumber"
                            placeholder="Escribir número..."
                            value={orderForm.documentNumber}
                            onChange={(e) => setOrderForm({...orderForm, documentNumber: e.target.value})}
                            className="h-12 text-base"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="editContactPhone" className="text-sm">Teléfono Principal *</Label>
                          <Input
                            id="editContactPhone"
                            placeholder="300 123 4567"
                            value={orderForm.clientPhone}
                            onChange={(e) => setOrderForm({...orderForm, clientPhone: e.target.value})}
                            required
                            className="h-12 text-base"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="editEmail" className="text-sm">Correo Electrónico</Label>
                          <Input
                            id="editEmail"
                            type="email"
                            placeholder="cliente@email.com"
                            value={orderForm.email}
                            onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
                            className="h-12 text-base"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dirección de Entrega */}
                  <Card className="shadow-lg border-2 border-gray-100">
                    <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                      <CardTitle className="text-xl text-gray-900">🚚 Dirección de Entrega</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-8 px-10 pb-10">
                      <div className="space-y-2">
                        <Label htmlFor="editDeliveryAddress" className="text-sm">Dirección *</Label>
                        <Input
                          id="editDeliveryAddress"
                          placeholder="Calle 123 #45-67"
                          value={orderForm.deliveryAddress}
                          onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                          required
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="editDeliveryCity" className="text-sm">Ciudad</Label>
                          <Input
                            id="editDeliveryCity"
                            placeholder="Medellín"
                            value={orderForm.deliveryCity}
                            onChange={(e) => setOrderForm({...orderForm, deliveryCity: e.target.value})}
                            className="h-12 text-base"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="editDeliveryNeighborhood" className="text-sm">Barrio</Label>
                          <Input
                            id="editDeliveryNeighborhood"
                            placeholder="El Poblado"
                            value={orderForm.deliveryNeighborhood}
                            onChange={(e) => setOrderForm({...orderForm, deliveryNeighborhood: e.target.value})}
                            className="h-12 text-base"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editDeliveryInstructions" className="text-sm">Instrucciones de Entrega</Label>
                        <Textarea
                          id="editDeliveryInstructions"
                          placeholder="Portería, piso, referencias adicionales..."
                          value={orderForm.deliveryInstructions}
                          onChange={(e) => setOrderForm({...orderForm, deliveryInstructions: e.target.value})}
                          rows={3}
                          className="text-base"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estado del Pedido */}
                  <Card className="shadow-2xl border-2 border-blue-100">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg border-b-2 border-blue-300 py-6 px-8">
                      <CardTitle className="text-2xl flex items-center text-blue-900">
                        <PackageIcon className="w-5 h-5 mr-2" />
                        Estado del Pedido
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-8 px-10 pb-10">
                      <div className="space-y-2">
                        <Label htmlFor="editOrderStatus" className="text-base">Estado del Pedido *</Label>
                        <Select
                          value={orderForm.status}
                          onValueChange={(value) => setOrderForm({...orderForm, status: value})}
                        >
                          <SelectTrigger id="editOrderStatus" className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                            <SelectItem value="Completo">Completo</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Indicador Visual del Estado */}
                      <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Estado actual:</span>
                          <Badge className={getStatusColor(orderForm.status)}>
                            {orderForm.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notas y Observaciones */}
                  <Card className="shadow-lg border-2 border-gray-100">
                    <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                      <CardTitle className="text-xl text-gray-900">📝 Notas y Observaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-8 px-10 pb-10">
                      <div className="space-y-2">
                        <Label htmlFor="editNotes" className="text-sm">Notas del Pedido</Label>
                        <Textarea
                          id="editNotes"
                          placeholder="Instrucciones especiales, comentarios adicionales..."
                          value={orderForm.notes}
                          onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                          rows={4}
                          className="text-base"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Botones de Acción - Footer Fijo */}
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-6 border-t border-gray-200 bg-white px-8 py-6 shadow-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditOrderDialogOpen(false);
                    setSelectedOrderForEdit(null);
                    resetOrderForm();
                  }}
                  className="flex-1 h-14 border-gray-300 hover:bg-gray-100 text-base"
                >
                  <RotateCcwIcon className="w-5 h-5 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-lg shadow-md"
                >
                  <EditIcon className="w-5 h-5 mr-2" />
                  Actualizar Pedido
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmación de Cancelación */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
                <AlertTriangleIcon className="w-5 h-5" />
                Cancelar Pedido
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>¿Estás seguro de que deseas cancelar este pedido?</p>
                {orderToCancel && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Pedido: </span>
                        <span className="text-sm text-gray-900">
                          {orderToCancel.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Cliente: </span>
                        <span className="text-sm text-gray-900">
                          {orderToCancel.clientName}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total: </span>
                        <span className="text-sm text-gray-900">
                          ${orderToCancel.total.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Estado actual: </span>
                        <Badge className={getStatusColor(orderToCancel.status)}>
                          {orderToCancel.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="cancelReason">Motivo de Cancelación *</Label>
                  <Textarea
                    id="cancelReason"
                    placeholder="Indica el motivo de la cancelación del pedido..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <p className="text-sm text-blue-600">
                  El pedido no será eliminado, pero cambiará su estado a "Cancelado" y no podrá ser procesado.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setOrderToCancel(null);
                setCancelReason('');
              }}>
                Volver
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancel}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Cancelar Pedido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}