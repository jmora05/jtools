import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { SmartPagination } from '@/shared/components/SmartPagination';
import { Badge } from '@/shared/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ApiError } from '@/services/http';
import {
  SearchIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  ClipboardListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XCircleIcon,
  CheckCircleIcon,
  Loader2,
  Info,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  getOrdenesProduccion,
  createOrdenProduccion,
  updateOrdenProduccion,
  anularOrdenProduccion,
  deleteOrdenProduccion,
  type OrdenProduccion,
  type DevolucionInsumo,
} from '@/features/orders/services/ordenesproduccionservice';
import { getProductos } from '@/features/products/services/productosService';
import { getEmpleados } from '@/features/employed/services/empleadosService';
import { OrdenDetailModal } from '@/features/orders/components/OrdenDetailModal';

// ========================
// INTERFACES
// ========================
// MÓDULO PRINCIPAL
// ========================

export function ProductionModule() {
  return <ProductionOrdersSubmodule />;
}

// ========================
// SUBMÓDULO: ÓRDENES DE PRODUCCIÓN
// ========================

const TRANSICIONES: Record<string, string[]> = {
  'Pendiente':   ['En Proceso', 'Pausada', 'Anulada'],
  'En Proceso':  ['Pausada', 'Finalizada'],
  'Pausada':     ['En Proceso', 'Anulada'],
  'Finalizada':  [],
  'Anulada':     [],
};

const NOTA_MAX = 1000;
const CANTIDAD_MAX_OP = 100_000;

const SO = {
  label: {
    fontSize: 11, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    marginBottom: 6, display: 'block',
  },
  fieldGroup: { marginBottom: 18 },
  error: { color: '#ef4444', fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 },
};

const OPFieldError = ({ message }: { message?: string }) =>
  message ? (
    <p style={SO.error}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
      {message}
    </p>
  ) : null;

type CarritoItemOP = { productoId: number; nombre: string; referencia: string; cantidad: number };

type OrdenFormErrors = {
  responsableId?: string;
  fechaInicio?: string;
  nota?: string;
};

type OrdenFormData = { responsableId: string; fechaInicio: string; nota: string };

function validateOrdenForm(form: OrdenFormData): OrdenFormErrors {
  const errors: OrdenFormErrors = {};

  if (!form.responsableId) errors.responsableId = 'El responsable es obligatorio.';

  if (!form.fechaInicio) {
    errors.fechaInicio = 'La fecha de inicio es obligatoria.';
  } else {
    const fecha = new Date(form.fechaInicio + 'T12:00:00');
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (isNaN(fecha.getTime())) {
      errors.fechaInicio = 'Fecha inválida.';
    } else if (fecha < hoy) {
      errors.fechaInicio = 'La fecha no puede ser una fecha pasada.';
    } else {
      const max = new Date(); max.setFullYear(max.getFullYear() + 5);
      if (fecha > max) errors.fechaInicio = 'La fecha no puede superar los 5 años.';
    }
  }

  if (form.nota && form.nota.length > NOTA_MAX)
    errors.nota = `Máximo ${NOTA_MAX.toLocaleString()} caracteres.`;

  return errors;
}

const blockNonIntegerOP = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!nav.includes(e.key) && !e.ctrlKey && !e.metaKey && !/\d/.test(e.key)) e.preventDefault();
};

function ProductionOrdersSubmodule() {
  const [orders, setOrders] = useState<OrdenProduccion[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAnulOpen, setIsAnulOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<OrdenProduccion | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const emptyForm: OrdenFormData = { responsableId: '', fechaInicio: todayStr, nota: '' };
  const [form, setForm] = useState<OrdenFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<OrdenFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof OrdenFormData, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [carrito, setCarrito] = useState<CarritoItemOP[]>([]);
  const [carritoErrors, setCarritoErrors] = useState<Record<number, string>>({});
  const [productoSelId, setProductoSelId] = useState('');
  const [cantidadNueva, setCantidadNueva] = useState('');
  const [editForm, setEditForm] = useState({ productoId: '', cantidad: '', responsableId: '', fechaInicio: '', nota: '', estado: '' });
  const [motivo, setMotivo] = useState('');
  const [motivoTouched, setMotivoTouched] = useState(false);

  // Devoluciones de insumos al anular
  type DevolucionUI = { insumosId: number; nombre: string; cantidadDescontada: number; cantidadADevolver: string };
  const [devoluciones, setDevoluciones] = useState<DevolucionUI[]>([]);

  // Diálogo de insumos insuficientes
  const [isStockErrorOpen, setIsStockErrorOpen] = useState(false);
  const [stockErrorMsg, setStockErrorMsg] = useState('');
  const [stockErrorDetails, setStockErrorDetails] = useState<string[]>([]);

  const loadOrders = async () => {
    try {
      const data = await getOrdenesProduccion();
      setOrders(data);
    } catch (err: any) {
      toast.error('Error al cargar las órdenes de producción: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    getProductos()
      .then((d: any) => setProductos((d || []).filter((p: any) => p.estado === 'activo').sort((a: any, b: any) => (b.stock ?? 0) - (a.stock ?? 0))))
      .catch(() => {});
    getEmpleados()
      .then((d: any) => setEmpleados((d || []).filter((e: any) => e.estado === 'activo')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (empleados.length === 0) return;
    try {
      const stored = localStorage.getItem('jrepuestos_user');
      if (!stored) return;
      const u = JSON.parse(stored);
      const emp = empleados.find((e: any) => e.email === u.email);
      if (emp) setForm(prev => ({ ...prev, responsableId: String(emp.id) }));
    } catch {}
  }, [empleados]);

  const getAutoResponsableId = () => {
    try {
      const stored = localStorage.getItem('jrepuestos_user');
      if (!stored) return '';
      const u = JSON.parse(stored);
      const emp = empleados.find((e: any) => e.email === u.email);
      return emp ? String(emp.id) : '';
    } catch { return ''; }
  };

  const handleFormChange = (field: keyof OrdenFormData, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setFormErrors(validateOrdenForm(next));
  };

  const handleBlurField = (field: keyof OrdenFormData) => {
    setTouched(p => ({ ...p, [field]: true }));
    setFormErrors(validateOrdenForm(form));
  };

  const resetCreateForm = () => {
    setForm({ responsableId: getAutoResponsableId(), fechaInicio: new Date().toISOString().split('T')[0], nota: '' });
    setCarrito([]);
    setCarritoErrors({});
    setFormErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setProductoSelId('');
    setCantidadNueva('');
  };

  const filtered = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (o.codigoOrden ?? '').toLowerCase().includes(q) ||
      (o.producto?.nombreProducto ?? '').toLowerCase().includes(q) ||
      (o.responsable ? `${o.responsable.nombres} ${o.responsable.apellidos}` : '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreate = async () => {
    setSubmitAttempted(true);
    setTouched({ responsableId: true, fechaInicio: true, nota: true });
    const errors = validateOrdenForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Completa los campos obligatorios correctamente');
      return;
    }
    if (carrito.length === 0) {
      toast.error('Agrega al menos un producto para producir');
      return;
    }
    const errs: Record<number, string> = {};
    carrito.forEach(item => {
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) errs[item.productoId] = 'Debe ser un entero mayor a 0.';
      else if (item.cantidad > CANTIDAD_MAX_OP) errs[item.productoId] = `Máximo ${CANTIDAD_MAX_OP.toLocaleString()}.`;
    });
    setCarritoErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Revisa las cantidades de los productos');
      return;
    }
    setSubmitting(true);
    try {
      for (const item of carrito) {
        await createOrdenProduccion({
          productoId: item.productoId,
          cantidad: item.cantidad,
          responsableId: Number(form.responsableId),
          tipoOrden: 'Venta',
          fechaEntrega: form.fechaInicio + 'T12:00:00',
          nota: form.nota.trim() || undefined,
        });
      }
      toast.success(carrito.length === 1
        ? 'Orden de producción creada correctamente'
        : `${carrito.length} órdenes de producción creadas correctamente`
      );
      setIsCreateOpen(false);
      resetCreateForm();
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear las órdenes');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (order: OrdenProduccion) => {
    setSelected(order);
    setEditForm({
      productoId: String(order.productoId ?? ''),
      cantidad: String(order.cantidad ?? ''),
      responsableId: String(order.responsableId ?? ''),
      fechaInicio: order.fechaEntrega ? order.fechaEntrega.split('T')[0] : todayStr,
      nota: order.nota ?? '',
      estado: '',
    });
    setIsStatusOpen(true);
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      if (selected.estado === 'Pendiente') {
        await updateOrdenProduccion(selected.id!, {
          productoId: Number(editForm.productoId) || undefined,
          cantidad: Number(editForm.cantidad) || undefined,
          responsableId: Number(editForm.responsableId) || undefined,
          fechaEntrega: editForm.fechaInicio ? editForm.fechaInicio + 'T12:00:00' : undefined,
          nota: editForm.nota.trim() || undefined,
        } as any);
      } else {
        const payload: any = {};
        if (editForm.responsableId) payload.responsableId = Number(editForm.responsableId);
        if (editForm.estado) payload.estado = editForm.estado;
        await updateOrdenProduccion(selected.id!, payload);
      }
      toast.success('Orden actualizada correctamente');
      setIsStatusOpen(false);
      setSelected(null);
      loadOrders();
    } catch (err: any) {
      if (err instanceof ApiError && err.errores?.length) {
        setStockErrorMsg(err.message || 'Stock insuficiente de insumos');
        setStockErrorDetails(err.errores);
        setIsStockErrorOpen(true);
      } else {
        toast.error(err.message || 'Error al actualizar la orden');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInlineStatus = async (order: OrdenProduccion, nuevoEstado: string) => {
    if (!nuevoEstado || nuevoEstado === order.estado) return;
    // Si el usuario selecciona 'Anulada' desde el desplegable, abrir modal de anulación
    if (nuevoEstado === 'Anulada') {
      openAnulModal(order);
      return;
    }

    try {
      await updateOrdenProduccion(order.id!, { estado: nuevoEstado as any });
      toast.success('Estado actualizado correctamente');
      loadOrders();
    } catch (err: any) {
      if (err instanceof ApiError && err.errores?.length) {
        setStockErrorMsg(err.message || 'Stock insuficiente de insumos');
        setStockErrorDetails(err.errores);
        setIsStockErrorOpen(true);
      } else {
        toast.error(err.message || 'Error al actualizar el estado');
      }
    }
  };

  // Abre el modal de anulación inicializando los campos de devolución
  const openAnulModal = (order: OrdenProduccion) => {
    setSelected(order);
    setMotivo('');
    setMotivoTouched(false);
    const insumos = Array.isArray(order.insumosCalculados) ? order.insumosCalculados : [];
    setDevoluciones(
      insumos
        .filter(i => i.cantidadDescontada > 0)
        .map(i => ({
          insumosId: i.insumosId,
          nombre: i.nombre,
          cantidadDescontada: Math.floor(i.cantidadDescontada),
          cantidadADevolver: String(Math.floor(i.cantidadDescontada)),
        }))
    );
    setIsAnulOpen(true);
  };

  const handleAnular = async () => {
    if (!selected) return;
    setMotivoTouched(true);
    if (motivo.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres');
      return;
    }
    if (motivo.trim().length > 500) {
      toast.error('El motivo no puede superar los 500 caracteres');
      return;
    }
    // Validar cantidades de devolución
    for (const dev of devoluciones) {
      const val = parseFloat(dev.cantidadADevolver);
      if (isNaN(val) || val < 0) {
        toast.error(`La cantidad a devolver de "${dev.nombre}" debe ser un número mayor o igual a 0`);
        return;
      }
      if (val > dev.cantidadDescontada) {
        toast.error(`No puedes devolver más de ${dev.cantidadDescontada} de "${dev.nombre}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const insumosADevolver: DevolucionInsumo[] = devoluciones.map(d => ({
        insumosId: d.insumosId,
        cantidadADevolver: parseFloat(d.cantidadADevolver) || 0,
      }));
      await anularOrdenProduccion(selected.id!, motivo.trim(), insumosADevolver);
      toast.success('Orden anulada correctamente');
      setIsAnulOpen(false);
      setMotivo('');
      setMotivoTouched(false);
      setDevoluciones([]);
      setSelected(null);
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Error al anular la orden');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteOrdenProduccion(selected.id!);
      toast.success('Orden eliminada correctamente');
      setIsDeleteOpen(false);
      setSelected(null);
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la orden');
    } finally {
      setSubmitting(false);
    }
  };

  const estadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente':   return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'En Proceso':  return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Pausada':     return 'bg-blue-200 text-blue-800 border-blue-400';
      case 'Finalizada':  return 'bg-blue-700 text-white border-blue-700';
      case 'Anulada':     return 'bg-gray-100 text-gray-500 border-gray-300';
      default:            return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  // No permitir editar/anular cuando la orden está en proceso
  const canEdit = (estado?: string) => !['Finalizada', 'Anulada', 'En Proceso'].includes(estado ?? '');

  const totalFormErrors = Object.keys(formErrors).length;
  const motivoError = motivoTouched && motivo.trim().length < 10
    ? 'Mínimo 10 caracteres.'
    : motivoTouched && motivo.trim().length > 500
    ? 'Máximo 500 caracteres.'
    : undefined;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-blue-900 font-bold mb-2">Órdenes de Producción</h1>
          <p className="text-blue-800">Gestión y seguimiento de órdenes de producción</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) { setIsCreateOpen(false); resetCreateForm(); } else setIsCreateOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusIcon className="w-4 h-4 mr-2" />
              Registrar Nueva Orden
            </Button>
          </DialogTrigger>

          <DialogContent
            className="p-0 gap-0 overflow-hidden"
            style={{
              width: '96vw', maxWidth: 1100, height: '92vh', maxHeight: '92vh',
              display: 'flex', flexDirection: 'column', padding: 0, gap: 0,
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
                <ClipboardListIcon style={{ width: 20, height: 20, color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
                <DialogTitle style={{
                  fontSize: 18, fontWeight: 700, color: '#111827',
                  lineHeight: 1.2, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
                }}>
                  Registrar Órdenes de Producción
                </DialogTitle>
                <DialogDescription style={{
                  fontSize: 12, color: '#6b7280', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  Completa la información y agrega los productos a producir. Se creará una orden por cada producto.
                </DialogDescription>
              </div>
            </header>

            {/* ════ ALERTAS ════ */}
            {submitAttempted && (totalFormErrors > 0 || carrito.length === 0) && (
              <div style={{
                padding: '8px 24px', background: '#fffbeb',
                borderBottom: '1px solid #fde68a', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 12,
                fontSize: 12, color: '#92400e',
              }}>
                <Info style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0 }} />
                <span>
                  {totalFormErrors > 0 && `${totalFormErrors} campo(s) requieren atención. `}
                  {carrito.length === 0 && 'Agrega al menos un producto para continuar.'}
                </span>
              </div>
            )}

            {/* ════ BODY (2 COLUMNAS) ════ */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

              {/* ── SIDEBAR IZQUIERDO ── */}
              <aside style={{
                width: 320, flexShrink: 0,
                borderRight: '1px solid #e5e7eb', background: '#f9fafb',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                  {/* Responsable */}
                  <div style={SO.fieldGroup}>
                    <label style={SO.label}>Responsable <span style={{ color: '#f87171' }}>*</span></label>
                    <Select
                      value={form.responsableId}
                      onValueChange={(v) => { handleFormChange('responsableId', v); setTouched(p => ({ ...p, responsableId: true })); }}
                    >
                      <SelectTrigger style={{
                        height: 40, fontSize: 14, background: '#fff',
                        borderColor: touched.responsableId && formErrors.responsableId ? '#f87171' : undefined,
                      }}>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        {empleados.length === 0
                          ? <SelectItem value="__none" disabled>Sin empleados activos</SelectItem>
                          : empleados.map((e: any) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                              {e.nombres} {e.apellidos} — {e.cargo}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <OPFieldError message={touched.responsableId ? formErrors.responsableId : undefined} />
                  </div>

                  {/* Fecha de Inicio */}
                  <div style={SO.fieldGroup}>
                    <label style={SO.label}>Fecha de inicio <span style={{ color: '#f87171' }}>*</span></label>
                    <Input
                      type="date"
                      min={todayStr}
                      value={form.fechaInicio}
                      onChange={(e) => handleFormChange('fechaInicio', e.target.value)}
                      onBlur={() => handleBlurField('fechaInicio')}
                      style={{
                        height: 40, fontSize: 14, background: '#fff',
                        borderColor: touched.fechaInicio && formErrors.fechaInicio ? '#f87171' : undefined,
                      }}
                    />
                    <OPFieldError message={touched.fechaInicio ? formErrors.fechaInicio : undefined} />
                  </div>

                  {/* Notas */}
                  <div style={SO.fieldGroup}>
                    <label style={SO.label}>Notas (opcional)</label>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      value={form.nota}
                      onChange={(e) => handleFormChange('nota', e.target.value)}
                      onBlur={() => handleBlurField('nota')}
                      rows={5}
                      maxLength={NOTA_MAX + 1}
                      style={{
                        fontSize: 14, background: '#fff', resize: 'none',
                        borderColor: touched.nota && formErrors.nota ? '#f87171' : undefined,
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <OPFieldError message={touched.nota ? formErrors.nota : undefined} />
                      <span style={{
                        fontSize: 11, marginLeft: 'auto',
                        color: form.nota.length > NOTA_MAX ? '#ef4444' : '#9ca3af',
                        fontWeight: form.nota.length > NOTA_MAX ? 600 : 400,
                      }}>
                        {form.nota.length}/{NOTA_MAX}
                      </span>
                    </div>
                  </div>

                </div>
              </aside>

              {/* ── PANEL DERECHO ── */}
              <section style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', background: '#fff',
              }}>
                {/* Header del panel + campos de agregar */}
                <div style={{
                  padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
                  flexShrink: 0, background: '#f9fafb',
                }}>
                  <h3 style={{ fontWeight: 700, color: '#111827', fontSize: 16, lineHeight: 1.2, margin: '0 0 14px 0' }}>
                    Productos a producir
                  </h3>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={SO.label}>Producto</label>
                      <Select value={productoSelId} onValueChange={setProductoSelId}>
                        <SelectTrigger style={{ height: 40, fontSize: 14, background: '#fff' }}>
                          <SelectValue placeholder="Seleccionar producto activo" />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.length === 0
                            ? <SelectItem value="__none" disabled>Sin productos activos</SelectItem>
                            : productos.map((p: any) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.nombreProducto} — {p.referencia}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div style={{ width: 120 }}>
                      <label style={SO.label}>Cantidad</label>
                      <Input
                        type="number"
                        min={1}
                        max={CANTIDAD_MAX_OP}
                        step={1}
                        placeholder="Ej: 10"
                        value={cantidadNueva}
                        onKeyDown={blockNonIntegerOP}
                        onChange={(e) => setCantidadNueva(e.target.value)}
                        style={{ height: 40, fontSize: 14, background: '#fff' }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const p = productos.find((p: any) => String(p.id) === productoSelId);
                        const qty = parseInt(cantidadNueva, 10);
                        if (!p || !qty || qty <= 0) return;
                        if (carrito.some(i => i.productoId === p.id)) {
                          setCarrito(prev => prev.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + qty } : i));
                        } else {
                          setCarrito(prev => [...prev, { productoId: p.id, nombre: p.nombreProducto, referencia: p.referencia ?? '', cantidad: qty }]);
                        }
                        setProductoSelId('');
                        setCantidadNueva('');
                      }}
                      style={{
                        height: 40, background: '#1d4ed8', color: '#fff',
                        fontSize: 13, padding: '0 18px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 6,
                        alignSelf: 'flex-end',
                      }}
                    >
                      <PlusIcon style={{ width: 15, height: 15 }} />
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Tabla / estado vacío */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {carrito.length === 0 ? (
                    <div style={{
                      margin: 24, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      padding: '64px 0', borderRadius: 12,
                      border: `2px dashed ${submitAttempted ? '#fca5a5' : '#e5e7eb'}`,
                      background: submitAttempted ? '#fef2f2' : 'transparent',
                      color: '#9ca3af',
                    }}>
                      <ClipboardListIcon style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.25 }} />
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Sin productos aún</p>
                      <p style={{ fontSize: 12, marginTop: 4, margin: 0 }}>Usa el botón "Agregar producto"</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</th>
                          <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 160 }}>Referencia</th>
                          <th style={{ textAlign: 'center', padding: '12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: 150 }}>Cantidad</th>
                          <th style={{ width: 48 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {carrito.map(item => {
                          const itemErr = carritoErrors[item.productoId];
                          return (
                            <tr key={item.productoId} style={{
                              borderBottom: '1px solid #f3f4f6',
                              background: itemErr ? '#fef2f2' : 'transparent',
                            }}>
                              <td style={{ padding: '12px 24px' }}>
                                <p style={{ fontWeight: 500, color: '#111827', fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.nombre}
                                </p>
                              </td>
                              <td style={{ padding: '12px', fontSize: 13, color: '#6b7280' }}>
                                {item.referencia || '—'}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <div style={{
                                    display: 'flex', alignItems: 'center',
                                    border: '1px solid #e5e7eb', borderRadius: 8,
                                    overflow: 'hidden', background: '#fff',
                                  }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = Math.max(1, item.cantidad - 1);
                                        setCarrito(prev => prev.map(i => i.productoId === item.productoId ? { ...i, cantidad: next } : i));
                                      }}
                                      disabled={item.cantidad <= 1}
                                      style={{ width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', background: 'transparent', border: 'none', fontSize: 16, fontWeight: 500, cursor: item.cantidad <= 1 ? 'not-allowed' : 'pointer', opacity: item.cantidad <= 1 ? 0.3 : 1 }}
                                    >−</button>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      value={item.cantidad}
                                      onKeyDown={blockNonIntegerOP}
                                      onChange={(e) => {
                                        const parsed = parseInt(e.target.value, 10);
                                        const next = isNaN(parsed) ? 1 : Math.max(1, Math.min(parsed, CANTIDAD_MAX_OP));
                                        setCarrito(prev => prev.map(i => i.productoId === item.productoId ? { ...i, cantidad: next } : i));
                                      }}
                                      style={{ width: 52, height: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, padding: '0 4px', border: 'none', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', borderRadius: 0 }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = Math.min(CANTIDAD_MAX_OP, item.cantidad + 1);
                                        setCarrito(prev => prev.map(i => i.productoId === item.productoId ? { ...i, cantidad: next } : i));
                                      }}
                                      disabled={item.cantidad >= CANTIDAD_MAX_OP}
                                      style={{ width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', background: 'transparent', border: 'none', fontSize: 16, fontWeight: 500, cursor: item.cantidad >= CANTIDAD_MAX_OP ? 'not-allowed' : 'pointer', opacity: item.cantidad >= CANTIDAD_MAX_OP ? 0.3 : 1 }}
                                    >+</button>
                                  </div>
                                  {itemErr && <p style={{ color: '#ef4444', fontSize: 10, lineHeight: 1.2, textAlign: 'center', margin: 0 }}>{itemErr}</p>}
                                </div>
                              </td>
                              <td style={{ paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCarrito(prev => prev.filter(i => i.productoId !== item.productoId));
                                    setCarritoErrors(prev => { const n = { ...prev }; delete n[item.productoId]; return n; });
                                  }}
                                  style={{ color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                  title="Quitar"
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                >
                                  <XCircleIcon style={{ width: 16, height: 16 }} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Resumen */}
                {carrito.length > 0 && (
                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px', flexShrink: 0, background: '#fff' }}>
                    <div style={{ marginLeft: 'auto', maxWidth: 280 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                        <span style={{ fontWeight: 700, color: '#111827' }}>Total de órdenes</span>
                        <span style={{ fontSize: 22, fontWeight: 700, color: '#1d4ed8' }}>{carrito.length}</span>
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
              <p style={{
                fontSize: 12, color: '#9ca3af',
                display: 'flex', alignItems: 'center', gap: 6,
                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                Los campos con * son obligatorios
              </p>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetCreateForm(); }} disabled={submitting} style={{ height: 36, padding: '0 16px' }}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={submitting}
                  style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px' }}
                >
                  {submitting && <Loader2 style={{ width: 16, height: 16, marginRight: 8 }} className="animate-spin" />}
                  {carrito.length > 1 ? `Crear ${carrito.length} órdenes` : 'Crear Orden'}
                </Button>
              </div>
            </footer>
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda y Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por código o producto..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En Proceso">En Proceso</SelectItem>
                <SelectItem value="Pausada">Pausada</SelectItem>
                <SelectItem value="Finalizada">Finalizada</SelectItem>
                <SelectItem value="Anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      No se encontraron órdenes de producción
                    </td>
                  </tr>
                ) : paginated.map(order => (
                  <tr key={order.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{order.codigoOrden}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{order.producto?.nombreProducto ?? '—'}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{order.cantidad}</td>
                    <td className="py-4 px-6">
                      {(TRANSICIONES[order.estado ?? ''] ?? []).length > 0 ? (
                        <select
                          value={order.estado ?? ''}
                          onChange={e => handleInlineStatus(order, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={order.estado ?? ''}>{order.estado}</option>
                          {(TRANSICIONES[order.estado ?? ''] ?? []).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-500">{order.estado}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <Button size="sm" title="Ver detalle"
                          onClick={() => { setSelected(order); setIsViewOpen(true); }}
                          className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
                          <EyeIcon className="w-4 h-4" />
                        </Button>

                        <Button size="sm" title="Editar"
                          onClick={() => canEdit(order.estado) && openEdit(order)}
                          className="bg-white border border-blue-900 hover:bg-blue-50"
                          style={{ opacity: canEdit(order.estado) ? 1 : 0.3, cursor: canEdit(order.estado) ? 'pointer' : 'not-allowed', color: '#1e3a8a' }}>
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" title="Eliminar"
                          onClick={() => { if (order.estado === 'Pendiente') { setSelected(order); setIsDeleteOpen(true); } }}
                          className="bg-white border border-blue-900 hover:bg-blue-50"
                          style={{ opacity: order.estado === 'Pendiente' ? 1 : 0.3, cursor: order.estado === 'Pendiente' ? 'pointer' : 'not-allowed', color: '#1e3a8a' }}>
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <SmartPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Modal Ver Detalle */}
      <OrdenDetailModal
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        orden={selected}
      />

      {/* Modal Editar */}
      <Dialog open={isStatusOpen} onOpenChange={(o) => { if (!o) { setIsStatusOpen(false); setSelected(null); } }}>
        <DialogContent className="p-0 gap-0 overflow-hidden" style={{ width: '90vw', maxWidth: 520, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#fff' }}>
            <div style={{ width: 40, height: 40, background: '#1d4ed8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <EditIcon style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
              <DialogTitle style={{ fontSize: 17, fontWeight: 700, color: '#111827', lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Editar Orden {selected?.codigoOrden}
              </DialogTitle>
              <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {selected?.estado === 'Pendiente'
                  ? 'Puedes modificar todos los campos de la orden.'
                  : 'Solo puedes cambiar el estado y el responsable.'}
              </DialogDescription>
            </div>
          </header>

          {/* Body */}
          <div style={{ padding: '20px 24px', background: '#f9fafb', overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {selected?.estado === 'Pendiente' ? (
              /* ── PENDIENTE: edición completa ── */
              <>
                <div style={SO.fieldGroup}>
                  <label style={SO.label}>Producto</label>
                  <Select value={editForm.productoId} onValueChange={(v) => setEditForm(p => ({ ...p, productoId: v }))}>
                    <SelectTrigger style={{ height: 40, fontSize: 14, background: '#fff' }}>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.nombreProducto} — {p.referencia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div>
                    <label style={SO.label}>Responsable</label>
                    <Select value={editForm.responsableId} onValueChange={(v) => setEditForm(p => ({ ...p, responsableId: v }))}>
                      <SelectTrigger style={{ height: 40, fontSize: 14, background: '#fff' }}>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        {empleados.map((e: any) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.nombres} {e.apellidos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label style={SO.label}>Fecha de inicio</label>
                    <Input type="date" min={todayStr} value={editForm.fechaInicio}
                      onChange={(e) => setEditForm(p => ({ ...p, fechaInicio: e.target.value }))}
                      style={{ height: 40, fontSize: 14, background: '#fff' }} />
                  </div>
                </div>
                <div style={SO.fieldGroup}>
                  <label style={SO.label}>Cantidad</label>
                  <Input type="number" min={1} max={CANTIDAD_MAX_OP} step={1} placeholder="Ej: 10"
                    value={editForm.cantidad} onKeyDown={blockNonIntegerOP}
                    onChange={(e) => setEditForm(p => ({ ...p, cantidad: e.target.value }))}
                    style={{ height: 40, fontSize: 14, background: '#fff' }} />
                </div>
                <div style={SO.fieldGroup}>
                  <label style={SO.label}>Notas <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', textTransform: 'none' }}>(opcional)</span></label>
                  <Textarea placeholder="Observaciones..." value={editForm.nota} rows={3}
                    onChange={(e) => setEditForm(p => ({ ...p, nota: e.target.value }))}
                    style={{ fontSize: 14, background: '#fff', resize: 'none' }} />
                </div>
              </>
            ) : (
              /* ── OTROS ESTADOS: edición limitada ── */
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <span style={SO.label as any}>Estado actual</span>
                  <Badge className={estadoColor(selected?.estado ?? '')}>{selected?.estado}</Badge>
                </div>
                {(TRANSICIONES[selected?.estado ?? ''] ?? []).length > 0 && (
                  <div style={SO.fieldGroup}>
                    <label style={SO.label}>Nuevo estado</label>
                    <Select value={editForm.estado} onValueChange={(v) => setEditForm(p => ({ ...p, estado: v }))}>
                      <SelectTrigger style={{ height: 40, fontSize: 14, background: '#fff' }}>
                        <SelectValue placeholder="Seleccionar nuevo estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {(TRANSICIONES[selected?.estado ?? ''] ?? []).map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div style={SO.fieldGroup}>
                  <label style={SO.label}>Responsable</label>
                  <Select value={editForm.responsableId} onValueChange={(v) => setEditForm(p => ({ ...p, responsableId: v }))}>
                    <SelectTrigger style={{ height: 40, fontSize: 14, background: '#fff' }}>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {empleados.map((e: any) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.nombres} {e.apellidos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
            <div>
              {canEdit(selected?.estado) && (
                <Button variant="outline" type="button" disabled={submitting}
                  onClick={() => { setIsStatusOpen(false); openAnulModal(selected!); }}
                  style={{ height: 36, padding: '0 16px', color: '#6b7280', borderColor: '#e5e7eb' }}>
                  <XCircleIcon style={{ width: 15, height: 15, marginRight: 6 }} />
                  Anular
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" onClick={() => { setIsStatusOpen(false); setSelected(null); }} disabled={submitting} style={{ height: 36, padding: '0 16px' }}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleEdit} disabled={submitting}
                style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px' }}>
                {submitting && <Loader2 style={{ width: 15, height: 15, marginRight: 8 }} className="animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>

      {/* ═══ Modal Anular ═══ */}
      <Dialog open={isAnulOpen} onOpenChange={(o) => {
        if (!o) { setIsAnulOpen(false); setMotivo(''); setMotivoTouched(false); setDevoluciones([]); }
      }}>
        <DialogContent className="p-0 gap-0 overflow-hidden" style={{ width: '96vw', maxWidth: 560, display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

          {/* Header */}
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#fff' }}>
            <div style={{ width: 40, height: 40, background: '#1d4ed8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <XCircleIcon style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
              <DialogTitle style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>
                Anular Orden — {selected?.codigoOrden}
              </DialogTitle>
              <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Completa los datos para confirmar la anulación.
              </DialogDescription>
            </div>
          </header>

          {/* Body */}
          {selected && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Motivo */}
              <div>
                <Label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Motivo de Anulación <span style={{ color: '#f87171' }}>*</span>
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 4 }}>(10–500 caracteres)</span>
                </Label>
                <Textarea
                  value={motivo}
                  onChange={(e) => { setMotivo(e.target.value); if (motivoTouched) setMotivoTouched(true); }}
                  onBlur={() => setMotivoTouched(true)}
                  placeholder="Describe el motivo de la anulación..."
                  rows={3}
                  maxLength={501}
                  style={{ fontSize: 13, resize: 'none', borderColor: motivoError ? '#f87171' : undefined }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <OPFieldError message={motivoError} />
                  <span style={{ fontSize: 11, marginLeft: 'auto', color: motivo.trim().length > 500 ? '#ef4444' : '#9ca3af', fontWeight: motivo.trim().length > 500 ? 600 : 400 }}>
                    {motivo.trim().length}/500
                  </span>
                </div>
              </div>

              {/* Devolución de insumos — solo si hay insumos consumidos */}
              {devoluciones.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <RotateCcw style={{ width: 15, height: 15, color: '#3b82f6' }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a', margin: 0 }}>
                      Devolución de Insumos al Inventario
                    </p>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                    Indica cuánto de cada insumo deseas devolver. Por defecto se devuelve todo lo consumido.
                  </p>

                  {/* Encabezado columnas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px', gap: 8, padding: '4px 10px', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insumo</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Consumido</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>A devolver</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {devoluciones.map((dev, i) => {
                      const val = parseFloat(dev.cantidadADevolver);
                      const esInvalido = dev.cantidadADevolver !== '' && (isNaN(val) || val < 0 || val > dev.cantidadDescontada);
                      return (
                        <div key={dev.insumosId} style={{
                          display: 'grid', gridTemplateColumns: '1fr 100px 110px', gap: 8, alignItems: 'center',
                          padding: '8px 10px', background: esInvalido ? '#fef2f2' : '#f8fafc',
                          borderRadius: 8, border: `1px solid ${esInvalido ? '#fca5a5' : '#e2e8f0'}`,
                        }}>
                          {/* Nombre */}
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {dev.nombre}
                            </p>
                          </div>
                          {/* Cantidad consumida */}
                          <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'right', margin: 0 }}>
                            {dev.cantidadDescontada}
                          </p>
                          {/* Input cantidad a devolver */}
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              step="1"
                              value={dev.cantidadADevolver}
                              onKeyDown={e => {
                                if (e.key === '.' || e.key === ',') e.preventDefault();
                              }}
                              onChange={e => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                const num = raw === '' ? '' : String(Math.floor(Number(raw)));
                                setDevoluciones(prev => prev.map((d, j) => j === i ? { ...d, cantidadADevolver: num } : d));
                              }}
                              style={{
                                flex: 1, height: 32, textAlign: 'right', fontSize: 13, fontWeight: 600,
                                padding: '0 8px', borderRadius: 6,
                                border: `1px solid ${esInvalido ? '#f87171' : '#d1d5db'}`,
                                background: '#fff', outline: 'none', minWidth: 0,
                              }}
                            />
                            <button
                              type="button"
                              title="Devolver todo"
                              onClick={() => setDevoluciones(prev => prev.map((d, j) => j === i ? { ...d, cantidadADevolver: String(Math.floor(d.cantidadDescontada)) } : d))}
                              style={{ flexShrink: 0, height: 32, padding: '0 6px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: '#1d4ed8', fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                              Todo
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Sin insumos consumidos */
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <Info style={{ width: 15, height: 15, color: '#6b7280', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                    Esta orden no tiene insumos consumidos que devolver al inventario.
                  </p>
                </div>
              )}

              {/* Advertencia final */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12 }}>
                <AlertTriangle style={{ width: 18, height: 18, color: '#1d4ed8', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>Esta acción no se puede deshacer.</p>
                  {devoluciones.length > 0 ? (
                    <p style={{ margin: 0 }}>
                      La orden <strong>{selected.codigoOrden}</strong> quedará en estado <strong>Anulada</strong>{' '}
                      y las cantidades indicadas serán sumadas de vuelta al inventario de insumos.
                      Si colocas <strong>0</strong> en un insumo, ese insumo <strong>no</strong> se devolverá.
                    </p>
                  ) : (
                    <p style={{ margin: 0 }}>
                      La orden <strong>{selected.codigoOrden}</strong> quedará en estado <strong>Anulada</strong>.
                      No hay insumos que devolver.
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Footer */}
          <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 24px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
            <Button variant="outline"
              onClick={() => { setIsAnulOpen(false); setMotivo(''); setMotivoTouched(false); setDevoluciones([]); }}
              disabled={submitting}
              style={{ height: 36, padding: '0 16px' }}>
              Cancelar
            </Button>
            <Button
              onClick={handleAnular}
              disabled={submitting || motivo.trim().length < 10 || motivo.trim().length > 500}
              style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px' }}
              className="hover:bg-blue-700">
              {submitting && <Loader2 style={{ width: 15, height: 15, marginRight: 8 }} className="animate-spin" />}
              Confirmar Anulación
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Diálogo Eliminar */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden de producción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la orden{' '}
              <strong>{selected?.codigoOrden}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelected(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Diálogo de insumos insuficientes ──────────────────────── */}
      <AlertDialog open={isStockErrorOpen} onOpenChange={setIsStockErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Stock de insumos insuficiente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <span className="block text-gray-700 font-medium mb-3">{stockErrorMsg}</span>
              <ul className="space-y-1.5">
                {stockErrorDetails.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded px-3 py-1.5">
                    <span className="mt-0.5 text-red-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Realiza una compra de insumos para reponer el stock antes de iniciar esta orden.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsStockErrorOpen(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
