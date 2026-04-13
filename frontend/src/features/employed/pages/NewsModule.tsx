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
  ChevronLeftIcon, ChevronRightIcon, EyeIcon, UserIcon, Loader2Icon, XIcon, Lock, X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getNovedades, createNovedad, updateNovedad, deleteNovedad, cambiarEstadoNovedad,
  type Novedad, type CreateNovedadDTO, type UpdateNovedadDTO,
} from '../services/novedadesService';

// ─── ID del empleado autenticado ──────────────────────────────────────────────
const EMPLEADO_ACTUAL_ID = 1;

// ─── Helpers visuales ─────────────────────────────────────────────────────────

const ESTADO_COLORS: Record<string, string> = {
  registrada: 'bg-blue-100 text-blue-900 border-blue-200',
  aprobada:   'bg-blue-100 text-blue-900 border-blue-200',
  rechazada:  'bg-gray-100 text-gray-900 border-gray-200',
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

// ─── Lógica de permisos por estado ───────────────────────────────────────────

const canEdit   = (n: Novedad) => n.estado === 'registrada';
const canDelete = (n: Novedad) => n.estado === 'registrada';

const editBlockReason = (n: Novedad): string | null =>
  n.estado !== 'registrada'
    ? `No se puede editar: la novedad ya fue ${n.estado}`
    : null;

const deleteBlockReason = (n: Novedad): string | null =>
  n.estado !== 'registrada'
    ? `No se puede eliminar: la novedad ya fue ${n.estado}`
    : null;

// ─── Tipos del formulario ─────────────────────────────────────────────────────

interface FormValues {
  titulo: string;
  descripcion_detallada: string;
  empleado_responsable: string;
  empleado_afectado: string;
  estado: 'registrada' | 'aprobada' | 'rechazada';
}

interface FormErrors {
  titulo?: string;
  descripcion_detallada?: string;
  empleado_responsable?: string;
  empleado_afectado?: string;
}

const emptyForm: FormValues = {
  titulo: '',
  descripcion_detallada: '',
  empleado_responsable: '',
  empleado_afectado: '',
  estado: 'registrada',
};

// ─── Validaciones ─────────────────────────────────────────────────────────────

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const titulo = values.titulo.trim();
  if (!titulo) {
    errors.titulo = 'El título es obligatorio';
  } else if (titulo.length < 3) {
    errors.titulo = 'El título debe tener al menos 3 caracteres';
  } else if (titulo.length > 50) {
    errors.titulo = `El título no puede superar 50 caracteres (${titulo.length}/50)`;
  }

  const desc = values.descripcion_detallada.trim();
  if (!desc) {
    errors.descripcion_detallada = 'La descripción es obligatoria';
  } else if (desc.length < 10) {
    errors.descripcion_detallada = 'La descripción debe tener al menos 10 caracteres';
  }

  const resp = values.empleado_responsable.trim();
  if (resp !== '') {
    const num = Number(resp);
    if (!Number.isInteger(num) || num <= 0) {
      errors.empleado_responsable = 'Debe ser un número entero positivo';
    }
  }

  const afec = values.empleado_afectado.trim();
  if (afec !== '') {
    const num = Number(afec);
    if (!Number.isInteger(num) || num <= 0) {
      errors.empleado_afectado = 'Debe ser un número entero positivo';
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

  const [novedades, setNovedades]   = useState<Novedad[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [isNewDialogOpen,    setIsNewDialogOpen]    = useState(false);
  const [isEditDialogOpen,   setIsEditDialogOpen]   = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen,   setIsViewDialogOpen]   = useState(false);
  const [selectedNovedad,    setSelectedNovedad]    = useState<Novedad | null>(null);

  const [form, setForm]       = useState<FormValues>(emptyForm);
  const [errors, setErrors]   = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});

  // ─── Estado del banner inline ─────────────────────────────────────────────
  const [bannerNovedadId,  setBannerNovedadId]  = useState<number | null>(null);
  const [bannerAction,     setBannerAction]     = useState<'edit' | 'delete' | null>(null);

  const showRowBanner = (novedadId: number, action: 'edit' | 'delete') => {
    setBannerNovedadId(novedadId);
    setBannerAction(action);
  };

  const closeBanner = () => {
    setBannerNovedadId(null);
    setBannerAction(null);
  };

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

  const handleTituloKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (form.titulo.length >= 50 && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

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
      nombreCompleto(n.empleadoResponsable).toLowerCase().includes(q) ||
      nombreCompleto(n.empleadoAfectado).toLowerCase().includes(q);
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
    setTouched({ titulo: true, descripcion_detallada: true, empleado_responsable: true, empleado_afectado: true });
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const dto: CreateNovedadDTO = {
        titulo:                form.titulo.trim(),
        descripcion_detallada: form.descripcion_detallada.trim(),
        registrado_por:        EMPLEADO_ACTUAL_ID,
        empleado_responsable:  form.empleado_responsable !== '' ? Number(form.empleado_responsable) : null,
        empleado_afectado:     form.empleado_afectado !== '' ? Number(form.empleado_afectado) : null,
      };
      const nueva = await createNovedad(dto);
      setNovedades(prev => [nueva, ...prev]);
      resetForm();
      setIsNewDialogOpen(false);
      toast.success('Novedad registrada exitosamente');
    } catch (err: any) {
      const msg = err.errores ? err.errores.join(', ') : (err.message ?? 'Error al crear la novedad');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ titulo: true, descripcion_detallada: true, empleado_responsable: true, empleado_afectado: true });
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0 || !selectedNovedad) return;

    setSubmitting(true);
    try {
      const dto: UpdateNovedadDTO = {
        titulo:                form.titulo.trim(),
        descripcion_detallada: form.descripcion_detallada.trim(),
        empleado_responsable:  form.empleado_responsable !== '' ? Number(form.empleado_responsable) : null,
        empleado_afectado:     form.empleado_afectado !== '' ? Number(form.empleado_afectado) : null,
      };
      let updated = await updateNovedad(selectedNovedad.id, dto);

      if (form.estado !== selectedNovedad.estado) {
        updated = await cambiarEstadoNovedad(selectedNovedad.id, form.estado);
      }

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

  // ── Abrir diálogos ─────────────────────────────────────────────────────────
  const openView = (n: Novedad) => { setSelectedNovedad(n); setIsViewDialogOpen(true); };

  const openEdit = (n: Novedad) => {
    setSelectedNovedad(n);
    resetForm();
    setForm({
      titulo:                n.titulo,
      descripcion_detallada: n.descripcion_detallada,
      empleado_responsable:  n.empleado_responsable?.toString() ?? '',
      empleado_afectado:     n.empleado_afectado?.toString() ?? '',
      estado:                n.estado,
    });
    setIsEditDialogOpen(true);
  };

  const openDelete = (n: Novedad) => { setSelectedNovedad(n); setIsDeleteDialogOpen(true); };

  // ── Render del formulario ──────────────────────────────────────────────────
  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string, isEdit = false) => (
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
          onKeyDown={handleNumericKeyDown}
          placeholder="Ej: 3"
          className={touched.empleado_responsable && errors.empleado_responsable ? 'border-red-400 focus-visible:ring-red-400' : ''}
        />
      </Field>

      <Field
        label="ID Empleado Afectado"
        error={touched.empleado_afectado ? errors.empleado_afectado : undefined}
        hint={!errors.empleado_afectado ? 'Opcional — solo números enteros positivos' : undefined}
      >
        <Input
          type="text"
          inputMode="numeric"
          value={form.empleado_afectado}
          onChange={handleChange('empleado_afectado')}
          onBlur={handleBlur('empleado_afectado')}
          onKeyDown={handleNumericKeyDown}
          placeholder="Ej: 5"
          className={touched.empleado_afectado && errors.empleado_afectado ? 'border-red-400 focus-visible:ring-red-400' : ''}
        />
      </Field>

      {isEdit && (
        <Field label="Estado">
          <Select
            value={form.estado}
            onValueChange={(value: 'registrada' | 'aprobada' | 'rechazada') =>
              setForm(prev => ({ ...prev, estado: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="registrada">Registrada</SelectItem>
              <SelectItem value="aprobada">Aprobada</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

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
            <h1 className="text-2xl text-blue-900 font-bold mb-2 flex items-center gap-2">
              <AlertCircleIcon className="w-8 h-8 text-blue-900" />
              Gestión de Novedades
            </h1>
            <p className="text-sm text-blue-900 mt-1">
              Registra y gestiona novedades, incidencias y mejoras del equipo
            </p>
          </div>

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
                placeholder="Buscar por título, responsable, afectado o descripción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-52">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
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
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Afectado</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2Icon className="w-8 h-8 animate-spin" />
                        <p>Cargando novedades...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-gray-500">
                        <AlertCircleIcon className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-gray-900">No se encontraron novedades</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map(novedad => (
                    <React.Fragment key={novedad.id}>
                      <tr className="hover:bg-gray-50 transition-colors">

                        {/* Título */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {novedad.titulo}
                          </div>
                          <div className="text-xs text-gray-500">
                            Por: {nombreCompleto(novedad.registradoPor)}
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

                        {/* Afectado */}
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {nombreCompleto(novedad.empleadoAfectado)}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">

                            {/* Ver — siempre activo */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => openView(novedad)}
                                  className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                  <EyeIcon className="w-4 h-4 text-blue-900" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver detalles</p></TooltipContent>
                            </Tooltip>

                            {/* Editar */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (!canEdit(novedad)) {
                                      showRowBanner(novedad.id, 'edit');
                                      return;
                                    }
                                    closeBanner();
                                    openEdit(novedad);
                                  }}
                                  className={`border-blue-900 transition-opacity ${
                                    canEdit(novedad)
                                      ? 'text-blue-900 hover:bg-blue-50'
                                      : 'opacity-40 cursor-not-allowed text-gray-400 border-gray-300'
                                  }`}
                                >
                                  <EditIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{canEdit(novedad) ? 'Editar novedad' : editBlockReason(novedad)}</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* Eliminar */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (!canDelete(novedad)) {
                                      showRowBanner(novedad.id, 'delete');
                                      return;
                                    }
                                    closeBanner();
                                    openDelete(novedad);
                                  }}
                                  className={`border-blue-900 transition-opacity ${
                                    canDelete(novedad)
                                      ? 'text-blue-900 hover:bg-blue-50'
                                      : 'opacity-40 cursor-not-allowed text-gray-400 border-gray-300'
                                  }`}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{canDelete(novedad) ? 'Eliminar novedad' : deleteBlockReason(novedad)}</p>
                              </TooltipContent>
                            </Tooltip>

                          </div>
                        </td>
                      </tr>

                      {/* ── Banner inline por fila ── */}
                      {bannerNovedadId === novedad.id && (
                        <tr className="border-b border-amber-100">
                          <td colSpan={6} className="px-6 py-0">
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>
                                <strong>Novedad bloqueada:</strong>{' '}
                                {bannerAction === 'edit'
                                  ? `No puedes editar esta novedad porque ya fue ${novedades.find(n => n.id === bannerNovedadId)?.estado}.`
                                  : `No puedes eliminar esta novedad porque ya fue ${novedades.find(n => n.id === bannerNovedadId)?.estado}.`}
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
       {/* Diálogo Ver */}
<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible p-0">
    <div className="overflow-y-auto max-h-[90vh] p-6">
      <DialogHeader>
        <DialogTitle>Detalles de la Novedad</DialogTitle>
        <DialogDescription>Información completa de la novedad registrada</DialogDescription>
      </DialogHeader>

      {selectedNovedad && (
        <div className="space-y-4 mt-4">

          {/* Bloque principal */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">

            {/* Título + estado */}
            <div className="col-span-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <AlertCircleIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-lg leading-tight">
                  {selectedNovedad.titulo}
                </p>
                <Badge className={`mt-1 ${ESTADO_COLORS[selectedNovedad.estado]}`}>
                  {ESTADO_LABELS[selectedNovedad.estado]}
                </Badge>
              </div>
            </div>

            {/* Registrado por */}
            <div>
              <p className="text-xs text-gray-500">Registrado por</p>
              <p className="font-semibold text-sm mt-0.5">
                {nombreCompleto(selectedNovedad.registradoPor)}
              </p>
            </div>

            {/* Fecha */}
            <div>
              <p className="text-xs text-gray-500">Fecha de registro</p>
              <p className="font-semibold text-sm mt-0.5 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                {formatFecha(selectedNovedad.fecha_registro)}
              </p>
            </div>

            {/* Responsable */}
            <div>
              <p className="text-xs text-gray-500">Empleado responsable</p>
              <p className="font-semibold text-sm mt-0.5 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                {nombreCompleto(selectedNovedad.empleadoResponsable)}
              </p>
            </div>

            {/* Afectado */}
            <div>
              <p className="text-xs text-gray-500">Empleado afectado</p>
              <p className="font-semibold text-sm mt-0.5 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                {nombreCompleto(selectedNovedad.empleadoAfectado)}
              </p>
            </div>

            {/* Descripción — ancho completo */}
            <div className="col-span-2">
              <p className="text-xs text-gray-500">Descripción detallada</p>
              <p className="font-semibold text-sm mt-0.5 whitespace-pre-line text-gray-700 leading-relaxed">
                {selectedNovedad.descripcion_detallada}
              </p>
            </div>

          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
            {selectedNovedad.estado === 'registrada' && (
              <Button
                onClick={() => { openEdit(selectedNovedad); setIsViewDialogOpen(false); }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Editar Novedad
              </Button>
            )}
          </div>

        </div>
      )}
    </div>
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
                Modifica los datos de la novedad y cambia su estado si es necesario.
              </DialogDescription>
            </DialogHeader>
            {renderForm(handleUpdate, 'Actualizar Novedad', true)}
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
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Afectado:</strong> {nombreCompleto(selectedNovedad.empleadoAfectado)}
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