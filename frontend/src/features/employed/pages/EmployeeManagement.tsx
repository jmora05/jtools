// src/features/employees/EmployeeManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import {
    Plus, Eye, Edit, Trash2, Users, Search,
    AlertTriangle, ChevronLeft, ChevronRight,
    Briefcase, Calendar, Phone, Mail, MapPin,
    Loader2, CheckCircle2, Info, Lock, X,
} from 'lucide-react';
import {
    getEmpleados, createEmpleado, updateEmpleado, deleteEmpleado, getRoles,
    verificarPuedeEliminarse, desactivarEmpleado,
    type Empleado, type Rol, type VerificacionEliminacion,
} from '../services/empleadosService';
import {
    validarFormEmpleado, validarCampo, validarUnicidad, hayErrores,
    sanitizarNombre, sanitizarDocumento, sanitizarTelefono, sanitizarCiudad,
    type FormErrors,
} from '../utils/empleadosValidations';

// ─── Constantes ───────────────────────────────────────────────────────────────
const AREAS:  Empleado['area'][]  = ['Producción', 'Calidad', 'Logística', 'Mantenimiento', 'Administración'];

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

// ─── FieldError ───────────────────────────────────────────────────────────────
function FieldError({ mensaje }: { mensaje?: string }) {
    if (!mensaje) return null;
    return (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {mensaje}
        </p>
    );
}

// ─── InfoAlert ────────────────────────────────────────────────────────────────
const InfoAlert = ({ message }: { message: string }) => (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
        <Info className="w-4 h-4 shrink-0 text-blue-500" />
        <span>{message}</span>
    </div>
);

// ─── InactiveAlert ────────────────────────────────────────────────────────────
function InactiveAlert({ mensaje, onClose }: { mensaje: string; onClose: () => void }) {
    return (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg px-4 py-3">
            <Lock className="w-4 h-4 shrink-0 text-gray-500" />
            <span className="flex-1">{mensaje}</span>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Estilos de select nativos alineados con los inputs ──────────────────────
const selectCls = (hasError?: boolean) =>
    `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-[#f3f3f5] h-9 ${
        hasError ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'
    }`;

// ─── Formulario de empleado ───────────────────────────────────────────────────
function FormFields({
    form,
    setForm,
    errores = {},
    setErrores,
    roles = [],
}: {
    form: FormState;
    setForm: (f: FormState) => void;
    errores?: FormErrors;
    setErrores: (e: FormErrors) => void;
    roles?: Rol[];
}) {
    function update<K extends keyof FormState>(campo: K, valor: FormState[K], sanitizado?: string) {
        const nuevoForm = { ...form, [campo]: sanitizado !== undefined ? sanitizado : valor };
        setForm(nuevoForm);
        const msgAnterior = errores[campo as keyof FormErrors];
        const msgNuevo = validarCampo(campo as keyof FormState, nuevoForm);
        if (msgAnterior !== undefined || msgNuevo) {
            setErrores({ ...errores, [campo]: msgNuevo || undefined });
        }
    }

    function blur(campo: keyof FormState) {
        const msg = validarCampo(campo, form);
        setErrores({ ...errores, [campo]: msg || undefined });
    }

    return (
        <div className="space-y-4">
            {/* Personal */}
            <div className="border border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 py-3 px-4">
                    <p className="text-sm font-semibold text-blue-900">Información Personal</p>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Tipo de Documento <span className="text-red-500">*</span></label>
                            <select
                                className={selectCls(!!errores.tipoDocumento)}
                                value={form.tipoDocumento}
                                onChange={e => {
                                    const tipo = e.target.value as FormState['tipoDocumento'];
                                    setForm({ ...form, tipoDocumento: tipo, numeroDocumento: '' });
                                    setErrores({ ...errores, tipoDocumento: undefined, numeroDocumento: undefined });
                                }}
                            >
                                <option value="CC">Cédula de Ciudadanía </option>
                                <option value="CE">Cédula de Extranjería </option>
                                <option value="Pasaporte">Pasaporte</option>
                            </select>
                            <FieldError mensaje={errores.tipoDocumento} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Número de Documento <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="Solo dígitos"
                                value={form.numeroDocumento}
                                onChange={e => update('numeroDocumento', e.target.value, sanitizarDocumento(e.target.value, form.tipoDocumento))}
                                onBlur={() => blur('numeroDocumento')}
                                className={errores.numeroDocumento ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                maxLength={10}
                            />
                            <FieldError mensaje={errores.numeroDocumento} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Nombres <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="Nombres"
                                value={form.nombres}
                                onChange={e => update('nombres', e.target.value, sanitizarNombre(e.target.value))}
                                onBlur={() => blur('nombres')}
                                className={errores.nombres ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                maxLength={100}
                            />
                            <FieldError mensaje={errores.nombres} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Apellidos <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="Apellidos"
                                value={form.apellidos}
                                onChange={e => update('apellidos', e.target.value, sanitizarNombre(e.target.value))}
                                onBlur={() => blur('apellidos')}
                                className={errores.apellidos ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                maxLength={100}
                            />
                            <FieldError mensaje={errores.apellidos} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Contacto */}
            <div className="border border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 py-3 px-4">
                    <p className="text-sm font-semibold text-blue-900">Información de Contacto</p>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Correo Electrónico <span className="text-red-500">*</span></label>
                            <Input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={form.email}
                                onChange={e => update('email', e.target.value)}
                                onBlur={() => blur('email')}
                                className={errores.email ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                maxLength={50}
                            />
                            <FieldError mensaje={errores.email} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Teléfono <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="+57 300 123 4567"
                                value={form.telefono}
                                onChange={e => update('telefono', e.target.value, sanitizarTelefono(e.target.value))}
                                onBlur={() => blur('telefono')}
                                className={errores.telefono ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                maxLength={17}
                            />
                            <FieldError mensaje={errores.telefono} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Ciudad</label>
                            <Input
                                placeholder="Ciudad"
                                value={form.ciudad}
                                onChange={e => update('ciudad', e.target.value, sanitizarCiudad(e.target.value))}
                                onBlur={() => blur('ciudad')}
                                className={errores.ciudad ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                maxLength={50}
                            />
                            <FieldError mensaje={errores.ciudad} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Dirección</label>
                            <Input
                                placeholder="Dirección de residencia"
                                value={form.direccion}
                                onChange={e => update('direccion', e.target.value)}
                                onBlur={() => blur('direccion')}
                                className={errores.direccion ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                maxLength={200}
                            />
                            <FieldError mensaje={errores.direccion} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Laboral */}
            <div className="border border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 py-3 px-4">
                    <p className="text-sm font-semibold text-blue-900">Información Laboral</p>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Cargo <span className="text-red-500">*</span></label>
                            <select
                                className={selectCls(!!errores.cargo)}
                                value={form.cargo}
                                onChange={e => update('cargo', e.target.value)}
                                onBlur={() => blur('cargo')}
                            >
                                <option value="">Seleccionar cargo</option>
                                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                            <FieldError mensaje={errores.cargo} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Área <span className="text-red-500">*</span></label>
                            <select
                                className={selectCls(!!errores.area)}
                                value={form.area}
                                onChange={e => update('area', e.target.value)}
                                onBlur={() => blur('area')}
                            >
                                <option value="">Seleccionar área</option>
                                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <FieldError mensaje={errores.area} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Fecha de Ingreso <span className="text-red-500">*</span></label>
                            <Input
                                type="date"
                                value={form.fechaIngreso}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={e => update('fechaIngreso', e.target.value)}
                                onBlur={() => blur('fechaIngreso')}
                                className={errores.fechaIngreso ? 'border-red-400 focus-visible:ring-red-300' : ''}
                            />
                            <FieldError mensaje={errores.fechaIngreso} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-2">Estado</label>
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    checked={form.estado === 'activo'}
                                    onCheckedChange={(checked) => setForm({ ...form, estado: checked ? 'activo' : 'inactivo' })}
                                />
                                <span className="text-sm text-gray-600">{form.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function EmployeeManagement() {
    const [empleados, setEmpleados]       = useState<Empleado[]>([]);
    const [roles, setRoles]               = useState<Rol[]>([]);
    const [loading, setLoading]           = useState(false);
    const [saving, setSaving]             = useState(false);
    const [togglingIds, setTogglingIds]   = useState<Set<number>>(new Set());

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingEmployee, setEditingEmployee]   = useState<Empleado | null>(null);
    const [viewingEmployee, setViewingEmployee]   = useState<Empleado | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState<Empleado | null>(null);
    const [verificacionEliminacion, setVerificacionEliminacion] = useState<VerificacionEliminacion | null>(null);
    const [checkingDelete, setCheckingDelete] = useState(false);

    const [searchTerm, setSearchTerm]       = useState('');
    const [filterEstado, setFilterEstado]   = useState('all');
    const [currentPage, setCurrentPage]     = useState(1);
    const itemsPerPage = 5;

    const [form, setForm]             = useState<FormState>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const showFeedback = (msg: string) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

    // ── Alerta de inactivo ────────────────────────────────────────────────────
    const [inactiveAlert, setInactiveAlert] = useState<string | null>(null);
    const showInactiveAlert = (msg: string) => {
        setInactiveAlert(msg);
        setTimeout(() => setInactiveAlert(null), 5000);
    };

    // ── Fetch ─────────────────────────────────────────────────────────────────
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
    useEffect(() => {
        getRoles().then(setRoles).catch(() => {});
    }, []);

    // ── Filtros ───────────────────────────────────────────────────────────────
    const filtered = empleados.filter(emp => {
        const name = `${emp.nombres} ${emp.apellidos}`.toLowerCase();
        return (
            (name.includes(searchTerm.toLowerCase()) ||
                emp.numeroDocumento.includes(searchTerm) ||
                emp.cargo.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterEstado === 'all' || emp.estado === filterEstado)
        );
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ── Reset form ────────────────────────────────────────────────────────────
    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
        setEditingEmployee(null);
        setShowModal(false);
    };

    // ── Crear ─────────────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const erroresForm     = validarFormEmpleado(form);
        const erroresUnicidad = validarUnicidad(form, empleados, null);
        const errores = { ...erroresForm, ...erroresUnicidad };
        setFormErrors(errores);
        if (hayErrores(errores)) {
            toast.error('Corrige los errores antes de continuar');
            return;
        }
        setSaving(true);
        try {
            await createEmpleado({
                tipoDocumento:   form.tipoDocumento,
                numeroDocumento: form.numeroDocumento,
                nombres:         form.nombres,
                apellidos:       form.apellidos,
                telefono:        form.telefono,
                email:           form.email,
                cargo:           form.cargo as Empleado['cargo'],
                area:            form.area  as Empleado['area'],
                direccion:       form.direccion || undefined,
                ciudad:          form.ciudad   || undefined,
                fechaIngreso:    form.fechaIngreso,
                estado:          form.estado,
            });
            showFeedback('✓ Empleado registrado exitosamente');
            toast.success('Empleado registrado exitosamente');
            resetForm();
            fetchEmpleados();
        } catch (err: any) {
            if (
                err.message?.toLowerCase().includes('duplicate') ||
                err.message?.toLowerCase().includes('duplicado') ||
                err.message?.toLowerCase().includes('ya existe') ||
                err.status === 409
            ) {
                toast.error('Ya existe un empleado con ese documento o correo. Verifica los datos e intenta de nuevo.');
            } else {
                toast.error('Error al registrar: ' + (err?.message ?? 'Error desconocido'));
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Actualizar ────────────────────────────────────────────────────────────
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee?.id) return;
        const erroresForm     = validarFormEmpleado(form);
        const erroresUnicidad = validarUnicidad(form, empleados, editingEmployee.id);
        const errores = { ...erroresForm, ...erroresUnicidad };
        setFormErrors(errores);
        if (hayErrores(errores)) {
            toast.error('Corrige los errores antes de continuar');
            return;
        }
        setSaving(true);
        try {
            await updateEmpleado(editingEmployee.id, {
                tipoDocumento:   form.tipoDocumento,
                numeroDocumento: form.numeroDocumento,
                nombres:         form.nombres,
                apellidos:       form.apellidos,
                telefono:        form.telefono,
                email:           form.email,
                cargo:           form.cargo as Empleado['cargo'],
                area:            form.area  as Empleado['area'],
                direccion:       form.direccion || undefined,
                ciudad:          form.ciudad   || undefined,
                fechaIngreso:    form.fechaIngreso,
                estado:          form.estado,
            });
            showFeedback('✓ Empleado actualizado correctamente');
            toast.success('Empleado actualizado correctamente');
            resetForm();
            fetchEmpleados();
        } catch (err: any) {
            if (
                err.message?.toLowerCase().includes('duplicate') ||
                err.message?.toLowerCase().includes('duplicado') ||
                err.message?.toLowerCase().includes('ya existe') ||
                err.status === 409
            ) {
                toast.error('Ya existe un empleado con ese documento o correo. Verifica los datos e intenta de nuevo.');
            } else {
                toast.error('Error al actualizar: ' + (err?.message ?? 'Error desconocido'));
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Toggle estado ─────────────────────────────────────────────────────────
    const handleToggleEstado = async (emp: Empleado) => {
        const nuevoEstado: 'activo' | 'inactivo' = emp.estado === 'activo' ? 'inactivo' : 'activo';
        setEmpleados(prev => prev.map(e => e.id === emp.id ? { ...e, estado: nuevoEstado } : e));
        setTogglingIds(prev => new Set(prev).add(emp.id!));
        // Limpiar alerta al cambiar estado
        setInactiveAlert(null);
        try {
            await updateEmpleado(emp.id!, { ...emp, estado: nuevoEstado });
            toast.success(`Empleado ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
        } catch {
            setEmpleados(prev => prev.map(e => e.id === emp.id ? { ...e, estado: emp.estado } : e));
            toast.error('Error al cambiar estado');
        } finally {
            setTogglingIds(prev => { const next = new Set(prev); next.delete(emp.id!); return next; });
        }
    };

    // ── Abrir edición ─────────────────────────────────────────────────────────
    const openEdit = (emp: Empleado) => {
        setEditingEmployee(emp);
        setFormErrors({});
        setForm({
            tipoDocumento:   emp.tipoDocumento,
            numeroDocumento: emp.numeroDocumento,
            nombres:         emp.nombres,
            apellidos:       emp.apellidos,
            telefono:        emp.telefono,
            email:           emp.email,
            cargo:           emp.cargo,
            area:            emp.area,
            direccion:       emp.direccion ?? '',
            ciudad:          emp.ciudad    ?? '',
            fechaIngreso:    emp.fechaIngreso,
            estado:          emp.estado,
        });
        setShowModal(true);
    };

    // ── Desactivar ────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deletingEmployee?.id) return;
        setSaving(true);
        try {
            await desactivarEmpleado(deletingEmployee.id);
            showFeedback('✓ Empleado desactivado correctamente');
            toast.success('Empleado desactivado correctamente');
            setShowDeleteModal(false);
            setDeletingEmployee(null);
            setVerificacionEliminacion(null);
            fetchEmpleados();
        } catch (err: any) {
            toast.error('Error al desactivar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ── Verificar si puede eliminarse ──────────────────────────────────────────
    const handleVerificarEliminacion = async (emp: Empleado) => {
        if (!emp.id) return;
        setCheckingDelete(true);
        try {
            const verificacion = await verificarPuedeEliminarse(emp.id);
            setVerificacionEliminacion(verificacion);
            setDeletingEmployee(emp);
            setShowDeleteModal(true);
        } catch (err: any) {
            toast.error('Error al verificar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setCheckingDelete(false);
        }
    };

    // ── Eliminar permanentemente ───────────────────────────────────────────────
    const handleDeletePermanente = async () => {
        if (!deletingEmployee?.id) return;
        setSaving(true);
        try {
            await deleteEmpleado(deletingEmployee.id);
            showFeedback('✓ Empleado eliminado permanentemente');
            toast.success('Empleado eliminado permanentemente');
            setShowDeleteModal(false);
            setDeletingEmployee(null);
            setVerificacionEliminacion(null);
            fetchEmpleados();
        } catch (err: any) {
            toast.error('Error al eliminar: ' + (err?.message ?? 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Empleados</h1>
                    <p className="text-blue-800">Administra el personal de la empresa</p>
                </div>
                <Button
                    onClick={() => { setEditingEmployee(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Registrar Empleado
                </Button>
            </div>

            {/* Filtros */}
            <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                    placeholder="Buscar por nombre, documento o cargo..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="pl-10 w-full"
                    />
                </div>

                <select
                    value={filterEstado}
                    onChange={(e) => {
                    setFilterEstado(e.target.value);
                    setCurrentPage(1);
                    }}
                    className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-40"
                >
                    <option value="all">Todos</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                </select>

                </div>
            </CardContent>
            </Card>

            {/* Tabla */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando empleados...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-900">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Empleado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Teléfono</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Correo</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Cargo / Área</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                                        <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-500">
                                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p>No se encontraron empleados</p>
                                            </td>
                                        </tr>
                                    ) : paginated.map((emp) => {
                                        const isToggling = togglingIds.has(emp.id!);
                                        const isInactive = emp.estado === 'inactivo';
                                        return (
                                            <tr key={emp.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className={`font-semibold ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
                                                        {emp.nombres} {emp.apellidos}
                                                    </p>
                                                    <p className={`text-xs ${isInactive ? 'text-gray-400' : 'text-blue-900'}`}>
                                                        {emp.tipoDocumento} {emp.numeroDocumento}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-1">
                                                        <Phone className={`w-3 h-3 shrink-0 ${isInactive ? 'text-gray-300' : 'text-blue-500'}`} />
                                                        <span className={`text-sm ${isInactive ? 'text-gray-400' : 'text-gray-700'}`}>{emp.telefono ?? '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`text-sm ${isInactive ? 'text-gray-400' : 'text-gray-700'}`}>{emp.email}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className={`font-semibold text-sm ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>{emp.cargo}</p>
                                                    <Badge variant="secondary" className={`mt-1 text-xs ${isInactive ? 'opacity-50' : ''}`}>{emp.area}</Badge>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={emp.estado === 'activo'}
                                                            onCheckedChange={() => handleToggleEstado(emp)}
                                                            disabled={isToggling}
                                                        />
                                                        {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-2">
                                                        {/* Ver detalle: siempre activo */}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => { setViewingEmployee(emp); setShowDetailModal(true); }}
                                                            className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {/* Editar: deshabilitado si inactivo */}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (isInactive) {
                                                                    showInactiveAlert('Empleado inactivo: No puedes editar un empleado inactivo. Actívalo primero usando el interruptor de estado.');
                                                                    return;
                                                                }
                                                                openEdit(emp);
                                                            }}
                                                            disabled={isToggling}
                                                            className={`border transition-colors ${
                                                                isInactive
                                                                    ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed hover:bg-white'
                                                                    : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        {/* Eliminar/Desactivar: deshabilitado si inactivo */}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (isInactive) {
                                                                    showInactiveAlert('Empleado inactivo: No puedes desactivar un empleado que ya está inactivo. Actívalo primero usando el interruptor de estado.');
                                                                    return;
                                                                }
                                                                handleVerificarEliminacion(emp);
                                                            }}
                                                            disabled={isToggling || checkingDelete}
                                                            className={`border transition-colors ${
                                                                isInactive
                                                                    ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed hover:bg-white'
                                                                    : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            {checkingDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                                <Button variant="outline" size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button key={page} size="sm" onClick={() => setCurrentPage(page)}
                                        className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}>
                                        {page}
                                    </Button>
                                ))}
                                <Button variant="outline" size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Alerta de empleado inactivo */}
            {inactiveAlert && (
                <InactiveAlert
                    mensaje={inactiveAlert}
                    onClose={() => setInactiveAlert(null)}
                />
            )}

            {/* Feedback Banner */}
            {feedbackMsg && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{feedbackMsg}</span>
                </div>
            )}

            {/* ═══ MODAL — CREAR / EDITAR ═══ */}
            <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}</DialogTitle>
                        <DialogDescription>
                            {editingEmployee
                                ? 'Modifica la información del empleado.'
                                : 'Completa todos los campos obligatorios (*).'}
                        </DialogDescription>
                    </DialogHeader>

                    {Object.keys(formErrors).some(k => formErrors[k as keyof FormErrors]) && (
                        <div className="mt-4">
                            <InfoAlert message="Algunos campos requieren atención antes de continuar." />
                        </div>
                    )}

                    <form onSubmit={editingEmployee ? handleUpdate : handleCreate} className="mt-4 space-y-4">
                        <FormFields
                            form={form}
                            setForm={setForm}
                            errores={formErrors}
                            setErrores={setFormErrors}
                            roles={roles}
                        />
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Cancelar</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {editingEmployee ? 'Guardar Cambios' : 'Registrar Empleado'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — VER DETALLE ═══ */}
            <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) setShowDetailModal(false); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>Detalle del Empleado</DialogTitle>
                        <DialogDescription>Información completa del empleado seleccionado.</DialogDescription>
                    </DialogHeader>
                    {viewingEmployee && (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Nombre Completo</p>
                                    <p className="font-semibold text-blue-900 text-lg">{viewingEmployee.nombres} {viewingEmployee.apellidos}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Identificación</p>
                                    <p className="font-semibold text-sm">{viewingEmployee.tipoDocumento} {viewingEmployee.numeroDocumento}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Estado</p>
                                    <Badge className={viewingEmployee.estado === 'activo' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-500'}>
                                        {viewingEmployee.estado}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Mail className="w-3 h-3" /> Correo</p>
                                    <p className="font-semibold text-sm">{viewingEmployee.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</p>
                                    <p className="font-semibold text-sm">{viewingEmployee.telefono}</p>
                                </div>
                                {viewingEmployee.ciudad && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> Ciudad</p>
                                        <p className="font-semibold text-sm">{viewingEmployee.ciudad}</p>
                                    </div>
                                )}
                                {viewingEmployee.direccion && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Dirección</p>
                                        <p className="font-semibold text-sm">{viewingEmployee.direccion}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3" /> Cargo</p>
                                    <p className="font-semibold text-sm">{viewingEmployee.cargo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Área</p>
                                    <Badge variant="secondary">{viewingEmployee.area}</Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha de Ingreso</p>
                                    <p className="font-semibold text-sm">{viewingEmployee.fechaIngreso}</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cerrar</Button>
                                {viewingEmployee.estado === 'activo' && (
                                    <Button
                                        onClick={() => { openEdit(viewingEmployee); setShowDetailModal(false); }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Editar Empleado
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL — CONFIRMAR DESACTIVACIÓN/ELIMINACIÓN ═══ */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => { if (!open) { setShowDeleteModal(false); setDeletingEmployee(null); setVerificacionEliminacion(null); } }}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-900">
                            <Trash2 className="w-5 h-5" />
                            {verificacionEliminacion?.puedeEliminarse ? 'Eliminar Empleado' : 'Desactivar Empleado'}
                        </DialogTitle>
                        <DialogDescription>
                            {verificacionEliminacion?.puedeEliminarse 
                                ? 'Este empleado puede ser eliminado permanentemente del sistema.'
                                : 'Este empleado está vinculado a otros registros y solo puede ser desactivado.'}
                        </DialogDescription>
                    </DialogHeader>

                    {deletingEmployee && verificacionEliminacion && (
                        <div className="mt-4 space-y-3">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-semibold text-blue-900">{deletingEmployee.nombres} {deletingEmployee.apellidos}</p>
                                <p className="text-sm text-blue-700 mt-1">{deletingEmployee.tipoDocumento} {deletingEmployee.numeroDocumento}</p>
                                <p className="text-sm text-blue-700">{deletingEmployee.cargo} — {deletingEmployee.area}</p>
                            </div>

                            {verificacionEliminacion.puedeEliminarse ? (
                                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3">
                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold">Empleado sin referencias</p>
                                        <p className="text-blue-700 mt-0.5">Este empleado puede ser <strong>eliminado permanentemente</strong> del sistema.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold">Empleado vinculado a otros registros</p>
                                        <p className="text-amber-700 mt-0.5">No se puede eliminar. Solo puede ser <strong>desactivado</strong>.</p>
                                        <div className="mt-2 text-xs text-amber-700 bg-white bg-opacity-50 p-2 rounded">
                                            <p className="font-semibold mb-1">Referencias encontradas:</p>
                                            {verificacionEliminacion.referencias.novedadesRegistradas > 0 && <p>• Novedades registradas: {verificacionEliminacion.referencias.novedadesRegistradas}</p>}
                                            {verificacionEliminacion.referencias.novedadesResponsable > 0 && <p>• Novedades como responsable: {verificacionEliminacion.referencias.novedadesResponsable}</p>}
                                            {verificacionEliminacion.referencias.novedadesAfectado > 0 && <p>• Novedades como afectado: {verificacionEliminacion.referencias.novedadesAfectado}</p>}
                                            {verificacionEliminacion.referencias.ordenesProduccion > 0 && <p>• Órdenes de producción: {verificacionEliminacion.referencias.ordenesProduccion}</p>}
                                            {verificacionEliminacion.referencias.fichaTecnicaCount > 0 && <p>• Fichas técnicas: {verificacionEliminacion.referencias.fichaTecnicaCount}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={() => { setShowDeleteModal(false); setDeletingEmployee(null); setVerificacionEliminacion(null); }} disabled={saving}>
                            Cancelar
                        </Button>
                        {verificacionEliminacion?.puedeEliminarse ? (
                            <Button
                                onClick={handleDeletePermanente}
                                disabled={saving}
                                className="bg-white hover:bg-blue-50 text-blue-600"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Eliminar Permanentemente
                            </Button>
                        ) : (
                            <Button
                                onClick={handleDelete}
                                disabled={saving}
                                className="bg-white hover:bg-blue-50 text-blue-600"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Desactivar
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}