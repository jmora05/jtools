// Novedades empleados - Gestión de incidencias, mejoras y novedades del equipo
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  PlusIcon, EditIcon, TrashIcon, CalendarIcon, AlertCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, EyeIcon, UserIcon, Loader2Icon,
  CheckIcon, XIcon,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

import { getNovedades, createNovedad, updateNovedad, deleteNovedad, cambiarEstadoNovedad, type Novedad, type CreateNovedadDTO, type UpdateNovedadDTO } from '../services/novedadesService';// ajusta el path a tu proyecto

// ─── ID del empleado autenticado ──────────────────────────────────────────────
// Reemplaza esto con tu hook/contexto de autenticación real, por ejemplo:
// const { empleado } = useAuth();
// const EMPLEADO_ACTUAL_ID = empleado.id;
const EMPLEADO_ACTUAL_ID = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_COLORS: Record<string, string> = {
  registrada: 'bg-blue-100 text-blue-700 border-blue-200',
  aprobada:   'bg-green-100 text-green-700 border-green-200',
  rechazada:  'bg-red-100 text-red-700 border-red-200',
};

const ESTADO_LABELS: Record<string, string> = {
  registrada: 'Registrada',
  aprobada:   'Aprobada',
  rechazada:  'Rechazada',
};

const nombreCompleto = (emp?: { nombres: string; apellidos: string } | null) =>
  emp ? `${emp.nombres} ${emp.apellidos}` : '—';

const formatFecha = (fecha?: string) =>
  fecha ? fecha.split('T')[0] : '—';

// ─── Componente ───────────────────────────────────────────────────────────────

export function NewsModule() {

  // ── Estado de datos ────────────────────────────────────────────────────────
  const [novedades, setNovedades]   = useState<Novedad[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Filtros y paginación ───────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const ITEMS_PER_PAGE = 5;

  // ── Diálogos ───────────────────────────────────────────────────────────────
  const [isNewDialogOpen,    setIsNewDialogOpen]    = useState(false);
  const [isEditDialogOpen,   setIsEditDialogOpen]   = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen,   setIsViewDialogOpen]   = useState(false);
  const [selectedNovedad,    setSelectedNovedad]    = useState<Novedad | null>(null);

  // ── Formulario ─────────────────────────────────────────────────────────────
  const emptyForm = { titulo: '', descripcion_detallada: '', empleado_responsable: '' };
  const [form, setForm] = useState(emptyForm);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const fetchNovedades = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNovedades();
      setNovedades(data);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al cargar las novedades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNovedades(); }, [fetchNovedades]);

  // Reset página al cambiar filtros
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  // ── Filtrado y paginación ──────────────────────────────────────────────────
  const filtered = novedades.filter(n => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      n.titulo.toLowerCase().includes(q) ||
      n.descripcion_detallada.toLowerCase().includes(q) ||
      nombreCompleto(n.registradoPor).toLowerCase().includes(q) ||
      nombreCompleto(n.empleadoResponsable).toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || n.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dto: CreateNovedadDTO = {
        titulo:                form.titulo,
        descripcion_detallada: form.descripcion_detallada,
        registrado_por:        EMPLEADO_ACTUAL_ID,
        empleado_responsable:  form.empleado_responsable !== ''
                                 ? Number(form.empleado_responsable)
                                 : null,
      };
      const nueva = await createNovedad(dto);
      setNovedades(prev => [nueva, ...prev]);
      setForm(emptyForm);
      setIsNewDialogOpen(false);
      toast.success('Novedad registrada exitosamente');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al crear la novedad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovedad) return;
    setSubmitting(true);
    try {
      const dto: UpdateNovedadDTO = {
        titulo:                form.titulo,
        descripcion_detallada: form.descripcion_detallada,
        empleado_responsable:  form.empleado_responsable !== ''
                                 ? Number(form.empleado_responsable)
                                 : null,
      };
      const updated = await updateNovedad(selectedNovedad.id, dto);
      setNovedades(prev => prev.map(n => n.id === updated.id ? updated : n));
      setIsEditDialogOpen(false);
      setSelectedNovedad(null);
      setForm(emptyForm);
      toast.success('Novedad actualizada exitosamente');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al actualizar la novedad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNovedad) return;
    setSubmitting(true);
    try {
      await deleteNovedad(selectedNovedad.id);
      setNovedades(prev => prev.filter(n => n.id !== selectedNovedad.id));
      setIsDeleteDialogOpen(false);
      setSelectedNovedad(null);
      toast.success('Novedad eliminada exitosamente');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al eliminar la novedad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCambiarEstado = async (
    novedad: Novedad,
    estado: 'aprobada' | 'rechazada'
  ) => {
    try {
      const updated = await cambiarEstadoNovedad(novedad.id, estado);
      setNovedades(prev => prev.map(n => n.id === updated.id ? updated : n));
      toast.success(`Novedad ${ESTADO_LABELS[estado].toLowerCase()} correctamente`);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al cambiar el estado');
    }
  };

  // ── Abrir diálogos ─────────────────────────────────────────────────────────
  const openView = (n: Novedad) => {
    setSelectedNovedad(n);
    setIsViewDialogOpen(true);
  };

  const openEdit = (n: Novedad) => {
    setSelectedNovedad(n);
    setForm({
      titulo:                n.titulo,
      descripcion_detallada: n.descripcion_detallada,
      empleado_responsable:  n.empleado_responsable?.toString() ?? '',
    });
    setIsEditDialogOpen(true);
  };

  const openDelete = (n: Novedad) => {
    setSelectedNovedad(n);
    setIsDeleteDialogOpen(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl text-gray-900 flex items-center gap-3">
              <AlertCircleIcon className="w-8 h-8 text-blue-600" />
              Gestión de Novedades
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Registra y gestiona novedades, incidencias y mejoras del equipo
            </p>
          </div>

          {/* Botón nueva novedad */}
          <Dialog open={isNewDialogOpen} onOpenChange={open => {
            setIsNewDialogOpen(open);
            if (!open) setForm(emptyForm);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nueva Novedad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Novedad</DialogTitle>
                <DialogDescription>
                  Completa el formulario para registrar una nueva novedad o incidencia.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="new-titulo">Título *</Label>
                  <Input
                    id="new-titulo"
                    placeholder="Breve descripción del problema o novedad..."
                    value={form.titulo}
                    onChange={e => setForm({ ...form, titulo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-descripcion">Descripción Detallada *</Label>
                  <Textarea
                    id="new-descripcion"
                    placeholder="Describe con detalle la situación, el problema o la mejora propuesta..."
                    value={form.descripcion_detallada}
                    onChange={e => setForm({ ...form, descripcion_detallada: e.target.value })}
                    rows={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-responsable">ID Empleado Responsable</Label>
                  <Input
                    id="new-responsable"
                    type="number"
                    min={1}
                    placeholder="ID del empleado responsable (opcional)..."
                    value={form.empleado_responsable}
                    onChange={e => setForm({ ...form, empleado_responsable: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => { setForm(emptyForm); setIsNewDialogOpen(false); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {submitting && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
                    Registrar Novedad
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Filtros ──────────────────────────────────────────────────────── */}
        <Card className="shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por título, responsable o descripción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="registrada">Registrada</SelectItem>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {filtered.length} novedad(es)
            </span>
          </div>
        </Card>

        {/* ── Tabla ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Título</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Responsable</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2Icon className="w-8 h-8 animate-spin" />
                        <p>Cargando novedades...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-gray-500">
                        <AlertCircleIcon className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-gray-900">No se encontraron novedades</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map(novedad => (
                    <tr key={novedad.id} className="hover:bg-gray-50 transition-colors">

                      {/* Título + registrado por */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {novedad.titulo}
                        </div>
                        <div className="text-xs text-gray-500">
                          {nombreCompleto(novedad.registradoPor)}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <Badge className={ESTADO_COLORS[novedad.estado] ?? 'bg-gray-100 text-gray-700'}>
                          {ESTADO_LABELS[novedad.estado] ?? novedad.estado}
                        </Badge>
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatFecha(novedad.fecha_registro)}
                      </td>

                      {/* Responsable */}
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {nombreCompleto(novedad.empleadoResponsable)}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">

                          {/* Ver siempre */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm"
                                onClick={() => openView(novedad)}
                                className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver detalles</p></TooltipContent>
                          </Tooltip>

                          {/* Solo si está en 'registrada' */}
                          {novedad.estado === 'registrada' && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm"
                                    onClick={() => openEdit(novedad)}
                                    className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                    <EditIcon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Editar novedad</p></TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm"
                                    onClick={() => handleCambiarEstado(novedad, 'aprobada')}
                                    className="text-green-700 border-green-700 hover:bg-green-50">
                                    <CheckIcon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Aprobar</p></TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm"
                                    onClick={() => handleCambiarEstado(novedad, 'rechazada')}
                                    className="text-red-700 border-red-700 hover:bg-red-50">
                                    <XIcon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Rechazar</p></TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm"
                                    onClick={() => openDelete(novedad)}
                                    className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Eliminar novedad</p></TooltipContent>
                              </Tooltip>
                            </>
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
          {!loading && filtered.length > ITEMS_PER_PAGE && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button key={page} variant={currentPage === page ? 'default' : 'ghost'} size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page
                    ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]'
                    : 'min-w-[32px]'}>
                  {currentPage === page ? page : '•'}
                </Button>
              ))}

              <Button variant="outline" size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Diálogo Ver ──────────────────────────────────────────────────── */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Novedad</DialogTitle>
              <DialogDescription>Información completa de la novedad registrada</DialogDescription>
            </DialogHeader>
            {selectedNovedad && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl text-gray-900">{selectedNovedad.titulo}</h2>
                  <Badge className={ESTADO_COLORS[selectedNovedad.estado]}>
                    {ESTADO_LABELS[selectedNovedad.estado]}
                  </Badge>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">Información General</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Empleado Responsable:</p>
                      <p className="text-gray-900 flex items-center gap-2 mt-1">
                        <UserIcon className="w-4 h-4" />
                        {nombreCompleto(selectedNovedad.empleadoResponsable)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registrado por:</p>
                      <p className="text-gray-900 mt-1">{nombreCompleto(selectedNovedad.registradoPor)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Registro:</p>
                      <p className="text-gray-900 flex items-center gap-2 mt-1">
                        <CalendarIcon className="w-4 h-4" />
                        {formatFecha(selectedNovedad.fecha_registro)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Descripción Detallada</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-line">
                      {selectedNovedad.descripcion_detallada}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Diálogo Editar ────────────────────────────────────────────────── */}
        <Dialog open={isEditDialogOpen} onOpenChange={open => {
          setIsEditDialogOpen(open);
          if (!open) { setForm(emptyForm); setSelectedNovedad(null); }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Novedad</DialogTitle>
              <DialogDescription>
                Solo puedes editar novedades en estado <strong>Registrada</strong>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-titulo">Título *</Label>
                <Input
                  id="edit-titulo"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-descripcion">Descripción Detallada *</Label>
                <Textarea
                  id="edit-descripcion"
                  rows={5}
                  value={form.descripcion_detallada}
                  onChange={e => setForm({ ...form, descripcion_detallada: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-responsable">ID Empleado Responsable</Label>
                <Input
                  id="edit-responsable"
                  type="number"
                  min={1}
                  value={form.empleado_responsable}
                  onChange={e => setForm({ ...form, empleado_responsable: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1"
                  onClick={() => { setForm(emptyForm); setIsEditDialogOpen(false); setSelectedNovedad(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {submitting && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
                  Actualizar Novedad
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Diálogo Eliminar ──────────────────────────────────────────────── */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta novedad?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La novedad será eliminada permanentemente.
                {selectedNovedad && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900">
                      <strong>Título:</strong> {selectedNovedad.titulo}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Responsable:</strong> {nombreCompleto(selectedNovedad.empleadoResponsable)}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedNovedad(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700">
                {submitting && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
