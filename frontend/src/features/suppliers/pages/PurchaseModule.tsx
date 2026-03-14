import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { PlusIcon, SearchIcon, ShoppingCartIcon, EyeIcon, Trash2, FileDown, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export function PurchaseModule() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [isNewPurchaseDialogOpen, setIsNewPurchaseDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [purchaseForm, setPurchaseForm] = useState({
    supplierName: '',
    documentType: 'NIT',
    documentNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    items: [],
    paymentMethod: 'Transferencia',
    status: 'Pendiente',
    notes: ''
  });

  const [supplySearch, setSupplySearch] = useState('');

  useEffect(() => {
    // Load demo data
    setSuppliers([
      { id: 1, name: 'AutoPartes Premium S.A.S', email: 'ventas@autopartespremium.com' },
      { id: 2, name: 'Distribuidora Nacional Ltda', email: 'gerencia@disnacional.com' },
      { id: 3, name: 'Repuestos Eléctricos del Valle', email: 'contacto@electricosvalle.com' },
      { id: 4, name: 'Lubricantes y Filtros SA', email: 'info@lubrifiltros.com' }
    ]);

    setSupplies([
      { id: 1, name: 'Aceite Motor 5W-30', code: 'AC-001', price: 45000, stock: 120 },
      { id: 2, name: 'Líquido de Frenos DOT-4', code: 'LF-002', price: 28000, stock: 85 },
      { id: 3, name: 'Refrigerante Motor', code: 'RF-003', price: 35000, stock: 60 },
      { id: 4, name: 'Grasa Multiusos', code: 'GR-004', price: 22000, stock: 95 },
      { id: 5, name: 'Filtro de Aire', code: 'FA-005', price: 42000, stock: 40 },
      { id: 6, name: 'Bujías Platino', code: 'BP-006', price: 85000, stock: 25 }
    ]);

    setPurchases([
      {
        id: 1,
        supplierName: 'AutoPartes Premium S.A.S',
        documentNumber: '900123456-7',
        date: '2024-01-19',
        time: '10:30',
        items: [
          { id: 1, name: 'Aceite Motor 5W-30', quantity: 24, price: 45000 },
          { id: 2, name: 'Líquido de Frenos DOT-4', quantity: 12, price: 28000 }
        ],
        total: 1416000,
        paymentMethod: 'Transferencia',
        status: 'Completada',
        notes: 'Compra mensual de lubricantes'
      },
      {
        id: 2,
        supplierName: 'Distribuidora Nacional Ltda',
        documentNumber: '900987654-3',
        date: '2024-01-19',
        time: '14:15',
        items: [
          { id: 3, name: 'Refrigerante Motor', quantity: 18, price: 35000 }
        ],
        total: 630000,
        paymentMethod: 'Crédito',
        status: 'Pendiente',
        notes: 'Pendiente de entrega'
      },
      {
        id: 3,
        supplierName: 'Repuestos Eléctricos del Valle',
        documentNumber: '900456789-1',
        date: '2024-01-18',
        time: '16:45',
        items: [
          { id: 5, name: 'Filtro de Aire', quantity: 15, price: 42000 }
        ],
        total: 630000,
        paymentMethod: 'Transferencia',
        status: 'En tránsito',
        notes: ''
      }
    ]);
  }, []);

  const handleCreatePurchase = (e) => {
    e.preventDefault();
    if (purchaseForm.items.length === 0) {
      alert('Debe agregar al menos un insumo');
      return;
    }

    if (!purchaseForm.supplierName.trim()) {
      alert('Debe ingresar el nombre del proveedor');
      return;
    }

    const total = purchaseForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const now = new Date();

    const newPurchase = {
      id: Date.now(),
      supplierName: purchaseForm.supplierName.trim(),
      documentNumber: purchaseForm.documentNumber,
      date: purchaseForm.purchaseDate,
      time: now.toTimeString().slice(0, 5),
      items: purchaseForm.items,
      total,
      paymentMethod: purchaseForm.paymentMethod,
      status: purchaseForm.status,
      notes: purchaseForm.notes
    };

    setPurchases([newPurchase, ...purchases]);
    resetPurchaseForm();
    setIsNewPurchaseDialogOpen(false);
    alert('Compra creada exitosamente');
  };

  const resetPurchaseForm = () => {
    setPurchaseForm({
      supplierName: '',
      documentType: 'NIT',
      documentNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      items: [],
      paymentMethod: 'Transferencia',
      status: 'Pendiente',
      notes: ''
    });
    setSupplySearch('');
  };

  const addSupplyToPurchase = (supply) => {
    const existingItem = purchaseForm.items.find(item => item.id === supply.id);
    if (existingItem) {
      setPurchaseForm({
        ...purchaseForm,
        items: purchaseForm.items.map(item =>
          item.id === supply.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      setPurchaseForm({
        ...purchaseForm,
        items: [...purchaseForm.items, {
          id: supply.id,
          name: supply.name,
          code: supply.code,
          price: supply.price,
          quantity: 1
        }]
      });
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setPurchaseForm({
        ...purchaseForm,
        items: purchaseForm.items.filter(item => item.id !== itemId)
      });
    } else {
      setPurchaseForm({
        ...purchaseForm,
        items: purchaseForm.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      });
    }
  };

  const cancelPurchase = (purchaseId) => {
    if (confirm('¿Está seguro de anular esta compra?')) {
      setPurchases(purchases.map(purchase =>
        purchase.id === purchaseId ? { ...purchase, status: 'Anulada' } : purchase
      ));
    }
  };

  const filteredSupplies = supplies.filter(supply =>
    supply.name.toLowerCase().includes(supplySearch.toLowerCase()) ||
    supply.code.toLowerCase().includes(supplySearch.toLowerCase())
  );

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          purchase.id.toString().includes(searchTerm);
    
    let matchesDate = true;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    switch (dateFilter) {
      case 'today':
        matchesDate = purchase.date === today;
        break;
      case 'yesterday':
        matchesDate = purchase.date === yesterday;
        break;
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        matchesDate = purchase.date >= weekAgo;
        break;
    }

    return matchesSearch && matchesDate;
  });

  const purchasesTotal = filteredPurchases.reduce((sum, purchase) => 
    purchase.status !== 'Anulada' ? sum + purchase.total : sum, 0
  );

  const getStatusColor = () => {
  return 'bg-blue-100 text-blue-700 border border-blue-200';
};

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const currentPurchases = filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
  const endIndex = Math.min(currentPage * itemsPerPage, filteredPurchases.length);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-1">
            Compras de Insumos
          </h1>
          <p className="text-blue-600">
            Gestión y control de adquisiciones
          </p>
        </div>
        
        <Button 
          onClick={() => setIsNewPurchaseDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Nueva Compra
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por proveedor o ID de compra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Compras</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Mostrando {currentPurchases.length} compras</p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Total: ${purchasesTotal.toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-200">
            {currentPurchases.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg text-gray-900 mb-2">No hay compras</h3>
                <p className="text-gray-600">No se encontraron compras con los filtros aplicados</p>
              </div>
            ) : (
              currentPurchases.map((purchase) => (
                <div key={purchase.id} className="py-5 hover:bg-blue-50 transition-all rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="text-lg text-gray-900">#{purchase.id}</h4>
                        <Badge className={getStatusColor(purchase.status)}>
                          {purchase.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(purchase.date).toLocaleDateString('es-CO')} • {purchase.time}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Proveedor</p>
                          <p className="text-gray-900">{purchase.supplierName}</p>
                          {purchase.documentNumber && (
                            <p className="text-sm text-gray-500">NIT: {purchase.documentNumber}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Insumos ({purchase.items.length})</p>
                          <div className="space-y-1">
                            {purchase.items.slice(0, 2).map((item, index) => (
                              <p key={index} className="text-sm text-gray-900">
                                {item.quantity}x {item.name}
                              </p>
                            ))}
                            {purchase.items.length > 2 && (
                              <p className="text-sm text-gray-500">
                                +{purchase.items.length - 2} más...
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total</p>
                          <p className="text-xl text-gray-900">${purchase.total.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{purchase.paymentMethod}</p>
                        </div>
                      </div>

                      {purchase.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{purchase.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingPurchase(purchase);
                          setShowDetailModal(true);
                        }}
                        className="bg-white text-blue-900 border border-blue-900 hover:shadow-md hover:bg-blue-900 transition-all"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('Generando PDF...')}
                        className="bg-white text-blue-900 border border-blue-900 hover:shadow-md hover:bg-blue-900 transition-all"
                      >
                        <FileDown className="w-4 h-4" />
                      </Button>
                      {purchase.status !== 'Anulada' && (
                        <Button
                          size="sm"
                          onClick={() => cancelPurchase(purchase.id)}
                          className="bg-white text-blue-600 border border-blue-600 hover:shadow-md hover:bg-blue-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredPurchases.length > 0 && (
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

      {/* New Purchase Modal - Reorganized and Wider */}
      <Dialog open={isNewPurchaseDialogOpen} onOpenChange={setIsNewPurchaseDialogOpen}>
        <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Nueva Compra de Insumos</DialogTitle>
            <DialogDescription>
              Completa el formulario para registrar una nueva compra
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreatePurchase} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-1">
              <div className="grid grid-cols-1 lg:grid-cols-1 1xl:grid-cols-1 gap-8 pb-6">
                {/* Columna 1: Datos del Proveedor */}
                <div className="space-y-6">
                  <Card className="h-full">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                      <CardTitle className="text-lg text-blue-900">Datos del Proveedor</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="supplierName">Nombre del Proveedor *</Label>
                        <Input
                          id="supplierName"
                          placeholder="Escribir nombre del proveedor..."
                          value={purchaseForm.supplierName}
                          onChange={(e) => setPurchaseForm({...purchaseForm, supplierName: e.target.value})}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="documentType">Tipo de Documento</Label>
                          <Select
                            value={purchaseForm.documentType}
                            onValueChange={(value) => setPurchaseForm({...purchaseForm, documentType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NIT">NIT</SelectItem>
                              <SelectItem value="RUT">RUT</SelectItem>
                              <SelectItem value="CE">Cédula Extranjería</SelectItem>
                              <SelectItem value="CC">Cédula Ciudadanía</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="documentNumber">Número</Label>
                          <Input
                            id="documentNumber"
                            placeholder="123456789-0"
                            value={purchaseForm.documentNumber}
                            onChange={(e) => setPurchaseForm({...purchaseForm, documentNumber: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purchaseDate">Fecha de Compra *</Label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="purchaseDate"
                            type="date"
                            value={purchaseForm.purchaseDate}
                            onChange={(e) => setPurchaseForm({...purchaseForm, purchaseDate: e.target.value})}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Método de Pago</Label>
                          <Select
                            value={purchaseForm.paymentMethod}
                            onValueChange={(value) => setPurchaseForm({...purchaseForm, paymentMethod: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Transferencia">Transferencia</SelectItem>
                              <SelectItem value="Crédito">Crédito</SelectItem>
                              <SelectItem value="Efectivo">Efectivo</SelectItem>
                              <SelectItem value="Cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status">Estado</Label>
                          <Select
                            value={purchaseForm.status}
                            onValueChange={(value) => setPurchaseForm({...purchaseForm, status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendiente">Pendiente</SelectItem>
                              <SelectItem value="En tránsito">En tránsito</SelectItem>
                              <SelectItem value="Completada">Completada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Comentarios adicionales..."
                          value={purchaseForm.notes}
                          onChange={(e) => setPurchaseForm({...purchaseForm, notes: e.target.value})}
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna 2: Selección de Insumos */}
                <div className="space-y-6">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="bg-blue-50 border-b border-blue-200">
                    <CardTitle className="text-lg text-blue-900">Seleccionar Insumos</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplySearch">Buscar Insumos</Label>
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="supplySearch"
                            placeholder="Buscar por nombre o código..."
                            value={supplySearch}
                            onChange={(e) => setSupplySearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-gray-50 min-h-[400px]">
                        <div className="grid grid-cols-1 gap-3">
                          {filteredSupplies.map(supply => (
                            <Card key={supply.id} className="border-gray-200 bg-white hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm text-gray-900 truncate">{supply.name}</h4>
                                      <p className="text-xs text-gray-500">{supply.code}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-blue-600 ml-2 shrink-0">
                                      ${supply.price.toLocaleString()}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Stock: {supply.stock}</span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => addSupplyToPurchase(supply)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all"
                                    >
                                      <PlusIcon className="w-3 h-3 mr-1" />
                                      Agregar
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna 3: Carrito de Compra */}
                <div className="space-y-6">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="bg-blue-50 border-b border-blue-200">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-blue-900 flex items-center">
                          <ShoppingCartIcon className="w-5 h-5 mr-2" />
                          Carrito de Compra
                        </CardTitle>
                        {purchaseForm.items.length > 0 && (
                          <Badge className="bg-green-600 text-white">
                            {purchaseForm.items.reduce((sum, item) => sum + item.quantity, 0)} items
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0">
                      {purchaseForm.items.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                          <div className="text-center">
                            <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-2">No hay insumos agregados</p>
                            <p className="text-sm text-gray-400">Selecciona insumos para agregar al carrito</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col">
                          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px]">
                            {purchaseForm.items.map(item => (
                              <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm text-gray-900 truncate">{item.name}</h4>
                                      <p className="text-xs text-gray-500">{item.code}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-blue-600 ml-2 shrink-0">
                                      ${item.price.toLocaleString()}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 p-0 border-gray-300 hover:border-red-300 hover:bg-red-50"
                                      >
                                        -
                                      </Button>
                                      <span className="text-sm w-10 text-center bg-white px-2 py-1 border rounded">{item.quantity}</span>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 p-0 border-gray-300 hover:border-green-300 hover:bg-green-50"
                                      >
                                        +
                                      </Button>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700 border-green-200 ml-2">
                                      ${(item.quantity * item.price).toLocaleString()}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-4 bg-blue-50 border-t border-blue-200 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Insumos:</span>
                              <span className="text-gray-900">{purchaseForm.items.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-base">
                              <span className="text-blue-600 font-medium">
                                Cantidad total:
                              </span>
                              <span className="text-blue-900 font-semibold text-lg">
                                {purchaseForm.items.reduce((sum, item) => sum + item.quantity, 0)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="text-gray-900">
                                ${purchaseForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="border-t border-blue-200 pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-lg text-blue-900">Total:</span>
                                <Badge className="text-xl px-4 py-2 bg-blue-600 text-white border-blue-600">
                                  ${purchaseForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-4 pt-6 border-t bg-gray-50 px-6 py-4 -mx-6 -mb-6 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetPurchaseForm();
                  setIsNewPurchaseDialogOpen(false);
                }}
                className="flex-1 h-12 bg-white text-blue-600 border border-blue-600 hover:shadow-md hover:bg-blue-50 transition-all"
              >
                Cancelar Compra
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-lg"
                disabled={purchaseForm.items.length === 0}
              >
                🛒 Procesar Compra
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Compra</DialogTitle>
            <DialogDescription>
              Información completa de la compra seleccionada
            </DialogDescription>
          </DialogHeader>

          {viewingPurchase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID de Compra</p>
                  <p className="text-lg text-gray-900">#{viewingPurchase.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <Badge className={getStatusColor(viewingPurchase.status)}>
                    {viewingPurchase.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Proveedor</p>
                  <p className="text-lg text-gray-900">{viewingPurchase.supplierName}</p>
                  {viewingPurchase.documentNumber && (
                    <p className="text-sm text-gray-500">NIT: {viewingPurchase.documentNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="text-lg text-gray-900">
                    {new Date(viewingPurchase.date).toLocaleDateString('es-CO')}
                  </p>
                  <p className="text-sm text-gray-500">{viewingPurchase.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Método de Pago</p>
                  <p className="text-lg text-gray-900">{viewingPurchase.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl text-blue-600">${viewingPurchase.total.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg text-gray-900 mb-4">Insumos Comprados</h3>
                <div className="space-y-2">
                  {viewingPurchase.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Código: {item.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900">{item.quantity} x ${item.price.toLocaleString()}</p>
                        <p className="text-sm text-blue-600">${(item.quantity * item.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingPurchase.notes && (
                <div>
                  <h3 className="text-lg text-gray-900 mb-2">Notas</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{viewingPurchase.notes}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button 
                  onClick={() => alert('Generando PDF...')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}