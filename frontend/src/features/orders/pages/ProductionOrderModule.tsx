import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import {
  PlusIcon, SearchIcon, EyeIcon, EditIcon, AlertTriangleIcon,
  ChevronLeftIcon, ChevronRightIcon, ClipboardListIcon, UserIcon,
  CalendarIcon, ArrowLeftIcon, CheckCircleIcon, PlayIcon, PauseIcon,
  XCircleIcon, ClockIcon, UsersIcon, PackageIcon, RefreshCwIcon,
  ShoppingCartIcon, TruckIcon
} from 'lucide-react';
import {
  getOrdenesProduccion, createOrdenProduccion, updateOrdenProduccion,
  anularOrdenProduccion, type OrdenProduccion, type EstadoOrden
} from '../services/ordenesProduccionService';
import { getEmpleados, type Empleado } from '../../employed/services/empleadosService';
import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';

// ─── Tipos locales ────────────────────────────────────────────────────────────

type Producto = { id: number; nombreProducto: string; referencia: string };

type FormCreate = {
  productoId: string;
  cantidad: string;
  responsableId: string;
  pedidoId: string;
  fechaEntrega: string;
  nota: string;
};

type FormEdit = {
  responsableId: string;
  fechaEntrega: string;
  nota: string;
  estado: EstadoOrden;
};

const EMPTY_CREATE: FormCreate = {
  productoId: '',
  cantidad: '',
  responsableId: '',
  pedidoId: '',
  fechaEntrega: '',
  nota: '',
};

const ESTADOS: EstadoOrden[] = ['Pendiente', 'En Proceso', 'Pausada', 'Finalizada', 'Anulada'];

// ─── Select nativo (igual que en EmployeeManagement — evita bug de portales) ──
const nativeSelectClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

// ─── Badges de estado ─────────────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: EstadoOrden | string }) {
  const map: Record<string, React.ReactNode> = {
    Pendiente:  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><ClockIcon className="w-3 h-3 mr-1" />Pendiente</Badge>,
    'En Proceso': <Badge className="bg-blue-100 text-blue-700 border-blue-200"><PlayIcon className="w-3 h-3 mr-1" />En Proceso</Badge>,
    Pausada:    <Badge className="bg-orange-100 text-orange-700 border-orange-200"><PauseIcon className="w-3 h-3 mr-1" />Pausada</Badge>,
    Finalizada: <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircleIcon className="w-3 h-3 mr-1" />Finalizada</Badge>,
    Anulada:    <Badge className="bg-red-100 text-red-700 border-red-200"><XCircleIcon className="w-3 h-3 mr-1" />Anulada</Badge>,
  };
  return <>{map[estado] ?? <Badge>{estado}</Badge>}</>;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ProductionOrderModule() {
  // Datos de la API
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAnularDialog, setShowAnularDialog] = useState(false);
  const [showEstadoDialog, setShowEstadoDialog] = useState(false);

  // Paso del wizard de creación
  const [orderTypeStep, setOrderTypeStep] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<'Pedido' | 'Venta' | ''>('');

  // Ordenes seleccionadas
  const [selectedOrden, setSelectedOrden]   = useState<OrdenProduccion | null>(null);
  const [ordenToAnular, setOrdenToAnular]   = useState<OrdenProduccion | null>(null);
  const [ordenToEstado, setOrdenToEstado]   = useState<OrdenProduccion | null>(null);

  // Formularios
  const [createForm, setCreateForm] = useState<FormCreate>(EMPTY_CREATE);
  const [editForm, setEditForm]     = useState<FormEdit>({ responsableId: '', fechaEntrega: '', nota: '', estado: 'Pendiente' });
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [newEstado, setNewEstado]   = useState<EstadoOrden>('Pendiente');

  // Filtros
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterEstado, setFilterEstado]   = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]   = useState('');
  const [sortBy, setSortBy]               = useState('codigo');
  const [currentPage, setCurrentPage]     = useState(1);
  const itemsPerPage = 5;

  // ─── Carga de datos ──────────────────────────────────────────────────────────

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      setOrdenes(await getOrdenesProduccion());
    } catch (err: any) {
      toast.error('Error al cargar órdenes: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductos = useCallback(async () => {
    try {
      const BASE = getApiBaseUrl();
      const res = await fetch(`${BASE}/productos`, { headers: buildAuthHeaders() });
      const data = await handleResponse<Producto[]>(res);
      setProductos(data);
    } catch {
      // silencioso — la lista de productos puede estar vacía
    }
  }, []);

  const fetchEmpleados = useCallback(async () => {
    try {
      const data = await getEmpleados();
      setEmpleados(data.filter(e => e.estado === 'activo'));
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchOrdenes();
    fetchProductos();
    fetchEmpleados();
  }, [fetchOrdenes, fetchProductos, fetchEmpleados]);

  // ─── Filtrado y paginación ───────────────────────────────────────────────────

  const filtered = ordenes.filter(o => {
    const codigo   = (o.codigoOrden ?? '').toLowerCase();
    const producto = (o.producto?.nombreProducto ?? '').toLowerCase();
    const ref      = (o.producto?.referencia ?? '').toLowerCase();
    const search   = searchTerm.toLowerCase();
    const matchSearch = codigo.includes(search) || producto.includes(search) || ref.includes(search);
    const matchEstado = filterEstado === 'all' || o.estado === filterEstado;
    const fechaCreacion = (o.createdAt ?? '').slice(0, 10);
    const matchFrom = !filterDateFrom || fechaCreacion >= filterDateFrom;
    const matchTo   = !filterDateTo   || fechaCreacion <= filterDateTo;
    return matchSearch && matchEstado && matchFrom && matchTo;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'codigo') return (a.codigoOrden ?? '').localeCompare(b.codigoOrden ?? '');
    if (sortBy === 'fecha')  return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    return 0;
  });

  const totalPages    = Math.ceil(sorted.length / itemsPerPage);
  const paginated     = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Acciones CRUD ───────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.productoId || !createForm.cantidad || !createForm.responsableId || !createForm.fechaEntrega) {
      toast.error('Completa todos los campos obligatorios (*)');
      return;
    }
    setSaving(true);
    try {
      const res = await createOrdenProduccion({
        productoId:   parseInt(createForm.productoId),
        cantidad:     parseInt(createForm.cantidad),
        responsableId: parseInt(createForm.responsableId),
        pedidoId:     createForm.pedidoId ? parseInt(createForm.pedidoId) : null,
        fechaEntrega: createForm.fechaEntrega,
        nota:         createForm.nota || undefined,
      });
      toast.success(`Orden ${res.orden.codigoOrden} creada exitosamente`);
      setShowCreateModal(false);
      setOrderTypeStep(false);
      setSelectedOrderType('');
      setCreateForm(EMPTY_CREATE);
      fetchOrdenes();
    } catch (err: any) {
      toast.error('Error al crear: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrden?.id || !editForm.responsableId || !editForm.fechaEntrega) {
      toast.error('Completa los campos obligatorios (*)');
      return;
    }
    setSaving(true);
    try {
      await updateOrdenProduccion(selectedOrden.id, {
        responsableId: parseInt(editForm.responsableId),
        fechaEntrega:  editForm.fechaEntrega,
        nota:          editForm.nota || undefined,
        estado:        editForm.estado,
      });
      toast.success('Orden actualizada correctamente');
      setShowEditModal(false);
      setSelectedOrden(null);
      fetchOrdenes();
    } catch (err: any) {
      toast.error('Error al actualizar: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleAnular = async () => {
    if (!ordenToAnular?.id) return;
    if (!motivoAnulacion.trim()) {
      toast.error('El motivo de anulación es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await anularOrdenProduccion(ordenToAnular.id, motivoAnulacion);
      toast.success('Orden anulada correctamente');
      setShowAnularDialog(false);
      setOrdenToAnular(null);
      setMotivoAnulacion('');
      fetchOrdenes();
    } catch (err: any) {
      toast.error('Error al anular: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (!ordenToEstado?.id) return;
    setSaving(true);
    try {
      await updateOrdenProduccion(ordenToEstado.id, { estado: newEstado });
      toast.success(`Estado cambiado a ${newEstado}`);
      setShowEstadoDialog(false);
      setOrdenToEstado(null);
      fetchOrdenes();
    } catch (err: any) {
      toast.error('Error al cambiar estado: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (o: OrdenProduccion) => {
    setSelectedOrden(o);
    setEditForm({
      responsableId: String(o.responsableId ?? ''),
      fechaEntrega:  o.fechaEntrega,
      nota:          o.nota ?? '',
      estado:        o.estado ?? 'Pendiente',
    });
    setShowEditModal(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 flex items-center gap-3">
            <ClipboardListIcon className="w-8 h-8 text-blue-600" />
            Órdenes de Producción
          </h1>
          <p className="text-sm text-gray-600 mt-1">Módulo de Producción — Gestiona las órdenes de fabricación</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrdenes} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {/* Modal crear */}
          <Dialog
            open={showCreateModal}
            onOpenChange={open => {
              setShowCreateModal(open);
              if (!open) { setOrderTypeStep(false); setSelectedOrderType(''); setCreateForm(EMPTY_CREATE); }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />Registrar Orden
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              {!orderTypeStep ? (
                /* Paso 1: Tipo de orden */
                <>
                  <DialogHeader>
                    <DialogTitle>Nueva Orden de Producción</DialogTitle>
                    <DialogDescription>Selecciona el tipo de orden que deseas registrar</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
                    <Card className="cursor-pointer border-2 hover:border-blue-500 hover:shadow-lg transition-all"
                      onClick={() => { setSelectedOrderType('Pedido'); setOrderTypeStep(true); }}>
                      <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                          <ShoppingCartIcon className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl text-gray-900">Pedido</h3>
                        <p className="text-sm text-center text-gray-600">Producción basada en pedidos de clientes</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer border-2 hover:border-green-500 hover:shadow-lg transition-all"
                      onClick={() => { setSelectedOrderType('Venta'); setOrderTypeStep(true); }}>
                      <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                          <TruckIcon className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-xl text-gray-900">Venta</h3>
                        <p className="text-sm text-center text-gray-600">Producción para inventario y venta directa</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                  </div>
                </>
              ) : (
                /* Paso 2: Formulario — sin Select de Radix, solo select nativo */
                <>
                  <DialogHeader>
                    <DialogTitle>Registrar Orden de Producción — {selectedOrderType}</DialogTitle>
                    <DialogDescription>Completa los campos obligatorios (*) para crear la orden.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-6 mt-2">
                    <Card className="border-2 border-blue-100">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-white py-3">
                        <CardTitle className="text-base">Información de la Orden</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                          <div className="space-y-1">
                            <Label className="text-xs">Producto *</Label>
                            <select
                              className={nativeSelectClass}
                              value={createForm.productoId}
                              onChange={e => setCreateForm({ ...createForm, productoId: e.target.value })}
                              required
                            >
                              <option value="">Seleccionar producto</option>
                              {productos.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.nombreProducto} ({p.referencia})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Cantidad *</Label>
                            <Input
                              type="number" min="1" placeholder="Unidades a producir"
                              value={createForm.cantidad}
                              onChange={e => setCreateForm({ ...createForm, cantidad: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Responsable *</Label>
                            <select
                              className={nativeSelectClass}
                              value={createForm.responsableId}
                              onChange={e => setCreateForm({ ...createForm, responsableId: e.target.value })}
                              required
                            >
                              <option value="">Seleccionar responsable</option>
                              {empleados.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.nombres} {emp.apellidos} — {emp.cargo}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Fecha de Entrega *</Label>
                            <Input
                              type="date" min={today}
                              value={createForm.fechaEntrega}
                              onChange={e => setCreateForm({ ...createForm, fechaEntrega: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Notas Adicionales</Label>
                            <Textarea
                              placeholder="Especificaciones o instrucciones especiales..."
                              value={createForm.nota}
                              onChange={e => setCreateForm({ ...createForm, nota: e.target.value })}
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" className="flex-1"
                        onClick={() => { setOrderTypeStep(false); setSelectedOrderType(''); }}>
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />Atrás
                      </Button>
                      <Button type="button" variant="outline" className="flex-1"
                        onClick={() => { setShowCreateModal(false); setOrderTypeStep(false); setCreateForm(EMPTY_CREATE); }}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
                        {saving ? 'Guardando...' : 'Registrar Orden'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros — todos con select nativo */}
      <Card className="shadow-lg border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por código, producto..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
              <select className={nativeSelectClass} value={filterEstado}
                onChange={e => { setFilterEstado(e.target.value); setCurrentPage(1); }}>
                <option value="all">Todos los estados</option>
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Input type="date" value={filterDateFrom}
                onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }} placeholder="Desde" />
              <Input type="date" value={filterDateTo}
                onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }} placeholder="Hasta" />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{sorted.length} orden(es) encontrada(s)</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Ordenar por:</span>
                <select className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="codigo">Código de Orden</option>
                  <option value="fecha">Fecha (reciente)</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Entrega</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <RefreshCwIcon className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-400" />
                  <p>Cargando órdenes...</p>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <ClipboardListIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron órdenes de producción</p>
                </td></tr>
              ) : paginated.map(orden => (
                <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ClipboardListIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{orden.codigoOrden}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{orden.producto?.nombreProducto ?? '—'}</p>
                    <p className="text-xs text-gray-500">{orden.producto?.referencia}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className="bg-gray-50">{orden.cantidad} uds.</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {orden.responsable ? `${orden.responsable.nombres} ${orden.responsable.apellidos}` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {orden.estado === 'Finalizada' || orden.estado === 'Anulada' ? (
                      <StatusBadge estado={orden.estado ?? 'Pendiente'} />
                    ) : (
                      <select
                        value={orden.estado}
                        onChange={(e) => handleEstadoDirecto(orden.id, e.target.value as EstadoOrden)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ESTADOS.filter(e => e !== 'Anulada').map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm text-gray-900">{orden.fechaEntrega}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" title="Ver detalle"
                        onClick={() => { setSelectedOrden(orden); setShowDetailModal(true); }}
                        className="text-blue-700 border-blue-200 hover:bg-blue-50">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      {orden.estado !== 'Finalizada' && orden.estado !== 'Anulada' && (
                        <Button variant="outline" size="sm" title="Editar"
                          onClick={() => openEdit(orden)}
                          className="text-amber-700 border-amber-200 hover:bg-amber-50">
                          <EditIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {orden.estado !== 'Finalizada' && orden.estado !== 'Anulada' && (
                        <Button variant="outline" size="sm" title="Anular"
                          onClick={() => { setOrdenToAnular(orden); setShowAnularDialog(true); }}
                          className="text-red-600 border-red-200 hover:bg-red-50">
                          <XCircleIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button key={page} size="sm" onClick={() => setCurrentPage(page)}
                  className={page === currentPage
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}>
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Ver Detalle */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Orden de Producción</DialogTitle>
            <DialogDescription>Información completa de la orden {selectedOrden?.codigoOrden}</DialogDescription>
          </DialogHeader>
          {selectedOrden && (
            <div className="space-y-5 mt-2">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PackageIcon className="w-4 h-4" />Información General
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-gray-500">Código</Label><p className="mt-1 text-sm font-medium">{selectedOrden.codigoOrden}</p></div>
                    <div><Label className="text-xs text-gray-500">Estado</Label><div className="mt-1"><StatusBadge estado={selectedOrden.estado ?? 'Pendiente'} /></div></div>
                    <div><Label className="text-xs text-gray-500">Producto</Label><p className="mt-1 text-sm">{selectedOrden.producto?.nombreProducto ?? '—'}</p></div>
                    <div><Label className="text-xs text-gray-500">Referencia</Label><p className="mt-1 text-sm">{selectedOrden.producto?.referencia ?? '—'}</p></div>
                    <div><Label className="text-xs text-gray-500">Cantidad</Label><p className="mt-1 text-sm">{selectedOrden.cantidad} unidades</p></div>
                    <div><Label className="text-xs text-gray-500">Fecha de Entrega</Label><p className="mt-1 text-sm">{selectedOrden.fechaEntrega}</p></div>
                    {selectedOrden.fechaInicio && <div><Label className="text-xs text-gray-500">Fecha Inicio</Label><p className="mt-1 text-sm">{selectedOrden.fechaInicio}</p></div>}
                    {selectedOrden.fechaFin && <div><Label className="text-xs text-gray-500">Fecha Fin</Label><p className="mt-1 text-sm">{selectedOrden.fechaFin}</p></div>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><UsersIcon className="w-4 h-4" />Responsable</CardTitle></CardHeader>
                <CardContent>
                  {selectedOrden.responsable ? (
                    <p className="text-sm">{selectedOrden.responsable.nombres} {selectedOrden.responsable.apellidos}
                      <span className="ml-2 text-gray-500">— {selectedOrden.responsable.cargo}</span>
                    </p>
                  ) : <p className="text-sm text-gray-500">No asignado</p>}
                </CardContent>
              </Card>
              {selectedOrden.nota && (
                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-base">Notas</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-gray-700">{selectedOrden.nota}</p></CardContent>
                </Card>
              )}
              {selectedOrden.motivoAnulacion && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="py-3"><CardTitle className="text-base text-red-700">Motivo de Anulación</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-red-700">{selectedOrden.motivoAnulacion}</p></CardContent>
                </Card>
              )}
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowDetailModal(false)}>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />Volver
                </Button>
                {selectedOrden.estado !== 'Finalizada' && selectedOrden.estado !== 'Anulada' && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => { setShowDetailModal(false); openEdit(selectedOrden); }}>
                    <EditIcon className="w-4 h-4 mr-2" />Editar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar — select nativo para estado y responsable */}
      <Dialog open={showEditModal} onOpenChange={open => { setShowEditModal(open); if (!open) setSelectedOrden(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualizar Orden de Producción</DialogTitle>
            <DialogDescription>Orden: {selectedOrden?.codigoOrden}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 mt-2">
            {/* Lectura */}
            <Card className="border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white py-3">
                <CardTitle className="text-base">Datos de la Orden (solo lectura)</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-xs">Código</Label><Input value={selectedOrden?.codigoOrden ?? ''} disabled className="bg-gray-50" /></div>
                  <div className="space-y-1"><Label className="text-xs">Producto</Label><Input value={selectedOrden?.producto?.nombreProducto ?? ''} disabled className="bg-gray-50" /></div>
                  <div className="space-y-1"><Label className="text-xs">Cantidad</Label><Input value={selectedOrden?.cantidad ?? ''} disabled className="bg-gray-50" /></div>
                </div>
              </CardContent>
            </Card>

            {/* Editable */}
            <Card className="border-2 border-green-100">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white py-3">
                <CardTitle className="text-base">Actualizar Información</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Responsable *</Label>
                    <select className={nativeSelectClass} value={editForm.responsableId}
                      onChange={e => setEditForm({ ...editForm, responsableId: e.target.value })} required>
                      <option value="">Seleccionar responsable</option>
                      {empleados.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombres} {emp.apellidos} — {emp.cargo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estado *</Label>
                    <select className={nativeSelectClass} value={editForm.estado}
                      onChange={e => setEditForm({ ...editForm, estado: e.target.value as EstadoOrden })}>
                      {(['Pendiente', 'En Proceso', 'Pausada', 'Finalizada'] as EstadoOrden[]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de Entrega *</Label>
                    <Input type="date" value={editForm.fechaEntrega}
                      onChange={e => setEditForm({ ...editForm, fechaEntrega: e.target.value })} required />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Notas</Label>
                    <Textarea value={editForm.nota} rows={3}
                      onChange={e => setEditForm({ ...editForm, nota: e.target.value })}
                      placeholder="Instrucciones adicionales..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => { setShowEditModal(false); setSelectedOrden(null); }}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Anular */}
      <AlertDialog open={showAnularDialog} onOpenChange={setShowAnularDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="w-5 h-5" />Anular Orden de Producción
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>¿Estás seguro de que deseas anular esta orden?</p>
                {ordenToAnular && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1 text-sm">
                    <p><span className="text-gray-500">Código: </span><span className="font-medium">{ordenToAnular.codigoOrden}</span></p>
                    <p><span className="text-gray-500">Producto: </span>{ordenToAnular.producto?.nombreProducto}</p>
                    <p><span className="text-gray-500">Cantidad: </span>{ordenToAnular.cantidad} unidades</p>
                    <p><span className="text-gray-500">Estado actual: </span><StatusBadge estado={ordenToAnular.estado ?? 'Pendiente'} /></p>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-sm">Motivo de Anulación *</Label>
                  <Textarea
                    placeholder="Indica el motivo de la anulación..."
                    value={motivoAnulacion}
                    onChange={e => setMotivoAnulacion(e.target.value)}
                    rows={3}
                  />
                </div>
                <p className="text-sm text-red-600">La orden cambiará a "Anulada" y no podrá procesarse.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setOrdenToAnular(null); setMotivoAnulacion(''); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAnular} className="bg-red-600 hover:bg-red-700" disabled={saving}>
              {saving ? 'Procesando...' : 'Anular Orden'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}