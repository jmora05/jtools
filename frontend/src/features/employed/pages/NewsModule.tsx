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
import { toast } from 'sonner';

import {
  getNovedades, createNovedad, updateNovedad, deleteNovedad, cambiarEstadoNovedad,
  type Novedad, type CreateNovedadDTO, type UpdateNovedadDTO,
} from '../services/novedadesService';

// ─── ID del empleado autenticado ──────────────────────────────────────────────
// Reemplaza con tu hook/contexto real: const { empleado } = useAuth();
const EMPLEADO_ACTUAL_ID = 1;

// ─── Helpers visuales ─────────────────────────────────────────────────────────

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

// ─── Tipos del formulario ────────────────────────────────────────────────────

interface FormValues {
  titulo: string;
  descripcion_detallada: string;
  empleado_responsable: string;
}

interface FormErrors {
  titulo?: string;
  descripcion_detallada?: string;
  empleado_responsable?: string;
}

const emptyForm: FormValues = {
  titulo: '',
  descripcion_detallada: '',
  empleado_responsable: '',
};

// ─── Validaciones ─────────────────────────────────────────────────────────────

function validateForm(values: FormValues, isEdit = false): FormErrors {
  const errors: FormErrors = {};

  // titulo
  const titulo = values.titulo.trim();
  if (!titulo) {
    errors.titulo = 'El título es obligatorio';
  } else if (titulo.length < 3) {
    errors.titulo = 'El título debe tener al menos 3 caracteres';
  } else if (titulo.length > 50) {
    errors.titulo = `El título no puede superar 50 caracteres (${titulo.length}/50)`;
  }

  // descripcion_detallada
  const desc = values.descripcion_detallada.trim();
  if (!desc) {
    errors.descripcion_detallada = 'La descripción es obligatoria';
  } else if (desc.length < 10) {
    errors.descripcion_detallada = 'La descripción debe tener al menos 10 caracteres';
  }

  // empleado_responsable (opcional)
  const resp = values.empleado_responsable.trim();
  if (resp !== '') {
    const num = Number(resp);
    if (!Number.isInteger(num) || num <= 0) {
      errors.empleado_responsable = 'Debe ser un número entero positivo';
    }
  }

  return errors;
}

// ─── Componente campo con error ───────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label className={error ? 'text-red-600' : ''}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error
        ? <p className="text-xs text-red-600 flex items-center gap-1"><XIcon className="w-3 h-3" />{error}</p>
        : hint
          ? <p className="text-xs text-gray-400">{hint}</p>
          : null
      }
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NewsModule() {

  // ── Datos ──────────────────────────────────────────────────────────────────
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

  // ── Formulario + errores ───────────────────────────────────────────────────
  const [form, setForm]       = useState<FormValues>(emptyForm);
  const [errors, setErrors]   = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});

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
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  // Revalidar en tiempo real cuando cambia el form
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validateForm(form));
    }
  }, [form, touched]);

  // ── Handlers de campo ─────────────────────────────────────────────────────
  const handleChange = (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  const handleBlur = (field: keyof FormValues) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validateForm(form));
  };

  // Restricción de longitud máxima en keydown para título
  const handleTituloKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (form.titulo.length >= 50 && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  // Solo números para el campo de responsable
  const handleResponsableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  // ── Reset formulario ───────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setTouched({});
  };

  // ── Filtrado ───────────────────────────────────────────────────────────────
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
    currentPage * ITEMS_PER_PAGE,
  );

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Marcar todos los campos como tocados para mostrar todos los errores
    setTouched({ titulo: true, descripcion_detallada: true, empleado_responsable: true });
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const dto: CreateNovedadDTO = {
        titulo:                form.titulo.trim(),
        descripcion_detallada: form.descripcion_detallada.trim(),
        registrado_por:        EMPLEADO_ACTUAL_ID,
        empleado_responsable:  form.empleado_responsable !== ''
                                 ? Number(form.empleado_responsable)
                                 : null,
      };
      const nueva = await createNovedad(dto);
      setNovedades(prev => [nueva, ...prev]);
      resetForm();
      setIsNewDialogOpen(false);
      toast.success('Novedad registrada exitosamente');
    } catch (err: any) {
      // Mostrar errores que devuelve el backend
      const msg = err.errores ? err.errores.join(', ') : (err.message ?? 'Error al crear la novedad');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ titulo: true, descripcion_detallada: true, empleado_responsable: true });
    const validationErrors = validateForm(form, true);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0 || !selectedNovedad) return;

    setSubmitting(true);
    try {
      const dto: UpdateNovedadDTO = {
        titulo:                form.titulo.trim(),
        descripcion_detallada: form.descripcion_detallada.trim(),
        empleado_responsable:  form.empleado_responsable !== ''
                                 ? Number(form.empleado_responsable)
                                 : null,
      };
      const updated = await updateNovedad(selectedNovedad.id, dto);
      setNovedades(prev => prev.map(n => n.id === updated.id ? updated : n));
      setIsEditDialogOpen(false);
      setSelectedNovedad(null);
      resetForm();
      toast.success('Novedad actualizada exitosamente');
    } catch (err: any) {
      const msg = err.errores ? err.errores.join(', ') : (err.message ?? 'Error al actualizar la novedad');
      toast.error(msg);
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

  const handleCambiarEstado = async (novedad: Novedad, estado: 'aprobada' | 'rechazada') => {
    try {
      const updated = await cambiarEstadoNovedad(novedad.id, estado);
      setNovedades(prev => prev.map(n => n.id === updated.id ? updated : n));
      toast.success(`Novedad ${ESTADO_LABELS[estado].toLowerCase()} correctamente`);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al cambiar el estado');
    }
  };

  // ── Abrir diálogos ─────────────────────────────────────────────────────────
  const openView = (n: Novedad) => { setSelectedNovedad(n); setIsViewDialogOpen(true); };

  const openEdit = (n: Novedad) => {
    setSelectedNovedad(n);
    setForm({
      titulo:                n.titulo,
      descripcion_detallada: n.descripcion_detallada,
      empleado_responsable:  n.empleado_responsable?.toString() ?? '',
    });
    resetForm();
    setForm({
      titulo:                n.titulo,
      descripcion_detallada: n.descripcion_detallada,
      empleado_responsable:  n.empleado_responsable?.toString() ?? '',
    });
    setIsEditDialogOpen(true);
  };

  const openDelete = (n: Novedad) => { setSelectedNovedad(n); setIsDeleteDialogOpen(true); };

  // ── Render del formulario (reutilizado en crear y editar) ──────────────────
  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>

      <Field
        label="Título"
        required
        error={touched.titulo ? errors.titulo : undefined}
        hint={!errors.titulo ? `${form.titulo.length}/50 caracteres` : undefined}
      >
        <Input
          value={form.titulo}
          onChange={handleChange('titulo')}
          onBlur={handleBlur('titulo')}
          onKeyDown={handleTituloKeyDown}
          placeholder="Breve descripción del problema o novedad..."
          maxLength={50}
          className={touched.titulo && errors.titulo ? 'border-red-400 focus-visible:ring-red-400' : ''}
        />
      </Field>

      <Field
        label="Descripción Detallada"
        required
        error={touched.descripcion_detallada ? errors.descripcion_detallada : undefined}
        hint={!errors.descripcion_detallada ? 'Mínimo 10 caracteres' : undefined}
      >
        <Textarea
          value={form.descripcion_detallada}
          onChange={handleChange('descripcion_detallada')}
          onBlur={handleBlur('descripcion_detallada')}
          placeholder="Describe con detalle la situación, el problema o la mejora propuesta..."
          rows={5}
          className={touched.descripcion_detallada && errors.descripcion_detallada ? 'border-red-400 focus-visible:ring-red-400' : ''}
        />
      </Field>

      <Field
        label="ID Empleado Responsable"
        error={touched.empleado_responsable ? errors.empleado_responsable : undefined}
        hint={!errors.empleado_responsable ? 'Opcional — solo números enteros positivos' : undefined}
      >
        <Input
          type="text"
          inputMode="numeric"
          value={form.empleado_responsable}
          onChange={handleChange('empleado_responsable')}
          onBlur={handleBlur('empleado_responsable')}
          onKeyDown={handleResponsableKeyDown}
          placeholder="Ej: 3"
          className={touched.empleado_responsable && errors.empleado_responsable ? 'border-red-400 focus-visible:ring-red-400' : ''}
        />
      </Field>

      <div className="flex gap-4 pt-2">
        <Button type="button" variant="outline" className="flex-1"
          onClick={() => {
            resetForm();
            setIsNewDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedNovedad(null);
          }}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {submitting && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen">

        {/* Header */}
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
            if (!open) resetForm();
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
              {renderForm(handleCreate, 'Registrar Novedad')}
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
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

        {/* Tabla */}
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
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {novedad.titulo}
                        </div>
                        <div className="text-xs text-gray-500">
                          {nombreCompleto(novedad.registradoPor)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={ESTADO_COLORS[novedad.estado] ?? 'bg-gray-100 text-gray-700'}>
                          {ESTADO_LABELS[novedad.estado] ?? novedad.estado}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatFecha(novedad.fecha_registro)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {nombreCompleto(novedad.empleadoResponsable)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">

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

        {/* Diálogo Ver */}
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

        {/* Diálogo Editar */}
        <Dialog open={isEditDialogOpen} onOpenChange={open => {
          setIsEditDialogOpen(open);
          if (!open) { resetForm(); setSelectedNovedad(null); }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Novedad</DialogTitle>
              <DialogDescription>
                Solo puedes editar novedades en estado <strong>Registrada</strong>.
              </DialogDescription>
            </DialogHeader>
            {renderForm(handleUpdate, 'Actualizar Novedad')}
          </DialogContent>
        </Dialog>

        {/* Diálogo Eliminar */}
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
              <AlertDialogCancel onClick={() => setSelectedNovedad(null)}>Cancelar</AlertDialogCancel>
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
