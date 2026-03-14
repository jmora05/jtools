import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner@2.0.3';
import { 
  PlusIcon, 
  SearchIcon, 
  EyeIcon, 
  EditIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  UserIcon,
  PackageIcon,
  CalendarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  ListIcon,
  ShoppingCartIcon,
  TruckIcon
} from 'lucide-react';

interface ProductionOrder {
  id: number;
  orderCode: string;
  type?: 'Pedido' | 'Venta';
  product: string;
  productCode: string;
  quantity: number;
  responsible: string;
  status: 'Pendiente' | 'En Proceso' | 'Pausada' | 'Finalizada' | 'Anulada';
  createdDate: string;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  supplies: { name: string; quantity: number; unit: string }[];
  employees: string[];
  tasks: { task: string; status: string }[];
  statusHistory: { date: string; status: string; user: string; reason?: string }[];
  createdBy: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

export function ProductionOrderModule() {
  // HU_052: Listar órdenes de producción - Estado inicial
  const [orders, setOrders] = useState<ProductionOrder[]>([
    {
      id: 1,
      orderCode: 'OP-2024-001',
      product: 'Filtro de Aceitee Premium',
      productCode: 'FAP-001',
      quantity: 500,
      responsible: 'Carlos Mendoza',
      status: 'En Proceso',
      createdDate: '2024-11-01',
      dueDate: '2024-11-15',
      startDate: '2024-11-02',
      notes: 'Producción prioritaria para cliente mayorista',
      supplies: [
        { name: 'Papel filtro especial', quantity: 500, unit: 'unidades' },
        { name: 'Adhesivo industrial', quantity: 2, unit: 'litros' }
      ],
      employees: ['Carlos Mendoza', 'Ana López', 'Roberto Sánchez'],
      tasks: [
        { task: 'Preparación de materiales', status: 'Completada' },
        { task: 'Ensamblaje', status: 'En proceso' },
        { task: 'Control de calidad', status: 'Pendiente' }
      ],
      statusHistory: [
        { date: '2024-11-01', status: 'Pendiente', user: 'Admin' },
        { date: '2024-11-02', status: 'En Proceso', user: 'Carlos Mendoza' }
      ],
      createdBy: 'Admin'
    },
    {
      id: 2,
      orderCode: 'OP-2024-002',
      product: 'Pastillas de Freno Cerámicas',
      productCode: 'PFC-002',
      quantity: 300,
      responsible: 'Ana López',
      status: 'Finalizada',
      createdDate: '2024-10-20',
      dueDate: '2024-11-05',
      startDate: '2024-10-21',
      endDate: '2024-11-04',
      supplies: [
        { name: 'Material cerámico', quantity: 150, unit: 'kg' },
        { name: 'Resina especial', quantity: 5, unit: 'litros' }
      ],
      employees: ['Ana López', 'Miguel Torres'],
      tasks: [
        { task: 'Preparación de materiales', status: 'Completada' },
        { task: 'Moldeado', status: 'Completada' },
        { task: 'Control de calidad', status: 'Completada' }
      ],
      statusHistory: [
        { date: '2024-10-20', status: 'Pendiente', user: 'Admin' },
        { date: '2024-10-21', status: 'En Proceso', user: 'Ana López' },
        { date: '2024-11-04', status: 'Finalizada', user: 'Ana López' }
      ],
      createdBy: 'Admin'
    },
    {
      id: 3,
      orderCode: 'OP-2024-003',
      product: 'Kit de Empaques Motor',
      productCode: 'KEM-003',
      quantity: 200,
      responsible: 'Roberto Sánchez',
      status: 'Pausada',
      createdDate: '2024-11-03',
      dueDate: '2024-11-20',
      startDate: '2024-11-04',
      notes: 'Pausada por falta de material',
      supplies: [
        { name: 'Caucho sintético', quantity: 50, unit: 'kg' },
        { name: 'Adhesivo para juntas', quantity: 3, unit: 'litros' }
      ],
      employees: ['Roberto Sánchez', 'Laura Fernández'],
      tasks: [
        { task: 'Preparación de materiales', status: 'Completada' },
        { task: 'Corte y moldeado', status: 'Pausada' },
        { task: 'Control de calidad', status: 'Pendiente' }
      ],
      statusHistory: [
        { date: '2024-11-03', status: 'Pendiente', user: 'Admin' },
        { date: '2024-11-04', status: 'En Proceso', user: 'Roberto Sánchez' },
        { date: '2024-11-06', status: 'Pausada', user: 'Roberto Sánchez', reason: 'Falta de material' }
      ],
      createdBy: 'Admin'
    },
    {
      id: 4,
      orderCode: 'OP-2024-004',
      product: 'Bujías de Alto Rendimiento',
      productCode: 'BAR-004',
      quantity: 1000,
      responsible: 'Miguel Torres',
      status: 'Pendiente',
      createdDate: '2024-11-07',
      dueDate: '2024-11-25',
      supplies: [
        { name: 'Electrodo de iridio', quantity: 1000, unit: 'unidades' },
        { name: 'Cerámica aislante', quantity: 100, unit: 'kg' }
      ],
      employees: ['Miguel Torres'],
      tasks: [
        { task: 'Preparación de materiales', status: 'Pendiente' },
        { task: 'Ensamblaje', status: 'Pendiente' },
        { task: 'Control de calidad', status: 'Pendiente' }
      ],
      statusHistory: [
        { date: '2024-11-07', status: 'Pendiente', user: 'Admin' }
      ],
      createdBy: 'Admin'
    }
  ]);

  // Estados de UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderTypeStep, setOrderTypeStep] = useState(false); // Para controlar el flujo de tipo de orden
  const [selectedOrderType, setSelectedOrderType] = useState<'Pedido' | 'Venta' | ''>(''); // Tipo de orden seleccionado
  
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [orderToChangeStatus, setOrderToChangeStatus] = useState<ProductionOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<ProductionOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [cancelReason, setCancelReason] = useState('');

  // HU_051: Buscar orden de producción
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('orderNumber');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Datos para selects
  const products = [
    { code: 'FAP-001', name: 'Filtro de Aceite Premium' },
    { code: 'PFC-002', name: 'Pastillas de Freno Cerámicas' },
    { code: 'KEM-003', name: 'Kit de Empaques Motor' },
    { code: 'BAR-004', name: 'Bujías de Alto Rendimiento' },
    { code: 'AMD-005', name: 'Amortiguadores Delanteros' }
  ];

  const responsibles = [
    'Carlos Mendoza',
    'Ana López',
    'Roberto Sánchez',
    'Miguel Torres',
    'Laura Fernández'
  ];

  // HU_047: Registrar orden de producción - Formulario
  const [orderForm, setOrderForm] = useState({
    product: '',
    productCode: '',
    quantity: '',
    responsible: '',
    dueDate: '',
    notes: ''
  });

  // HU_051: Buscar orden de producción - Filtrado
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    const matchesDateFrom = !filterDateFrom || order.createdDate >= filterDateFrom;
    const matchesDateTo = !filterDateTo || order.createdDate <= filterDateTo;

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  // HU_052: Ordenar órdenes
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'orderNumber') {
      return a.orderCode.localeCompare(b.orderCode);
    } else if (sortBy === 'date') {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    }
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Generar código único
  const generateOrderCode = () => {
    const year = new Date().getFullYear();
    const lastOrder = orders.length > 0 
      ? Math.max(...orders.map(o => parseInt(o.orderCode.split('-')[2])))
      : 0;
    const nextNumber = String(lastOrder + 1).padStart(3, '0');
    return `OP-${year}-${nextNumber}`;
  };

  // HU_047: Registrar orden de producción
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obligatorios
    if (!orderForm.product || !orderForm.quantity || !orderForm.responsible || !orderForm.dueDate) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const orderCode = generateOrderCode();
    
    const newOrder: ProductionOrder = {
      id: Math.max(...orders.map(o => o.id), 0) + 1,
      orderCode,
      type: selectedOrderType as 'Pedido' | 'Venta',
      product: orderForm.product,
      productCode: orderForm.productCode,
      quantity: parseInt(orderForm.quantity),
      responsible: orderForm.responsible,
      status: 'Pendiente',
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: orderForm.dueDate,
      notes: orderForm.notes,
      supplies: [],
      employees: [orderForm.responsible],
      tasks: [
        { task: 'Preparación de materiales', status: 'Pendiente' },
        { task: 'Producción', status: 'Pendiente' },
        { task: 'Control de calidad', status: 'Pendiente' }
      ],
      statusHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          status: 'Pendiente',
          user: 'Admin'
        }
      ],
      createdBy: 'Admin'
    };

    setOrders([...orders, newOrder]);
    resetForm();
    setShowCreateModal(false);
    setOrderTypeStep(false);
    setSelectedOrderType('');
    toast.success(`Orden ${orderCode} registrada exitosamente`);
  };

  // HU_049: Actualizar orden de producción (solo estado y responsable)
  const handleUpdateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) return;

    // Validar que no esté anulada
    if (selectedOrder.status === 'Anulada') {
      toast.error('No se puede editar una orden anulada');
      return;
    }

    // Validar campos obligatorios
    if (!newStatus || !orderForm.responsible) {
      toast.error('Por favor completa el estado y el responsable');
      return;
    }

    const updatedOrders = orders.map(order =>
      order.id === selectedOrder.id
        ? {
            ...order,
            status: newStatus,
            responsible: orderForm.responsible,
            modifiedBy: 'Admin',
            modifiedAt: new Date().toISOString().split('T')[0]
          }
        : order
    );

    setOrders(updatedOrders);
    setShowEditModal(false);
    setSelectedOrder(null);
    resetForm();
    setNewStatus('');
    toast.success('Orden actualizada exitosamente');
  };

  // HU_050: Cambiar estado de la orden
  const handleChangeStatus = () => {
    if (!orderToChangeStatus || !newStatus) return;

    const updatedOrders = orders.map(order =>
      order.id === orderToChangeStatus.id
        ? {
            ...order,
            status: newStatus as any,
            startDate: newStatus === 'En Proceso' && !order.startDate 
              ? new Date().toISOString().split('T')[0] 
              : order.startDate,
            endDate: newStatus === 'Finalizada' 
              ? new Date().toISOString().split('T')[0] 
              : order.endDate,
            statusHistory: [
              ...order.statusHistory,
              {
                date: new Date().toISOString().split('T')[0],
                status: newStatus,
                user: 'Admin'
              }
            ],
            modifiedBy: 'Admin',
            modifiedAt: new Date().toISOString().split('T')[0]
          }
        : order
    );

    setOrders(updatedOrders);
    setShowStatusDialog(false);
    setOrderToChangeStatus(null);
    setNewStatus('');
    toast.success(`Estado cambiado a ${newStatus} exitosamente`);
  };

  // HU_053: Anular orden de producción
  const handleCancelOrder = () => {
    if (!orderToCancel) return;

    if (!cancelReason.trim()) {
      toast.error('Por favor indica el motivo de anulación');
      return;
    }

    const updatedOrders = orders.map(order =>
      order.id === orderToCancel.id
        ? {
            ...order,
            status: 'Anulada' as any,
            statusHistory: [
              ...order.statusHistory,
              {
                date: new Date().toISOString().split('T')[0],
                status: 'Anulada',
                user: 'Admin',
                reason: cancelReason
              }
            ],
            modifiedBy: 'Admin',
            modifiedAt: new Date().toISOString().split('T')[0]
          }
        : order
    );

    setOrders(updatedOrders);
    setShowCancelDialog(false);
    setOrderToCancel(null);
    setCancelReason('');
    toast.success('Orden anulada exitosamente');
  };

  // HU_055: Ver PDF de orden de producción
  const handleViewPDF = (order: ProductionOrder) => {
    toast.success(`Generando PDF de la orden ${order.orderCode}...`);
    setTimeout(() => {
      toast.success(`PDF de orden ${order.orderCode} generado exitosamente`);
    }, 1500);
  };

  // HU_048/HU_054: Ver detalle de orden
  const handleViewDetail = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const openEditModal = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setOrderForm({
      product: order.product,
      productCode: order.productCode,
      quantity: order.quantity.toString(),
      responsible: order.responsible,
      dueDate: order.dueDate,
      notes: order.notes || ''
    });
    setNewStatus(order.status); // Inicializar el estado actual
    setShowEditModal(true);
  };

  const openStatusDialog = (order: ProductionOrder) => {
    setOrderToChangeStatus(order);
    setNewStatus(order.status);
    setShowStatusDialog(true);
  };

  const openCancelDialog = (order: ProductionOrder) => {
    setOrderToCancel(order);
    setShowCancelDialog(true);
  };

  const resetForm = () => {
    setOrderForm({
      product: '',
      productCode: '',
      quantity: '',
      responsible: '',
      dueDate: '',
      notes: ''
    });
    setSelectedOrder(null);
  };

  const handleProductChange = (productName: string) => {
    const product = products.find(p => p.name === productName);
    setOrderForm({
      ...orderForm,
      product: productName,
      productCode: product?.code || ''
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Pendiente': <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><ClockIcon className="w-3 h-3 mr-1" />Pendiente</Badge>,
      'En Proceso': <Badge className="bg-blue-100 text-blue-700 border-blue-200"><PlayIcon className="w-3 h-3 mr-1" />En Proceso</Badge>,
      'Pausada': <Badge className="bg-orange-100 text-orange-700 border-orange-200"><PauseIcon className="w-3 h-3 mr-1" />Pausada</Badge>,
      'Finalizada': <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircleIcon className="w-3 h-3 mr-1" />Finalizada</Badge>,
      'Anulada': <Badge className="bg-red-100 text-red-700 border-red-200"><XCircleIcon className="w-3 h-3 mr-1" />Anulada</Badge>
    };
    return variants[status as keyof typeof variants] || <Badge>{status}</Badge>;
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 flex items-center gap-3">
            <ClipboardListIcon className="w-8 h-8 text-blue-600" />
            Órdenes de Producción
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Módulo de Producción - Gestiona las órdenes de fabricación
          </p>
        </div>

        {/* HU_047: Botón para registrar orden */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
              <PlusIcon className="w-4 h-4 mr-2" />
              Registrar Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Paso 1: Selección del tipo de orden */}
            {!orderTypeStep ? (
              <>
                <DialogHeader>
                  <DialogTitle>Nueva Orden de Producción</DialogTitle>
                  <DialogDescription>
                    Selecciona el tipo de orden que deseas registrar
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
                  {/* Opción Pedido */}
                  <Card 
                    className="cursor-pointer border-2 hover:border-blue-500 hover:shadow-lg transition-all"
                    onClick={() => {
                      setSelectedOrderType('Pedido');
                      setOrderTypeStep(true);
                    }}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <ShoppingCartIcon className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl text-gray-900">Pedido</h3>
                      <p className="text-sm text-center text-gray-600">
                        Producción basada en pedidos de clientes
                      </p>
                    </CardContent>
                  </Card>

                  {/* Opción Venta */}
                  <Card 
                    className="cursor-pointer border-2 hover:border-green-500 hover:shadow-lg transition-all"
                    onClick={() => {
                      setSelectedOrderType('Venta');
                      setOrderTypeStep(true);
                    }}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                        <TruckIcon className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-xl text-gray-900">Venta</h3>
                      <p className="text-sm text-center text-gray-600">
                        Producción para inventario y venta directa
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedOrderType('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Paso 2: Formulario de registro */}
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Orden de Producción - {selectedOrderType}</DialogTitle>
                  <DialogDescription>
                    Completa los campos obligatorios (*) para crear una nueva orden.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateOrder} className="space-y-6">
                  <Card className="border-2 border-blue-100">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                      <CardTitle className="text-lg">Información de la Orden</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Producto *</Label>
                          <Select
                            value={orderForm.product}
                            onValueChange={handleProductChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(product => (
                                <SelectItem key={product.code} value={product.name}>
                                  {product.name} ({product.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Código del Producto</Label>
                          <Input
                            value={orderForm.productCode}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Cantidad a producir"
                            value={orderForm.quantity}
                            onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Responsable *</Label>
                          <Select
                            value={orderForm.responsible}
                            onValueChange={(value) => setOrderForm({ ...orderForm, responsible: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar responsable" />
                            </SelectTrigger>
                            <SelectContent>
                              {responsibles.map(resp => (
                                <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Fecha de Entrega *</Label>
                          <Input
                            type="date"
                            value={orderForm.dueDate}
                            onChange={(e) => setOrderForm({ ...orderForm, dueDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Notas Adicionales</Label>
                          <Textarea
                            placeholder="Especificaciones o instrucciones especiales..."
                            value={orderForm.notes}
                            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOrderTypeStep(false);
                        setSelectedOrderType('');
                      }}
                      className="flex-1"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-2" />
                      Atrás
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setShowCreateModal(false);
                        setOrderTypeStep(false);
                        setSelectedOrderType('');
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Registrar Orden
                    </Button>
                  </div>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* HU_051: Buscar orden de producción - Filtros */}
      <Card className="shadow-lg border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por código, producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Pausada">Pausada</SelectItem>
                  <SelectItem value="Finalizada">Finalizada</SelectItem>
                  <SelectItem value="Anulada">Anulada</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  placeholder="Desde"
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  placeholder="Hasta"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{sortedOrders.length} orden(es) encontrada(s)</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Ordenar por:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orderNumber">Número de Orden</SelectItem>
                    <SelectItem value="date">Fecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HU_052: Listar órdenes de producción - Tabla */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <ClipboardListIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron órdenes de producción</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ClipboardListIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-900">{order.orderCode}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="bg-gray-50">
                        {order.quantity} unidades
                      </Badge>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{order.responsible}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div>
                        <p className="text-sm text-gray-900">{order.createdDate}</p>
                        <p className="text-xs text-gray-500">Entrega: {order.dueDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* HU_048: Ver detalle */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(order)}
                          className="text-blue-900 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        
                        {/* HU_049: Actualizar (solo si no está finalizada o anulada) */}
                        {order.status !== 'Finalizada' && order.status !== 'Anulada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(order)}
                            className="text-blue-900 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                          >
                            <EditIcon className="w-4 h-4" />
                          </Button>
                        )}

                        {/* HU_053: Anular orden (solo si no está finalizada o anulada) */}
                        {order.status !== 'Finalizada' && order.status !== 'Anulada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCancelDialog(order)}
                            className="text-blue-900 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </Button>
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
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (page === currentPage) {
                  return (
                    <Button
                      key={page}
                      variant="outline"
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {page}
                    </Button>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant="ghost"
                    size="sm"
                    className="w-8"
                  >
                    •
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* HU_048/HU_054: Ver detalle de orden de producción */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Orden de Producción</DialogTitle>
            <DialogDescription>
              Información completa de la orden {selectedOrder?.orderCode}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Información General */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PackageIcon className="w-5 h-5" />
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Código de Orden</Label>
                      <p className="text-gray-900 mt-1">{selectedOrder.orderCode}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Estado Actual</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Producto</Label>
                      <p className="text-gray-900 mt-1">{selectedOrder.product}</p>
                      <p className="text-sm text-gray-500">{selectedOrder.productCode}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Cantidad</Label>
                      <p className="text-gray-900 mt-1">{selectedOrder.quantity} unidades</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Responsable</Label>
                      <p className="text-gray-900 mt-1">{selectedOrder.responsible}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Fecha de Creación</Label>
                      <p className="text-gray-900 mt-1">{selectedOrder.createdDate}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Fecha de Entrega</Label>
                      <p className="text-gray-900 mt-1">{selectedOrder.dueDate}</p>
                    </div>
                    {selectedOrder.startDate && (
                      <div>
                        <Label className="text-gray-600">Fecha de Inicio</Label>
                        <p className="text-gray-900 mt-1">{selectedOrder.startDate}</p>
                      </div>
                    )}
                    {selectedOrder.endDate && (
                      <div>
                        <Label className="text-gray-600">Fecha de Finalización</Label>
                        <p className="text-gray-900 mt-1">{selectedOrder.endDate}</p>
                      </div>
                    )}
                  </div>

                  {selectedOrder.notes && (
                    <div className="pt-3 border-t">
                      <Label className="text-gray-600">Notas</Label>
                      <p className="text-gray-900 mt-1">{selectedOrder.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Insumos Relacionados */}
              {selectedOrder.supplies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ListIcon className="w-5 h-5" />
                      Insumos Requeridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedOrder.supplies.map((supply, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-3 border">
                          <span className="text-sm text-gray-900">{supply.name}</span>
                          <Badge variant="outline">
                            {supply.quantity} {supply.unit}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empleados Asociados */}
              {selectedOrder.employees.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UsersIcon className="w-5 h-5" />
                      Empleados Asociados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.employees.map((employee, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <UserIcon className="w-3 h-3 mr-1" />
                          {employee}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tareas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardListIcon className="w-5 h-5" />
                    Tareas de Producción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedOrder.tasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-3 border">
                        <span className="text-sm text-gray-900">{task.task}</span>
                        <Badge 
                          className={
                            task.status === 'Completada' 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : task.status === 'En proceso'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Historial de Estados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Historial de Cambios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(history.status)}
                            <span className="text-xs text-gray-500">por {history.user}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{history.date}</p>
                          {history.reason && (
                            <p className="text-sm text-gray-700 mt-1">Motivo: {history.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Información de Auditoría */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4 text-xs text-gray-600 space-y-1">
                  <p>Creado por: {selectedOrder.createdBy} el {selectedOrder.createdDate}</p>
                  {selectedOrder.modifiedBy && (
                    <p>Última modificación: {selectedOrder.modifiedBy} el {selectedOrder.modifiedAt}</p>
                  )}
                </CardContent>
              </Card>

              {/* Botones de Acción */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver a la Lista
                </Button>
                
                {selectedOrder.status !== 'Finalizada' && selectedOrder.status !== 'Anulada' && (
                  <>
                    <Button
                      onClick={() => {
                        setShowDetailModal(false);
                        openStatusDialog(selectedOrder);
                      }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Cambiar Estado
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDetailModal(false);
                        openEditModal(selectedOrder);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* HU_049: Actualizar orden de producción */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualizar Orden de Producción</DialogTitle>
            <DialogDescription>
              Actualiza el estado y/o el empleado responsable de la orden {selectedOrder?.orderCode}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateOrder} className="space-y-6">
            {/* Información de la orden (solo lectura) */}
            <Card className="border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="text-lg">Información de la Orden</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código de Orden</Label>
                    <Input
                      value={selectedOrder?.orderCode || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Input
                      value={selectedOrder?.type || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Producto</Label>
                    <Input
                      value={selectedOrder?.product || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Código del Producto</Label>
                    <Input
                      value={selectedOrder?.productCode || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      value={selectedOrder?.quantity || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Entrega</Label>
                    <Input
                      value={selectedOrder?.dueDate || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campos editables */}
            <Card className="border-2 border-green-100">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-lg">Actualizar Información</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select
                      value={newStatus}
                      onValueChange={setNewStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="En Proceso">En Proceso</SelectItem>
                        <SelectItem value="Pausada">Pausada</SelectItem>
                        <SelectItem value="Finalizada">Finalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Responsable *</Label>
                    <Select
                      value={orderForm.responsible}
                      onValueChange={(value) => setOrderForm({ ...orderForm, responsible: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsibles.map(resp => (
                          <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setNewStatus('');
                  setShowEditModal(false);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* HU_050: Cambiar estado de la orden */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-blue-600" />
              Cambiar Estado de la Orden
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Selecciona el nuevo estado para la orden {orderToChangeStatus?.orderCode}</p>
              
              {orderToChangeStatus && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Orden: </span>
                      <span className="text-sm text-gray-900">{orderToChangeStatus.orderCode}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Producto: </span>
                      <span className="text-sm text-gray-900">{orderToChangeStatus.product}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Estado actual: </span>
                      {getStatusBadge(orderToChangeStatus.status)}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Nuevo Estado *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="En Proceso">En Proceso</SelectItem>
                    <SelectItem value="Pausada">Pausada</SelectItem>
                    <SelectItem value="Finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-gray-600">
                El cambio de estado se registrará en el historial de la orden.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setOrderToChangeStatus(null);
              setNewStatus('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeStatus}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!newStatus}
            >
              Confirmar Cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HU_053: Anular orden de producción */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="w-5 h-5" />
              Anular Orden de Producción
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>¿Estás seguro de que deseas anular esta orden?</p>
              
              {orderToCancel && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Orden: </span>
                      <span className="text-sm text-gray-900">{orderToCancel.orderCode}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Producto: </span>
                      <span className="text-sm text-gray-900">{orderToCancel.product}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Cantidad: </span>
                      <span className="text-sm text-gray-900">{orderToCancel.quantity} unidades</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Estado actual: </span>
                      {getStatusBadge(orderToCancel.status)}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Motivo de Anulación *</Label>
                <Textarea
                  placeholder="Indica el motivo de la anulación..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              </div>

              <p className="text-sm text-red-600">
                La orden no será eliminada, pero cambiará su estado a "Anulada" y no podrá ser procesada.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setOrderToCancel(null);
              setCancelReason('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="bg-red-600 hover:bg-red-700"
            >
              Anular Orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}