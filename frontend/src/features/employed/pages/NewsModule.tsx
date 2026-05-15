// Novedades empleados - Gestión de incidencias, mejoras y novedades del equipo
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  PlusIcon, EditIcon, TrashIcon, CalendarIcon, AlertCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, EyeIcon, UserIcon, Loader2Icon, XIcon, Lock, X,
  SearchIcon, CheckIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getNovedades, createNovedad, updateNovedad, deleteNovedad, cambiarEstadoNovedad,
  type Novedad, type CreateNovedadDTO, type UpdateNovedadDTO, type EstadoNovedad,
} from '../services/novedadesService';

import { getEmpleados, desactivarEmpleado, reactivarEmpleado } from '../services/empleadosService';
import {
  getHorasExtra, createHoraExtra, updateHoraExtra, deleteHoraExtra, cambiarEstadoHoraExtra,
  type HoraExtra, type CreateHoraExtraDTO, type UpdateHoraExtraDTO,
} from '../services/horasExtraService';

// ─── Helpers visuales ─────────────────────────────────────────────────────────

const ESTADO_SELECT_CLASSES: Record<string, string> = {
  registrada:                'border-blue-300 bg-blue-50 text-blue-900',
  aprobada_remunera:         'border-green-300 bg-green-50 text-green-900',
  aprobada_sin_remuneracion: 'border-amber-300 bg-amber-50 text-amber-900',
  rechazada:                 'border-red-300 bg-red-50 text-red-900',
};

const ESTADO_COLORS: Record<string, string> = {
  registrada:                'bg-blue-100 text-blue-900 border-blue-200',
  aprobada_remunera:         'bg-green-100 text-green-900 border-green-200',
  aprobada_sin_remuneracion: 'bg-amber-100 text-amber-900 border-amber-200',
  rechazada:                 'bg-red-100 text-red-900 border-red-200',
};

const ESTADO_LABELS: Record<string, string> = {
  registrada:                'Registrada',
  aprobada_remunera:         'Aprobada con Remuneración',
  aprobada_sin_remuneracion: 'Aprobada sin Remuneración',
  rechazada:                 'Rechazada',
};

const nombreCompleto = (emp?: { nombres: string; apellidos: string } | null) =>
  emp ? `${emp.nombres} ${emp.apellidos}` : '—';

const formatFecha = (fecha?: string) =>
  fecha ? fecha.split('T')[0] : '—';

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const getTodayString = () => new Date().toISOString().split('T')[0];

const getMinFechaFin = (fechaInicio: string) => {
  if (!fechaInicio) return getTodayString();
  return fechaInicio;
};

// ─── Lógica de permisos por estado ───────────────────────────────────────────

const canEdit   = (n: Novedad) => n.estado === 'registrada';
const canDelete = (n: Novedad) => n.estado === 'registrada';

const editBlockReason   = (n: Novedad) => n.estado !== 'registrada' ? `No se puede editar: la novedad está ${ESTADO_LABELS[n.estado]?.toLowerCase() ?? n.estado}` : null;
const deleteBlockReason = (n: Novedad) => n.estado !== 'registrada' ? `No se puede eliminar: la novedad está ${ESTADO_LABELS[n.estado]?.toLowerCase() ?? n.estado}` : null;

// ─── Tipos del formulario ─────────────────────────────────────────────────────

interface EmpleadoSeleccionado {
  id: number;
  nombres: string;
  apellidos: string;
  cargo: string;
}

interface FormValues {
  titulo: string;
  descripcion_detallada: string;
  fecha_inicio: string;
  fecha_finalizacion: string;
  empleado_afectado: EmpleadoSeleccionado | null;
  estado: 'registrada' | 'aprobada_remunera' | 'aprobada_sin_remuneracion' | 'rechazada';
  horas_ausencia: string;
}

interface FormErrors {
  titulo?: string;
  descripcion_detallada?: string;
  empleado_afectado?: string;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  horas_ausencia?: string;
}

const emptyForm: FormValues = {
  titulo: '',
  descripcion_detallada: '',
  fecha_inicio: '',
  fecha_finalizacion: '',
  empleado_afectado: null,
  estado: 'registrada',
  horas_ausencia: '',
};

// ─── Validaciones ─────────────────────────────────────────────────────────────

function validateForm(values: FormValues, isEdit = false): FormErrors {
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

  if (!isEdit && values.fecha_inicio) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inicio = new Date(values.fecha_inicio + 'T00:00:00');
    if (inicio < today) {
      errors.fecha_inicio = 'La fecha de inicio no puede ser anterior al día de hoy';
    }
  }

  if (values.horas_ausencia !== '') {
    const h = parseFloat(values.horas_ausencia);
    if (!isNaN(h) && h > 0 && h < 0.5) {
      errors.horas_ausencia = 'El mínimo es 30 minutos (0.5 h)';
    }
  }

  if (values.fecha_finalizacion && values.fecha_inicio) {
    const inicio = new Date(values.fecha_inicio + 'T00:00:00');
    const fin    = new Date(values.fecha_finalizacion + 'T00:00:00');
    if (fin < inicio) {
      errors.fecha_finalizacion = 'La fecha de finalización no puede ser anterior a la fecha de inicio';
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

// ─── Componente Autocomplete de Empleados ─────────────────────────────────────

interface EmpleadoAutocompleteProps {
  label: string;
  value: EmpleadoSeleccionado | null;
  onChange: (emp: EmpleadoSeleccionado | null) => void;
  allEmpleados: EmpleadoSeleccionado[];
  loadingEmpleados: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  placeholder?: string;
}

function EmpleadoAutocomplete({
  label, value, onChange, allEmpleados, loadingEmpleados,
  error, hint, disabled, placeholder = 'Buscar empleado por nombre...',
}: EmpleadoAutocompleteProps) {
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef            = useRef<HTMLDivElement>(null);
  const prevValueIdRef        = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const prevId = prevValueIdRef.current;
    const currId = value?.id ?? null;
    if (prevId !== currId) {
      prevValueIdRef.current = currId;
      if (value) setQuery(nombreCompleto(value));
      else setQuery('');
    }
  }, [value]);

  const filtered = query.trim().length === 0
    ? allEmpleados.slice(0, 8)
    : allEmpleados.filter(e =>
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(query.toLowerCase()) ||
        e.cargo?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

  const handleSelect = (emp: EmpleadoSeleccionado) => {
    onChange(emp);
    setQuery(nombreCompleto(emp));
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setOpen(false);
  };

  return (
    <Field label={label} error={error} hint={hint}>
      <div ref={wrapperRef} className="relative">
        <div className={`relative flex items-center border rounded-md transition-colors ${
          error
            ? 'border-red-400 focus-within:ring-1 focus-within:ring-red-400'
            : focused
              ? 'border-blue-500 ring-1 ring-blue-500'
              : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
          <SearchIcon className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
          <input
            type="text"
            value={query}
            disabled={disabled}
            placeholder={disabled ? '' : placeholder}
            className="flex-1 px-2 py-2 text-sm bg-transparent outline-none placeholder:text-gray-400"
            onChange={e => {
              setQuery(e.target.value);
              onChange(null);
              setOpen(true);
            }}
            onFocus={() => { setFocused(true); setOpen(true); }}
          />
          {value && !disabled && (
            <button type="button" onClick={handleClear} className="p-2 text-gray-400 hover:text-gray-600">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {value && (
            <CheckIcon className="w-4 h-4 text-green-500 mr-2 shrink-0" />
          )}
        </div>

        {open && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {loadingEmpleados ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                <Loader2Icon className="w-4 h-4 animate-spin" />
                Cargando empleados...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                No se encontraron empleados
              </div>
            ) : (
              <ul className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                {filtered.map(emp => (
                  <li key={emp.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(emp)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                        value?.id === emp.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-blue-700">
                          {emp.nombres[0]}{emp.apellidos[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.nombres} {emp.apellidos}</p>
                        {emp.cargo && <p className="text-xs text-gray-500">{emp.cargo}</p>}
                      </div>
                      {value?.id === emp.id && (
                        <CheckIcon className="w-4 h-4 text-blue-600 ml-auto" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NewsModule() {

  const [novedades, setNovedades]   = useState<Novedad[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [allEmpleados, setAllEmpleados]         = useState<EmpleadoSeleccionado[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

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
  const [isEditMode, setIsEditMode] = useState(false);

  const [bannerNovedadId, setBannerNovedadId] = useState<number | null>(null);
  const [bannerAction,    setBannerAction]    = useState<'edit' | 'delete' | null>(null);
  const [togglingIds,     setTogglingIds]     = useState<Set<number>>(new Set());
  const [activeView,      setActiveView]      = useState<'ausencias' | 'horas-extra'>('ausencias');
  const [heIsNewOpen,     setHeIsNewOpen]     = useState(false);

  const showRowBanner = (id: number, action: 'edit' | 'delete') => { setBannerNovedadId(id); setBannerAction(action); };
  const closeBanner   = () => { setBannerNovedadId(null); setBannerAction(null); };

  const handleCambiarEstado = async (novedad: Novedad, nuevoEstado: EstadoNovedad) => {
    if (novedad.estado === nuevoEstado) return;
    setNovedades(prev => prev.map(n => n.id === novedad.id ? { ...n, estado: nuevoEstado } : n));
    setTogglingIds(prev => new Set(prev).add(novedad.id));
    try {
      const updated = await cambiarEstadoNovedad(novedad.id, nuevoEstado);
      setNovedades(prev => prev.map(n => n.id === updated.id ? updated : n));

      const esAprobada = nuevoEstado === 'aprobada_remunera' || nuevoEstado === 'aprobada_sin_remuneracion';
      if (esAprobada && novedad.empleado_afectado) {
        try {
          await reactivarEmpleado(novedad.empleado_afectado);
          setAllEmpleados(prev => {
            const yaExiste = prev.some(e => e.id === novedad.empleado_afectado);
            if (yaExiste) return prev;
            const emp = novedad.empleadoAfectado;
            return emp
              ? [...prev, { id: emp.id, nombres: emp.nombres, apellidos: emp.apellidos, cargo: emp.cargo }]
              : prev;
          });
        } catch {
          // si ya estaba activo no es error crítico
        }
      }

      toast.success('Estado actualizado exitosamente');
    } catch (err: any) {
      setNovedades(prev => prev.map(n => n.id === novedad.id ? { ...n, estado: novedad.estado } : n));
      toast.error(err.message ?? 'Error al cambiar el estado');
    } finally {
      setTogglingIds(prev => { const next = new Set(prev); next.delete(novedad.id); return next; });
    }
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

  const fetchEmpleados = useCallback(async () => {
    setLoadingEmpleados(true);
    try {
      const data = await getEmpleados();
      const activos = data.filter((e: any) => e.estado !== 'inactivo');
      setAllEmpleados(
        activos.map((e: any) => ({
          id:        e.id,
          nombres:   e.nombres,
          apellidos: e.apellidos,
          cargo:     e.cargo ?? '',
        }))
      );
    } catch (err: any) {
      toast.error('No se pudo cargar la lista de empleados');
    } finally {
      setLoadingEmpleados(false);
    }
  }, []);

  useEffect(() => { fetchNovedades(); fetchEmpleados(); }, [fetchNovedades, fetchEmpleados]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);
  useEffect(() => {
    if (Object.keys(touched).length > 0) setErrors(validateForm(form, isEditMode));
  }, [form, touched, isEditMode]);

  // ── Helpers de form ────────────────────────────────────────────────────────
  const handleChange = (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  const handleBlur = (field: keyof FormValues) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validateForm(form, isEditMode));
  };

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    setForm(prev => ({ ...prev, titulo: soloLetras }));
  };

  const handleTituloKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (form.titulo.length >= 50) { e.preventDefault(); return; }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]$/.test(e.key)) e.preventDefault();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setTouched({});
    setIsEditMode(false);
  };

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtered = novedades.filter(n => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      n.titulo.toLowerCase().includes(q) ||
      n.descripcion_detallada.toLowerCase().includes(q) ||
      nombreCompleto(n.empleadoAfectado).toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || n.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ titulo: true, descripcion_detallada: true, fecha_inicio: true, fecha_finalizacion: true });
    const validationErrors = validateForm(form, false);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const dto: CreateNovedadDTO = {
        titulo:                form.titulo.trim(),
        descripcion_detallada: form.descripcion_detallada.trim(),
        fecha_inicio:          form.fecha_inicio,
        fecha_finalizacion:    form.fecha_finalizacion,
        empleado_afectado:     form.empleado_afectado?.id ?? null,
        horas_ausencia:        form.horas_ausencia ? parseFloat(form.horas_ausencia) : null,
      };

      const nueva = await createNovedad(dto);
      setNovedades(prev => [nueva, ...prev]);

      if (dto.empleado_afectado) {
        await desactivarEmpleado(dto.empleado_afectado);
        setAllEmpleados(prev => prev.filter(e => e.id !== dto.empleado_afectado));
      }

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
    if (!selectedNovedad) return;

    const soloEstado = selectedNovedad.estado !== 'registrada';

    if (!soloEstado) {
      setTouched({ titulo: true, descripcion_detallada: true, fecha_inicio: true, fecha_finalizacion: true });
      const validationErrors = validateForm(form, true);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;
    }

    setSubmitting(true);
    try {
      let updated: Novedad = selectedNovedad;

      if (!soloEstado) {
        const dto: UpdateNovedadDTO = {
          titulo:                form.titulo.trim(),
          descripcion_detallada: form.descripcion_detallada.trim(),
          fecha_inicio:          form.fecha_inicio,
          fecha_finalizacion:    form.fecha_finalizacion,
          empleado_afectado:     form.empleado_afectado?.id ?? null,
          horas_ausencia:        form.horas_ausencia ? parseFloat(form.horas_ausencia) : null,
        };

        updated = await updateNovedad(selectedNovedad.id, dto);
      }

      const estadoCambioAAprobada = form.estado !== selectedNovedad.estado &&
        (form.estado === 'aprobada_remunera' || form.estado === 'aprobada_sin_remuneracion');

      if (form.estado !== selectedNovedad.estado) {
        updated = await cambiarEstadoNovedad(selectedNovedad.id, form.estado);
      }

      if (estadoCambioAAprobada && updated.empleado_afectado) {
        try {
          await reactivarEmpleado(updated.empleado_afectado);
          setAllEmpleados(prev => {
            const yaExiste = prev.some(e => e.id === updated.empleado_afectado);
            if (yaExiste) return prev;
            const emp = updated.empleadoAfectado;
            return emp
              ? [...prev, { id: emp.id, nombres: emp.nombres, apellidos: emp.apellidos, cargo: emp.cargo }]
              : prev;
          });
        } catch {
          // si ya estaba activo no es error crítico
        }
      }

      setNovedades(prev => prev.map(n => n.id === updated.id ? updated : n));
      setSelectedNovedad(updated);

      setIsEditDialogOpen(false);
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
    setIsEditMode(true);

    const resolveEmpleado = (
      idFK: number | null | undefined,
      nested: { id: number; nombres: string; apellidos: string; cargo: string } | null | undefined
    ): EmpleadoSeleccionado | null => {
      if (!idFK && !nested) return null;
      const fromList = allEmpleados.find(e => e.id === (idFK ?? nested?.id));
      if (fromList) return fromList;
      if (nested) return { id: nested.id, nombres: nested.nombres, apellidos: nested.apellidos, cargo: nested.cargo ?? '' };
      return null;
    };

    setSelectedNovedad(n);
    resetForm();

    setForm({
      titulo:                n.titulo,
      descripcion_detallada: n.descripcion_detallada,
      fecha_inicio:          n.fecha_inicio      ? n.fecha_inicio.split('T')[0]      : '',
      fecha_finalizacion:    n.fecha_finalizacion ? n.fecha_finalizacion.split('T')[0] : '',
      empleado_afectado:     resolveEmpleado(n.empleado_afectado, n.empleadoAfectado),
      estado:                n.estado,
      horas_ausencia:        n.horas_ausencia != null ? String(n.horas_ausencia) : '',
    });

    setIsEditMode(true);
    setIsEditDialogOpen(true);
  };

  const openDelete = (n: Novedad) => { setSelectedNovedad(n); setIsDeleteDialogOpen(true); };

  const handleOpenNew = (open: boolean) => {
    setIsNewDialogOpen(open);
    if (open) {
      resetForm();
    } else {
      resetForm();
    }
  };

  // ── Render del formulario ──────────────────────────────────────────────────
  const renderForm = (
    onSubmit: (e: React.FormEvent) => void,
    submitLabel: string,
    isEdit = false
  ) => {
    const bloqueado = isEdit && selectedNovedad?.estado !== 'registrada';
    return (
    <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column' }}>

      {bloqueado && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          <Lock className="w-4 h-4 shrink-0 text-amber-500" />
          Esta novedad está <strong className="mx-1">{ESTADO_LABELS[form.estado]}</strong> — solo puedes modificar el estado.
        </div>
      )}

      {/* ── Cuerpo en dos columnas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>

        {/* COLUMNA IZQUIERDA — Título + Descripción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field
            label="Título"
            required={!bloqueado}
            error={touched.titulo ? errors.titulo : undefined}
            hint={!errors.titulo && !bloqueado ? `${form.titulo.length}/50 caracteres` : undefined}
          >
            <Input
              value={form.titulo}
              onChange={handleTituloChange}
              onBlur={handleBlur('titulo')}
              onKeyDown={handleTituloKeyDown}
              placeholder="Breve descripción del problema o novedad..."
              maxLength={50}
              disabled={bloqueado}
              className={`${bloqueado ? 'bg-gray-100 opacity-70' : ''} ${touched.titulo && errors.titulo ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            />
          </Field>

          <Field
            label="Descripción Detallada"
            required={!bloqueado}
            error={touched.descripcion_detallada ? errors.descripcion_detallada : undefined}
            hint={!errors.descripcion_detallada && !bloqueado ? 'Mínimo 10 caracteres' : undefined}
          >
            <Textarea
              value={form.descripcion_detallada}
              onChange={handleChange('descripcion_detallada')}
              onBlur={handleBlur('descripcion_detallada')}
              placeholder="Describe con detalle la situación, el problema o la mejora propuesta..."
              rows={10}
              disabled={bloqueado}
              className={`resize-none h-full min-h-[200px] ${bloqueado ? 'bg-gray-100 opacity-70' : ''} ${touched.descripcion_detallada && errors.descripcion_detallada ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            />
          </Field>
        </div>

        {/* COLUMNA DERECHA — Fechas + Empleado + Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, borderLeft: '1px solid #e5e7eb', paddingLeft: 32 }}>

          <Field
            label="Fecha de inicio"
            required={!bloqueado}
            error={touched.fecha_inicio ? errors.fecha_inicio : undefined}
          >
            <Input
              type="date"
              value={form.fecha_inicio}
              min={isEdit ? undefined : getTodayString()}
              onChange={handleChange('fecha_inicio')}
              onBlur={handleBlur('fecha_inicio')}
              disabled={bloqueado}
              className={`${bloqueado ? 'bg-gray-100 opacity-70' : ''} ${touched.fecha_inicio && errors.fecha_inicio ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            />
          </Field>

          <Field
            label="Fecha de finalización"
            required={!bloqueado}
            error={touched.fecha_finalizacion ? errors.fecha_finalizacion : undefined}
          >
            <Input
              type="date"
              value={form.fecha_finalizacion}
              min={getMinFechaFin(form.fecha_inicio)}
              onChange={e => {
                handleChange('fecha_finalizacion')(e);
                setTouched(prev => ({ ...prev, fecha_finalizacion: true }));
              }}
              onBlur={handleBlur('fecha_finalizacion')}
              disabled={bloqueado}
              className={`${bloqueado ? 'bg-gray-100 opacity-70' : ''} ${touched.fecha_finalizacion && errors.fecha_finalizacion ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            />
          </Field>

          <EmpleadoAutocomplete
            label="Empleado Afectado"
            value={form.empleado_afectado}
            onChange={emp => setForm(prev => ({ ...prev, empleado_afectado: emp }))}
            allEmpleados={allEmpleados}
            loadingEmpleados={loadingEmpleados}
            hint={bloqueado ? undefined : 'Opcional — busca por nombre o cargo'}
            placeholder="Buscar empleado afectado..."
            disabled={bloqueado}
          />

          <Field
            label="Horas de Ausencia"
            error={errors.horas_ausencia}
            hint={!errors.horas_ausencia && !bloqueado ? 'Opcional — mínimo 30 minutos (0.5 h)' : undefined}
          >
            <Input
              type="number"
              min="0.5"
              max="744"
              step="0.5"
              value={form.horas_ausencia}
              onChange={e => {
                setForm(prev => ({ ...prev, horas_ausencia: e.target.value }));
                setTouched(prev => ({ ...prev, horas_ausencia: true }));
              }}
              onBlur={handleBlur('horas_ausencia')}
              placeholder="Ej: 8"
              disabled={bloqueado}
              className={`${bloqueado ? 'bg-gray-100 opacity-70' : ''} ${errors.horas_ausencia ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
            />
          </Field>

          {isEdit && (
            <div className="border-t border-gray-200 pt-4">
              <Field label="Estado">
                <select
                  value={form.estado}
                  onChange={e => setForm(prev => ({ ...prev, estado: e.target.value as FormValues['estado'] }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="registrada">Registrada</option>
                  <option value="aprobada_remunera">Aprobada con Remuneración</option>
                  <option value="aprobada_sin_remuneracion">Aprobada sin Remuneración</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex gap-4 pt-3 mt-3 border-t border-gray-200">
        <Button type="button" variant="outline" className="flex-1"
          onClick={() => {
            resetForm();
            setIsNewDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedNovedad(null);
          }}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
          {submitting && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
    );
  };

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

          {activeView === 'ausencias' && (
            <Dialog open={isNewDialogOpen} onOpenChange={handleOpenNew}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nueva Novedad
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 gap-0 overflow-hidden" style={{ width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
                <div className="overflow-y-auto flex-1 p-6">
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Novedad</DialogTitle>
                  <DialogDescription>
                    Completa el formulario para registrar una nueva novedad o incidencia.
                  </DialogDescription>
                </DialogHeader>
                {renderForm(handleCreate, 'Registrar Novedad', false)}
                </div>
              </DialogContent>
            </Dialog>
          )}
          {activeView === 'horas-extra' && (
            <Button className="bg-blue-600 hover:bg-blue-700" size="lg" onClick={() => setHeIsNewOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nuevo Registro
            </Button>
          )}
        </div>

        {/* Navegación de vistas */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-200 w-fit shadow-sm">
          <button
            onClick={() => setActiveView('ausencias')}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'ausencias'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <AlertCircleIcon className="w-4 h-4" />
            Ausencias
          </button>
          <button
            onClick={() => setActiveView('horas-extra')}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'horas-extra'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Horas Extra / Recargos
          </button>
        </div>

        {activeView === 'ausencias' && (<>
        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">

              <div className="relative w-full sm:flex-[3]">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <Input
                  placeholder="Buscar por título, responsable, afectado o descripción..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10 w-full"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-1/4 sm:w-56 sm:flex-[1]"
              >
                <option value="all">Todos los estados</option>
                <option value="registrada">Registrada</option>
                <option value="aprobada_remunera">Aprobada con Remuneración</option>
                <option value="aprobada_sin_remuneracion">Aprobada sin Remuneración</option>
                <option value="rechazada">Rechazada</option>
              </select>

            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Título</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Afectado</th>                 
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Estado</th>
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
                    <React.Fragment key={novedad.id}>
                      <tr className="hover:bg-gray-50 transition-colors">

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{novedad.titulo}</div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900">{nombreCompleto(novedad.empleadoAfectado)}</td>
                        
                        <td className="px-6 py-4 text-sm text-gray-900">{formatFecha(novedad.fecha_registro)}</td>
                        
                        <td className="px-6 py-4">
                          <div className="relative inline-flex items-center">
                            <select
                              value={novedad.estado}
                              onChange={e => handleCambiarEstado(novedad, e.target.value as EstadoNovedad)}
                              disabled={togglingIds.has(novedad.id)}
                              className={`border rounded-md px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 pr-7 ${ESTADO_SELECT_CLASSES[novedad.estado] ?? 'border-gray-300 bg-white text-gray-700'} ${togglingIds.has(novedad.id) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <option value="registrada">Registrada</option>
                              <option value="aprobada_remunera">Aprobada con Remuneración</option>
                              <option value="aprobada_sin_remuneracion">Aprobada sin Remuneración</option>
                              <option value="rechazada">Rechazada</option>
                            </select>
                            {togglingIds.has(novedad.id) && (
                              <Loader2Icon className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-gray-500 pointer-events-none" />
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => openView(novedad)}
                                  className="text-blue-900 border-blue-900 hover:bg-blue-50">
                                  <EyeIcon className="w-4 h-4 text-blue-900" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver detalles</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => {
                                    if (!canEdit(novedad)) { showRowBanner(novedad.id, 'edit'); return; }
                                    closeBanner(); openEdit(novedad);
                                  }}
                                  className={`border-blue-900 transition-opacity ${canEdit(novedad) ? 'text-blue-900 hover:bg-blue-50' : 'opacity-40 cursor-not-allowed text-gray-400 border-gray-300'}`}>
                                  <EditIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>{canEdit(novedad) ? 'Editar novedad' : editBlockReason(novedad)}</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                  onClick={() => {
                                    if (!canDelete(novedad)) { showRowBanner(novedad.id, 'delete'); return; }
                                    closeBanner(); openDelete(novedad);
                                  }}
                                  className={`border-blue-900 transition-opacity ${canDelete(novedad) ? 'text-blue-900 hover:bg-blue-50' : 'opacity-40 cursor-not-allowed text-gray-400 border-gray-300'}`}>
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>{canDelete(novedad) ? 'Eliminar novedad' : deleteBlockReason(novedad)}</p></TooltipContent>
                            </Tooltip>

                          </div>
                        </td>
                      </tr>

                      {bannerNovedadId === novedad.id && (
                        <tr className="border-b border-amber-100">
                          <td colSpan={5} className="px-6 py-0">
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>
                                <strong>Novedad bloqueada:</strong>{' '}
                                {bannerAction === 'edit'
                                  ? `No puedes editar esta novedad porque está ${ESTADO_LABELS[novedades.find(n => n.id === bannerNovedadId)?.estado ?? ''] ?? novedades.find(n => n.id === bannerNovedadId)?.estado}.`
                                  : `No puedes eliminar esta novedad porque está ${ESTADO_LABELS[novedades.find(n => n.id === bannerNovedadId)?.estado ?? ''] ?? novedades.find(n => n.id === bannerNovedadId)?.estado}.`}
                              </span>
                              <button onClick={closeBanner} className="ml-auto opacity-60 hover:opacity-100">
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

          {!loading && filtered.length > ITEMS_PER_PAGE && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button key={page} variant={currentPage === page ? 'default' : 'ghost'} size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]' : 'min-w-[32px]'}>
                  {currentPage === page ? page : '•'}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Diálogo Ver detalle ─────────────────────────────────────────── */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible p-0">
            <div className="overflow-y-auto max-h-[90vh] p-6">
              <DialogHeader>
                <DialogTitle>Detalles de la Novedad</DialogTitle>
                <DialogDescription>Información completa de la novedad registrada</DialogDescription>
              </DialogHeader>
              {selectedNovedad && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">

                    {/* Cabecera */}
                    <div className="col-span-2 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <AlertCircleIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 text-lg leading-tight">{selectedNovedad.titulo}</p>
                        <Badge className={`mt-1 ${ESTADO_COLORS[selectedNovedad.estado]}`}>
                          {ESTADO_LABELS[selectedNovedad.estado]}
                        </Badge>
                      </div>
                    </div>

                    {/* Fecha de registro */}
                    <div>
                      <p className="text-xs text-gray-500">Fecha de registro</p>
                      <p className="font-semibold text-sm mt-0.5 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                        {formatFecha(selectedNovedad.fecha_registro)}
                      </p>
                    </div>

                    {/* Fecha inicio */}
                    <div>
                      <p className="text-xs text-gray-500">Fecha de inicio</p>
                      <p className="font-semibold text-sm mt-0.5">{formatFecha(selectedNovedad.fecha_inicio)}</p>
                    </div>

                    {/* Fecha fin */}
                    <div>
                      <p className="text-xs text-gray-500">Fecha de finalización</p>
                      <p className="font-semibold text-sm mt-0.5">{formatFecha(selectedNovedad.fecha_finalizacion)}</p>
                    </div>

                    {/* Horas de ausencia */}
                    {selectedNovedad.horas_ausencia != null && (
                      <div>
                        <p className="text-xs text-gray-500">Horas de ausencia</p>
                        <p className="font-semibold text-sm mt-0.5">{selectedNovedad.horas_ausencia} h</p>
                      </div>
                    )}

                    {/* Afectado */}
                    <div>
                      <p className="text-xs text-gray-500">Empleado afectado</p>
                      <p className="font-semibold text-sm mt-0.5 flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                        {nombreCompleto(selectedNovedad.empleadoAfectado)}
                      </p>
                    </div>

                    {/* Descripción */}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Descripción detallada</p>
                      <p className="font-semibold text-sm mt-0.5 whitespace-pre-line text-gray-700 leading-relaxed">
                        {selectedNovedad.descripcion_detallada}
                      </p>
                    </div>

                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
                    {canEdit(selectedNovedad) && (
                      <Button
                        onClick={() => {
                          const fresco = novedades.find(n => n.id === selectedNovedad.id) ?? selectedNovedad;
                          setIsViewDialogOpen(false);
                          openEdit(fresco);
                        }}
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

        {/* ── Diálogo Editar ──────────────────────────────────────────────── */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={open => {
            if (!open) {
              setIsEditDialogOpen(false);
              resetForm();
              setSelectedNovedad(null);
            }
          }}
        >
          <DialogContent className="p-0 gap-0 overflow-hidden" style={{ width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="overflow-y-auto flex-1 p-6">
            <DialogHeader>
              <DialogTitle>Editar Novedad</DialogTitle>
              <DialogDescription>Modifica los datos de la novedad y cambia su estado si es necesario.</DialogDescription>
            </DialogHeader>
            {renderForm(handleUpdate, 'Actualizar Novedad', true)}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Diálogo Eliminar ────────────────────────────────────────────── */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta novedad?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La novedad será eliminada permanentemente.
                {selectedNovedad && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900"><strong>Título:</strong> {selectedNovedad.titulo}</p>
                    <p className="text-sm text-gray-600 mt-1"><strong>Afectado:</strong> {nombreCompleto(selectedNovedad.empleadoAfectado)}</p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedNovedad(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        </>)}

        {activeView === 'horas-extra' && (
          <HorasExtraSubmodule
            allEmpleados={allEmpleados}
            loadingEmpleados={loadingEmpleados}
            isNewOpen={heIsNewOpen}
            onNewOpenChange={setHeIsNewOpen}
          />
        )}

      </div>
    </TooltipProvider>
  );
}

// ─── Horas Extra / Recargos ───────────────────────────────────────────────────

const TIPOS_RECARGO = [
  'Recargo Nocturno',
  'Recargo Diurno Dominical',
  'Recargo Nocturno Dominical',
  'Hora Extra Diurna',
  'Hora Extra Nocturna',
  'Hora Extra Diurna Dominical/Festiva',
] as const;

type TipoRecargo = typeof TIPOS_RECARGO[number];

const TIPO_BADGE_COLORS: Record<TipoRecargo, string> = {
  'Recargo Nocturno':                    'bg-gray-100 text-gray-800 border-gray-200',
  'Recargo Diurno Dominical':            'bg-gray-100 text-gray-800 border-gray-200',
  'Recargo Nocturno Dominical':          'bg-gray-100 text-gray-800 border-gray-200',
  'Hora Extra Diurna':                   'bg-gray-100 text-gray-800 border-gray-200',
  'Hora Extra Nocturna':                 'bg-gray-100 text-gray-800 border-gray-200',
  'Hora Extra Diurna Dominical/Festiva': 'bg-gray-100 text-gray-800 border-gray-200',
};

// ─── Festivos Colombia ────────────────────────────────────────────────────────

function calcularPascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function sumarDias(date: Date, days: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
}

function siguienteLunes(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  if (dow === 1) return d;
  d.setDate(d.getDate() + (dow === 0 ? 1 : 8 - dow));
  return d;
}

function festivosColombia(year: number): Set<string> {
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const s = new Set<string>();
  const f = (m: number, day: number) => new Date(year, m - 1, day);

  // Fijos sin movimiento
  [f(1,1), f(5,1), f(7,20), f(8,7), f(12,8), f(12,25)].forEach(d => s.add(fmt(d)));

  // Emiliani (se mueven al siguiente lunes)
  [f(1,6), f(3,19), f(6,29), f(8,15), f(10,12), f(11,1), f(11,11)]
    .forEach(d => s.add(fmt(siguienteLunes(d))));

  // Semana Santa (fijos relativos a Pascua)
  const pascua = calcularPascua(year);
  s.add(fmt(sumarDias(pascua, -3))); // Jueves Santo
  s.add(fmt(sumarDias(pascua, -2))); // Viernes Santo

  // Relativos a Pascua que siempre van al siguiente lunes
  s.add(fmt(siguienteLunes(sumarDias(pascua, 39))));  // Ascensión
  s.add(fmt(siguienteLunes(sumarDias(pascua, 60))));  // Corpus Christi
  s.add(fmt(siguienteLunes(sumarDias(pascua, 68))));  // Sagrado Corazón

  return s;
}

const TIPOS_DOMINICAL_FESTIVA = new Set<string>([
  'Recargo Diurno Dominical',
  'Recargo Nocturno Dominical',
  'Hora Extra Diurna Dominical/Festiva',
]);

function esDominicalOFestivo(fechaStr: string): boolean {
  const d = new Date(fechaStr + 'T12:00:00');
  if (isNaN(d.getTime())) return false;
  if (d.getDay() === 0) return true;
  return festivosColombia(d.getFullYear()).has(fechaStr);
}

// ── Formulario de edición (un solo registro) ──────────────────────────────
interface HoraExtraFormValues {
  empleado: EmpleadoSeleccionado | null;
  tipo: TipoRecargo | '';
  fecha: string;
  horas: string;
  observaciones: string;
  estado: 'pendiente' | 'aprobada';
}

interface HoraExtraErrors {
  empleado?: string;
  tipo?: string;
  fecha?: string;
  horas?: string;
  observaciones?: string;
}

const EMPTY_HE_FORM: HoraExtraFormValues = {
  empleado: null, tipo: '', fecha: '', horas: '', observaciones: '', estado: 'pendiente',
};

function validateHoraExtraForm(v: HoraExtraFormValues): HoraExtraErrors {
  const e: HoraExtraErrors = {};
  if (!v.empleado) e.empleado = 'El empleado es obligatorio';
  if (!v.tipo)     e.tipo     = 'El tipo es obligatorio';
  if (!v.fecha) {
    e.fecha = 'La fecha es obligatoria';
  } else {
    const d   = new Date(v.fecha + 'T12:00:00');
    const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
    if (isNaN(d.getTime())) e.fecha = 'Fecha inválida';
    else if (d > hoy)       e.fecha = 'La fecha no puede ser futura';
    else if (TIPOS_DOMINICAL_FESTIVA.has(v.tipo) && !esDominicalOFestivo(v.fecha))
      e.fecha = 'Este tipo solo aplica en domingos o festivos colombianos';
  }
  if (!v.horas || v.horas === '') {
    e.horas = 'El número de horas es obligatorio';
  } else {
    const h = parseFloat(v.horas);
    if (isNaN(h) || h <= 0) e.horas = 'Debe ser un número mayor a 0';
    else if (h > 24)        e.horas = 'No puede superar 24 horas';
  }
  if (v.observaciones.length > 500) e.observaciones = 'Máximo 500 caracteres';
  return e;
}

// ── Ítem del carrito de creación (múltiples recargos) ─────────────────────
interface RecargItem {
  id: string;
  tipo: TipoRecargo | '';
  fecha: string;
  horas: string;
}

interface RecargItemError {
  tipo?: string;
  fecha?: string;
  horas?: string;
}

function validateRecargItem(item: RecargItem, todayStr: string): RecargItemError {
  const e: RecargItemError = {};
  if (!item.tipo) {
    e.tipo = 'Selecciona un tipo';
  }
  if (!item.fecha) {
    e.fecha = 'Fecha obligatoria';
  } else {
    const d   = new Date(item.fecha + 'T12:00:00');
    const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
    if (isNaN(d.getTime())) e.fecha = 'Fecha inválida';
    else if (d > hoy)       e.fecha = 'No puede ser futura';
    else if (TIPOS_DOMINICAL_FESTIVA.has(item.tipo) && !esDominicalOFestivo(item.fecha))
      e.fecha = 'Solo domingos o festivos colombianos';
  }
  if (!item.horas) {
    e.horas = 'Obligatorio';
  } else {
    const h = parseFloat(item.horas);
    if (isNaN(h) || h <= 0) e.horas = '> 0';
    else if (h > 24)        e.horas = 'Máx 24h';
  }
  return e;
}

const newEmptyItem = (): RecargItem => ({ id: String(Date.now() + Math.random()), tipo: '', fecha: '', horas: '' });

interface HorasExtraSubmoduleProps {
  allEmpleados: EmpleadoSeleccionado[];
  loadingEmpleados: boolean;
  isNewOpen: boolean;
  onNewOpenChange: (open: boolean) => void;
}

function HorasExtraSubmodule({ allEmpleados, loadingEmpleados, isNewOpen, onNewOpenChange }: HorasExtraSubmoduleProps) {
  const [records,    setRecords]    = useState<HoraExtra[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm,  setSearchTerm]  = useState('');
  const [tipoFilter,  setTipoFilter]  = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS = 5;

  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen,   setIsViewOpen]   = useState(false);
  const [selected,     setSelected]     = useState<HoraExtra | null>(null);
  const [togglingIds,   setTogglingIds]   = useState<Set<number>>(new Set());
  const [heBannerId,    setHeBannerId]    = useState<number | null>(null);
  const [heBannerAction, setHeBannerAction] = useState<'edit' | 'delete' | null>(null);

  const canEditHE   = (r: HoraExtra) => r.estado !== 'aprobada';
  const canDeleteHE = (r: HoraExtra) => r.estado !== 'aprobada';
  const showHeBanner = (id: number, action: 'edit' | 'delete') => { setHeBannerId(id); setHeBannerAction(action); };
  const closeHeBanner = () => { setHeBannerId(null); setHeBannerAction(null); };

  // ── Estado del formulario de edición (un solo registro) ──
  const [form,    setForm]    = useState<HoraExtraFormValues>(EMPTY_HE_FORM);
  const [errors,  setErrors]  = useState<HoraExtraErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof HoraExtraFormValues, boolean>>>({});

  // ── Estado del formulario de creación (múltiples recargos) ──
  const [createEmpleado,       setCreateEmpleado]       = useState<EmpleadoSeleccionado | null>(null);
  const [createObs,            setCreateObs]            = useState('');
  const [createItems,          setCreateItems]          = useState<RecargItem[]>([newEmptyItem()]);
  const [createSubmitted,      setCreateSubmitted]      = useState(false);
  const [createEmpleadoError,  setCreateEmpleadoError]  = useState<string | undefined>();

  const todayStr = new Date().toISOString().split('T')[0];

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHorasExtra();
      setRecords(data);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, tipoFilter]);
  useEffect(() => {
    if (Object.keys(touched).length > 0) setErrors(validateHoraExtraForm(form));
  }, [form, touched]);

  const handleChange = (field: keyof HoraExtraFormValues, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleBlurF = (field: keyof HoraExtraFormValues) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validateHoraExtraForm(form));
  };

  const resetForm = () => { setForm(EMPTY_HE_FORM); setErrors({}); setTouched({}); };
  const touchAll  = () =>
    setTouched({ empleado: true, tipo: true, fecha: true, horas: true, observaciones: true });

  const resetCreateForm = () => {
    setCreateEmpleado(null);
    setCreateObs('');
    setCreateItems([newEmptyItem()]);
    setCreateSubmitted(false);
    setCreateEmpleadoError(undefined);
  };

  const addItem    = () => setCreateItems(prev => [...prev, newEmptyItem()]);
  const removeItem = (id: string) => setCreateItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: keyof Omit<RecargItem, 'id'>, value: string) =>
    setCreateItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const filtered = records.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchS =
      (r.empleado ? `${r.empleado.nombres} ${r.empleado.apellidos}` : '').toLowerCase().includes(q) ||
      r.tipo.toLowerCase().includes(q);
    return matchS && (tipoFilter === 'all' || r.tipo === tipoFilter);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitted(true);
    const empErr = !createEmpleado ? 'El empleado es obligatorio' : undefined;
    setCreateEmpleadoError(empErr);
    const anyItemErr = createItems.some(i => Object.keys(validateRecargItem(i, todayStr)).length > 0);
    if (empErr || anyItemErr) return;

    setSubmitting(true);
    try {
      const nuevos: HoraExtra[] = [];
      for (const item of createItems) {
        const dto: CreateHoraExtraDTO = {
          empleadoId:    createEmpleado!.id,
          tipo:          item.tipo as TipoRecargo,
          fecha:         item.fecha,
          horas:         parseFloat(item.horas),
          observaciones: createObs.trim() || undefined,
        };
        nuevos.push(await createHoraExtra(dto));
      }
      setRecords(prev => [...nuevos.reverse(), ...prev]);
      resetCreateForm();
      onNewOpenChange(false);
      toast.success(`${nuevos.length} registro${nuevos.length > 1 ? 's' : ''} creado${nuevos.length > 1 ? 's' : ''} exitosamente`);
    } catch (err: any) {
      const msg = err.errores ? err.errores.join(', ') : (err.message ?? 'Error al crear los registros');
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); touchAll();
    const errs = validateHoraExtraForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !selected || !form.empleado) return;
    setSubmitting(true);
    try {
      const dto: UpdateHoraExtraDTO = {
        empleadoId:    form.empleado.id,
        tipo:          form.tipo as TipoRecargo,
        fecha:         form.fecha,
        horas:         parseFloat(form.horas),
        observaciones: form.observaciones.trim() || undefined,
        estado:        form.estado,
      };
      const updated = await updateHoraExtra(selected.id, dto);
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      resetForm(); setSelected(null); setIsEditOpen(false);
      toast.success('Registro actualizado exitosamente');
    } catch (err: any) {
      const msg = err.errores ? err.errores.join(', ') : (err.message ?? 'Error al actualizar el registro');
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteHoraExtra(selected.id);
      setRecords(prev => prev.filter(r => r.id !== selected.id));
      setSelected(null); setIsDeleteOpen(false);
      toast.success('Registro eliminado exitosamente');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al eliminar el registro');
    } finally { setSubmitting(false); }
  };

  const handleToggle = async (r: HoraExtra) => {
    const nuevo: 'pendiente' | 'aprobada' = r.estado === 'aprobada' ? 'pendiente' : 'aprobada';
    setTogglingIds(prev => new Set(prev).add(r.id));
    setRecords(prev => prev.map(x => x.id === r.id ? { ...x, estado: nuevo } : x));
    try {
      const updated = await cambiarEstadoHoraExtra(r.id, nuevo);
      setRecords(prev => prev.map(x => x.id === updated.id ? updated : x));
      toast.success(`Estado cambiado a ${nuevo}`);
    } catch (err: any) {
      setRecords(prev => prev.map(x => x.id === r.id ? { ...x, estado: r.estado } : x));
      toast.error(err.message ?? 'Error al cambiar el estado');
    } finally {
      setTogglingIds(prev => { const n = new Set(prev); n.delete(r.id); return n; });
    }
  };

  const openEdit = (r: HoraExtra) => {
    setSelected(r);
    setForm({
      empleado: r.empleado
        ? { id: r.empleado.id, nombres: r.empleado.nombres, apellidos: r.empleado.apellidos, cargo: r.empleado.cargo }
        : null,
      tipo:          r.tipo,
      fecha:         r.fecha,
      horas:         String(r.horas),
      observaciones: r.observaciones ?? '',
      estado:        r.estado,
    });
    setErrors({}); setTouched({});
    setIsEditOpen(true);
  };

  const renderHeFormFields = () => (
    <div className="space-y-5">
      <EmpleadoAutocomplete
        label="Empleado"
        value={form.empleado}
        onChange={emp => { setForm(prev => ({ ...prev, empleado: emp })); setTouched(p => ({ ...p, empleado: true })); }}
        allEmpleados={allEmpleados}
        loadingEmpleados={loadingEmpleados}
        error={touched.empleado ? errors.empleado : undefined}
        placeholder="Buscar empleado..."
      />

      <Field label="Tipo de Recargo / Hora Extra" required error={touched.tipo ? errors.tipo : undefined}>
        <select
          value={form.tipo}
          onChange={e => { handleChange('tipo', e.target.value); setTouched(p => ({ ...p, tipo: true })); }}
          onBlur={() => handleBlurF('tipo')}
          className={`w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            touched.tipo && errors.tipo ? 'border-red-400' : 'border-gray-300'
          }`}
        >
          <option value="">Seleccionar tipo...</option>
          {TIPOS_RECARGO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Fecha"
          required
          error={touched.fecha ? errors.fecha : undefined}
          hint={!errors.fecha && TIPOS_DOMINICAL_FESTIVA.has(form.tipo) ? 'Solo domingos o festivos colombianos' : undefined}
        >
          <Input
            type="date"
            max={todayStr}
            value={form.fecha}
            onChange={e => { handleChange('fecha', e.target.value); setTouched(p => ({ ...p, fecha: true })); }}
            onBlur={() => handleBlurF('fecha')}
            className={touched.fecha && errors.fecha ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
        </Field>

        <Field
          label="Horas"
          required
          error={touched.horas ? errors.horas : undefined}
          hint={!errors.horas ? 'Ej: 1, 1.5, 2' : undefined}
        >
          <Input
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            placeholder="Ej: 2.5"
            value={form.horas}
            onChange={e => handleChange('horas', e.target.value)}
            onBlur={() => handleBlurF('horas')}
            className={touched.horas && errors.horas ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
        </Field>
      </div>

      <Field
        label="Observaciones"
        error={touched.observaciones ? errors.observaciones : undefined}
        hint={!errors.observaciones ? `${form.observaciones.length}/500 caracteres` : undefined}
      >
        <Textarea
          value={form.observaciones}
          onChange={e => handleChange('observaciones', e.target.value)}
          onBlur={() => handleBlurF('observaciones')}
          placeholder="Observaciones adicionales (opcional)..."
          rows={4}
          maxLength={501}
          className={touched.observaciones && errors.observaciones ? 'border-red-400 focus-visible:ring-red-400' : ''}
        />
      </Field>

    </div>
  );

  return (
    <>
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative w-full sm:flex-[3]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                placeholder="Buscar por empleado o tipo..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 w-full"
              />
            </div>
            <select
              value={tipoFilter}
              onChange={e => { setTipoFilter(e.target.value); setCurrentPage(1); }}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-1/4 sm:w-40 sm:flex-[1]"
            >
              <option value="all">Todos los tipos</option>
              {TIPOS_RECARGO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Nuevo Registro */}
      <Dialog open={isNewOpen} onOpenChange={o => { onNewOpenChange(o); if (!o) resetCreateForm(); }}>
        <DialogContent
          className="p-0 gap-0 overflow-hidden"
          style={{ width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* ── HEADER ── */}
          <header style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
            flexShrink: 0, background: '#fff',
          }}>
            <div style={{
              width: 40, height: 40, background: '#1d4ed8', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CalendarIcon style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
              <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                Registrar Horas Extra / Recargos
              </DialogTitle>
              <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Selecciona el empleado y agrega todos los tipos de recargo en una sola operación.
              </DialogDescription>
            </div>
          </header>

          {/* ── BODY (2 columnas) ── */}
          <form
            id="he-form-new"
            onSubmit={handleCreate}
            noValidate
            style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}
          >
            {/* SIDEBAR IZQUIERDO */}
            <aside style={{
              width: 320, flexShrink: 0, borderRight: '1px solid #e5e7eb',
              background: '#f9fafb', display: 'flex', flexDirection: 'column',
              overflowY: 'auto', padding: 20, gap: 20,
            }}>
              <EmpleadoAutocomplete
                label="Empleado *"
                value={createEmpleado}
                onChange={emp => { setCreateEmpleado(emp); if (emp) setCreateEmpleadoError(undefined); }}
                allEmpleados={allEmpleados}
                loadingEmpleados={loadingEmpleados}
                error={createSubmitted || createEmpleadoError ? createEmpleadoError : undefined}
                placeholder="Buscar empleado..."
              />

              <Field
                label="Observaciones"
                hint={`${createObs.length}/500 caracteres`}
                error={createObs.length > 500 ? 'Máximo 500 caracteres' : undefined}
              >
                <Textarea
                  value={createObs}
                  onChange={e => setCreateObs(e.target.value)}
                  placeholder="Observaciones para todos los registros (opcional)..."
                  rows={6}
                  maxLength={501}
                  className={createObs.length > 500 ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
              </Field>
            </aside>

            {/* PANEL PRINCIPAL — lista de ítems */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Cabecera del panel */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0,
              }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                  Tipos de Recargo a registrar
                  <span style={{
                    marginLeft: 8, background: '#dbeafe', color: '#1d4ed8',
                    borderRadius: 12, fontSize: 11, fontWeight: 700, padding: '2px 8px',
                  }}>
                    {createItems.length}
                  </span>
                </span>
                <Button type="button" onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Agregar tipo
                </Button>
              </div>

              {/* Lista de ítems */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {createItems.map((item, idx) => {
                  const itemErr = createSubmitted ? validateRecargItem(item, todayStr) : {};
                  return (
                    <div key={item.id} style={{
                      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      {/* Número + borrar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                          Recargo #{idx + 1}
                        </span>
                        {createItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            style={{ color: '#1c148f', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Campos en fila */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px', gap: 12 }}>
                        {/* Tipo */}
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>
                            Tipo <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            value={item.tipo}
                            onChange={e => updateItem(item.id, 'tipo', e.target.value)}
                            style={{
                              width: '100%', border: `1px solid ${itemErr.tipo ? '#f87171' : '#d1d5db'}`,
                              borderRadius: 6, padding: '8px 10px', fontSize: 13,
                              background: '#fff', outline: 'none', cursor: 'pointer',
                            }}
                          >
                            <option value="">Seleccionar tipo...</option>
                            {TIPOS_RECARGO.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {itemErr.tipo && (
                            <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                              {itemErr.tipo}
                            </p>
                          )}
                        </div>

                        {/* Fecha */}
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>
                            Fecha <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <Input
                            type="date"
                            max={todayStr}
                            value={item.fecha}
                            onChange={e => updateItem(item.id, 'fecha', e.target.value)}
                            className={itemErr.fecha ? 'border-red-400 focus-visible:ring-red-400' : ''}
                          />
                          {itemErr.fecha ? (
                            <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                              {itemErr.fecha}
                            </p>
                          ) : TIPOS_DOMINICAL_FESTIVA.has(item.tipo) && (
                            <p style={{ color: '#6b7280', fontSize: 11, marginTop: 3 }}>
                              Solo dom. o festivos col.
                            </p>
                          )}
                        </div>

                        {/* Horas */}
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>
                            Horas <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <Input
                            type="number"
                            min="0.5"
                            max="24"
                            step="0.5"
                            placeholder="Ej: 2.5"
                            value={item.horas}
                            onChange={e => updateItem(item.id, 'horas', e.target.value)}
                            className={itemErr.horas ? 'border-red-400 focus-visible:ring-red-400' : ''}
                          />
                          {itemErr.horas && (
                            <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                              {itemErr.horas}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>

          {/* ── FOOTER ── */}
          <footer style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
            padding: '16px 24px', borderTop: '1px solid #e5e7eb',
            background: '#fff', flexShrink: 0,
          }}>
            {createSubmitted && (!createEmpleado || createItems.some(i => Object.keys(validateRecargItem(i, todayStr)).length > 0)) && (
              <span style={{ color: '#b45309', fontSize: 12, marginRight: 'auto' }}>
                Corrige los campos marcados en rojo antes de continuar.
              </span>
            )}
            <Button type="button" variant="outline" onClick={() => { resetCreateForm(); onNewOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit" form="he-form-new" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
              Registrar {createItems.length > 1 ? `(${createItems.length} registros)` : ''}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Empleado</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Horas</th>
                <th className="px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Loader2Icon className="w-8 h-8 animate-spin" />
                      <p>Cargando registros...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center text-gray-500">
                      <CalendarIcon className="w-12 h-12 mb-3 text-gray-300" />
                      <p className="text-gray-900">No se encontraron registros</p>
                      <p className="text-sm">Registra horas extra o recargos con el botón "Nuevo Registro"</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(r => (
                <React.Fragment key={r.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {r.empleado ? `${r.empleado.nombres} ${r.empleado.apellidos}` : '—'}
                    {r.empleado?.cargo && (
                      <p className="text-xs text-gray-400 font-normal">{r.empleado.cargo}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={TIPO_BADGE_COLORS[r.tipo]}>{r.tipo}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{r.fecha}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{Number(r.horas)}h</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm"
                            onClick={() => { setSelected(r); setIsViewOpen(true); }}
                            className="text-blue-900 border-blue-900 hover:bg-blue-50">
                            <EyeIcon className="w-4 h-4 text-blue-900" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver detalles</p></TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm"
                            onClick={() => {
                              if (!canEditHE(r)) { showHeBanner(r.id, 'edit'); return; }
                              closeHeBanner(); openEdit(r);
                            }}
                            className={`border-blue-900 transition-opacity ${canEditHE(r) ? 'text-blue-900 hover:bg-blue-50' : 'opacity-40 cursor-not-allowed text-gray-400 border-gray-300'}`}>
                            <EditIcon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{canEditHE(r) ? 'Editar' : 'No se puede editar: el registro ya fue aprobado'}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm"
                            onClick={() => {
                              if (!canDeleteHE(r)) { showHeBanner(r.id, 'delete'); return; }
                              closeHeBanner(); setSelected(r); setIsDeleteOpen(true);
                            }}
                            className={`border-blue-900 transition-opacity ${canDeleteHE(r) ? 'text-blue-900 hover:bg-blue-50' : 'opacity-40 cursor-not-allowed text-gray-400 border-gray-300'}`}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{canDeleteHE(r) ? 'Eliminar' : 'No se puede eliminar: el registro ya fue aprobado'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>

                {heBannerId === r.id && (
                  <tr className="border-b border-amber-100">
                    <td colSpan={5} className="px-6 py-0">
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          <strong>Registro bloqueado:</strong>{' '}
                          {heBannerAction === 'edit'
                            ? 'No puedes editar este registro porque ya fue aprobado.'
                            : 'No puedes eliminar este registro porque ya fue aprobado.'}
                        </span>
                        <button onClick={closeHeBanner} className="ml-auto opacity-60 hover:opacity-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > ITEMS && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500">
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button key={page} size="sm"
                onClick={() => setCurrentPage(page)}
                variant={currentPage === page ? 'default' : 'ghost'}
                className={currentPage === page
                  ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[32px]'
                  : 'min-w-[32px]'
                }>
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

      {/* Dialog Ver */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Registro</DialogTitle>
            <DialogDescription>Información del recargo u hora extra registrada</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                <div className="col-span-2">
                  <Badge className={TIPO_BADGE_COLORS[selected.tipo]}>{selected.tipo}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Empleado</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {selected.empleado ? `${selected.empleado.nombres} ${selected.empleado.apellidos}` : '—'}
                  </p>
                  {selected.empleado?.cargo && (
                    <p className="text-xs text-gray-400">{selected.empleado.cargo}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <Badge className={
                    selected.estado === 'aprobada'
                      ? 'bg-blue-100 text-blue-900 border-blue-200 mt-0.5'
                      : 'bg-gray-100 text-gray-700 border-gray-200 mt-0.5'
                  }>
                    {selected.estado === 'aprobada' ? 'Aprobada' : 'Pendiente'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="text-sm font-semibold mt-0.5">{selected.fecha}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Horas</p>
                  <p className="text-sm font-semibold mt-0.5">{Number(selected.horas)}h</p>
                </div>
                {selected.observaciones && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Observaciones</p>
                    <p className="text-sm mt-0.5 text-gray-700 whitespace-pre-line">{selected.observaciones}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Cerrar</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => { setIsViewOpen(false); openEdit(selected); }}>
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={isEditOpen} onOpenChange={o => { if (!o) { setIsEditOpen(false); resetForm(); setSelected(null); } }}>
        <DialogContent
          className="p-0 gap-0 overflow-hidden"
          style={{ width: '96vw', maxWidth: 1400, height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        >
          <header style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
            flexShrink: 0, background: '#fff',
          }}>
            <div style={{
              width: 40, height: 40, background: '#1d4ed8', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CalendarIcon style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
              <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                Editar Hora Extra / Recargo
              </DialogTitle>
              <DialogDescription style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                Modifica los datos del recargo u hora extra y cambia su estado si es necesario.
              </DialogDescription>
            </div>
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f9fafb' }}>
            <form id="he-form-edit" onSubmit={handleUpdate} noValidate>
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                {renderHeFormFields()}
              </div>
            </form>
          </div>

          <footer style={{
            display: 'flex', justifyContent: 'flex-end', gap: 12,
            padding: '16px 24px', borderTop: '1px solid #e5e7eb',
            background: '#fff', flexShrink: 0,
          }}>
            <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); setSelected(null); }}>
              Cancelar
            </Button>
            <Button type="submit" form="he-form-edit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
              Actualizar
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Eliminar */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
              {selected && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900"><strong>Tipo:</strong> {selected.tipo}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Empleado:</strong>{' '}
                    {selected.empleado ? `${selected.empleado.nombres} ${selected.empleado.apellidos}` : '—'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Fecha:</strong> {selected.fecha} · <strong>Horas:</strong> {Number(selected.horas)}h
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelected(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-blue-600 hover:bg-blue-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}