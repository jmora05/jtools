import React, { useState, useEffect } from 'react';                 // 👈 agregado useEffect
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  PlusIcon, 
  SearchIcon, 
  ShoppingCartIcon, 
  EyeIcon,
  FileTextIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TruckIcon,  
  ShoppingBagIcon,
  XIcon,
  MinusIcon,
  UserIcon
} from 'lucide-react';

// 👇 CAMBIO 1: Importar el servicio
import {
  getVentas,
  createVenta,
  deleteVenta,
  toMetodoPago,
  toTipoVenta,
  mapVentaToSale,
} from '@/features/sales/services/ventasService';// ajusta la ruta si tu carpeta se llama diferente

// ─── Tipos (sin cambios) ──────────────────────────────────────────────────────

interface SaleItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  price: number;
}

interface Sale {
  id: number;
  clientName: string;
  clientId?: string;
  clientDocument?: string;
  date: string;
  total: number;
  paymentMethod: string;
  status: string;
  type: string;
  items: SaleItem[];
}

interface SalesModuleProps {
  clientFilter?: any;
  onClearClientFilter?: () => void;
}

export function SalesModule({ clientFilter, onClearClientFilter }: SalesModuleProps) {

  // 👇 CAMBIO 2: sales arranca vacío + estado de carga (se eliminan los datos mock)
  const [sales, setSales]     = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock de clientes (sin cambios — hasta que conectes clientesService)
  const [clients] = useState([
    { id: 'CLI001', name: 'Carlos Medina', document: '1234567890', phone: '300 123 4567', email: 'carlos@email.com' },
    { id: 'CLI002', name: 'Auto Servicio López', document: '9876543210', phone: '301 234 5678', email: 'lopez@email.com' },
    { id: 'CLI003', name: 'María González', document: '1122334455', phone: '302 345 6789', email: 'maria@email.com' },
    { id: 'CLI004', name: 'Taller El Repuesto', document: '5544332211', phone: '303 456 7890', email: 'taller@email.com' },
    { id: 'CLI005', name: 'Jorge Ramírez', document: '6677889900', phone: '304 567 8901', email: 'jorge@email.com' }
  ]);

  // Mock de productos (sin cambios — hasta que conectes productosService)
  const [products] = useState([
    { id: 'P001', name: 'Filtro de Aceite Toyota', code: 'FO-TOY-001', price: 25000, stock: 50, category: 'Filtros' },
    { id: 'P002', name: 'Pastillas de Freno Honda', code: 'PF-HON-002', price: 85000, stock: 30, category: 'Frenos' },
    { id: 'P003', name: 'Kit de Motor Chevrolet', code: 'KM-CHE-003', price: 450000, stock: 10, category: 'Motor' },
    { id: 'P004', name: 'Amortiguador Delantero', code: 'AD-GEN-004', price: 120000, stock: 25, category: 'Suspensión' },
    { id: 'P005', name: 'Batería 12V', code: 'BAT-12V-005', price: 280000, stock: 15, category: 'Eléctricos' },
    { id: 'P006', name: 'Banda de Distribución', code: 'BD-GEN-006', price: 95000, stock: 40, category: 'Motor' },
    { id: 'P007', name: 'Aceite Motor 5W30', code: 'AC-5W30-007', price: 65000, stock: 100, category: 'Lubricantes' },
    { id: 'P008', name: 'Bujías NGK', code: 'BUJ-NGK-008', price: 18000, stock: 200, category: 'Motor' }
  ]);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [pdfSale, setPdfSale] = useState<Sale | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [saleForm, setSaleForm] = useState({
    clientId: '',
    clientName: '',
    clientDocument: '',
    paymentMethod: 'Efectivo',
    items: [] as SaleItem[]
  });

  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // 👇 CAMBIO 3: cargar ventas desde el backend al montar el componente
  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true);
      try {
        const data = await getVentas();
        setSales(data.map(mapVentaToSale));
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar las ventas');
      } finally {
        setLoading(false);
      }
    };
    fetchVentas();
  }, []);

  // Aplicar filtro de cliente si viene desde otro módulo (sin cambios)
  React.useEffect(() => {
    if (clientFilter) {
      setSaleForm({
        ...saleForm,
        clientId: clientFilter.id,
        clientName: clientFilter.name,
        clientDocument: clientFilter.document || clientFilter.documentNumber || ''
      });
      setShowNewSaleModal(true);
    }
  }, [clientFilter]);

  const handleViewDetail = (sale: Sale) => {
    setViewingSale(sale);
    setShowDetailModal(true);
  };

  const handleViewPDF = (sale: Sale) => {
    setPdfSale(sale);
    setShowPDFModal(true);
  };

  const handleCancelSale = (sale: Sale) => {
    setSaleToCancel(sale);
    setShowCancelDialog(true);
  };

  // 👇 CAMBIO 4a: confirmCancel llama al backend (DELETE)
  const confirmCancel = async () => {
    if (!saleToCancel) return;
    try {
      await deleteVenta(saleToCancel.id);
      setSales(sales.map(sale =>
        sale.id === saleToCancel.id ? { ...sale, status: 'Anulada' } : sale
      ));
      toast.success(`Venta #${saleToCancel.id} anulada exitosamente`);
    } catch (error: any) {
      toast.error(error.message || 'Error al anular la venta');
    } finally {
      setShowCancelDialog(false);
      setSaleToCancel(null);
    }
  };

  const handleAddProduct = (product: any) => {
    const existingItem = saleForm.items.find(item => item.id === product.id);
    
    if (existingItem) {
      setSaleForm({
        ...saleForm,
        items: saleForm.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      setSaleForm({
        ...saleForm,
        items: [
          ...saleForm.items,
          {
            id: product.id,
            name: product.name,
            code: product.code,
            quantity: 1,
            price: product.price
          }
        ]
      });
    }
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleRemoveProduct = (productId: string) => {
    setSaleForm({
      ...saleForm,
      items: saleForm.items.filter(item => item.id !== productId)
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveProduct(productId);
      return;
    }
    setSaleForm({
      ...saleForm,
      items: saleForm.items.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    });
  };

  const handleSelectClient = (client: any) => {
    setSaleForm({
      ...saleForm,
      clientId: client.id,
      clientName: client.name,
      clientDocument: client.document
    });
    setClientSearch('');
  };

  const calculateTotal = () => {
    return saleForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  // 👇 CAMBIO 4b: handleCreateSale llama al backend (POST)
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!saleForm.clientId) {
      toast.error('Por favor selecciona un cliente');
      return;
    }
    if (saleForm.items.length === 0) {
      toast.error('Por favor agrega al menos un producto');
      return;
    }

    try {
      const dto = {
        clientesId: Number(saleForm.clientId),   // asegúrate que sea numérico en tu BD
        fecha:      new Date().toISOString().split('T')[0],
        metodoPago: toMetodoPago(saleForm.paymentMethod),
        tipoVenta:  toTipoVenta('Directa'),
        total:      calculateTotal(),
      };

      const { venta } = await createVenta(dto);

      // Construye el objeto local con el id real devuelto por el backend
      const newSale: Sale = {
        id:             venta.id,
        clientName:     saleForm.clientName,
        clientId:       saleForm.clientId,
        clientDocument: saleForm.clientDocument,
        date:           venta.fecha.slice(0, 10),
        total:          Number(venta.total),
        paymentMethod:  saleForm.paymentMethod,
        status:         'Completada',
        type:           'Directa',
        items:          saleForm.items,
      };

      setSales([newSale, ...sales]);
      resetSaleForm();
      setShowNewSaleModal(false);

      if (onClearClientFilter) onClearClientFilter();
      toast.success('Venta registrada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar la venta');
    }
  };

  const resetSaleForm = () => {
    setSaleForm({
      clientId: '',
      clientName: '',
      clientDocument: '',
      paymentMethod: 'Efectivo',
      items: []
    });
    setProductSearch('');
    setClientSearch('');
  };

  // ─── Badges (sin cambios) ─────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const colors = {
      'Completada': 'bg-green-100 text-green-700 border-green-200',
      'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Anulada': 'bg-red-100 text-red-700 border-red-200'
    };
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'Directa' ? (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <ShoppingBagIcon className="w-3 h-3 mr-1" />
        Directa
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
        <TruckIcon className="w-3 h-3 mr-1" />
        Pedido
      </Badge>
    );
  };

  // ─── Filtros (sin cambios) ────────────────────────────────────────────────

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.document.includes(clientSearch)
  );

  const filteredSales = sales.filter(sale => {
    return sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id.toString().includes(searchTerm) ||
          (sale.clientDocument && sale.clientDocument.includes(searchTerm));
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSales = filteredSales.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // ─── JSX (sin cambios excepto el tbody que muestra loading) ──────────────

  return (
    <TooltipProvider>
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl text-gray-900 flex items-center gap-3">
              <ShoppingCartIcon className="w-8 h-8 text-blue-600" />
              Gestión de Ventas
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Administra las ventas directas y pedidos
            </p>
          </div>

          <Dialog open={showNewSaleModal} onOpenChange={(open) => {
            setShowNewSaleModal(open);
            if (!open) {
              resetSaleForm();
              if (onClearClientFilter) onClearClientFilter();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nueva Venta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Venta</DialogTitle>
                <DialogDescription>
                  Selecciona un cliente y agrega productos para completar la venta.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSale} className="space-y-6">
                {/* Información del Cliente */}
                <Card className="border-2 border-gray-100">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {!saleForm.clientId ? (
                      <>
                        <div className="space-y-2">
                          <Label>Buscar Cliente</Label>
                          <Input
                            placeholder="Buscar por nombre o documento..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                          />
                        </div>
                        {clientSearch && filteredClients.length > 0 && (
                          <div className="border rounded-lg max-h-48 overflow-y-auto">
                            {filteredClients.map(client => (
                              <div
                                key={client.id}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                onClick={() => handleSelectClient(client)}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm text-gray-900">{client.name}</p>
                                    <p className="text-xs text-gray-500">{client.document} • {client.phone}</p>
                                  </div>
                                  <PlusIcon className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900">{saleForm.clientName}</p>
                            <p className="text-xs text-gray-600">{saleForm.clientDocument}</p>
                            <p className="text-xs text-gray-600">ID: {saleForm.clientId}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSaleForm({ ...saleForm, clientId: '', clientName: '', clientDocument: '' })}
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Método de Pago *</Label>
                      <Select
                        value={saleForm.paymentMethod}
                        onValueChange={(value) => setSaleForm({ ...saleForm, paymentMethod: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Efectivo">Efectivo</SelectItem>
                          <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                          <SelectItem value="Transferencia">Transferencia</SelectItem>
                          <SelectItem value="Crédito">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Productos */}
                <Card className="border-2 border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCartIcon className="w-5 h-5" />
                      Productos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Buscar Productos</Label>
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar por nombre o código..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {productSearch && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                        {filteredProducts.map(product => (
                          <Card key={product.id} className="bg-white hover:border-blue-400 transition-all cursor-pointer" onClick={() => handleAddProduct(product)}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">{product.name}</p>
                                  <p className="text-xs text-gray-500">{product.code}</p>
                                  <Badge variant="outline" className="text-xs mt-1">{product.category}</Badge>
                                </div>
                                <div className="text-right ml-2">
                                  <p className="text-sm text-blue-600">${product.price.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Carrito */}
                    <div className="border-t pt-4">
                      <Label className="mb-3 block">Productos Agregados ({saleForm.items.length})</Label>
                      {saleForm.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No hay productos agregados</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {saleForm.items.map(item => (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-3 border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">{item.name}</p>
                                  <p className="text-xs text-gray-500">{item.code}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XIcon className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 p-0"
                                  >
                                    <MinusIcon className="w-3 h-3" />
                                  </Button>
                                  <span className="w-12 text-center text-sm">{item.quantity}</span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 p-0"
                                  >
                                    <PlusIcon className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">${item.price.toLocaleString()} c/u</p>
                                  <p className="text-sm text-gray-900">${(item.quantity * item.price).toLocaleString()}</p>
                                </div>
              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    {saleForm.items.length > 0 && (
                      <div className="border-t pt-4 bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg text-gray-900">Total:</span>
                          <span className="text-2xl text-blue-600">${calculateTotal().toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Botones */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetSaleForm();
                      setShowNewSaleModal(false);
                      if (onClearClientFilter) onClearClientFilter();
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!saleForm.clientId || saleForm.items.length === 0}
                  >
                    Registrar Venta
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filter */}
        <Card className="shadow-lg border-gray-100">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar ventas por cliente, número o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {filteredSales.length} venta(s)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Ventas */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-right text-xs text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Pago</th>
                  <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">

                {/* 👇 CAMBIO 5: fila de carga mientras se obtienen datos del backend */}
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-pulse" />
                      <p>Cargando ventas...</p>
                    </td>
                  </tr>
                ) : currentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No se encontraron ventas</p>
                    </td>
                  </tr>
                ) : (
                  currentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{sale.clientName}</p>
                          {sale.clientDocument && (
                            <p className="text-xs text-gray-500">{sale.clientDocument}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{sale.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-900">${sale.total.toLocaleString()}</span>
                          <Badge variant="secondary" className="text-xs mt-1">{sale.paymentMethod}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="secondary">{sale.paymentMethod}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(sale)}
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
                                onClick={() => handleViewPDF(sale)}
                                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                              >
                                <FileTextIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver PDF</p></TooltipContent>
                          </Tooltip>

                          {sale.status !== 'Anulada' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelSale(sale)}
                                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Anular venta</p></TooltipContent>
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

          {/* Paginación (sin cambios) */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500 border-0"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (page === currentPage) {
                      return (
                        <Button
                          key={page}
                          variant="outline"
                          size="sm"
                          className="bg-blue-600 text-white hover:bg-blue-700 min-w-[32px] border-0 cursor-default"
                        >
                          {page}
                        </Button>
                      );
                    }
                    return (
                      <div key={page} className="text-gray-400 px-2">•</div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500 border-0"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalle (sin cambios) */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Venta #{viewingSale?.id}</DialogTitle>
              <DialogDescription>
                Información completa de la venta seleccionada.
              </DialogDescription>
            </DialogHeader>
            {viewingSale && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Cliente</Label>
                    <p className="text-gray-900 mt-1">{viewingSale.clientName}</p>
                    {viewingSale.clientDocument && (
                      <p className="text-sm text-gray-500">{viewingSale.clientDocument}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-600">Fecha</Label>
                    <p className="text-gray-900 mt-1">{viewingSale.date}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Método de pago</Label>
                    <p className="mt-1">
                      <Badge variant="secondary">{viewingSale.paymentMethod}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Total</Label>
                    <p className="text-gray-900 mt-1 text-xl">
                      ${viewingSale.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 mb-3 block">Productos</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">Producto</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Cantidad</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600 uppercase">Precio Unit.</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {viewingSale.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.code}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                              ${item.price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              ${(item.quantity * item.price).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de PDF (sin cambios) */}
        <Dialog open={showPDFModal} onOpenChange={setShowPDFModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Factura de Venta #{pdfSale?.id}</DialogTitle>
              <DialogDescription>Vista previa del documento de venta</DialogDescription>
            </DialogHeader>
            {pdfSale && (
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] bg-white">
                <div className="bg-white p-8 space-y-6 border rounded-lg">
                  {/* Encabezado */}
                  <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4">
                    <div>
                      <h2 className="text-3xl text-blue-600 mb-2">JREPUESTOS MEDELLÍN</h2>
                      <p className="text-sm text-gray-600">Repuestos de Carros de Alta Calidad</p>
                      <p className="text-sm text-gray-600">Medellín, Colombia</p>
                      <p className="text-sm text-gray-600">Tel: (604) 123-4567</p>
                      <p className="text-sm text-gray-600">contacto@jrepuestos.com</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded mb-2">
                        <p className="text-sm">FACTURA DE VENTA</p>
                        <p className="text-xl">#{pdfSale.id}</p>
                      </div>
                      <p className="text-sm text-gray-600">Fecha: {pdfSale.date}</p>
                      <p className="text-sm">{getTypeBadge(pdfSale.type)}</p>
                    </div>
                  </div>
                  {/* Info cliente */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm uppercase text-gray-600 mb-2">Datos del Cliente</h3>
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="text-gray-900">{pdfSale.clientName}</p>
                        {pdfSale.clientDocument && (
                          <p className="text-sm text-gray-600">Documento: {pdfSale.clientDocument}</p>
                        )}
                        {pdfSale.clientId && (
                          <p className="text-sm text-gray-600">ID Cliente: {pdfSale.clientId}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm uppercase text-gray-600 mb-2">Información de Pago</h3>
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="text-sm text-gray-600">Método de Pago:</p>
                        <p className="text-gray-900">{pdfSale.paymentMethod}</p>
                        <p className="text-sm text-gray-600 mt-2">Estado:</p>
                        <p className="mt-1">{getStatusBadge(pdfSale.status)}</p>
                      </div>
                    </div>
                  </div>
                  {/* Tabla productos */}
                  <div>
                    <h3 className="text-sm uppercase text-gray-600 mb-3">Detalle de Productos</h3>
                    <table className="w-full border border-gray-300">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase border-b border-gray-300">Código</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-700 uppercase border-b border-gray-300">Producto</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-700 uppercase border-b border-gray-300">Cantidad</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-700 uppercase border-b border-gray-300">Precio Unit.</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-700 uppercase border-b border-gray-300">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdfSale.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="px-4 py-3 text-sm text-gray-600">{item.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              ${item.price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              ${(item.quantity * item.price).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Totales */}
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">
                          ${Math.round(pdfSale.total / 1.19).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">IVA (19%):</span>
                        <span className="text-gray-900">
                          ${Math.round(pdfSale.total - pdfSale.total / 1.19).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-t-2 border-blue-600">
                        <span className="text-lg text-gray-900">Total:</span>
                        <span className="text-xl text-blue-600">
                          ${pdfSale.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="border-t-2 border-gray-300 pt-4 mt-6">
                    <p className="text-xs text-gray-600 text-center mb-2">
                      Gracias por su compra. Esta es una representación válida de su factura de venta.
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      JRepuestos Medellín - NIT: 900.123.456-7 - Régimen Común
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      Para cualquier duda o reclamo, contáctenos al (604) 123-4567 o contacto@jrepuestos.com
                    </p>
                  </div>
                </div>
                {/* Botón Imprimir */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    onClick={() => window.print()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Imprimir / Descargar PDF
                  </Button>
                  <Button
                    onClick={() => setShowPDFModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmación de Anulación (sin cambios) */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangleIcon className="w-5 h-5" />
                Confirmar Anulación de Venta
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>¿Estás seguro de que deseas anular esta venta?</p>
                {saleToCancel && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Venta #: </span>
                        <span className="text-sm text-gray-900">{saleToCancel.id}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Cliente: </span>
                        <span className="text-sm text-gray-900">{saleToCancel.clientName}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total: </span>
                        <span className="text-sm text-gray-900">
                          ${saleToCancel.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-red-600">
                  La venta será marcada como anulada y no se podrá revertir esta acción.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancel}
                className="bg-red-600 hover:bg-red-700"
              >
                Anular Venta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
