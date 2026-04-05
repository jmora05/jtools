import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { toast } from 'sonner';
import { PlusIcon, EyeIcon, EditIcon, TrashIcon, UsersIcon, SearchIcon, ArrowLeftIcon, AlertTriangleIcon, ChevronLeftIcon, ChevronRightIcon, BriefcaseIcon, CalendarIcon, PhoneIcon, MailIcon, MapPinIcon, UserCheckIcon, UserXIcon, RefreshCwIcon } from 'lucide-react';
import { getEmpleados, createEmpleado, updateEmpleado, deleteEmpleado, type Empleado } from '../services/empleadosService';
import { validarFormEmpleado, hayErrores, type FormErrors } from '../utils/empleadosValidations';

const AREAS: Empleado['area'][] = ['Producción', 'Calidad', 'Logística', 'Mantenimiento', 'Administración'];
const CARGOS: Empleado['cargo'][] = ['Supervisor de Producción', 'Jefe de Área', 'Operario', 'Técnico de Calidad', 'Asistente'];

type FormState = {
  tipoDocumento: 'CC' | 'CE' | 'Pasaporte';
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  cargo: string;
  area: string;
  direccion: string;
  ciudad: string;
  fechaIngreso: string;
  estado: 'activo' | 'inactivo';
};

const EMPTY_FORM: FormState = {
  tipoDocumento: 'CC',
  numeroDocumento: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  email: '',
  cargo: '',
  area: '',
  direccion: '',
  ciudad: '',
  fechaIngreso: new Date().toISOString().split('T')[0],
  estado: 'activo',
};

// ─── Componente de campo con mensaje de error ──────────────────────────────
function FieldError({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="text-red-500 text-xs mt-1">{mensaje}</p>;
}

// ─── Formulario con validaciones por campo ─────────────────────────────────
function FormFields({
  form,
  setForm,
  errores = {},
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  errores?: FormErrors;
}) {
  const base = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white";
  const inputClass = (campo: keyof FormErrors) =>
    `${base} ${errores[campo] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`;

  return (
    <div className="space-y-6">
      {/* ── Información Personal ── */}
      <Card className="border-2 border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white py-3">
          <CardTitle className="text-base">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-1">
              <Label className="text-xs">Nombres *</Label>
              <Input
                placeholder="Nombres"
                value={form.nombres}
                onChange={e => setForm({ ...form, nombres: e.target.value })}
                className={errores.nombres ? 'border-red-400 focus:ring-red-400' : ''}
              />
              <FieldError mensaje={errores.nombres} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Apellidos *</Label>
              <Input
                placeholder="Apellidos"
                value={form.apellidos}
                onChange={e => setForm({ ...form, apellidos: e.target.value })}
                className={errores.apellidos ? 'border-red-400 focus:ring-red-400' : ''}
              />
              <FieldError mensaje={errores.apellidos} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Documento *</Label>
              <select
                className={inputClass('tipoDocumento')}
                value={form.tipoDocumento}
                onChange={e => setForm({ ...form, tipoDocumento: e.target.value as FormState['tipoDocumento'], numeroDocumento: '' })}
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
              <FieldError mensaje={errores.tipoDocumento} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Número de Documento *</Label>
              <Input
                placeholder={
                  form.tipoDocumento === 'Pasaporte'
                    ? 'Ej: AB123456'
                    : 'Solo dígitos'
                }
                value={form.numeroDocumento}
                onChange={e => setForm({ ...form, numeroDocumento: e.target.value })}
                className={errores.numeroDocumento ? 'border-red-400 focus:ring-red-400' : ''}
              />
              <FieldError mensaje={errores.numeroDocumento} />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ── Información de Contacto ── */}
      <Card className="border-2 border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white py-3">
          <CardTitle className="text-base">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-1">
              <Label className="text-xs">Correo Electrónico *</Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={errores.email ? 'border-red-400 focus:ring-red-400' : ''}
              />
              <FieldError mensaje={errores.email} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Teléfono *</Label>
              <Input
                placeholder="+57 300 123 4567"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                className={errores.telefono ? 'border-red-400 focus:ring-red-400' : ''}
              />
              <FieldError mensaje={errores.telefono} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Ciudad</Label>
              <Input
                placeholder="Ciudad"
                value={form.ciudad}
                onChange={e => setForm({ ...form, ciudad: e.target.value })}
                className={errores.ciudad ? 'border-red-400 focus:ring-red-400' : ''}
              />
              <FieldError mensaje={errores.ciudad} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Dirección</Label>
              <Input
                placeholder="Dirección de residencia"
                value={form.direccion}
                onChange={e => setForm({ ...form, direccion: e.target.value })}
                className={errores.direccion ? 'border-red-400 focus:ring-red-400' : ''}
              />
              <FieldError mensaje={errores.direccion} />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ── Información Laboral ── */}
      <Card className="border-2 border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white py-3">
          <CardTitle className="text-base">Información Laboral</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-1">
              <Label className="text-xs">Cargo *</Label>
              <select
                className={inputClass('cargo')}
                value={form.cargo}
                onChange={e => setForm({ ...form, cargo: e.target.value })}
              >
                <option value="">Seleccionar cargo</option>
                {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <FieldError mensaje={errores.cargo} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Área *</Label>
              <select
                className={inputClass('area')}
                value={form.area}
                onChange={e => setForm({ ...form, area: e.target.value })}
              >
                <option value="">Seleccionar área</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <FieldError mensaje={errores.area} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Fecha de Ingreso *</Label>
              <Input
                type="date"
                value={form.fechaIngreso}
                onChange={e => setForm({ ...form, fechaIngreso: e.target.value })}
                className={errores.fechaIngreso ? 'border-red-400 focus:ring-red-400' : ''}
              />
              <FieldError mensaje={errores.fechaIngreso} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Estado *</Label>
              <select
                className={inputClass('estado')}
                value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value as 'activo' | 'inactivo' })}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
              <FieldError mensaje={errores.estado} />
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Badge de estado ───────────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: string }) {
  return estado === 'activo' ? (
    <Badge className="bg-green-100 text-green-700 border-green-200">
      <UserCheckIcon className="w-3 h-3 mr-1" />Activo
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 border-red-200">
      <UserXIcon className="w-3 h-3 mr-1" />Inactivo
    </Badge>
  );
}

// ─── Select de filtros ─────────────────────────────────────────────────────
function FilterSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export function EmployeeManagement() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Empleado | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Empleado | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [filterCargo, setFilterCargo] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [sortBy, setSortBy] = useState('nombre');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  // ── Estado de errores por formulario ──────────────────────────────
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  // ── Carga inicial ──────────────────────────────────────────────────
  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    try {
      setEmpleados(await getEmpleados());
    } catch (err: any) {
      toast.error('Error al cargar: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmpleados(); }, [fetchEmpleados]);

  // ── Filtros y ordenamiento ─────────────────────────────────────────
  const filtered = empleados.filter(emp => {
    const name = `${emp.nombres} ${emp.apellidos}`.toLowerCase();
    return (
      (name.includes(searchTerm.toLowerCase()) ||
        emp.numeroDocumento.includes(searchTerm) ||
        emp.cargo.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterArea === 'all' || emp.area === filterArea) &&
      (filterCargo === 'all' || emp.cargo === filterCargo) &&
      (filterEstado === 'all' || emp.estado === filterEstado)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'nombre') return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`);
    if (sortBy === 'estado') return a.estado.localeCompare(b.estado);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Crear ──────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errores = validarFormEmpleado(createForm);
    setCreateErrors(errores);
    if (hayErrores(errores)) {
      toast.error('Corrige los errores antes de continuar');
      return;
    }
    setSaving(true);
    try {
      await createEmpleado({
        tipoDocumento: createForm.tipoDocumento,
        numeroDocumento: createForm.numeroDocumento,
        nombres: createForm.nombres,
        apellidos: createForm.apellidos,
        telefono: createForm.telefono,
        email: createForm.email,
        cargo: createForm.cargo as Empleado['cargo'],
        area: createForm.area as Empleado['area'],
        direccion: createForm.direccion || undefined,
        ciudad: createForm.ciudad || undefined,
        fechaIngreso: createForm.fechaIngreso,
        estado: createForm.estado,
      });
      toast.success('Empleado registrado exitosamente');
      setShowCreateModal(false);
      setCreateForm(EMPTY_FORM);
      setCreateErrors({});
      fetchEmpleados();
    } catch (err: any) {
      toast.error('Error al registrar: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // ── Actualizar ─────────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee?.id) return;
    const errores = validarFormEmpleado(editForm);
    setEditErrors(errores);
    if (hayErrores(errores)) {
      toast.error('Corrige los errores antes de continuar');
      return;
    }
    setSaving(true);
    try {
      await updateEmpleado(selectedEmployee.id, {
        tipoDocumento: editForm.tipoDocumento,
        numeroDocumento: editForm.numeroDocumento,
        nombres: editForm.nombres,
        apellidos: editForm.apellidos,
        telefono: editForm.telefono,
        email: editForm.email,
        cargo: editForm.cargo as Empleado['cargo'],
        area: editForm.area as Empleado['area'],
        direccion: editForm.direccion || undefined,
        ciudad: editForm.ciudad || undefined,
        fechaIngreso: editForm.fechaIngreso,
        estado: editForm.estado,
      });
      toast.success('Empleado actualizado correctamente');
      setShowEditModal(false);
      setSelectedEmployee(null);
      setEditErrors({});
      fetchEmpleados();
    } catch (err: any) {
      toast.error('Error al actualizar: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // ── Desactivar ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!employeeToDelete?.id) return;
    setSaving(true);
    try {
      await deleteEmpleado(employeeToDelete.id);
      toast.success('Empleado desactivado correctamente');
      setShowDeleteDialog(false);
      setEmployeeToDelete(null);
      fetchEmpleados();
    } catch (err: any) {
      toast.error('Error al desactivar: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // ── Abrir edición ──────────────────────────────────────────────────
  const openEdit = (emp: Empleado) => {
    setSelectedEmployee(emp);
    setEditErrors({});
    setEditForm({
      tipoDocumento: emp.tipoDocumento,
      numeroDocumento: emp.numeroDocumento,
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      telefono: emp.telefono,
      email: emp.email,
      cargo: emp.cargo,
      area: emp.area,
      direccion: emp.direccion ?? '',
      ciudad: emp.ciudad ?? '',
      fechaIngreso: emp.fechaIngreso,
      estado: emp.estado,
    });
    setShowEditModal(true);
  };

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-blue-900" />
            Gestión de Empleados
          </h1>
          <p className="text-sm text-gray-600 mt-1">Módulo de Producción — Administra el personal de la empresa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEmpleados} disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {/* Modal Crear */}
          <Dialog
            open={showCreateModal}
            onOpenChange={open => {
              setShowCreateModal(open);
              if (!open) { setCreateForm(EMPTY_FORM); setCreateErrors({}); }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                <PlusIcon className="w-4 h-4 mr-2" />Registrar Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
                <DialogDescription>Completa todos los campos obligatorios (*).</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <FormFields form={createForm} setForm={setCreateForm} errores={createErrors} />
                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => { setCreateForm(EMPTY_FORM); setCreateErrors({}); setShowCreateModal(false); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={saving}>
                    {saving ? 'Guardando...' : 'Registrar Empleado'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Filtros ── */}
      <Card className="shadow-lg border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, documento o cargo..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
              <FilterSelect value={filterArea} onChange={v => { setFilterArea(v); setCurrentPage(1); }}>
                <option value="all">Todas las áreas</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </FilterSelect>
              <FilterSelect value={filterCargo} onChange={v => { setFilterCargo(v); setCurrentPage(1); }}>
                <option value="all">Todos los cargos</option>
                {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
              </FilterSelect>
              <FilterSelect value={filterEstado} onChange={v => { setFilterEstado(v); setCurrentPage(1); }}>
                <option value="all">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </FilterSelect>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{sorted.length} empleado(s) encontrado(s)</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Ordenar por:</span>
                <FilterSelect value={sortBy} onChange={setSortBy}>
                  <option value="nombre">Nombre</option>
                  <option value="estado">Estado</option>
                </FilterSelect>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider">Cargo / Área</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <RefreshCwIcon className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-400" />
                  <p>Cargando empleados...</p>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron empleados</p>
                </td></tr>
              ) : paginated.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{emp.nombres} {emp.apellidos}</p>
                    <p className="text-xs text-gray-500">{emp.tipoDocumento} {emp.numeroDocumento}</p>
                  </td>
                  <td className="px-6 py-4"><p className="text-sm text-gray-900">{emp.email}</p></td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{emp.cargo}</p>
                    <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200 text-xs">{emp.area}</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const nuevoEstado = emp.estado === 'activo' ? 'inactivo' : 'activo';
                            await updateEmpleado(emp.id!, { ...emp, estado: nuevoEstado });
                            toast.success(`Empleado ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`);
                            fetchEmpleados();
                          } catch {
                            toast.error('Error al cambiar estado');
                          }
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${emp.estado === 'activo' ? 'bg-blue-600' : 'bg-gray-800'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emp.estado === 'activo' ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-xs font-medium ${emp.estado === 'activo' ? 'text-blue-700' : 'text-gray-500'}`}>
                        {emp.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" title="Ver detalle"
                        onClick={() => { setSelectedEmployee(emp); setShowDetailModal(true); }}
                        className="text-blue-900 border-blue-200 hover:bg-blue-50">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Editar"
                        onClick={() => openEdit(emp)}
                        className="text-amber-700 border-amber-200 hover:bg-amber-50">
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Desactivar"
                        onClick={() => { setEmployeeToDelete(emp); setShowDeleteDialog(true); }}
                        className="text-red-600 border-red-200 hover:bg-red-50">
                        <TrashIcon className="w-4 h-4" />
                      </Button>
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
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300">
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button key={page} size="sm" onClick={() => setCurrentPage(page)}
                  className={page === currentPage ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}>
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300">
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Ver Detalle ── */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Empleado</DialogTitle>
            <DialogDescription>Información completa del empleado seleccionado</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-5 mt-2">
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-base">Información Personal</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-gray-500">Nombre Completo</Label><p className="mt-1">{selectedEmployee.nombres} {selectedEmployee.apellidos}</p></div>
                    <div><Label className="text-xs text-gray-500">Identificación</Label><p className="mt-1">{selectedEmployee.tipoDocumento} {selectedEmployee.numeroDocumento}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><PhoneIcon className="w-4 h-4" />Contacto</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-gray-500 flex items-center gap-1"><MailIcon className="w-3 h-3" />Correo</Label><p className="mt-1 text-sm">{selectedEmployee.email}</p></div>
                    <div><Label className="text-xs text-gray-500 flex items-center gap-1"><PhoneIcon className="w-3 h-3" />Teléfono</Label><p className="mt-1 text-sm">{selectedEmployee.telefono}</p></div>
                    {selectedEmployee.ciudad && <div><Label className="text-xs text-gray-500 flex items-center gap-1"><MapPinIcon className="w-3 h-3" />Ciudad</Label><p className="mt-1 text-sm">{selectedEmployee.ciudad}</p></div>}
                    {selectedEmployee.direccion && <div><Label className="text-xs text-gray-500">Dirección</Label><p className="mt-1 text-sm">{selectedEmployee.direccion}</p></div>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><BriefcaseIcon className="w-4 h-4" />Información Laboral</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-gray-500">Cargo</Label><p className="mt-1 text-sm">{selectedEmployee.cargo}</p></div>
                    <div><Label className="text-xs text-gray-500">Área</Label><Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700 border-purple-200">{selectedEmployee.area}</Badge></div>
                    <div><Label className="text-xs text-gray-500 flex items-center gap-1"><CalendarIcon className="w-3 h-3" />Fecha de Ingreso</Label><p className="mt-1 text-sm">{selectedEmployee.fechaIngreso}</p></div>
                    <div><Label className="text-xs text-gray-500">Estado</Label><div className="mt-1"><StatusBadge estado={selectedEmployee.estado} /></div></div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowDetailModal(false)}>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />Volver
                </Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={() => { setShowDetailModal(false); openEdit(selectedEmployee); }}>
                  <EditIcon className="w-4 h-4 mr-2" />Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Editar ── */}
      <Dialog open={showEditModal} onOpenChange={open => {
        setShowEditModal(open);
        if (!open) { setSelectedEmployee(null); setEditErrors({}); }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualizar Datos del Empleado</DialogTitle>
            <DialogDescription>Los campos con (*) son obligatorios.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <FormFields form={editForm} setForm={setEditForm} errores={editErrors} />
            <div className="flex gap-4 pt-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => { setShowEditModal(false); setSelectedEmployee(null); setEditErrors({}); }}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar desactivar ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="w-5 h-5" />Desactivar Empleado
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>¿Estás seguro de que deseas desactivar este empleado?</p>
                {employeeToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1 text-sm">
                    <p><span className="text-gray-500">Empleado: </span><span className="font-medium text-gray-900">{employeeToDelete.nombres} {employeeToDelete.apellidos}</span></p>
                    <p><span className="text-gray-500">Identificación: </span><span className="text-gray-900">{employeeToDelete.tipoDocumento} {employeeToDelete.numeroDocumento}</span></p>
                    <p><span className="text-gray-500">Cargo: </span><span className="text-gray-900">{employeeToDelete.cargo}</span></p>
                  </div>
                )}
                <p className="text-sm text-amber-600">El empleado quedará como <strong>inactivo</strong> en el sistema.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={saving}>
              {saving ? 'Procesando...' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}