// Gestión de Pedidos
import React, { useState, useEffect } from 'react';
import {
  getPedidos,
  createPedido,
  updatePedido,
} from '@/features/orders/services/pedidosService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from 'sonner';
import {
  PlusIcon, SearchIcon, ShoppingCartIcon, EyeIcon, XIcon, EditIcon,
  PackageIcon, RotateCcwIcon, XCircleIcon, AlertTriangleIcon,
  ChevronLeftIcon, ChevronRightIcon, FileTextIcon,
  Lock, X,
} from 'lucide-react';
import { generarPdfPedido } from '../utils/generarPdfPedido';

// ─── Restricciones de input ───────────────────────────────────────────────────

const soloLetras    = (v) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
const soloTelefono  = (v) => v.replace(/[^0-9]/g, '');
const sinEspacios   = (v) => v.replace(/\s/g, '');
const soloDireccion = (v) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s#\-\.]/g, '');
const soloLetrasNum = (v) => v.replace(/[^a-zA-Z0-9]/g, '');
const soloNumeros   = (v) => v.replace(/[^0-9]/g, '');
const soloNIT       = (v) => v.replace(/[^0-9\-]/g, '');

const restriccionDocumento = (v, tipo) => {
  if (tipo === 'CC' || tipo === 'RUT') return soloNumeros(v);
  if (tipo === 'NIT')                  return soloNIT(v);
  if (tipo === 'CE' || tipo === 'Pasaporte') return soloLetrasNum(v);
  return v;
};

// ─── Validaciones ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateClienteForm(f) {
  const e = {};
  const nombre = f.clientName.trim();
  if (!nombre)                  e.clientName = 'El nombre es obligatorio';
  else if (nombre.length < 2)   e.clientName = 'Mínimo 2 caracteres';
  else if (nombre.length > 100) e.clientName = 'Máximo 100 caracteres';

  if (f.documentType && !f.documentNumber.trim())
    e.documentNumber = 'Ingresa el número de documento';
  if (!f.documentType && f.documentNumber.trim())
    e.documentType = 'Selecciona el tipo de documento';

  if (f.documentNumber.trim()) {
    const n = f.documentNumber.trim();
    if ((f.documentType === 'CC' || f.documentType === 'RUT') && !/^\d{5,12}$/.test(n))
      e.documentNumber = 'Debe tener entre 5 y 12 dígitos';
    if (f.documentType === 'NIT' && !/^\d{9,10}(-\d)?$/.test(n))
      e.documentNumber = 'Formato inválido (ej: 900123456-7)';
    if (f.documentType === 'CE' && !/^[a-zA-Z0-9]{6,12}$/.test(n))
      e.documentNumber = 'Entre 6 y 12 caracteres alfanuméricos';
    if (f.documentType === 'Pasaporte' && !/^[a-zA-Z0-9]{6,9}$/.test(n))
      e.documentNumber = 'Entre 6 y 9 caracteres alfanuméricos';
  }

  const tel = f.clientPhone.trim();
  if (!tel)                         e.clientPhone = 'El teléfono es obligatorio';
  else if (!/^\d{7,15}$/.test(tel)) e.clientPhone = 'Debe tener entre 7 y 15 dígitos';

  if (f.email.trim() && !EMAIL_REGEX.test(f.email.trim()))
    e.email = 'Correo electrónico inválido';

  return e;
}

function validateEntregaForm(f) {
  const e = {};
  const dir = f.deliveryAddress.trim();
  if (!dir)                  e.deliveryAddress = 'La dirección es obligatoria';
  else if (dir.length < 5)   e.deliveryAddress = 'Mínimo 5 caracteres';
  else if (dir.length > 150) e.deliveryAddress = 'Máximo 150 caracteres';

  const ciudad = f.deliveryCity.trim();
  if (!ciudad)                e.deliveryCity = 'La ciudad es obligatoria';
  else if (ciudad.length < 2) e.deliveryCity = 'Mínimo 2 caracteres';

  if (f.deliveryInstructions.length > 500)
    e.deliveryInstructions = 'Máximo 500 caracteres';

  return e;
}

function validateNotasForm(f) {
  const e = {};
  if (f.notes.length > 500) e.notes = 'Máximo 500 caracteres';
  return e;
}

function validateCancelForm(reason) {
  if (!reason.trim())           return 'El motivo es obligatorio';
  if (reason.trim().length < 5) return 'Mínimo 5 caracteres';
  if (reason.length > 300)      return 'Máximo 300 caracteres';
  return null;
}

// ── FIX: en edición el nombre no es obligatorio (viene del objeto existente)
// Validación completa para creación
function validateFullForm(f) {
  return {
    ...validateClienteForm(f),
    ...validateEntregaForm(f),
    ...validateNotasForm(f),
  };
}

// ── Validación reducida para edición (solo campos editables)
function validateEditForm(f) {
  return {
    ...validateEntregaForm(f),
    ...validateNotasForm(f),
  };
}

// ─── Componente Field ─────────────────────────────────────────────────────────

function Field({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1">
      <Label className={error ? 'text-red-600' : ''}>
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error
        ? <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
            <XIcon className="w-3 h-3 flex-shrink-0" />{error}
          </p>
        : hint
          ? <p className="text-xs text-gray-400 mt-1">{hint}</p>
          : null
      }
    </div>
  );
}

// ─── Form vacío ───────────────────────────────────────────────────────────────

const emptyForm = {
  clientId: '', clientName: '', clientDocument: '', clientPhone: '',
  deliveryAddress: '', deliveryCity: 'Medellín', deliveryNeighborhood: '',
  deliveryInstructions: '', paymentMethod: 'Efectivo', status: 'Pendiente',
  documentType: '', documentNumber: '', email: '', items: [], notes: '',
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function OrderModule() {
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 5;

  // Banner inline
  const [inactiveBannerId,     setInactiveBannerId]     = useState(null);
  const [inactiveBannerAction, setInactiveBannerAction] = useState(null);

  // Modales
  const [isNewOrderDialogOpen,  setIsNewOrderDialogOpen]  = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderModalOpen,  setIsViewOrderModalOpen]  = useState(false);
  const [selectedOrderForView,  setSelectedOrderForView]  = useState(null);
  const [selectedOrderForEdit,  setSelectedOrderForEdit]  = useState(null);
  const [showCancelDialog,      setShowCancelDialog]      = useState(false);
  const [orderToCancel,         setOrderToCancel]         = useState(null);
  const [cancelReason,          setCancelReason]          = useState('');
  const [cancelReasonError,     setCancelReasonError]     = useState('');

  // Form
  const [orderForm, setOrderForm]   = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched]       = useState({});
  const [productSearch, setProductSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── FIX: flag para saber si estamos en modo edición (cambia qué validación usar)
  const [isEditMode, setIsEditMode] = useState(false);

  // ── Mapeador: respuesta API → objeto UI ──────────────────────────────────
  const mapPedidoToUI = (p, fallbackClientName = null) => ({
    id: Number(p.id),
    rawId: Number(p.id),
    displayId: `ORD-${String(p.id).padStart(3, '0')}`,
    // FIX: si la respuesta del PUT no trae cliente con include, usar fallback
    clientName: p.cliente
      ? `${p.cliente.nombres} ${p.cliente.apellidos}`
      : fallbackClientName ?? `Cliente #${p.clienteId}`,
    clienteId: p.clienteId,
    contactPhone: p.cliente?.telefono ?? '',
    contactEmail: p.cliente?.email ?? '',
    orderType: 'Pedido',
    // FIX: leer campo estado si el modelo lo tiene; si no, conservar 'Pendiente'
    status: p.estado ?? 'Pendiente',
    total: parseFloat(p.total),
    date: p.fecha_pedido?.split('T')[0] ?? '',
    items: p.detalles?.length ?? 0,
    itemsData: (p.detalles ?? []).map(d => ({
      productoId:      d.productosId,
      cantidad:        d.cantidad,
      precio_unitario: d.precioUnitario,
      producto: d.producto ? {
        nombreProducto: d.producto.nombreProducto,
        referencia:     d.producto.referencia,
        precio:         d.producto.precio,
      } : null,
    })),
    deliveryAddress: p.direccion,
    deliveryCity: p.ciudad,
    instrucciones_entrega: p.instrucciones_entrega || '',
    notes: p.notas_observaciones || '',
  });

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    const cargarPedidos = async () => {
      setLoading(true);
      try {
        const data = await getPedidos();
        setOrders(data.map(p => mapPedidoToUI(p)));
      } catch (error) {
        toast.error('Error al cargar los pedidos: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    cargarPedidos();

    // Productos mock — reemplazar con getProductos() cuando esté disponible
    setProducts([
      { id: 3, name: 'Filtro de Aceite Toyota',  code: 'FO-TOY-001', price: 25000,  stock: 15, category: 'Filtros' },
      { id: 4, name: 'Pastillas de Freno Honda',  code: 'PF-HON-002', price: 85000,  stock: 8,  category: 'Frenos' },
      { id: 5, name: 'Amortiguador Delantero',    code: 'AM-DEL-003', price: 150000, stock: 5,  category: 'Suspensión' },
      { id: 6, name: 'Bujía NGK',                 code: 'BU-NGK-004', price: 12000,  stock: 30, category: 'Sistema eléctrico' },
      { id: 7, name: 'Correa de Distribución',    code: 'CD-UNI-005', price: 95000,  stock: 12, category: 'Motor' },
    ]);
  }, []);

  // Revalidar al cambiar el form
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      // FIX: usar validación correcta según el modo
      const allErrors = isEditMode ? validateEditForm(orderForm) : validateFullForm(orderForm);
      const visibleErrors = {};
      Object.keys(touched).forEach(k => { if (allErrors[k]) visibleErrors[k] = allErrors[k]; });
      setFormErrors(visibleErrors);
    }
  }, [orderForm, touched, isEditMode]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const setField = (field, value) => setOrderForm(prev => ({ ...prev, [field]: value }));

  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const allErrors = isEditMode ? validateEditForm(orderForm) : validateFullForm(orderForm);
    setFormErrors(prev => ({ ...prev, [field]: allErrors[field] }));
  };

  const resetForm = () => {
    setOrderForm(emptyForm);
    setFormErrors({});
    setTouched({});
    setProductSearch('');
    setIsEditMode(false);
  };

  const markAllTouched = (form, editMode = false) => {
    const allErrors = editMode ? validateEditForm(form) : validateFullForm(form);
    const allTouched = {};
    Object.keys(allErrors).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    setFormErrors(allErrors);
    return allErrors;
  };

  // ── Banner inline ─────────────────────────────────────────────────────────
  const showBanner = (orderId, action) => {
    if (inactiveBannerId === orderId && inactiveBannerAction === action) {
      setInactiveBannerId(null);
      setInactiveBannerAction(null);
    } else {
      setInactiveBannerId(orderId);
      setInactiveBannerAction(action);
      setTimeout(() => {
        setInactiveBannerId(null);
        setInactiveBannerAction(null);
      }, 4000);
    }
  };

  const closeBanner = () => {
    setInactiveBannerId(null);
    setInactiveBannerAction(null);
  };

  const getBannerMessage = (order, action) => {
    if (action === 'edit') {
      if (order?.status === 'Completo')  return 'No puedes editar un pedido completado.';
      if (order?.status === 'Cancelado') return 'No puedes editar un pedido cancelado.';
    }
    if (action === 'cancel') return 'Este pedido ya no puede cancelarse.';
    return 'Acción no disponible para este pedido.';
  };

  // ── Filtrado y paginación ─────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    const matchSearch =
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.displayId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages    = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else if (currentPage <= 3)              pages.push(1, 2, 3, '...', totalPages);
    else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    else                                    pages.push(1, '...', currentPage, '...', totalPages);
    return pages;
  };

  // ── Carrito ───────────────────────────────────────────────────────────────
  const addProduct = (product) => {
    const existing = orderForm.items.find(i => i.id === product.id);
    setField('items', existing
      ? orderForm.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...orderForm.items, { id: product.id, name: product.name, code: product.code, price: product.price, quantity: 1 }]
    );
  };

  const updateQty = (itemId, qty) => {
    setField('items', qty <= 0
      ? orderForm.items.filter(i => i.id !== itemId)
      : orderForm.items.map(i => i.id === itemId ? { ...i, quantity: qty } : i)
    );
  };

  const removeItem = (itemId) => setField('items', orderForm.items.filter(i => i.id !== itemId));

  const subtotal = orderForm.items.reduce((s, i) => s + i.quantity * i.price, 0);

  // ── CREAR pedido → POST /pedidos ─────────────────────────────────────────
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const errors = markAllTouched(orderForm, false);
    if (Object.keys(errors).length > 0) {
      toast.error('Corrige los errores del formulario antes de continuar');
      return;
    }
    if (orderForm.items.length === 0) {
      toast.error('Agrega al menos un producto al pedido');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clienteId: orderForm.clientId ? Number(orderForm.clientId) : 1,
        total: Math.round(subtotal * 1.19),
        direccion: orderForm.deliveryAddress.trim(),
        ciudad: orderForm.deliveryCity.trim(),
        instrucciones_entrega: orderForm.deliveryInstructions || undefined,
        notas_observaciones: orderForm.notes || undefined,
        detalles: orderForm.items.map(i => ({
          productoId: i.id,
          cantidad: i.quantity,
          precio_unitario: i.price,
        })),
      };

      const { pedido } = await createPedido(payload);

      setOrders(prev => [mapPedidoToUI(pedido), ...prev]);
      resetForm();
      setIsNewOrderDialogOpen(false);
      toast.success(`Pedido creado: ORD-${String(pedido.id).padStart(3, '0')}`);
    } catch (error) {
      toast.error('Error al crear el pedido: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── FIX: EDITAR pedido → PUT /pedidos/:id ────────────────────────────────
  const handleUpdateOrder = async (e) => {
    e.preventDefault();

    // FIX: usar validación reducida (solo campos editables)
    const errors = markAllTouched(orderForm, true);
    if (Object.keys(errors).length > 0) {
      toast.error('Corrige los errores del formulario antes de continuar');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        direccion:             orderForm.deliveryAddress.trim(),
        ciudad:                orderForm.deliveryCity.trim(),
        instrucciones_entrega: orderForm.deliveryInstructions.trim() || undefined,
        notas_observaciones:   orderForm.notes.trim() || undefined,
        estado:                orderForm.status, 
      };

      // FIX: llamar al servicio; el backend devuelve { message, pedido }
      await updatePedido(selectedOrderForEdit.rawId, payload);

      // FIX: actualizar solo los campos editables en el estado local
      // sin depender de que el backend devuelva el objeto completo con includes
      setOrders(prev => prev.map(o =>
        Number(o.rawId) === Number(selectedOrderForEdit.rawId)
          ? {
              ...o,                                                    // conserva cliente, items, total, etc.
              deliveryAddress:      payload.direccion,
              deliveryCity:         payload.ciudad,
              instrucciones_entrega: payload.instrucciones_entrega ?? '',
              notes:                payload.notas_observaciones ?? '',
              status:                payload.estado
            }
          : o
      ));

      toast.success('Pedido actualizado exitosamente');
      setIsEditOrderDialogOpen(false);
      setSelectedOrderForEdit(null);
      resetForm();
    } catch (error) {
      toast.error('Error al actualizar el pedido: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── CANCELAR (local, el modelo no tiene campo estado aún) ────────────────
  const confirmCancel = () => {
    const error = validateCancelForm(cancelReason);
    if (error) { setCancelReasonError(error); return; }
    setOrders(prev => prev.map(o =>
      o.id === orderToCancel.id
        ? { ...o, status: 'Cancelado', cancelReason: cancelReason.trim(), cancelledAt: new Date().toISOString().split('T')[0] }
        : o
    ));
    toast.success('Pedido cancelado');
    setShowCancelDialog(false);
    setOrderToCancel(null);
    setCancelReason('');
    setCancelReasonError('');
  };

  // ── FIX: Abrir edición ────────────────────────────────────────────────────
  const openEdit = (order) => {
    if (order.status === 'Completo') {
      showBanner(order.id, 'edit');
      return;
    }
    if (order.status === 'Cancelado') {
      showBanner(order.id, 'edit');
      return;
    }

    setSelectedOrderForEdit(order);
    setIsEditMode(true); // FIX: activar modo edición antes de poblar el form

    // FIX: poblar form con los datos existentes del pedido
    setOrderForm({
      ...emptyForm,
      clientName:           order.clientName,
      clientPhone:          order.contactPhone || '',
      email:                order.contactEmail || '',
      deliveryAddress:      order.deliveryAddress || '',
      deliveryCity:         order.deliveryCity || 'Medellín',
      deliveryInstructions: order.instrucciones_entrega || '',
      status:               order.status,
      notes:                order.notes || '',
    });

    setFormErrors({});
    setTouched({});
    setIsEditOrderDialogOpen(true);
  };

  const getStatusColor = (s) => ({
    Pendiente: 'bg-blue-50 text-blue-900 border-blue-200',
    Completo:  'bg-blue-50 text-blue-900 border-blue-200',
    Cancelado: 'bg-gray-100 text-gray-700 border-gray-300',
  }[s] ?? 'bg-gray-100 text-gray-700 border-gray-300');

  // ── Secciones del formulario ──────────────────────────────────────────────
  const renderClienteSection = () => (
    <Card className="shadow-lg border-2 border-gray-100">
      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-xl text-gray-900">👤 Información del Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-8 px-10 pb-10">
        <Field label="Nombre Completo" required={!isEditMode} error={formErrors.clientName}
          hint={!formErrors.clientName ? 'Solo letras, sin números ni símbolos' : undefined}>
          <Input placeholder="Juan Pérez" value={orderForm.clientName}
            onChange={e => setField('clientName', soloLetras(e.target.value))}
            onBlur={handleBlur('clientName')} maxLength={100}
            // FIX: en edición el nombre es de solo lectura (viene del backend)
            readOnly={isEditMode}
            className={`h-12 text-base ${formErrors.clientName ? 'border-red-400 focus-visible:ring-red-400' : ''} ${isEditMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Tipo de Documento" error={formErrors.documentType}>
            <Select value={orderForm.documentType}
              onValueChange={v => { setField('documentType', v); setField('documentNumber', ''); setTouched(p => ({ ...p, documentType: true })); }}
              disabled={isEditMode}>
              <SelectTrigger className={`h-12 ${formErrors.documentType ? 'border-red-400' : ''} ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                <SelectItem value="NIT">NIT</SelectItem>
                <SelectItem value="Pasaporte">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Número de Documento" error={formErrors.documentNumber}
            hint={!formErrors.documentNumber && orderForm.documentType === 'NIT' ? 'Ej: 900123456-7' : undefined}>
            <Input
              placeholder={orderForm.documentType === 'NIT' ? '900123456-7' : orderForm.documentType === 'Pasaporte' ? 'AB123456' : 'Número...'}
              value={orderForm.documentNumber}
              onChange={e => setField('documentNumber', restriccionDocumento(e.target.value, orderForm.documentType))}
              onBlur={handleBlur('documentNumber')}
              readOnly={isEditMode}
              className={`h-12 text-base ${formErrors.documentNumber ? 'border-red-400 focus-visible:ring-red-400' : ''} ${isEditMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Teléfono" required={!isEditMode} error={formErrors.clientPhone}
            hint={!formErrors.clientPhone ? 'Solo dígitos, sin espacios ni guiones' : undefined}>
            <Input placeholder="3001234567" value={orderForm.clientPhone}
              onChange={e => setField('clientPhone', soloTelefono(e.target.value))}
              onBlur={handleBlur('clientPhone')} maxLength={15} inputMode="numeric"
              readOnly={isEditMode}
              className={`h-12 text-base ${formErrors.clientPhone ? 'border-red-400 focus-visible:ring-red-400' : ''} ${isEditMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
          </Field>
          <Field label="Correo Electrónico" error={formErrors.email}>
            <Input type="email" placeholder="cliente@email.com" value={orderForm.email}
              onChange={e => setField('email', sinEspacios(e.target.value))}
              onBlur={handleBlur('email')}
              readOnly={isEditMode}
              className={`h-12 text-base ${formErrors.email ? 'border-red-400 focus-visible:ring-red-400' : ''} ${isEditMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
          </Field>
        </div>

        {/* FIX: aviso visual cuando los campos de cliente son de solo lectura */}
        {isEditMode && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Los datos del cliente no se pueden modificar desde aquí.
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderEntregaSection = () => (
    <Card className="shadow-lg border-2 border-gray-100">
      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-xl text-gray-900">🚚 Dirección de Entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-8 px-10 pb-10">
        <Field label="Dirección" required error={formErrors.deliveryAddress}
          hint={!formErrors.deliveryAddress ? `${orderForm.deliveryAddress.length}/150 — se permiten letras, números, #, - y .` : undefined}>
          <Input placeholder="Calle 123 #45-67" value={orderForm.deliveryAddress}
            onChange={e => setField('deliveryAddress', soloDireccion(e.target.value))}
            onBlur={handleBlur('deliveryAddress')} maxLength={150}
            className={`h-12 text-base ${formErrors.deliveryAddress ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Ciudad" required error={formErrors.deliveryCity}>
            <Input placeholder="Medellín" value={orderForm.deliveryCity}
              onChange={e => setField('deliveryCity', soloLetras(e.target.value))}
              onBlur={handleBlur('deliveryCity')} maxLength={100}
              className={`h-12 text-base ${formErrors.deliveryCity ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />
          </Field>
          <Field label="Barrio">
            <Input placeholder="El Poblado" value={orderForm.deliveryNeighborhood}
              onChange={e => setField('deliveryNeighborhood', soloLetras(e.target.value))}
              maxLength={100} className="h-12 text-base" />
          </Field>
        </div>

        <Field label="Instrucciones de Entrega" error={formErrors.deliveryInstructions}
          hint={!formErrors.deliveryInstructions ? `${orderForm.deliveryInstructions.length}/500` : undefined}>
          <Textarea placeholder="Portería, piso, referencias adicionales..."
            value={orderForm.deliveryInstructions}
            onChange={e => setField('deliveryInstructions', e.target.value)}
            onBlur={handleBlur('deliveryInstructions')} rows={3} maxLength={500}
            className={`text-base ${formErrors.deliveryInstructions ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />
        </Field>
      </CardContent>
    </Card>
  );

  const renderNotasSection = () => (
    <Card className="shadow-lg border-2 border-gray-100">
      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-xl text-gray-900">📝 Notas y Observaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-8 px-10 pb-10">
        <Field label="Notas del Pedido" error={formErrors.notes}
          hint={!formErrors.notes ? `${orderForm.notes.length}/500` : undefined}>
          <Textarea placeholder="Instrucciones especiales, comentarios adicionales..."
            value={orderForm.notes} onChange={e => setField('notes', e.target.value)}
            onBlur={handleBlur('notes')} rows={4} maxLength={500}
            className={`text-base ${formErrors.notes ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />
        </Field>
      </CardContent>
    </Card>
  );

  const renderEstadoSection = () => (
    <Card className="shadow-lg border-2 border-gray-100">
      <CardHeader className="pb-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-xl text-gray-900">📦 Estado del Pedido</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 px-10 pb-10">
        <Field label="Estado" required>
          <Select
            value={orderForm.status}
            onValueChange={(value) => setField('status', value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Completo">Completo</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Pedidos</h1>
            <p className="text-blue-900">Administra pedidos y cotizaciones de clientes</p>
          </div>

          {/* ── MODAL NUEVO PEDIDO ──────────────────────────────────────── */}
          <Dialog open={isNewOrderDialogOpen} onOpenChange={open => {
            setIsNewOrderDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />Nuevo Pedido / Cotización
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full w-screen h-screen m-0 p-0 rounded-none flex flex-col">
              <DialogHeader className="border-b border-gray-200 pb-5 px-8 pt-8 flex-shrink-0">
                <DialogTitle className="text-3xl text-center text-gray-900">Nuevo Pedido / Cotización</DialogTitle>
                <DialogDescription className="text-center">Completa el formulario para crear un nuevo pedido.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateOrder} noValidate className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-8 py-8">
                  <div className="space-y-8 max-w-7xl mx-auto">

                    {/* Carrito */}
                    <Card className="shadow-2xl border-2 border-blue-100">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg border-b-2 border-blue-300 py-6 px-8">
                        <CardTitle className="text-2xl flex items-center text-blue-900">
                          <ShoppingCartIcon className="w-5 h-5 mr-2" />
                          Carrito de Pedido
                          {orderForm.items.length > 0 && (
                            <Badge className="ml-2 bg-blue-600 text-white">
                              {orderForm.items.reduce((s, i) => s + i.quantity, 0)} items
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-6">
                          {/* Búsqueda */}
                          <div className="p-8 border-b border-gray-200">
                            <div className="space-y-5">
                              <div className="space-y-2">
                                <Label className="text-base">🔍 Buscar Productos</Label>
                                <div className="relative">
                                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                  <Input placeholder="Buscar por nombre o código..." value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)} className="pl-12 h-12 text-base" />
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
                                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                          </div>
                                          <div className="text-right ml-3">
                                            <Badge variant="secondary" className="text-blue-600 mb-2 text-sm px-3 py-1">
                                              ${product.price.toLocaleString()}
                                            </Badge>
                                            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                                          </div>
                                        </div>
                                        <Button type="button" size="default" variant="outline"
                                          onClick={() => addProduct(product)}
                                          className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 h-10">
                                          <PlusIcon className="w-4 h-4 mr-2" />Agregar
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Items en carrito */}
                          <div className="space-y-3 p-8 border-b border-gray-200 bg-gray-50">
                            {orderForm.items.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No hay productos en el carrito</p>
                                <p className="text-sm">Busca y agrega productos arriba</p>
                              </div>
                            ) : orderForm.items.map(item => (
                              <div key={item.id} className="bg-white rounded-lg p-3 border">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h4 className="text-sm text-gray-900">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.code}</p>
                                  </div>
                                  <Button type="button" size="sm" variant="outline" onClick={() => removeItem(item.id)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 w-8 h-8 p-0">
                                    <XIcon className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Button type="button" size="sm" variant="outline" onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 p-0">-</Button>
                                    <span className="text-sm w-10 text-center bg-white px-2 py-1 border rounded">{item.quantity}</span>
                                    <Button type="button" size="sm" variant="outline" onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 p-0">+</Button>
                                  </div>
                                  <p className="text-sm text-gray-900">${(item.quantity * item.price).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Resumen de totales */}
                          {orderForm.items.length > 0 && (
                            <div className="px-8 pb-8">
                              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200 space-y-3">
                                <div className="flex justify-between text-base">
                                  <span className="text-gray-700">Subtotal:</span>
                                  <span>${subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-base">
                                  <span className="text-gray-700">IVA (19%):</span>
                                  <span>${Math.round(subtotal * 0.19).toLocaleString()}</span>
                                </div>
                                <div className="border-t-2 border-blue-300 pt-3 flex justify-between text-xl">
                                  <span>Total:</span>
                                  <span className="text-blue-600">${Math.round(subtotal * 1.19).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {renderClienteSection()}
                    {renderEstadoSection()}
                    {renderEntregaSection()}
                    {renderNotasSection()}
                  </div>
                </div>

                <div className="flex-shrink-0 flex gap-6 border-t border-gray-200 bg-white px-8 py-6 shadow-lg">
                  <Button type="button" variant="outline" onClick={() => { resetForm(); setIsNewOrderDialogOpen(false); }}
                    className="flex-1 h-14 text-base" disabled={submitting}>
                    <RotateCcwIcon className="w-5 h-5 mr-2" />Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-lg"
                    disabled={orderForm.items.length === 0 || submitting}>
                    <ShoppingCartIcon className="w-5 h-5 mr-2" />
                    {submitting ? 'Creando...' : 'Crear Pedido'}
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
              <Input placeholder="Buscar pedidos por cliente o número..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Completo">Completo</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-gray-600">{filteredOrders.length} pedido(s)</span>
          </div>
        </Card>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Cargando pedidos...
                    </td>
                  </tr>
                ) : currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-gray-500">
                        <PackageIcon className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-gray-900">No se encontraron pedidos</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : currentOrders.map(order => {
                  const isInactive = order.status === 'Completo' || order.status === 'Cancelado';
                  return (
                    <React.Fragment key={order.id}>

                      {/* ── Fila principal ── */}
                      <tr className={`hover:bg-gray-50 transition-colors ${isInactive ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4 text-sm text-blue-600 font-medium">{order.displayId}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{order.clientName}</div>
                          <div className="text-sm text-gray-500">{order.contactPhone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{order.date}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">${order.total.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">{order.items} productos</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">

                            {/* Ver */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => {
                                    console.log('ORDER COMPLETO:', order);
                                    console.log('itemsData:', order.itemsData);
                                    setSelectedOrderForView(order);
                                    setIsViewOrderModalOpen(true);
                                  }}
                                  className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver detalles</p></TooltipContent>
                            </Tooltip>

                            {/* Editar — opaco si Completo/Cancelado */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (isInactive) {
                                      showBanner(order.id, 'edit');
                                      return;
                                    }
                                    closeBanner();
                                    openEdit(order);
                                  }}
                                  className={`border-blue-900 transition-opacity ${
                                    isInactive
                                      ? 'opacity-40 cursor-not-allowed text-gray-400 border-gray-300'
                                      : 'text-blue-900 hover:bg-blue-50'
                                  }`}
                                >
                                  <EditIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isInactive ? getBannerMessage(order, 'edit') : 'Editar pedido'}</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* PDF */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => generarPdfPedido(order)}

                                  className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                  <FileTextIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver PDF</p></TooltipContent>
                            </Tooltip>

                            {/* Cancelar — solo si Pendiente */}
                            {order.status !== 'Cancelado' && order.status !== 'Completo' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm"
                                    onClick={() => { setOrderToCancel(order); setShowCancelDialog(true); }}
                                    className="text-blue-900 border-blue-900 hover:bg-red-50">
                                    <XCircleIcon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Cancelar pedido</p></TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ── Fila del banner inline ── */}
                      {inactiveBannerId === order.id && (
                        <tr className="border-b border-amber-100">
                          <td colSpan={6} className="px-6 py-0">
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>
                                <strong>
                                  {order.status === 'Completo' ? 'Pedido completado:' : 'Pedido cancelado:'}
                                </strong>{' '}
                                {getBannerMessage(order, inactiveBannerAction)}
                              </span>
                              <button
                                onClick={closeBanner}
                                className="ml-auto opacity-60 hover:opacity-100"
                              >
                                <X className="w-3.5 h-3.5" />
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
          {filteredOrders.length > itemsPerPage && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              {getPageNumbers().map((page, i) =>
                page === '...'
                  ? <span key={`e-${i}`} className="px-2 text-gray-500">•</span>
                  : (
                    <Button key={page} size="sm" variant={currentPage === page ? 'default' : 'ghost'}
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]' : 'min-w-[32px]'}>
                      {currentPage === page ? page : '•'}
                    </Button>
                  )
              )}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ── MODAL VER ─────────────────────────────────────────────────── */}
<Dialog open={isViewOrderModalOpen} onOpenChange={setIsViewOrderModalOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible p-0">
    <div className="overflow-y-auto max-h-[90vh] p-6">
      <DialogHeader>
        <DialogTitle>Detalles del Pedido {selectedOrderForView?.displayId}</DialogTitle>
        <DialogDescription>Información completa del pedido</DialogDescription>
      </DialogHeader>

      {selectedOrderForView && (
        <div className="space-y-4 mt-4">

          {/* ── Bloque principal ── */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">

            {/* Avatar + nombre + estado */}
            <div className="col-span-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <ShoppingCartIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-lg leading-tight">
                  {selectedOrderForView.clientName}
                </p>
                <p className="text-sm text-gray-500">{selectedOrderForView.displayId}</p>
                <Badge className={`mt-1 ${getStatusColor(selectedOrderForView.status)}`}>
                  {selectedOrderForView.status}
                </Badge>
              </div>
            </div>

            {/* Fecha */}
            <div>
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="font-semibold text-sm mt-0.5 flex items-center gap-1">
                <ShoppingCartIcon className="w-3.5 h-3.5 text-blue-600" />
                {selectedOrderForView.date}
              </p>
            </div>

            {/* Total */}
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold text-sm mt-0.5 text-blue-600">
                ${selectedOrderForView.total.toLocaleString()}
              </p>
            </div>

            {/* Teléfono */}
            {selectedOrderForView.contactPhone && (
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="font-semibold text-sm mt-0.5">{selectedOrderForView.contactPhone}</p>
              </div>
            )}

            {/* Email */}
            {selectedOrderForView.contactEmail && (
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold text-sm mt-0.5">{selectedOrderForView.contactEmail}</p>
              </div>
            )}

            {/* Ciudad */}
            {selectedOrderForView.deliveryCity && (
              <div>
                <p className="text-xs text-gray-500">Ciudad</p>
                <p className="font-semibold text-sm mt-0.5">{selectedOrderForView.deliveryCity}</p>
              </div>
            )}

            {/* Cantidad de productos */}
            <div>
              <p className="text-xs text-gray-500">Productos</p>
              <p className="font-semibold text-sm mt-0.5">{selectedOrderForView.items} ítem(s)</p>
            </div>

            {/* Dirección — ancho completo */}
            {selectedOrderForView.deliveryAddress && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Dirección de entrega</p>
                <p className="font-semibold text-sm mt-0.5">{selectedOrderForView.deliveryAddress}</p>
              </div>
            )}

            {/* Instrucciones — ancho completo */}
            {selectedOrderForView.instrucciones_entrega && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Instrucciones de entrega</p>
                <p className="font-semibold text-sm mt-0.5 text-gray-700 leading-relaxed">
                  {selectedOrderForView.instrucciones_entrega}
                </p>
              </div>
            )}

            {/* Notas — ancho completo */}
            {selectedOrderForView.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Notas</p>
                <p className="font-semibold text-sm mt-0.5 text-gray-700 leading-relaxed">
                  {selectedOrderForView.notes}
                </p>
              </div>
            )}
          </div>

          {/* ── Tabla de productos ── */}
          {selectedOrderForView.itemsData?.length > 0 && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Productos del pedido</p>
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
                  {selectedOrderForView.itemsData.map((d, i) => (
                    <tr key={i} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {d.producto?.nombreProducto ?? `Producto #${d.productoId}`}
                      </td>
                      <td className="text-right px-4 py-2">{d.cantidad}</td>
                      <td className="text-right px-4 py-2">
                        ${Number(d.precio_unitario).toLocaleString()}
                      </td>
                      <td className="text-right px-4 py-2 font-semibold">
                        ${(d.cantidad * d.precio_unitario).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 border-t border-blue-100">
                    <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-700 text-right">
                      Total
                    </td>
                    <td className="px-4 py-2 font-semibold text-blue-600">
                      ${selectedOrderForView.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── Bloque cancelación ── */}
          {selectedOrderForView.status === 'Cancelado' && selectedOrderForView.cancelReason && (
            <div className="grid grid-cols-2 gap-4 bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="col-span-2 flex items-center gap-2">
                <XCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
                <p className="font-semibold text-red-700">Información de cancelación</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-red-500">Motivo</p>
                <p className="font-semibold text-sm mt-0.5 text-red-800">
                  {selectedOrderForView.cancelReason}
                </p>
              </div>
              {selectedOrderForView.cancelledAt && (
                <div>
                  <p className="text-xs text-red-500">Fecha de cancelación</p>
                  <p className="font-semibold text-sm mt-0.5 text-red-800">
                    {selectedOrderForView.cancelledAt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Acciones ── */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsViewOrderModalOpen(false)}>
              Cerrar
            </Button>
            {selectedOrderForView.status === 'Pendiente' && (
              <Button
                onClick={() => { openEdit(selectedOrderForView); setIsViewOrderModalOpen(false); }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Editar Pedido
              </Button>
            )}
          </div>

        </div>
      )}
    </div>
  </DialogContent>
</Dialog>

        {/* ── MODAL EDITAR ──────────────────────────────────────────────── */}
        <Dialog open={isEditOrderDialogOpen} onOpenChange={open => {
          setIsEditOrderDialogOpen(open);
          if (!open) { setSelectedOrderForEdit(null); resetForm(); }
        }}>
          <DialogContent className="max-w-full w-screen h-screen m-0 p-0 rounded-none flex flex-col">
            <DialogHeader className="border-b border-gray-200 pb-5 px-8 pt-8 flex-shrink-0">
              <DialogTitle className="text-3xl text-center text-gray-900">
                Editar Pedido {selectedOrderForEdit?.displayId}
              </DialogTitle>
              <DialogDescription className="text-center">Modifica la información del pedido.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateOrder} noValidate className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="space-y-8 max-w-7xl mx-auto">
                  {renderClienteSection()}
                  {renderEstadoSection()}
                  {renderEntregaSection()}
                  {renderNotasSection()}
                </div>
              </div>
              <div className="flex-shrink-0 flex gap-6 border-t border-gray-200 bg-white px-8 py-6 shadow-lg">
                <Button type="button" variant="outline" disabled={submitting}
                  onClick={() => { setIsEditOrderDialogOpen(false); setSelectedOrderForEdit(null); resetForm(); }}
                  className="flex-1 h-14 text-base">
                  <RotateCcwIcon className="w-5 h-5 mr-2" />Cancelar
                </Button>
                <Button type="submit" disabled={submitting}
                  className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-lg">
                  <EditIcon className="w-5 h-5 mr-2" />
                  {submitting ? 'Guardando...' : 'Actualizar Pedido'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── MODAL CANCELAR ────────────────────────────────────────────── */}
        <AlertDialog open={showCancelDialog} onOpenChange={open => {
          setShowCancelDialog(open);
          if (!open) { setOrderToCancel(null); setCancelReason(''); setCancelReasonError(''); }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
                <AlertTriangleIcon className="w-5 h-5" />Cancelar Pedido
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3" asChild>
                <div>
                  <p>¿Estás seguro de que deseas cancelar este pedido?</p>
                  {orderToCancel && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1 text-sm">
                      <p><span className="text-gray-500">Pedido: </span>{orderToCancel.displayId}</p>
                      <p><span className="text-gray-500">Cliente: </span>{orderToCancel.clientName}</p>
                      <p><span className="text-gray-500">Total: </span>${orderToCancel.total.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="cancelReason" className={cancelReasonError ? 'text-red-600' : ''}>
                      Motivo de Cancelación <span className="text-red-500">*</span>
                    </Label>
                    <Textarea id="cancelReason" placeholder="Indica el motivo de la cancelación..."
                      value={cancelReason}
                      onChange={e => { setCancelReason(e.target.value); setCancelReasonError(''); }}
                      rows={3} maxLength={300}
                      className={cancelReasonError ? 'border-red-400 focus-visible:ring-red-400' : ''} />
                    {cancelReasonError
                      ? <p className="text-xs text-red-600 flex items-center gap-1"><XIcon className="w-3 h-3" />{cancelReasonError}</p>
                      : <p className="text-xs text-gray-400">{cancelReason.length}/300</p>
                    }
                  </div>
                  <p className="text-sm text-blue-600">El pedido cambiará su estado a "Cancelado" y no se eliminará.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancel} className="bg-blue-600 hover:bg-blue-700">
                Confirmar Cancelación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}