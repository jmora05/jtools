import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { toast } from 'sonner';
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
} from 'lucide-react';
import {
  getOrdenesProduccion,
  createOrdenProduccion,
  updateOrdenProduccion,
  anularOrdenProduccion,
  deleteOrdenProduccion,
  type OrdenProduccion,
} from '@/features/orders/services/ordenesproduccionservice';
import { getProductos } from '@/features/products/services/productosService';
import { getEmpleados } from '@/features/employed/services/empleadosService';

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
  'Pendiente':   ['En Proceso', 'Pausada'],
  'En Proceso':  ['Pausada', 'Finalizada'],
  'Pausada':     ['En Proceso'],
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

type OrdenFormErrors = {
  productoId?: string;
  cantidad?: string;
  responsableId?: string;
  fechaInicio?: string;
  nota?: string;
};

type OrdenFormData = { productoId: string; cantidad: string; responsableId: string; fechaInicio: string; nota: string };

function validateOrdenForm(form: OrdenFormData): OrdenFormErrors {
  const errors: OrdenFormErrors = {};

  if (!form.productoId) errors.productoId = 'El producto es obligatorio.';

  if (!form.cantidad || form.cantidad === '') {
    errors.cantidad = 'La cantidad es obligatoria.';
  } else {
    const n = Number(form.cantidad);
    if (!Number.isInteger(n) || n <= 0) errors.cantidad = 'Debe ser un número entero mayor a 0.';
    else if (n > CANTIDAD_MAX_OP) errors.cantidad = `No puede superar ${CANTIDAD_MAX_OP.toLocaleString()} unidades.`;
  }

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
  const emptyForm: OrdenFormData = { productoId: '', cantidad: '', responsableId: '', fechaInicio: todayStr, nota: '' };
  const [form, setForm] = useState<OrdenFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<OrdenFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof OrdenFormData, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [newEstado, setNewEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [motivoTouched, setMotivoTouched] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await getOrdenesProduccion();
      setOrders(data);
    } catch {
      toast.error('Error al cargar las órdenes de producción');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    getProductos()
      .then((d: any) => setProductos((d || []).filter((p: any) => p.estado === 'activo')))
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
    setForm({ ...emptyForm, responsableId: getAutoResponsableId(), fechaInicio: new Date().toISOString().split('T')[0] });
    setFormErrors({});
    setTouched({});
    setSubmitAttempted(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouched({ productoId: true, cantidad: true, responsableId: true, fechaEntrega: true, nota: true });
    const errors = validateOrdenForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Completa los campos obligatorios correctamente');
      return;
    }
    setSubmitting(true);
    try {
      await createOrdenProduccion({
        productoId: Number(form.productoId),
        cantidad: Number(form.cantidad),
        responsableId: Number(form.responsableId),
        tipoOrden: 'Venta',
        fechaEntrega: form.fechaInicio + 'T12:00:00',
        nota: form.nota.trim() || undefined,
      });
      toast.success('Orden de producción creada correctamente');
      setIsCreateOpen(false);
      resetCreateForm();
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la orden');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selected || !newEstado) return;
    setSubmitting(true);
    try {
      await updateOrdenProduccion(selected.id!, { estado: newEstado as any });
      toast.success('Estado actualizado correctamente');
      setIsStatusOpen(false);
      setNewEstado('');
      setSelected(null);
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el estado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInlineStatus = async (order: OrdenProduccion, nuevoEstado: string) => {
    if (!nuevoEstado || nuevoEstado === order.estado) return;
    try {
      await updateOrdenProduccion(order.id!, { estado: nuevoEstado as any });
      toast.success('Estado actualizado correctamente');
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el estado');
    }
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
    setSubmitting(true);
    try {
      await anularOrdenProduccion(selected.id!, motivo.trim());
      toast.success('Orden anulada correctamente');
      setIsAnulOpen(false);
      setMotivo('');
      setMotivoTouched(false);
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

  const canEdit = (estado?: string) => !['Finalizada', 'Anulada'].includes(estado ?? '');

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
    <div className="space-y-6">
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
              width: '90vw', maxWidth: 720, borderRadius: 12,
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <header style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
              background: '#fff', flexShrink: 0,
            }}>
              <div style={{
                width: 40, height: 40, background: '#1d4ed8',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <ClipboardListIcon style={{ width: 20, height: 20, color: '#fff' }} />
              </div>
              <div style={{ flex: 1, paddingRight: 32 }}>
                <DialogTitle style={{
                  fontSize: 17, fontWeight: 700, color: '#111827', lineHeight: 1.2, margin: 0,
                }}>
                  Registrar Nueva Orden de Producción
                </DialogTitle>
                <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Completa los campos para crear la orden. Los campos marcados con * son obligatorios.
                </DialogDescription>
              </div>
            </header>

            {/* Alerta de errores */}
            {submitAttempted && totalFormErrors > 0 && (
              <div style={{
                padding: '8px 24px', background: '#fffbeb',
                borderBottom: '1px solid #fde68a', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 12,
                fontSize: 12, color: '#92400e',
              }}>
                <Info style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0 }} />
                <span>{totalFormErrors} campo(s) requieren atención.</span>
              </div>
            )}

            {/* Body */}
            <div style={{ padding: '24px', background: '#f9fafb', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <form id="orden-form" onSubmit={handleCreate}>
                {/* Producto */}
                <div style={SO.fieldGroup}>
                  <label style={SO.label}>Producto <span style={{ color: '#f87171' }}>*</span></label>
                  <Select
                    value={form.productoId}
                    onValueChange={(v) => { handleFormChange('productoId', v); setTouched(p => ({ ...p, productoId: true })); }}
                  >
                    <SelectTrigger style={{
                      height: 40, fontSize: 14, background: '#fff',
                      borderColor: touched.productoId && formErrors.productoId ? '#f87171' : undefined,
                    }}>
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
                  <OPFieldError message={touched.productoId ? formErrors.productoId : undefined} />
                </div>

                {/* Responsable + Fecha de Inicio */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div>
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
                  <div>
                    <label style={SO.label}>Fecha de Inicio <span style={{ color: '#f87171' }}>*</span></label>
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
                </div>

                {/* Cantidad */}
                <div style={SO.fieldGroup}>
                  <label style={SO.label}>Cantidad <span style={{ color: '#f87171' }}>*</span></label>
                  <Input
                    type="number"
                    min={1}
                    max={CANTIDAD_MAX_OP}
                    step={1}
                    placeholder="Ej: 10"
                    value={form.cantidad}
                    onKeyDown={blockNonIntegerOP}
                    onChange={(e) => handleFormChange('cantidad', e.target.value)}
                    onBlur={() => handleBlurField('cantidad')}
                    style={{
                      height: 40, fontSize: 14, background: '#fff',
                      borderColor: touched.cantidad && formErrors.cantidad ? '#f87171' : undefined,
                    }}
                  />
                  <OPFieldError message={touched.cantidad ? formErrors.cantidad : undefined} />
                </div>

                {/* Notas */}
                <div style={SO.fieldGroup}>
                  <label style={SO.label}>Notas <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', textTransform: 'none' }}>(opcional)</span></label>
                  <Textarea
                    placeholder="Observaciones adicionales..."
                    value={form.nota}
                    onChange={(e) => handleFormChange('nota', e.target.value)}
                    onBlur={() => handleBlurField('nota')}
                    rows={3}
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
              </form>
            </div>

            {/* Footer */}
            <footer style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, padding: '12px 24px',
              borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
            }}>
              <p style={{
                fontSize: 12, color: '#9ca3af',
                display: 'flex', alignItems: 'center', gap: 6, margin: 0,
              }}>
                <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                Los campos con * son obligatorios
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetCreateForm(); }} disabled={submitting} style={{ height: 36, padding: '0 16px' }}>
                Cancelar
              </Button>
              <Button
                form="orden-form"
                type="submit"
                disabled={submitting}
                style={{ background: '#1d4ed8', color: '#fff', height: 36, padding: '0 20px' }}
              >
                {submitting && <Loader2 style={{ width: 16, height: 16, marginRight: 8 }} className="animate-spin" />}
                Crear Orden
              </Button>
              </div>
            </footer>
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda y Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por código o producto..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
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
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Código</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Producto</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Cantidad</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Estado</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Acciones</th>
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
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{order.codigoOrden}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{order.producto?.nombreProducto ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{order.cantidad}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button size="sm" title="Ver detalle"
                          onClick={() => { setSelected(order); setIsViewOpen(true); }}
                          className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" title="Editar"
                          onClick={() => { setSelected(order); setNewEstado(''); setIsStatusOpen(true); }}
                          className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" title="Eliminar"
                          onClick={() => { setSelected(order); setIsDeleteOpen(true); }}
                          className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              {[...Array(totalPages)].map((_, i) => {
                const n = i + 1;
                return n === currentPage
                  ? <Button key={n} variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 min-w-[40px]">{n}</Button>
                  : <Button key={n} variant="ghost" size="sm" className="w-8" onClick={() => setCurrentPage(n)}>•</Button>;
              })}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ver Detalle */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Orden de Producción</DialogTitle>
            <DialogDescription>Información completa de la orden</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Información General</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Código</p><p className="text-sm font-medium">{selected.codigoOrden}</p></div>
                  <div><p className="text-xs text-gray-500">Estado</p><Badge className={estadoColor(selected.estado ?? '')}>{selected.estado}</Badge></div>
                  <div><p className="text-xs text-gray-500">Producto</p><p className="text-sm">{selected.producto?.nombreProducto ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-500">Referencia</p><p className="text-sm">{selected.producto?.referencia ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-500">Cantidad</p><p className="text-sm">{selected.cantidad}</p></div>
                  <div><p className="text-xs text-gray-500">Responsable</p><p className="text-sm">{selected.responsable ? `${selected.responsable.nombres} ${selected.responsable.apellidos}` : '—'}</p></div>
                  <div><p className="text-xs text-gray-500">Fecha de Inicio</p><p className="text-sm">{selected.fechaEntrega ? selected.fechaEntrega.split('T')[0] : '—'}</p></div>
                  {selected.motivoAnulacion && (
                    <div className="col-span-2"><p className="text-xs text-gray-500">Motivo de Anulación</p><p className="text-sm text-blue-700">{selected.motivoAnulacion}</p></div>
                  )}
                  {selected.nota && (
                    <div className="col-span-2"><p className="text-xs text-gray-500">Notas</p><p className="text-sm">{selected.nota}</p></div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                {canEdit(selected.estado) && (
                  <>
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => { setIsViewOpen(false); setNewEstado(''); setIsStatusOpen(true); }}>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Cambiar Estado
                    </Button>
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => { setIsViewOpen(false); setMotivo(''); setIsAnulOpen(true); }}>
                      <XCircleIcon className="w-4 h-4 mr-2" />
                      Anular
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cambiar Estado */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de la Orden</DialogTitle>
            <DialogDescription>Actualiza el estado de la orden de producción</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700">Orden: <strong>{selected.codigoOrden}</strong></p>
                <p className="text-xs text-gray-500 mt-1">Estado actual: {selected.estado}</p>
              </div>
              <div className="space-y-2">
                <Label>Nuevo Estado *</Label>
                <Select value={newEstado} onValueChange={setNewEstado}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                  <SelectContent>
                    {(TRANSICIONES[selected.estado ?? ''] ?? []).map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setIsStatusOpen(false); setNewEstado(''); }}>Cancelar</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleStatusChange} disabled={submitting || !newEstado}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Anular */}
      <Dialog open={isAnulOpen} onOpenChange={(o) => { if (!o) { setIsAnulOpen(false); setMotivo(''); setMotivoTouched(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anular Orden de Producción</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. Indica el motivo de la anulación.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">Orden: <strong>{selected.codigoOrden}</strong></p>
              <div className="space-y-2">
                <Label>Motivo de Anulación * <span className="text-xs text-gray-400">(10–500 caracteres)</span></Label>
                <Textarea
                  value={motivo}
                  onChange={(e) => { setMotivo(e.target.value); if (motivoTouched) setMotivoTouched(true); }}
                  onBlur={() => setMotivoTouched(true)}
                  placeholder="Describe el motivo de la anulación..."
                  rows={4}
                  maxLength={501}
                  style={{ borderColor: motivoError ? '#f87171' : undefined, resize: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <OPFieldError message={motivoError} />
                  <span style={{
                    fontSize: 11, marginLeft: 'auto',
                    color: motivo.trim().length > 500 ? '#ef4444' : '#9ca3af',
                    fontWeight: motivo.trim().length > 500 ? 600 : 400,
                  }}>
                    {motivo.trim().length}/500
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setIsAnulOpen(false); setMotivo(''); setMotivoTouched(false); }}>Cancelar</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAnular} disabled={submitting || motivo.trim().length < 10 || motivo.trim().length > 500}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Anular Orden
                </Button>
              </div>
            </div>
          )}
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
    </div>
  );
}
