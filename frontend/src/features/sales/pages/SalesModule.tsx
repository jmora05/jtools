import { getClientes } from '@/features/clients/services/clientesService';
import { getProductos } from '@/features/products/services/productosService';
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
  UserIcon,
  RotateCcwIcon,
} from 'lucide-react';

import {
  getVentas,
  createVenta,
  deleteVenta,
  toMetodoPago,
  toTipoVenta,
  mapVentaToSale,
} from '@/features/sales/services/ventasService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  clientMode?: boolean;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SalesModule({ clientFilter, onClearClientFilter, clientMode = false }: SalesModuleProps) {

  const [sales, setSales]     = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const data = await getClientes();
        setClients(data.map((c: any) => ({
          id: String(c.id),
          name: `${c.nombres} ${c.apellidos}`,
          document: c.numero_documento ?? '',
          phone: c.telefono ?? '',
          email: c.email ?? '',
        })));
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar los clientes');
      }
    };
    fetchClientes();
  }, []);

  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await getProductos();
        setProducts(data.map((p: any) => ({
          id: String(p.id),
          name: p.nombreProducto ?? '',
          code: p.referencia ?? '',
          price: Number(p.precio) ?? 0,
          stock: p.stock ?? 0,
          category: p.categoriaProducto?.nombre ?? '',
        })));
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar los productos');
      }
    };
    fetchProductos();
  }, []);

  const [showDetailModal, setShowDetailModal]   = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPDFModal, setShowPDFModal]         = useState(false);
  const [viewingSale, setViewingSale]           = useState<Sale | null>(null);
  const [pdfSale, setPdfSale]                   = useState<Sale | null>(null);
  const [saleToCancel, setSaleToCancel]         = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm]             = useState('');
  const [currentPage, setCurrentPage]           = useState(1);
  const itemsPerPage = 5;

  const [saleForm, setSaleForm] = useState({
    clientId: '',
    clientName: '',
    clientDocument: '',
    paymentMethod: 'Efectivo',
    items: [] as SaleItem[],
  });

  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch]   = useState('');
  const [submitting, setSubmitting]       = useState(false);

  // Cargar ventas
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

  // Filtro de cliente externo
  React.useEffect(() => {
    if (clientFilter) {
      setSaleForm({
        ...saleForm,
        clientId: clientFilter.id,
        clientName: clientFilter.name,
        clientDocument: clientFilter.document || clientFilter.documentNumber || '',
      });
      setShowNewSaleModal(true);
    }
  }, [clientFilter]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleViewDetail = (sale: Sale) => { setViewingSale(sale); setShowDetailModal(true); };
  const handleViewPDF    = (sale: Sale) => { setPdfSale(sale); setShowPDFModal(true); };
  const handleCancelSale = (sale: Sale) => { setSaleToCancel(sale); setShowCancelDialog(true); };

  const confirmCancel = async () => {
    if (!saleToCancel) return;
    try {
      await deleteVenta(saleToCancel.id);
      setSales(sales.map(s => s.id === saleToCancel.id ? { ...s, status: 'Anulada' } : s));
      toast.success(`Venta #${saleToCancel.id} anulada exitosamente`);
    } catch (error: any) {
      toast.error(error.message || 'Error al anular la venta');
    } finally {
      setShowCancelDialog(false);
      setSaleToCancel(null);
    }
  };

  const handleAddProduct = (product: any) => {
    const existing = saleForm.items.find(i => i.id === product.id);
    setSaleForm({
      ...saleForm,
      items: existing
        ? saleForm.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...saleForm.items, { id: product.id, name: product.name, code: product.code, quantity: 1, price: product.price }],
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleRemoveProduct = (productId: string) =>
    setSaleForm({ ...saleForm, items: saleForm.items.filter(i => i.id !== productId) });

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) { handleRemoveProduct(productId); return; }
    setSaleForm({ ...saleForm, items: saleForm.items.map(i => i.id === productId ? { ...i, quantity: newQty } : i) });
  };

  const handleSelectClient = (client: any) => {
    setSaleForm({ ...saleForm, clientId: client.id, clientName: client.name, clientDocument: client.document });
    setClientSearch('');
  };

  const calculateTotal = () => saleForm.items.reduce((s, i) => s + i.quantity * i.price, 0);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.clientId)          { toast.error('Por favor selecciona un cliente'); return; }
    if (saleForm.items.length === 0) { toast.error('Por favor agrega al menos un producto'); return; }

    setSubmitting(true);
    try {
      const dto = {
        clientesId: Number(saleForm.clientId),
        fecha:      new Date().toISOString().split('T')[0],
        metodoPago: toMetodoPago(saleForm.paymentMethod),
        tipoVenta:  toTipoVenta('Directa'),
        total:      calculateTotal(),
      };
      const { venta } = await createVenta(dto);
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
    } finally {
      setSubmitting(false);
    }
  };

  const resetSaleForm = () => {
    setSaleForm({ clientId: '', clientName: '', clientDocument: '', paymentMethod: 'Efectivo', items: [] });
    setProductSearch('');
    setClientSearch('');
  };

  // ─── Badges ───────────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Completada': 'bg-blue-50 text-blue-900 border-blue-200',
      'Pendiente':  'bg-blue-50 text-blue-900 border-blue-200',
      'Anulada':    'bg-gray-100 text-gray-700 border-gray-300',
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) =>
    type === 'Directa' ? (
      <Badge className="bg-blue-50 text-blue-900 border-blue-200">
        <ShoppingBagIcon className="w-3 h-3 mr-1" />Directa
      </Badge>
    ) : (
      <Badge className="bg-blue-50 text-blue-900 border-blue-200">
        <TruckIcon className="w-3 h-3 mr-1" />Pedido
      </Badge>
    );

  // ─── Filtros ──────────────────────────────────────────────────────────────

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.document.includes(clientSearch)
  );

  const filteredSales = sales.filter(s =>
    s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toString().includes(searchTerm) ||
    (s.clientDocument && s.clientDocument.includes(searchTerm))
  );

  const totalPages    = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));
  const currentSales  = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else if (currentPage <= 3)              pages.push(1, 2, 3, '...', totalPages);
    else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    else                                    pages.push(1, '...', currentPage, '...', totalPages);
    return pages;
  };

  const subtotal = saleForm.items.reduce((s, i) => s + i.quantity * i.price, 0);

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-2">
              {clientMode ? 'Mis Compras' : 'Gestión de Ventas'}
            </h1>
            <p className="text-blue-900">
              {clientMode ? 'Historial de tus compras' : 'Administra las ventas directas y pedidos'}
            </p>
          </div>

          {/* ── MODAL NUEVA VENTA ─────────────────────────────────────────── */}
          <Dialog open={showNewSaleModal} onOpenChange={(open) => {
            setShowNewSaleModal(open);
            if (!open) { resetSaleForm(); if (onClearClientFilter) onClearClientFilter(); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />Nueva Venta
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-full w-screen h-screen m-0 p-0 rounded-none flex flex-col">
              <DialogHeader className="border-b border-gray-200 pb-5 px-8 pt-8 flex-shrink-0">
                <DialogTitle className="text-3xl text-center text-gray-900">Registrar Nueva Venta</DialogTitle>
                <DialogDescription className="text-center">
                  Selecciona un cliente y agrega productos para completar la venta.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSale} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-8 py-8">
                  <div className="space-y-8 max-w-7xl mx-auto">

                    {/* ── Información del Cliente ──────────────────────────── */}
                    <Card className="shadow-lg border-2 border-gray-100">
                      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <CardTitle className="text-xl text-gray-900">👤 Seleccionar Cliente</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-8 px-10 pb-10 space-y-5">
                        {!saleForm.clientId ? (
                          <>
                            <div className="space-y-2">
                              <Label className="text-base">Buscar Cliente <span className="text-red-500 ml-1">*</span></Label>
                              <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                  placeholder="Buscar por nombre o documento..."
                                  value={clientSearch}
                                  onChange={(e) => setClientSearch(e.target.value)}
                                  className="pl-12 h-12 text-base"
                                />
                              </div>
                            </div>

                            {clientSearch && (
                              <div className="border rounded-xl overflow-hidden shadow-sm">
                                {filteredClients.length === 0 ? (
                                  <div className="px-4 py-6 text-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                                      <SearchIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">No se encontraron clientes para</p>
                                    <p className="text-sm font-semibold text-gray-700 mt-0.5">"{clientSearch}"</p>
                                  </div>
                                ) : (
                                  <div className="max-h-64 overflow-y-auto">
                                    {filteredClients.map(client => (
                                      <button
                                        key={client.id}
                                        type="button"
                                        onClick={() => handleSelectClient(client)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                                            <span className="text-xs font-bold text-blue-700">
                                              {(client.name?.[0] ?? '?').toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                              {client.document && <span className="mr-3">🪪 {client.document}</span>}
                                              {client.phone && <span>📞 {client.phone}</span>}
                                            </p>
                                          </div>
                                          <PlusIcon className="w-4 h-4 text-blue-600 shrink-0" />
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold">
                                ✅ Cliente seleccionado
                              </div>
                              <button
                                type="button"
                                onClick={() => setSaleForm({ ...saleForm, clientId: '', clientName: '', clientDocument: '' })}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Cambiar cliente"
                              >
                                <XIcon className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Nombre completo</p>
                                <p className="font-medium text-gray-800">{saleForm.clientName}</p>
                              </div>
                              {saleForm.clientDocument && (
                                <div>
                                  <p className="text-xs text-gray-500">Documento</p>
                                  <p className="font-medium text-gray-800">{saleForm.clientDocument}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-gray-500">ID</p>
                                <p className="font-medium text-gray-800">{saleForm.clientId}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Método de pago */}
                        <div className="space-y-2">
                          <Label className="text-base">Método de Pago <span className="text-red-500 ml-1">*</span></Label>
                          <Select
                            value={saleForm.paymentMethod}
                            onValueChange={(value) => setSaleForm({ ...saleForm, paymentMethod: value })}
                          >
                            <SelectTrigger className="h-12">
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

                    {/* ── Carrito ─────────────────────────────────────────── */}
                    <Card className="shadow-2xl border-2 border-blue-100">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg border-b-2 border-blue-300 py-6 px-8">
                        <CardTitle className="text-2xl flex items-center text-blue-900">
                          <ShoppingCartIcon className="w-5 h-5 mr-2" />
                          Carrito de Venta
                          {saleForm.items.length > 0 && (
                            <Badge className="ml-2 bg-blue-600 text-white">
                              {saleForm.items.reduce((s, i) => s + i.quantity, 0)} items
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-6">

                          {/* Búsqueda de productos */}
                          <div className="p-8 border-b border-gray-200">
                            <div className="space-y-5">
                              <div className="space-y-2">
                                <Label className="text-base">🔍 Buscar Productos</Label>
                                <div className="relative">
                                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                  <Input
                                    placeholder="Buscar por nombre o código..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-12 h-12 text-base"
                                  />
                                </div>
                              </div>

                              {productSearch && (
                                <div className="grid grid-cols-1 gap-3 border rounded-lg p-4 bg-gray-50">
                                  {filteredProducts.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No se encontraron productos</p>
                                  ) : filteredProducts.map(product => (
                                    <Card key={product.id} className="border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all">
                                      <CardContent className="p-5">
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-start">
                                            <div className="space-y-1 flex-1">
                                              <h4 className="text-base text-gray-900">{product.name}</h4>
                                              <p className="text-sm text-gray-500">{product.code}</p>
                                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                            </div>
                                            <div className="text-right ml-3">
                                              <Badge variant="secondary" className="text-blue-600 mb-2 text-sm px-3 py-1">
                                                ${product.price.toLocaleString()}
                                              </Badge>
                                              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                            </div>
                                          </div>
                                          <Button
                                            type="button" size="default" variant="outline"
                                            onClick={() => handleAddProduct(product)}
                                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 h-10"
                                          >
                                            <PlusIcon className="w-4 h-4 mr-2" />Agregar
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Items en carrito */}
                          <div className="space-y-3 p-8 border-b border-gray-200 bg-gray-50">
                            {saleForm.items.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No hay productos en el carrito</p>
                                <p className="text-sm">Busca y agrega productos arriba</p>
                              </div>
                            ) : saleForm.items.map(item => (
                              <div key={item.id} className="bg-white rounded-lg p-3 border">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h4 className="text-sm text-gray-900">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.code}</p>
                                  </div>
                                  <Button
                                    type="button" size="sm" variant="outline"
                                    onClick={() => handleRemoveProduct(item.id)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 w-8 h-8 p-0"
                                  >
                                    <XIcon className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Button type="button" size="sm" variant="outline"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                      className="w-8 h-8 p-0">
                                      <MinusIcon className="w-3 h-3" />
                                    </Button>
                                    <span className="text-sm w-10 text-center bg-white px-2 py-1 border rounded">{item.quantity}</span>
                                    <Button type="button" size="sm" variant="outline"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                      className="w-8 h-8 p-0">
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

                          {/* Resumen de totales */}
                          {saleForm.items.length > 0 && (
                            <div className="px-8 pb-8">
                              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200 space-y-3">
                                <div className="flex justify-between text-base">
                                  <span className="text-gray-700">Subtotal:</span>
                                  <span>${subtotal.toLocaleString()}</span>
                                </div>
                                <div className="border-t-2 border-blue-300 pt-3 flex justify-between text-xl">
                                  <span>Total:</span>
                                  <span className="text-blue-600">${subtotal.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                  </div>
                </div>

                {/* Footer botones */}
                <div className="flex-shrink-0 flex gap-6 border-t border-gray-200 bg-white px-8 py-6 shadow-lg">
                  <Button
                    type="button" variant="outline" disabled={submitting}
                    onClick={() => { resetSaleForm(); setShowNewSaleModal(false); if (onClearClientFilter) onClearClientFilter(); }}
                    className="flex-1 h-14 text-base"
                  >
                    <RotateCcwIcon className="w-5 h-5 mr-2" />Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-lg"
                    disabled={!saleForm.clientId || saleForm.items.length === 0 || submitting}
                  >
                    <ShoppingCartIcon className="w-5 h-5 mr-2" />
                    {submitting ? 'Registrando...' : 'Registrar Venta'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card className="shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar ventas por cliente, número o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-sm text-gray-600">{filteredSales.length} venta(s)</span>
          </div>
        </Card>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Pago</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Cargando ventas...
                    </td>
                  </tr>
                ) : currentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-gray-500">
                        <ShoppingCartIcon className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-gray-900">No se encontraron ventas</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : currentSales.map((sale) => {
                  const isAnulada = sale.status === 'Anulada';
                  return (
                    <tr key={sale.id} className={`hover:bg-gray-50 transition-colors ${isAnulada ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{sale.clientName}</div>
                        {sale.clientDocument && (
                          <div className="text-sm text-gray-500">{sale.clientDocument}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{sale.date}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">${sale.total.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{sale.items.length} producto(s)</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(sale.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm"
                                onClick={() => handleViewDetail(sale)}
                                className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver detalle</p></TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm"
                                onClick={() => handleViewPDF(sale)}
                                className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                <FileTextIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver PDF</p></TooltipContent>
                          </Tooltip>

                          {!isAnulada && !clientMode && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => handleCancelSale(sale)}
                                  className="text-blue-900 border-blue-900 hover:bg-red-50">
                                  <XCircleIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Anular venta</p></TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filteredSales.length > itemsPerPage && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-center space-x-2">
              <Button variant="outline" size="sm"
                onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              {getPageNumbers().map((page, i) =>
                page === '...'
                  ? <span key={`e-${i}`} className="px-2 text-gray-500">•</span>
                  : (
                    <Button key={page} size="sm"
                      variant={currentPage === page ? 'default' : 'ghost'}
                      onClick={() => setCurrentPage(page as number)}
                      className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]' : 'min-w-[32px]'}>
                      {currentPage === page ? page : '•'}
                    </Button>
                  )
              )}
              <Button variant="outline" size="sm"
                onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ── MODAL DETALLE ─────────────────────────────────────────────── */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible p-0">
            <div className="overflow-y-auto max-h-[90vh] p-6">
              <DialogHeader>
                <DialogTitle>Detalles de la Venta #{viewingSale?.id}</DialogTitle>
                <DialogDescription>Información completa de la venta seleccionada.</DialogDescription>
              </DialogHeader>

              {viewingSale && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                    <div className="col-span-2 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <ShoppingCartIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 text-lg leading-tight">{viewingSale.clientName}</p>
                        <p className="text-sm text-gray-500">Venta #{viewingSale.id}</p>
                        <div className="mt-1">{getStatusBadge(viewingSale.status)}</div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Fecha</p>
                      <p className="font-semibold text-sm mt-0.5">{viewingSale.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-semibold text-sm mt-0.5 text-blue-600">${viewingSale.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Método de Pago</p>
                      <p className="font-semibold text-sm mt-0.5">{viewingSale.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tipo</p>
                      <div className="mt-0.5">{getTypeBadge(viewingSale.type)}</div>
                    </div>
                    {viewingSale.clientDocument && (
                      <div>
                        <p className="text-xs text-gray-500">Documento</p>
                        <p className="font-semibold text-sm mt-0.5">{viewingSale.clientDocument}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Productos</p>
                      <p className="font-semibold text-sm mt-0.5">{viewingSale.items.length} ítem(s)</p>
                    </div>
                  </div>

                  {viewingSale.items.length > 0 && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-700">Productos de la venta</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-gray-500 bg-white">
                            <th className="text-left px-4 py-2">Producto</th>
                            <th className="text-right px-4 py-2">Cant.</th>
                            <th className="text-right px-4 py-2">P. Unitario</th>
                            <th className="text-right px-4 py-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {viewingSale.items.map((item, index) => (
                            <tr key={index} className="bg-white hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <p>{item.name}</p>
                                <p className="text-xs text-gray-500">{item.code}</p>
                              </td>
                              <td className="text-right px-4 py-2">{item.quantity}</td>
                              <td className="text-right px-4 py-2">${item.price.toLocaleString()}</td>
                              <td className="text-right px-4 py-2 font-semibold">${(item.quantity * item.price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-blue-50 border-t border-blue-100">
                            <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-700 text-right">Total</td>
                            <td className="px-4 py-2 font-semibold text-blue-600">${viewingSale.total.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── MODAL PDF ─────────────────────────────────────────────────── */}
        <Dialog open={showPDFModal} onOpenChange={setShowPDFModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Factura de Venta #{pdfSale?.id}</DialogTitle>
              <DialogDescription>Vista previa del documento de venta</DialogDescription>
            </DialogHeader>
            {pdfSale && (
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] bg-white">
                <div className="bg-white p-8 space-y-6 border rounded-lg">
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
                      <div className="mt-1">{getTypeBadge(pdfSale.type)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm uppercase text-gray-600 mb-2">Datos del Cliente</h3>
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="text-gray-900">{pdfSale.clientName}</p>
                        {pdfSale.clientDocument && <p className="text-sm text-gray-600">Documento: {pdfSale.clientDocument}</p>}
                        {pdfSale.clientId && <p className="text-sm text-gray-600">ID Cliente: {pdfSale.clientId}</p>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm uppercase text-gray-600 mb-2">Información de Pago</h3>
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="text-sm text-gray-600">Método de Pago:</p>
                        <p className="text-gray-900">{pdfSale.paymentMethod}</p>
                        <p className="text-sm text-gray-600 mt-2">Estado:</p>
                        <div className="mt-1">{getStatusBadge(pdfSale.status)}</div>
                      </div>
                    </div>
                  </div>

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
                            <td className="px-4 py-3 text-right text-sm text-gray-900">${item.price.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">${(item.quantity * item.price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">${Math.round(pdfSale.total / 1.19).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">IVA (19%):</span>
                        <span className="text-gray-900">${Math.round(pdfSale.total - pdfSale.total / 1.19).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 border-t-2 border-blue-600">
                        <span className="text-lg text-gray-900">Total:</span>
                        <span className="text-xl text-blue-600">${pdfSale.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

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

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button onClick={() => window.print()} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <FileTextIcon className="w-4 h-4 mr-2" />Imprimir / Descargar PDF
                  </Button>
                  <Button onClick={() => setShowPDFModal(false)} variant="outline" className="flex-1">
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── MODAL ANULACIÓN ───────────────────────────────────────────── */}
        <AlertDialog open={showCancelDialog} onOpenChange={(open) => {
          setShowCancelDialog(open);
          if (!open) setSaleToCancel(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
                <AlertTriangleIcon className="w-5 h-5" />
                Anular Venta
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>¿Estás seguro de que deseas anular esta venta?</p>
                  {saleToCancel && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1 text-sm">
                      <p><span className="text-gray-500">Venta #: </span>{saleToCancel.id}</p>
                      <p><span className="text-gray-500">Cliente: </span>{saleToCancel.clientName}</p>
                      <p><span className="text-gray-500">Total: </span>${saleToCancel.total.toLocaleString()}</p>
                    </div>
                  )}
                  <p className="text-sm text-blue-600">
                    La venta cambiará su estado a "Anulada" y no se eliminará del sistema.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancel} className="bg-blue-600 hover:bg-blue-700">
                Confirmar Anulación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}