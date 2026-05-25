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
  Info,
  Loader2,
  Banknote,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronUp,
  Lock,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// ─── Persistencia de estados de pago (localStorage) ──────────────────────────

const SALE_STATUS_KEY = 'jtools_sale_statuses';

const getSaleStatuses = (): Record<number, string> => {
  try { return JSON.parse(localStorage.getItem(SALE_STATUS_KEY) ?? '{}'); }
  catch { return {}; }
};

const persistSaleStatus = (id: number, status: string) => {
  const map = getSaleStatuses();
  if (status === 'Completada') delete map[id];
  else map[id] = status;
  localStorage.setItem(SALE_STATUS_KEY, JSON.stringify(map));
};

const getDaysUntilVoid = (dateStr: string) => {
  const voidDate = new Date(dateStr);
  voidDate.setDate(voidDate.getDate() + 30);
  return Math.ceil((voidDate.getTime() - Date.now()) / 86_400_000);
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function SalesModule({ clientFilter, onClearClientFilter, clientMode = false }: SalesModuleProps) {

  const [sales, setSales]     = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  useEffect(() => {
    if (clientMode) return;
    const fetchClientes = async () => {
      try {
        const data = await getClientes() as any[];
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
  }, [clientMode]);

  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await getProductos() as any[];
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
  const [pdfBannerId, setPdfBannerId]           = useState<number | null>(null);
  const [searchTerm, setSearchTerm]             = useState('');
  const [currentPage, setCurrentPage]           = useState(1);
  const itemsPerPage = 5;

  const [saleForm, setSaleForm] = useState({
    clientId: '',
    clientName: '',
    clientDocument: '',
    paymentMethod: 'Efectivo',
    descuento: '',
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
        const statuses = getSaleStatuses();

        // Mergear estado de pago persistido con datos del backend
        const mapped = data.map(v => {
          const s = mapVentaToSale(v);
          if (statuses[v.id]) s.status = statuses[v.id];
          return s;
        });

        // Auto-anular ventas pendientes con más de 30 días
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const toVoid = mapped.filter(s => s.status === 'Pendiente' && new Date(s.date) < cutoff);

        let result = [...mapped];
        for (const sale of toVoid) {
          try {
            await deleteVenta(sale.id);
            persistSaleStatus(sale.id, 'Anulada');
            result = result.map(s => s.id === sale.id ? { ...s, status: 'Anulada' } : s);
            toast.warning(`Venta #${sale.id} anulada automáticamente (pago pendiente más de 30 días)`);
          } catch {}
        }

        setSales(result);
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

  const handleViewPDF = (sale: Sale) => {
    if (sale.status === 'Anulada') {
      setPdfBannerId(prev => prev === sale.id ? null : sale.id);
      return;
    }
    setPdfBannerId(null);
    setPdfSale(sale);
    setShowPDFModal(true);
  };

  const generateSalePDF = (sale: Sale) => {
    const doc = new jsPDF();

    // Encabezado azul
    doc.setFillColor(29, 78, 216);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('JREPUESTOS MEDELLÍN', 14, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Repuestos de Carros de Alta Calidad  ·  Medellín, Colombia  ·  Tel: (604) 123-4567', 14, 25);
    doc.text('contacto@jrepuestos.com', 14, 32);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA DE VENTA', 196, 14, { align: 'right' });
    doc.setFontSize(16);
    doc.text(`#${sale.id}`, 196, 24, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${sale.date}`, 196, 32, { align: 'right' });

    // Info cliente y pago
    doc.setTextColor(0, 0, 0);
    const y = 50;

    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.rect(14, y, 86, 28, 'FD');
    doc.rect(110, y, 86, 28, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text('DATOS DEL CLIENTE', 18, y + 7);
    doc.text('INFORMACIÓN DE PAGO', 114, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(10);
    doc.text(sale.clientName.length > 30 ? sale.clientName.substring(0, 30) + '…' : sale.clientName, 18, y + 16);
    if (sale.clientDocument) {
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Doc: ${sale.clientDocument}`, 18, y + 23);
    }

    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`Método: ${sale.paymentMethod}`, 114, y + 16);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Estado: ${sale.status}`, 114, y + 23);

    // Tabla de productos
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: y + 36,
      head: [['Código', 'Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: sale.items.map(item => [
        item.code || '—',
        item.name,
        item.quantity.toString(),
        `$${item.price.toLocaleString('es-CO')}`,
        `$${(item.quantity * item.price).toLocaleString('es-CO')}`,
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 85 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 33, halign: 'right' },
      },
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const subtotal = Math.round(sale.total / 1.19);
    const iva = sale.total - subtotal;

    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.rect(120, finalY, 76, 30, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Subtotal:', 124, finalY + 9);
    doc.text('IVA (19%):', 124, finalY + 17);
    doc.setTextColor(17, 24, 39);
    doc.text(`$${subtotal.toLocaleString('es-CO')}`, 192, finalY + 9, { align: 'right' });
    doc.text(`$${iva.toLocaleString('es-CO')}`, 192, finalY + 17, { align: 'right' });

    doc.setDrawColor(29, 78, 216);
    doc.line(120, finalY + 21, 196, finalY + 21);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text('Total:', 124, finalY + 28);
    doc.text(`$${sale.total.toLocaleString('es-CO')}`, 192, finalY + 28, { align: 'right' });

    // Pie de página
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text('Gracias por su compra. Documento generado por JTOOLS SOFT.', 105, 280, { align: 'center' });
    doc.text('JRepuestos Medellín · NIT: 900.123.456-7 · (604) 123-4567 · contacto@jrepuestos.com', 105, 285, { align: 'center' });

    doc.save(`venta-${sale.id}.pdf`);
  };

  const handleCancelSale = (sale: Sale) => {
    if (sale.status === 'Completada') {
      toast.error('Las ventas completadas no pueden ser anuladas');
      return;
    }
    setSaleToCancel(sale);
    setShowCancelDialog(true);
  };

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

  const handleChangeStatus = (sale: Sale, newStatus: string) => {
    persistSaleStatus(sale.id, newStatus);
    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, status: newStatus } : s));
    toast.success(`Venta #${sale.id} marcada como ${newStatus}`);
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

  const calculateSubtotal = () => saleForm.items.reduce((s, i) => s + i.quantity * i.price, 0);

  const parseDescuento = () => {
    const val = parseFloat(saleForm.descuento.replace(/\./g, '').replace(',', '.'));
    return isNaN(val) || val < 0 ? 0 : val;
  };

  const calculateTotal = () => Math.max(0, calculateSubtotal() - parseDescuento());

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.clientId)          { toast.error('Por favor selecciona un cliente'); return; }
    if (saleForm.items.length === 0) { toast.error('Por favor agrega al menos un producto'); return; }
    const descuentoVal = parseDescuento();
    if (saleForm.descuento !== '' && descuentoVal < 0) { toast.error('El descuento no puede ser negativo'); return; }
    if (descuentoVal > calculateSubtotal()) { toast.error('El descuento no puede ser mayor al subtotal'); return; }

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
    setSaleForm({ clientId: '', clientName: '', clientDocument: '', paymentMethod: 'Efectivo', descuento: '', items: [] });
    setProductSearch('');
    setClientSearch('');
  };

  // ─── Badges ───────────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Completada': 'bg-blue-50 text-blue-900 border-blue-200',
      'Pendiente':  'bg-amber-50 text-amber-800 border-amber-300',
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

  const subtotal    = calculateSubtotal();
  const descuento   = parseDescuento();
  const totalFinal  = calculateTotal();

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
          <Dialog open={showNewSaleModal} onOpenChange={(open: boolean) => {
            setShowNewSaleModal(open);
            if (!open) { resetSaleForm(); if (onClearClientFilter) onClearClientFilter(); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />Nueva Venta
              </Button>
            </DialogTrigger>

            <DialogContent
              className="p-0 gap-0 overflow-hidden"
              style={{
                width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* ════ HEADER ════ */}
              <header style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
                flexShrink: 0, background: '#fff',
              }}>
                <div style={{
                  width: 40, height: 40, background: '#1d4ed8',
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <ShoppingCartIcon style={{ width: 20, height: 20, color: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
                  <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.2, margin: 0 }}>
                    Registrar Nueva Venta
                  </DialogTitle>
                  <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Selecciona un cliente y agrega productos para completar la venta.
                  </DialogDescription>
                </div>
              </header>

              <form onSubmit={handleCreateSale} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                {/* ════ BODY (2 COLUMNAS) ════ */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                  {/* ── SIDEBAR IZQUIERDO ── */}
                  <aside style={{
                    width: 320, flexShrink: 0,
                    borderRight: '1px solid #e5e7eb', background: '#f9fafb',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                      {/* Cliente */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>
                          Cliente <span style={{ color: '#f87171' }}>*</span>
                        </label>
                        {!saleForm.clientId ? (
                          <div>
                            <div style={{ position: 'relative' }}>
                              <SearchIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: 14, height: 14, pointerEvents: 'none' }} />
                              <Input
                                placeholder="Buscar por nombre o documento..."
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                style={{ paddingLeft: 36, height: 40, fontSize: 14, background: '#fff' }}
                              />
                            </div>
                            {clientSearch && (
                              <div style={{
                                marginTop: 4, background: '#fff', border: '1px solid #e5e7eb',
                                borderRadius: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                maxHeight: 200, overflowY: 'auto',
                              }}>
                                {filteredClients.length === 0 ? (
                                  <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
                                    <SearchIcon style={{ width: 20, height: 20, margin: '0 auto 4px', opacity: 0.4 }} />
                                    <p style={{ margin: 0 }}>Sin resultados para "{clientSearch}"</p>
                                  </div>
                                ) : filteredClients.map(client => (
                                  <button
                                    key={client.id} type="button"
                                    onClick={() => handleSelectClient(client)}
                                    style={{
                                      width: '100%', textAlign: 'left', padding: '8px 12px',
                                      fontSize: 13, border: 'none', cursor: 'pointer', background: '#fff',
                                      borderBottom: '1px solid #f3f4f6',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>
                                          {(client.name?.[0] ?? '?').toUpperCase()}
                                        </span>
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</p>
                                        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {client.document || ''}{client.phone ? ` · ${client.phone}` : ''}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8' }}>Cliente seleccionado</span>
                              <button type="button"
                                onClick={() => setSaleForm({ ...saleForm, clientId: '', clientName: '', clientDocument: '' })}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}
                              >
                                <XIcon style={{ width: 14, height: 14 }} />
                              </button>
                            </div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{saleForm.clientName}</p>
                            {saleForm.clientDocument && <p style={{ margin: 0, fontSize: 12, color: '#6b7280', marginTop: 2 }}>{saleForm.clientDocument}</p>}
                          </div>
                        )}
                      </div>

                      {/* Método de pago */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>
                          Método de pago <span style={{ color: '#f87171' }}>*</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {[
                            { value: 'Efectivo',      label: 'Efectivo',      Icon: Banknote },
                            { value: 'Transferencia', label: 'Transferencia', Icon: ArrowLeftRight },
                            { value: 'Tarjeta',       label: 'Tarjeta',       Icon: CreditCard },
                            { value: 'Crédito',       label: 'Crédito',       Icon: Wallet },
                          ].map(({ value, label, Icon }) => {
                            const selected = saleForm.paymentMethod === value;
                            return (
                              <button key={value} type="button"
                                onClick={() => setSaleForm({ ...saleForm, paymentMethod: value })}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  gap: 6, padding: '10px 8px', borderRadius: 8,
                                  border: `1px solid ${selected ? '#1d4ed8' : '#e5e7eb'}`,
                                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                  background: selected ? '#1d4ed8' : '#fff',
                                  color: selected ? '#fff' : '#4b5563',
                                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                                }}
                              >
                                <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Descuento */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>
                          Descuento <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: 14, fontWeight: 600, pointerEvents: 'none' }}>$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={saleForm.descuento}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const formatted = raw ? Number(raw).toLocaleString('es-CO') : '';
                              setSaleForm({ ...saleForm, descuento: formatted });
                            }}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              paddingLeft: 26, paddingRight: 12, height: 36,
                              border: `1px solid ${
                                saleForm.descuento !== '' && parseDescuento() > subtotal
                                  ? '#f87171'
                                  : '#e5e7eb'
                              }`,
                              borderRadius: 8, fontSize: 14, color: '#111827',
                              outline: 'none', background: '#fff',
                            }}
                          />
                        </div>
                        {saleForm.descuento !== '' && parseDescuento() > subtotal && subtotal > 0 && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#f87171' }}>
                            El descuento no puede superar el subtotal (${subtotal.toLocaleString('es-CO')})
                          </p>
                        )}
                        {saleForm.descuento !== '' && parseDescuento() > 0 && parseDescuento() <= subtotal && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#16a34a' }}>
                            Descuento aplicado: -${parseDescuento().toLocaleString('es-CO')}
                          </p>
                        )}
                      </div>
                    </div>
                  </aside>

                  {/* ── PANEL DERECHO (carrito) ── */}
                  <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>

                    {/* Header del panel */}
                    <div style={{
                      padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      gap: 16, flexShrink: 0,
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontWeight: 700, color: '#111827', fontSize: 16, lineHeight: 1.2, margin: 0 }}>
                          Carrito de Venta
                          {saleForm.items.length > 0 && (
                            <span style={{ marginLeft: 8, fontSize: 12, background: '#1d4ed8', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                              {saleForm.items.reduce((s, i) => s + i.quantity, 0)} items
                            </span>
                          )}
                        </h3>
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, margin: 0 }}>
                          Agrega productos para completar la venta.
                        </p>
                      </div>
                    </div>

                    {/* Buscador de productos */}
                    <div style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb', padding: '12px 24px', flexShrink: 0 }}>
                      <div style={{ position: 'relative' }}>
                        <SearchIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: 14, height: 14 }} />
                        <Input
                          placeholder="Buscar producto por nombre o código..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          style={{ paddingLeft: 36, height: 36, fontSize: 14 }}
                        />
                      </div>
                      {productSearch && (
                        <div style={{ marginTop: 8, overflowY: 'auto', maxHeight: 180 }}>
                          {filteredProducts.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 12 }}>No se encontraron productos</p>
                          ) : filteredProducts.map(product => (
                            <div key={product.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 12px', marginBottom: 4, borderRadius: 8,
                              border: `1px solid ${saleForm.items.some(i => i.id === product.id) ? '#93c5fd' : '#f3f4f6'}`,
                              background: '#fff',
                            }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                                  {product.name}
                                </p>
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                                  {product.code} · ${product.price.toLocaleString()} · Stock: {product.stock}
                                </p>
                              </div>
                              <Button type="button" size="sm"
                                onClick={() => handleAddProduct(product)}
                                style={{ marginLeft: 12, flexShrink: 0, height: 28, fontSize: 11, padding: '0 10px', background: '#2563eb', color: '#fff' }}
                              >
                                <PlusIcon style={{ width: 12, height: 12, marginRight: 4 }} />
                                Agregar
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Items del carrito */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {saleForm.items.length === 0 ? (
                        <div style={{
                          margin: 24, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          padding: '64px 0', borderRadius: 12,
                          border: '2px dashed #e5e7eb', color: '#9ca3af',
                        }}>
                          <ShoppingCartIcon style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.25 }} />
                          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Sin productos aún</p>
                          <p style={{ fontSize: 12, marginTop: 4, margin: 0 }}>Busca y agrega productos arriba</p>
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</th>
                              <th style={{ textAlign: 'center', padding: '12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>Cantidad</th>
                              <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>Subtotal</th>
                              <th style={{ width: 40 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {saleForm.items.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px 24px' }}>
                                  <p style={{ fontWeight: 500, color: '#111827', fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{item.code} · ${item.price.toLocaleString()} c/u</p>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff', width: 'fit-content', margin: '0 auto' }}>
                                    <button type="button"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                      style={{ width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', background: 'transparent', border: 'none', fontSize: 16, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', opacity: item.quantity <= 1 ? 0.3 : 1 }}
                                    >−</button>
                                    <span style={{ width: 36, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{item.quantity}</span>
                                    <button type="button"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                      style={{ width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer' }}
                                    >+</button>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                                    ${(item.quantity * item.price).toLocaleString()}
                                  </span>
                                </td>
                                <td style={{ paddingRight: 12 }}>
                                  <button type="button"
                                    onClick={() => handleRemoveProduct(item.id)}
                                    style={{ color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                  >
                                    <XIcon style={{ width: 16, height: 16 }} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Totales */}
                    {saleForm.items.length > 0 && (
                      <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px', flexShrink: 0, background: '#fff' }}>
                        <div style={{ marginLeft: 'auto', maxWidth: 280 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: '#6b7280' }}>Subtotal</span>
                            <span style={{ fontSize: 14, color: '#374151' }}>${subtotal.toLocaleString('es-CO')}</span>
                          </div>
                          {descuento > 0 && descuento <= subtotal && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, color: '#16a34a' }}>Descuento</span>
                              <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>-${descuento.toLocaleString('es-CO')}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: descuento > 0 && descuento <= subtotal ? '1px solid #e5e7eb' : 'none' }}>
                            <span style={{ fontWeight: 700, color: '#111827' }}>Total</span>
                            <span style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>
                              ${totalFinal.toLocaleString('es-CO')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* ════ FOOTER ════ */}
                <footer style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, padding: '12px 24px',
                  borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
                }}>
                  <p style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                    Todos los precios están en COP
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Button
                      type="button" variant="outline" disabled={submitting}
                      onClick={() => { resetSaleForm(); setShowNewSaleModal(false); if (onClearClientFilter) onClearClientFilter(); }}
                      style={{ height: 36, padding: '0 16px' }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={!saleForm.clientId || saleForm.items.length === 0 || submitting}
                      style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px' }}
                    >
                      {submitting && <Loader2 style={{ width: 16, height: 16, marginRight: 8 }} className="animate-spin" />}
                      Registrar Venta
                    </Button>
                  </div>
                </footer>
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
                  const isAnulada    = sale.status === 'Anulada';
                  const isCompletada = sale.status === 'Completada';
                  return (
                    <React.Fragment key={sale.id}>
                    <tr className={`hover:bg-gray-50 transition-colors ${isAnulada ? 'opacity-60' : ''}`}>
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
                        {isAnulada ? (
                          getStatusBadge('Anulada')
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select
                              value={sale.status}
                              onChange={(e) => handleChangeStatus(sale, e.target.value)}
                              style={{
                                padding: '4px 28px 4px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                border: '1px solid',
                                borderColor: sale.status === 'Pendiente' ? '#fcd34d' : '#bfdbfe',
                                background: sale.status === 'Pendiente' ? '#fffbeb' : '#eff6ff',
                                color: sale.status === 'Pendiente' ? '#92400e' : '#1e40af',
                                cursor: 'pointer',
                                outline: 'none',
                                appearance: 'auto',
                              }}
                            >
                              <option value="Completada">Completada</option>
                              <option value="Pendiente">Pendiente</option>
                            </select>
                            {sale.status === 'Pendiente' && (() => {
                              const days = getDaysUntilVoid(sale.date);
                              if (days > 15) return null;
                              return (
                                <span style={{
                                  fontSize: 10, display: 'flex', alignItems: 'center', gap: 2,
                                  color: days <= 7 ? '#ef4444' : '#f59e0b',
                                }}>
                                  <AlertTriangleIcon style={{ width: 10, height: 10, flexShrink: 0 }} />
                                  {days <= 0 ? 'Se anulará hoy' : `${days}d para anularse`}
                                </span>
                              );
                            })()}
                          </div>
                        )}
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
                                disabled={isAnulada}
                                className={isAnulada ? "bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed" : "text-blue-900 border-blue-900 hover:bg-blue-50"}>
                                <FileTextIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{isAnulada ? 'Venta anulada' : 'Ver PDF'}</p></TooltipContent>
                          </Tooltip>

                          {!isAnulada && !clientMode && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => handleCancelSale(sale)}
                                  disabled={isCompletada}
                                  className={isCompletada
                                    ? "bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed"
                                    : "text-blue-900 border-blue-900 hover:bg-red-50"}>
                                  <XCircleIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isCompletada ? 'Las ventas completadas no se pueden anular' : 'Anular venta'}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                    {pdfBannerId === sale.id && (
                      <tr>
                        <td colSpan={5} className="px-4 pb-2">
                          <div className="flex items-center justify-between bg-gray-100 border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 shrink-0 text-gray-500" />
                              <span>No puedes generar el PDF de una venta anulada.</span>
                            </div>
                            <button onClick={() => setPdfBannerId(null)} className="text-gray-400 hover:text-gray-600 ml-4">
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
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
          <DialogContent
            className="p-0 gap-0 overflow-hidden"
            style={{ width: '96vw', maxWidth: 1000, height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* ════ HEADER ════ */}
            <header style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
              flexShrink: 0, background: '#fff',
            }}>
              <div style={{
                width: 40, height: 40, background: '#1d4ed8', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FileTextIcon style={{ width: 20, height: 20, color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
                <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.2, margin: 0 }}>
                  Factura de Venta #{pdfSale?.id}
                </DialogTitle>
                <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Vista previa del documento — descarga el PDF con el botón inferior.
                </DialogDescription>
              </div>
            </header>

            {pdfSale && (
              <>
                {/* ════ BODY (2 COLUMNAS) ════ */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                  {/* ── SIDEBAR IZQUIERDO ── */}
                  <aside style={{
                    width: 280, flexShrink: 0,
                    borderRight: '1px solid #e5e7eb', background: '#f9fafb',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                      {/* Empresa */}
                      <div style={{ marginBottom: 20, padding: 14, background: '#1d4ed8', borderRadius: 8 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 15 }}>JREPUESTOS</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#93c5fd', marginTop: 2 }}>Repuestos de Alta Calidad</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#93c5fd', marginTop: 1 }}>Medellín, Colombia</p>
                      </div>

                      {/* Cliente */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                          Cliente
                        </label>
                        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: 14 }}>{pdfSale.clientName}</p>
                          {pdfSale.clientDocument && (
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', marginTop: 2 }}>Doc: {pdfSale.clientDocument}</p>
                          )}
                          {pdfSale.clientId && (
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', marginTop: 1 }}>ID: {pdfSale.clientId}</p>
                          )}
                        </div>
                      </div>

                      {/* Método de pago */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                          Método de Pago
                        </label>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px',
                        }}>
                          {pdfSale.paymentMethod === 'Efectivo'      && <Banknote       style={{ width: 16, height: 16, color: '#1d4ed8' }} />}
                          {pdfSale.paymentMethod === 'Transferencia' && <ArrowLeftRight  style={{ width: 16, height: 16, color: '#1d4ed8' }} />}
                          {pdfSale.paymentMethod === 'Tarjeta'       && <CreditCard      style={{ width: 16, height: 16, color: '#1d4ed8' }} />}
                          {pdfSale.paymentMethod === 'Crédito'       && <Wallet          style={{ width: 16, height: 16, color: '#1d4ed8' }} />}
                          <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{pdfSale.paymentMethod}</span>
                        </div>
                      </div>

                      {/* Estado */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                          Estado
                        </label>
                        <div>{getStatusBadge(pdfSale.status)}</div>
                      </div>

                      {/* Fecha */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                          Fecha
                        </label>
                        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ fontSize: 14, color: '#111827' }}>{pdfSale.date}</span>
                        </div>
                      </div>

                      {/* Tipo */}
                      {pdfSale.type && (
                        <div style={{ marginBottom: 18 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
                            Tipo de Venta
                          </label>
                          <div>{getTypeBadge(pdfSale.type)}</div>
                        </div>
                      )}
                    </div>
                  </aside>

                  {/* ── PANEL DERECHO ── */}
                  <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>

                    {/* Header panel */}
                    <div style={{
                      padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    }}>
                      <div>
                        <h3 style={{ fontWeight: 700, color: '#111827', fontSize: 16, margin: 0 }}>
                          Detalle de Productos
                          <span style={{ marginLeft: 8, fontSize: 12, background: '#1d4ed8', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                            {pdfSale.items.length} item(s)
                          </span>
                        </h3>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0, marginTop: 2 }}>Factura #{pdfSale.id}</p>
                      </div>
                    </div>

                    {/* Tabla */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead style={{ position: 'sticky', top: 0 }}>
                          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código</th>
                            <th style={{ textAlign: 'left', padding: '12px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</th>
                            <th style={{ textAlign: 'center', padding: '12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 70 }}>Cant.</th>
                            <th style={{ textAlign: 'right', padding: '12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 110 }}>Precio Unit.</th>
                            <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 110 }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pdfSale.items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f3f4f6', background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '12px 24px', fontSize: 12, color: '#6b7280' }}>{item.code}</td>
                              <td style={{ padding: '12px 12px', fontWeight: 500, color: '#111827' }}>{item.name}</td>
                              <td style={{ padding: '12px', textAlign: 'center', color: '#111827' }}>{item.quantity}</td>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#111827' }}>${item.price.toLocaleString()}</td>
                              <td style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>${(item.quantity * item.price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totales */}
                    <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px', flexShrink: 0, background: '#fff' }}>
                      <div style={{ marginLeft: 'auto', maxWidth: 280 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #e5e7eb', marginBottom: 8 }}>
                          <span style={{ color: '#6b7280', fontSize: 13 }}>Subtotal:</span>
                          <span style={{ color: '#111827', fontSize: 13 }}>${Math.round(pdfSale.total / 1.19).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #e5e7eb', marginBottom: 8 }}>
                          <span style={{ color: '#6b7280', fontSize: 13 }}>IVA (19%):</span>
                          <span style={{ color: '#111827', fontSize: 13 }}>${Math.round(pdfSale.total - pdfSale.total / 1.19).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>Total:</span>
                          <span style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>${pdfSale.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* ════ FOOTER ════ */}
                <footer style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, padding: '12px 24px',
                  borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
                }}>
                  <p style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                    JRepuestos Medellín · NIT: 900.123.456-7
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Button variant="outline" onClick={() => setShowPDFModal(false)} style={{ height: 36, padding: '0 16px' }}>
                      Cerrar
                    </Button>
                    <Button
                      onClick={() => { generateSalePDF(pdfSale); setShowPDFModal(false); }}
                      style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px' }}
                    >
                      <Download style={{ width: 16, height: 16, marginRight: 8 }} />
                      Descargar PDF
                    </Button>
                  </div>
                </footer>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── MODAL ANULACIÓN ───────────────────────────────────────────── */}
        <AlertDialog open={showCancelDialog} onOpenChange={(open: boolean) => {
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