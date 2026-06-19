/**
 * ClientManagement.tsx
 * Página principal de administración de clientes.
 *
 * Responsabilidades:
 *   - Listar clientes con búsqueda (nombre, documento, email, teléfono) y
 *     filtro por estado (activo / inactivo / todos).
 *   - Crear y editar clientes (Persona Natural o Empresa) con validación
 *     local y verificación de unicidad en tiempo real vía useUniquenessCheck.
 *   - Permitir la desactivación lógica con toggle de estado (solo admin).
 *   - Lanzar la eliminación física solo cuando el cliente no tiene historial,
 *     bloqueando el botón para clientes inactivos hasta que sean reactivados.
 *   - Mostrar el modal de detalle con toda la ficha del cliente.
 *
 * Acceso diferenciado: el rol 'administrador' puede cambiar estado y eliminar;
 * otros roles solo pueden ver y editar clientes activos.
 */
// src/features/clients/ClientManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { SmartPagination } from '@/shared/components/SmartPagination';
import { Input } from '@/shared/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';
import {
    Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
    AlertTriangle, User, X, Search, Loader2,
    CheckCircle2, Info, Lock,
    Mail, Phone, MapPin, Hash, FileText, Tag, Building2, XCircle,
    KeyRound, EyeOff,
} from 'lucide-react';
import {
    getClientes, createCliente, updateCliente,
    deleteCliente, forceDeleteCliente,
} from '../services/clientesService';

// Tipos de documento disponibles según la categoría del cliente.
// Persona Natural admite cédula, extranjería, pasaporte y RUT;
// Empresa solo opera con NIT o RUT, ya que son los identificadores tributarios.
const DOCS_PERSONA_NATURAL = [
    { value: 'cedula',                label: 'Cédula de Ciudadanía'  },
    { value: 'cedula de extranjeria', label: 'Cédula de Extranjería' },
    { value: 'pasaporte',             label: 'Pasaporte'             },
    { value: 'rut',                   label: 'RUT'                   },
];
const DOCS_EMPRESA = [
    { value: 'nit', label: 'NIT' },
    { value: 'rut', label: 'RUT' },
];

// ── Interfaces ────────────────────────────────────────────────────────────────
// clientType es un campo derivado calculado en el frontend: si nombres='N/A'
// el registro se trata como Empresa, de lo contrario como Persona Natural.
// No existe en BD; se enriquece al cargar la lista para simplificar la vista.
interface Cliente {
    id: number;
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    razon_social: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
    estado: 'activo' | 'inactivo';
    clientType?: 'Persona natural' | 'Empresa';
    contacto?: string | null;
}

interface FormData {
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    razon_social: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
    clientType: 'Persona natural' | 'Empresa';
    estado: 'activo' | 'inactivo';
    contacto: string;
    password: string;
    confirmPassword: string;
}

// FormErrors mapea cada campo editable a su mensaje de error.
// Todos los campos son opcionales para permitir validación incremental
// (solo se muestra el error del campo que falló, no de todos).
interface FormErrors {
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    contacto?: string;
    numero_documento?: string;
    email?: string;
    telefono?: string;
    ciudad?: string;
    direccion?: string;
    password?: string;
    confirmPassword?: string;
}

/**
 * Valida el formulario de creación/edición en el cliente (sin llamadas a red).
 * La validación se bifurca según clientType para aplicar reglas distintas:
 *   - Persona Natural → nombres + apellidos obligatorios; solo letras y espacios.
 *   - Empresa         → razón social + persona de contacto obligatorios.
 * La contraseña es completamente opcional; si se proporciona debe cumplir la
 * política de seguridad (8 chars, mayúscula, número, carácter especial).
 * Esta función es síncrona; la unicidad en tiempo real se delega al hook.
 */
function validarFormulario(data: FormData): FormErrors {
    const errs: FormErrors = {};
    // Expresión reutilizada en varios campos de texto libre para rechazar números
    // y símbolos donde el negocio solo espera nombres o ciudades.
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

    if (data.clientType === 'Persona natural') {
        if (!data.nombres.trim())
            errs.nombres = 'El nombre es obligatorio';
        else if (data.nombres.trim().length < 2)
            errs.nombres = 'Mínimo 2 caracteres';
        else if (!soloLetras.test(data.nombres.trim()))
            errs.nombres = 'Solo letras y espacios';

        if (!data.apellidos.trim())
            errs.apellidos = 'Los apellidos son obligatorios';
        else if (data.apellidos.trim().length < 2)
            errs.apellidos = 'Mínimo 2 caracteres';
        else if (!soloLetras.test(data.apellidos.trim()))
            errs.apellidos = 'Solo letras y espacios';
    } else {
        if (!data.razon_social.trim())
            errs.razon_social = 'La razón social es obligatoria';
        else if (data.razon_social.trim().length > 100)
            errs.razon_social = 'Máximo 100 caracteres';

        if (!data.contacto.trim())
            errs.contacto = 'El contacto es obligatorio';
        else if (!soloLetras.test(data.contacto.trim()))
            errs.contacto = 'Solo letras y espacios';
    }

    if (!data.numero_documento.trim())
        errs.numero_documento = 'El número de documento es obligatorio';
    else if (data.numero_documento.trim().length < 5)
        errs.numero_documento = 'Mínimo 5 caracteres';
    else if (data.tipo_documento === 'nit' && !/^\d{9,10}(-\d)?$/.test(data.numero_documento.trim()))
        errs.numero_documento = 'Formato: 900123456-7';

    if (!data.email.trim())
        errs.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
        errs.email = 'Correo inválido';

    if (!data.telefono.trim())
        errs.telefono = 'El teléfono es obligatorio';
    else if (data.telefono.trim().length < 7)
        errs.telefono = 'Mínimo 7 dígitos';

    if (!data.ciudad.trim())
        errs.ciudad = 'La ciudad es obligatoria';
    else if (!soloLetras.test(data.ciudad.trim()))
        errs.ciudad = 'Solo letras y espacios';

    if (!data.direccion.trim())
        errs.direccion = 'La dirección es obligatoria';

    // La contraseña es opcional para permitir clientes sin acceso al portal.
    // Si se intenta confirmar sin haberla escrito primero, se alerta al usuario
    // para evitar confusión sobre qué campo está incompleto.
    if (data.password.trim()) {
        if (data.password.length < 8)
            errs.password = 'Mínimo 8 caracteres';
        else if (!/[A-Z]/.test(data.password))
            errs.password = 'Debe contener al menos una mayúscula';
        else if (!/[0-9]/.test(data.password))
            errs.password = 'Debe contener al menos un número';
        else if (!/[!@#$%^&*()\-_=+[\]{};':",.<>?/\\|`~]/.test(data.password))
            errs.password = 'Debe contener al menos un carácter especial';

        if (!errs.password && data.password !== data.confirmPassword)
            errs.confirmPassword = 'Las contraseñas no coinciden';
    } else if (data.confirmPassword.trim()) {
        errs.password = 'Ingresa la contraseña primero';
    }

    return errs;
}

// ── Banner de notificación inline ─────────────────────────────────────────────
// El banner global vive encima de la tabla y muestra el resultado de la última
// operación (crear, editar, eliminar). Se auto-descarta a los 5 segundos para
// no saturar la UI en flujos de trabajo repetitivos.
type BannerVariant = 'success' | 'error' | 'warning' | 'info';

interface BannerMsg {
    text: string;
    variant: BannerVariant;
}

const bannerStyles: Record<BannerVariant, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50   border-red-200   text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info:    'bg-blue-50  border-blue-200  text-blue-800',
};

const bannerIcons: Record<BannerVariant, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
    error:   <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info:    <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

// Componente auxiliar para renderizar mensajes de error bajo cada campo.
// Retorna null si no hay error para no ocupar espacio visual innecesario.
function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{msg}</p>;
}

// Fila de información en el modal de detalle: icono + etiqueta + valor.
// Se parametrizan los colores para adaptar el estilo según el estado del cliente
// (activo → azul, inactivo → gris) sin duplicar el componente.
function ClientInfoItem({ icon, label, value, iconBg, iconColor }: {
    icon: React.ReactNode; label: string; value: string;
    iconBg: string; iconColor: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 160px' }}>
            <div style={{ background: iconBg, borderRadius: 8, padding: 8, display: 'flex', color: iconColor }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Componente principal de gestión de clientes.
 * onNavigateToSales permite al componente padre navegar al módulo de ventas
 * (por ejemplo, al hacer clic en el historial de un cliente), manteniendo
 * la separación entre módulos sin acoplamiento directo al router.
 */
export function ClientManagement({ onNavigateToSales }: { onNavigateToSales?: () => void }) {
    // El rol se lee de localStorage en lugar de un contexto global porque
    // el panel de administración no requiere reactividad sobre cambios de sesión.
    const stored = localStorage.getItem('jrepuestos_user');
    const currentUser = stored ? JSON.parse(stored) : null;
    const isAdmin = currentUser?.role?.toLowerCase() === 'administrador';

    const [clients, setClients]         = useState<Cliente[]>([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
    const [showPwd, setShowPwd]         = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);

    const [showModal, setShowModal]             = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingClient, setEditingClient]   = useState<Cliente | null>(null);
    const [viewingClient, setViewingClient]   = useState<Cliente | null>(null);
    const [deletingClient, setDeletingClient] = useState<Cliente | null>(null);

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 5;

    // Banner global (encima de la tabla)
    const [banner, setBanner] = useState<BannerMsg | null>(null);
    const showBanner = useCallback((text: string, variant: BannerVariant = 'info') => {
        setBanner({ text, variant });
        setTimeout(() => setBanner(null), 5000);
    }, []);

    // Banner por fila: aparece debajo del cliente inactivo cuando el operador
    // intenta editar o eliminar sin haberlo reactivado primero, explicando
    // qué acción debe tomar en lugar de simplemente ignorar el clic.
    const [inactiveBannerId, setInactiveBannerId] = useState<number | null>(null);
    const [inactiveBannerAction, setInactiveBannerAction] = useState<'edit' | 'delete' | null>(null);

    const triggerInactiveBanner = (id: number, action: 'edit' | 'delete') => {
        setInactiveBannerId(id);
        setInactiveBannerAction(action);
        setTimeout(() => { setInactiveBannerId(null); setInactiveBannerAction(null); }, 4000);
    };

    // Errores de formulario
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const emptyForm: FormData = {
        nombres: '', apellidos: '', razon_social: '',
        tipo_documento: 'cedula', numero_documento: '',
        telefono: '', email: '', direccion: '', ciudad: '',
        clientType: 'Persona natural', estado: 'activo',
        contacto: '', password: '', confirmPassword: '',
    };
    const [formData, setFormData] = useState<FormData>(emptyForm);

//<<<<<<< HEAD
    // ── Verificación de unicidad en tiempo real ─────────────────────────────────
    // Cada hook consulta /clientes/verificar con debounce para evitar saturar la API
    // mientras el usuario escribe. Al editar, se pasa excluirId para que el backend
    // no considere el propio registro como duplicado.
    const excluirId = editingClient?.id;
    const docCheck   = useUniquenessCheck('clientes', 'numero_documento', excluirId);
    const emailCheck = useUniquenessCheck('clientes', 'email', excluirId);
    const phoneCheck = useUniquenessCheck('clientes', 'telefono', excluirId);
    // El botón de submit se bloquea si alguno de los tres campos únicos ya existe,
    // evitando una llamada fallida al backend que el usuario ya podría corregir.
    const hayErroresUnicidad = !!docCheck.error || !!emailCheck.error || !!phoneCheck.error;

    // Revalidar reglas locales cada vez que cambia el formulario, pero solo
    // después del primer intento de envío para no molestar al usuario antes de tiempo.
//=======
    // Revalidar en tiempo real cuando el usuario ya intentó enviar
//>>>>>>> e92d0780424bd94b1ef634ffe7c275903b6d731e
    useEffect(() => {
        if (submitAttempted) setFormErrors(validarFormulario(formData));
    }, [formData, submitAttempted]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    /**
     * Carga todos los clientes desde la API y les agrega el campo derivado
     * clientType. La convención nombres='N/A' indica que es una Empresa; en BD
     * no existe una columna tipo_cliente para no duplicar información que ya
     * se infiere del tipo de documento y de si tiene razón social.
     */
    const fetchClientes = async () => {
        try {
            setLoading(true);
            const data = await getClientes();
            // Enriquecimiento local: clientType no viene del backend, se deduce
            // del valor centinela 'N/A' usado en nombres para registros de empresa.
            const enriched = data.map((c: Cliente) => ({
                ...c,
                clientType: c.nombres === 'N/A' ? 'Empresa' : 'Persona natural',
            }));
            setClients(enriched);
        } catch (error: any) {
            toast.error(`Error al cargar clientes: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClientes(); }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    /**
     * Resuelve el nombre visible para tabla, avatar y modales.
     * Para empresas devuelve la razón social (fallback: persona de contacto),
     * para personas naturales concatena nombres y apellidos.
     * El doble chequeo (clientType + nombres==='N/A') cubre casos donde el
     * campo derivado aún no fue enriquecido tras una carga parcial.
     */
    const getDisplayName = (client: Cliente): string => {
        if (client.clientType === 'Empresa' || client.nombres === 'N/A') {
            return client.razon_social || client.contacto || 'Sin nombre';
        }
        return `${client.nombres || ''} ${client.apellidos || ''}`.trim() || 'Sin nombre';
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    };

    /**
     * Limpia completamente el estado del formulario y los checks de unicidad.
     * Se llama al cancelar, al cerrar el modal y al terminar un guardado exitoso,
     * para que la próxima apertura siempre parta de un estado limpio.
     */
    const resetForm = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setSubmitAttempted(false);
        setEditingClient(null);
        setShowModal(false);
    };

    /**
     * Al cambiar el tipo de cliente se resetean los campos que difieren entre
     * ambas categorías (nombres vs razón social, tipo de documento, número).
     * Esto evita que datos de un tipo anterior contaminen el nuevo registro,
     * por ejemplo que quede un NIT en un campo de cédula.
     */
    const handleClientTypeChange = (value: 'Persona natural' | 'Empresa') => {
        setFormData(prev => ({
            ...prev,
            clientType:       value,
            tipo_documento:   value === 'Empresa' ? 'nit' : 'cedula',
            numero_documento: '',
            nombres: '', apellidos: '', razon_social: '', contacto: '',
        }));
        // Limpiar errores al cambiar de tipo evita mensajes huérfanos de campos
        // que ya no son visibles (ej. error en "apellidos" si ahora es Empresa).
        if (submitAttempted) setFormErrors({});
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    /**
     * Maneja la creación o actualización de un cliente.
     * Flujo:
     *   1. Validación local (sincrona) — campos vacíos, formatos, contraseña.
     *   2. Construcción del payload normalizado para el backend.
     *      - Empresas usan 'N/A' en nombres/apellidos como valor centinela BD.
     *      - La contraseña solo se envía si el operador la completó.
     *   3. Llamada a la API y refresco de la lista tras éxito.
     *   4. Gestión granular de errores de duplicado del backend, pintando el
     *      error directamente en el campo afectado sin recargar el formulario.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);

        const errs = validarFormulario(formData);
        setFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            showBanner('Corrige los errores del formulario antes de continuar', 'warning');
            return;
        }

        const isEmpresa = formData.clientType === 'Empresa';
        // Para empresas, nombres y apellidos se llenan con 'N/A' porque la BD
        // requiere un valor en esas columnas aunque el dato real sea razon_social.
        const payload = {
            nombres:          isEmpresa ? 'N/A' : formData.nombres,
            apellidos:        isEmpresa ? 'N/A' : formData.apellidos,
            razon_social:     isEmpresa ? formData.razon_social : '',
            tipo_documento:   formData.tipo_documento,
            numero_documento: formData.numero_documento,
            telefono:         formData.telefono,
            email:            formData.email,
            direccion:        formData.direccion,
            ciudad:           formData.ciudad,
            estado:           formData.estado,
            ...(isEmpresa ? { contacto: formData.contacto } : {}),
            // La contraseña se omite del payload si está vacía para no sobreescribir
            // accidentalmente la contraseña existente en una edición sin cambio de clave.
            ...(formData.password ? { password: formData.password, confirmPassword: formData.confirmPassword } : {}),
        };

        try {
            setSaving(true);
            if (editingClient) {
                await updateCliente(editingClient.id, payload);
                showBanner('Cliente actualizado correctamente', 'success');
                toast.success('Cliente actualizado exitosamente');
            } else {
                await createCliente(payload);
                showBanner('Cliente creado exitosamente', 'success');
                toast.success('Cliente creado exitosamente');
            }
            await fetchClientes();
            resetForm();
        } catch (error: any) {
            // Análisis granular del error del backend para marcar exactamente
            // el campo duplicado sin mostrar un mensaje genérico que confunda al operador.
            // Se revisan tanto el mensaje principal como el array de errores de validación.
            const msg: string = error.message?.toLowerCase() ?? '';
            const errores: string[] = error.errores ?? [];

            const emailDuplicado = errores.some((e: string) =>
                e.toLowerCase().includes('correo') || e.toLowerCase().includes('email')
            ) || msg.includes('email') || msg.includes('correo');

            const docDuplicado = errores.some((e: string) =>
                e.toLowerCase().includes('documento')
            ) || msg.includes('documento') || msg.includes('duplicate') || error.status === 409;

            if (emailDuplicado && docDuplicado) {
                showBanner('El correo electrónico y el número de documento ya están registrados', 'error');
                setFormErrors(prev => ({
                    ...prev,
                    email:            'Este correo ya está registrado',
                    numero_documento: 'Este documento ya está registrado',
                }));
            } else if (emailDuplicado) {
                showBanner('Ya existe un cliente registrado con ese correo electrónico', 'error');
                setFormErrors(prev => ({ ...prev, email: 'Este correo ya está registrado' }));
            } else if (docDuplicado) {
                showBanner('Ya existe un cliente registrado con ese número de documento', 'error');
                setFormErrors(prev => ({ ...prev, numero_documento: 'Este documento ya está registrado' }));
            } else if (errores.length > 0) {
                errores.forEach((err: string) => toast.error(err));
                showBanner(errores[0], 'error');
            } else {
                showBanner(`Error: ${error.message}`, 'error');
                toast.error(`Error: ${error.message}`);
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Editar ────────────────────────────────────────────────────────────────
    /**
     * Pre-carga el formulario con los datos del cliente seleccionado para edición.
     * Los clientes inactivos no pueden editarse: se exige reactivarlos primero
     * para garantizar que el operador toma conciencia del cambio de estado.
     * Se resetean los hooks de unicidad para que no queden errores residuales
     * del último formulario abierto.
     */
    const handleEdit = (client: Cliente) => {
        if (client.estado === 'inactivo') {
            triggerInactiveBanner(client.id, 'edit');
            return;
        }
        const isEmpresa = client.clientType === 'Empresa' || client.nombres === 'N/A';
        setFormData({
            nombres:          isEmpresa ? '' : client.nombres,
            apellidos:        isEmpresa ? '' : client.apellidos,
            razon_social:     isEmpresa ? client.razon_social : '',
            tipo_documento:   client.tipo_documento || (isEmpresa ? 'nit' : 'cedula'),
            numero_documento: client.numero_documento,
            telefono:         client.telefono,
            email:            client.email,
            direccion:        client.direccion || '',
            ciudad:           client.ciudad || '',
            clientType:       isEmpresa ? 'Empresa' : 'Persona natural',
            estado:           client.estado ?? 'activo',
            contacto:         client.contacto || '',
            password:         '',
            confirmPassword:  '',
        });
        setFormErrors({});
        setSubmitAttempted(false);
        setEditingClient(client);
        setShowModal(true);
    };

    // ── Toggle estado ─────────────────────────────────────────────────────────
    /**
     * Cambia el estado del cliente entre activo/inactivo de forma optimista:
     * actualiza la UI inmediatamente y revierte si la API falla.
     * El Set togglingIds permite deshabilitar todos los botones de esa fila
     * mientras la petición está en vuelo, evitando dobles clics concurrentes.
     * Solo disponible para el rol administrador (el botón no se renderiza para otros).
     */
    const handleToggleEstado = async (client: Cliente) => {
        const nuevoEstado: 'activo' | 'inactivo' = client.estado === 'activo' ? 'inactivo' : 'activo';
        // Actualización optimista: la UI responde de inmediato sin esperar la red.
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, estado: nuevoEstado } : c));
        setTogglingIds(prev => new Set(prev).add(client.id));
        try {
            await updateCliente(client.id, { estado: nuevoEstado });
            toast.success(`Cliente ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
        } catch (error: any) {
            // Rollback: si la API falla se restaura el estado previo para mantener
            // la consistencia entre la UI y la BD.
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, estado: client.estado } : c));
            toast.error(`Error: ${error.message}`);
        } finally {
            setTogglingIds(prev => { const next = new Set(prev); next.delete(client.id); return next; });
        }
    };

    // ── Eliminar ──────────────────────────────────────────────────────────────
    /**
     * Abre el modal de confirmación de eliminación para el cliente seleccionado.
     * Los clientes inactivos tampoco pueden eliminarse directamente: requieren
     * ser reactivados primero, lo que obliga al operador a revisar su estado
     * antes de tomar una acción irreversible.
     */
    const handleDelete = (client: Cliente) => {
        if (client.estado === 'inactivo') {
            triggerInactiveBanner(client.id, 'delete');
            return;
        }
        setDeletingClient(client);
        setShowDeleteModal(true);
    };

    /**
     * Ejecuta la eliminación física tras la confirmación del operador.
     * Llama a /force, que el backend solo acepta si el cliente no tiene
     * historial de ventas ni pedidos; de lo contrario devuelve 400 y el
     * mensaje de error se muestra al operador sin cerrar el modal.
     */
    const confirmDelete = async () => {
        if (!deletingClient) return;
        try {
            setSaving(true);
            await forceDeleteCliente(deletingClient.id);
            showBanner('Cliente eliminado exitosamente', 'success');
            toast.success('Cliente eliminado exitosamente');
            await fetchClientes();
        } catch (error: any) {
            // El backend puede rechazar la eliminación si se detectó historial
            // en Ventas después de que el usuario abrió el modal de confirmación.
            toast.error(`No se puede eliminar: ${error.message}`);
            showBanner(`No se puede eliminar: ${error.message}`, 'error');
        } finally {
            setSaving(false);
            setShowDeleteModal(false);
            setDeletingClient(null);
        }
    };

    // ── Filtros y paginación ──────────────────────────────────────────────────
    // El filtrado es completamente local (sin llamadas a la API) porque el
    // volumen de clientes no justifica paginación en servidor. Los criterios
    // de búsqueda cubren los campos más usados por los operadores en su día a día.
    const filteredClients = clients.filter((client) => {
        const name = getDisplayName(client);
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            name.toLowerCase().includes(q) ||
            (client.numero_documento ?? '').includes(searchTerm) ||
            (client.email ?? '').toLowerCase().includes(q) ||
            (client.telefono ?? '').includes(searchTerm);
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active'   && client.estado === 'activo') ||
            (statusFilter === 'inactive' && client.estado === 'inactivo');
        return matchesSearch && matchesStatus;
    });

    const totalPages     = Math.ceil(filteredClients.length / itemsPerPage);
    const currentClients = filteredClients.slice(
        (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const docsDisponibles = formData.clientType === 'Empresa' ? DOCS_EMPRESA : DOCS_PERSONA_NATURAL;

    // ── Helpers de input con restricciones ───────────────────────────────────
    // Estas funciones sanitizan el valor en cada pulsación de tecla para
    // rechazar caracteres inválidos antes de que lleguen al estado o al backend.
    // Se prefiere este enfoque frente a solo validar al submit para dar
    // retroalimentación inmediata y reducir errores de formato en producción.
    const onlyLetters   = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    const onlyPhone     = (v: string) => v.replace(/[^0-9+\s\-]/g, '');
    // El formato de documento varía según tipo: cédula/RUT solo números,
    // NIT acepta guion para el dígito de verificación (ej. 900123456-7),
    // pasaporte acepta alfanumérico.
    const onlyDoc       = (v: string, tipo: string) => {
        if (tipo === 'cedula' || tipo === 'rut') return v.replace(/[^0-9]/g, '');
        if (tipo === 'nit')                       return v.replace(/[^0-9\-]/g, '');
        return v.replace(/[^a-zA-Z0-9]/g, '');
    };
    // Dirección admite números y caracteres especiales comunes en nomenclatura
    // colombiana (Calle 50 #25-30, Manzana A, etc.).
    const onlyAddress   = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s#\-\.]/g, '');
    // El email no puede tener espacios; se eliminan en tiempo real para evitar
    // errores de validación por espacios accidentales al pegar desde el portapapeles.
    const noSpaces      = (v: string) => v.replace(/\s/g, '');

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">

            {/* ── Banner global ──────────────────────────────────────────── */}
            {banner && (
                <div className={`flex items-center gap-3 border rounded-xl px-5 py-3 shadow-sm ${bannerStyles[banner.variant]}`}>
                    {bannerIcons[banner.variant]}
                    <span className="text-sm font-medium flex-1">{banner.text}</span>
                    <button onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl text-blue-900 font-bold mb-2">Gestión de Clientes</h1>
                    <p className="text-blue-800">Administra la base de datos de clientes</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />Nuevo Cliente
                </Button>
            </div>

            {/* ── Filtros ─────────────────────────────────────────────────── */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

                        {/* 🔍 Búsqueda */}
                        <div className="relative w-full sm:flex-[3]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <Input
                                placeholder="Buscar por nombre, documento, email o teléfono..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 w-full"
                            />
                        </div>

                        {/* ⚙️ Filtro */}
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-1/4 sm:w-40 sm:flex-[1]"
                        >
                            <option value="all">Todos</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>

                    </div>
                </CardContent>
            </Card>

            {/* ── Tabla ───────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">Cargando clientes...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Cliente</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Contacto</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentClients.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-gray-500">
                                                No se encontraron clientes
                                            </td>
                                        </tr>
                                    ) : currentClients.map((client) => {
                                        const displayName  = getDisplayName(client);
                                        const isToggling   = togglingIds.has(client.id);
                                        const isInactive   = client.estado === 'inactivo';
                                        const showRowBanner =
                                            inactiveBannerId === client.id && inactiveBannerAction !== null;

                                        return (
                                            <React.Fragment key={client.id}>
                                                <tr className={`border-b border-blue-100 transition-colors ${
                                                    isInactive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'
                                                }`}>
                                                    {/* Cliente */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-3">
                                                            <Avatar className="w-9 h-9">
                                                                <AvatarFallback className={`text-sm ${isInactive ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                                                                    {getInitials(displayName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className={`font-semibold text-sm ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                    {displayName}
                                                                </p>
                                                                <p className={`text-xs ${isInactive ? 'text-gray-400' : 'text-blue-900'}`}>
                                                                    {client.tipo_documento} {client.numero_documento}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Contacto */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm ${isInactive ? 'text-gray-400' : 'text-gray-700'}`}>{client.email}</span>
                                                            <span className="text-xs text-gray-400">{client.telefono}</span>
                                                        </div>
                                                    </td>

                                                    {/* Tipo */}
                                                    <td className="py-4 px-6">
                                                        <Badge variant="secondary">{client.clientType ?? 'Persona natural'}</Badge>
                                                    </td>

                                                    {/* Estado */}
                                                    <td className="py-4 px-6">
                                                        {isAdmin ? (
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={client.estado === 'activo'}
                                                                    onCheckedChange={() => handleToggleEstado(client)}
                                                                    disabled={isToggling}
                                                                />
                                                                {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                                                            </div>
                                                        ) : (
                                                            <Badge className={client.estado === 'activo'
                                                                ? 'bg-blue-100 text-blue-900'
                                                                : 'bg-gray-100 text-gray-500'}>
                                                                {client.estado}
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    {/* Acciones */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-2">

                                                            {/* Ver */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => { setViewingClient(client); setShowDetailModal(true); }}
                                                                className="bg-white text-blue-900 border border-blue-900 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>

                                                            {/* Editar */}
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleEdit(client)}
                                                                disabled={isToggling}
                                                                title={isInactive ? 'Cliente inactivo' : 'Editar'}
                                                                className={`border transition-all duration-200 ${
                                                                    isInactive
                                                                        ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                                        : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>

                                                            {/* Eliminar — solo administrador */}
                                                            {isAdmin && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleDelete(client)}
                                                                    disabled={isToggling}
                                                                    title={isInactive ? 'Cliente inactivo' : 'Eliminar'}
                                                                    className={`border transition-all duration-200 ${
                                                                        isInactive
                                                                            ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                                            : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                                                                    }`}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}

                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Banner inline por fila (cliente inactivo) ── */}
                                                {showRowBanner && (
                                                    <tr className="border-b border-amber-100">
                                                        <td colSpan={5} className="px-6 py-0">
                                                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 my-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                                                                <span>
                                                                    <strong>Cliente inactivo:</strong>{' '}
                                                                    {inactiveBannerAction === 'edit'
                                                                        ? 'No puedes editar un cliente inactivo. Actívalo primero usando el interruptor de estado.'
                                                                        : 'No puedes eliminar un cliente inactivo. Actívalo primero usando el interruptor de estado.'}
                                                                </span>
                                                                <button
                                                                    onClick={() => { setInactiveBannerId(null); setInactiveBannerAction(null); }}
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
                        <SmartPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredClients.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </CardContent>
                </Card>
            )}

            {/* ── MODAL CREAR / EDITAR ────────────────────────────────────── */}
            <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
                <DialogContent className="p-0 gap-0 overflow-hidden" style={{ width: '95vw', maxWidth: 780, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
                    <div className="overflow-y-auto flex-1 p-6">
                        <DialogHeader className="mb-4">
                            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                            <DialogDescription>
                                {editingClient
                                    ? 'Modifica los datos del cliente.'
                                    : 'Completa el formulario para registrar un nuevo cliente.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} noValidate className="space-y-4">

                            {/* Tipo de cliente + Tipo de documento */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Tipo de cliente <span className="text-red-500">*</span>
                                    </label>
                                    <Select value={formData.clientType} onValueChange={handleClientTypeChange}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Persona natural">Persona natural</SelectItem>
                                            <SelectItem value="Empresa">Empresa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Tipo de documento <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={formData.tipo_documento}
                                        onValueChange={(value) =>
                                            setFormData(prev => ({ ...prev, tipo_documento: value, numero_documento: '' }))
                                        }
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {docsDisponibles.map(doc => (
                                                <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Número de documento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Número de documento <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formData.numero_documento}
                                    onChange={(e) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            numero_documento: onlyDoc(e.target.value, prev.tipo_documento),
                                        }))
                                    }
                                    maxLength={20}
                                    placeholder={formData.tipo_documento === 'nit' ? '900123456-7' : '123456789'}
                                    className={formErrors.numero_documento ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.numero_documento} />
                            </div>

                            {/* Nombre / Razón social + Contacto */}
                            {formData.clientType === 'Persona natural' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Nombres <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.nombres}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, nombres: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={30}
                                            placeholder="Ej: Carlos"
                                            className={formErrors.nombres ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.nombres} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Apellidos <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.apellidos}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, apellidos: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={30}
                                            placeholder="Ej: Medina López"
                                            className={formErrors.apellidos ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.apellidos} />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Razón Social <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.razon_social}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, razon_social: e.target.value.slice(0, 30) }))
                                            }
                                            maxLength={30}
                                            placeholder="Ej: Auto Servicio López S.A.S"
                                            className={formErrors.razon_social ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.razon_social} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Persona de contacto <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={formData.contacto}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, contacto: onlyLetters(e.target.value) }))
                                            }
                                            maxLength={30}
                                            placeholder="Ej: María García"
                                            className={formErrors.contacto ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                        />
                                        <FieldError msg={formErrors.contacto} />
                                    </div>
                                </div>
                            )}

                            {/* Correo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Correo electrónico <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, email: noSpaces(e.target.value) }))
                                    }
                                    maxLength={100}
                                    placeholder="cliente@email.com"
                                    className={formErrors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.email} />
                            </div>

                            {/* Teléfono + Ciudad */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Teléfono <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        value={formData.telefono}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, telefono: onlyPhone(e.target.value) }))
                                        }
                                        maxLength={20}
                                        placeholder="3001234567"
                                        className={formErrors.telefono ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.telefono} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Ciudad <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={formData.ciudad}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, ciudad: onlyLetters(e.target.value) }))
                                        }
                                        maxLength={50}
                                        placeholder="Medellín"
                                        className={formErrors.ciudad ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                    />
                                    <FieldError msg={formErrors.ciudad} />
                                </div>
                            </div>

                            {/* Dirección */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formData.direccion}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, direccion: onlyAddress(e.target.value) }))
                                    }
                                    maxLength={100}
                                    placeholder="Calle 50 #25-30"
                                    className={formErrors.direccion ? 'border-red-400 focus-visible:ring-red-300' : ''}
                                />
                                <FieldError msg={formErrors.direccion} />
                            </div>

                            {/* Acceso al sistema — contraseña */}
                            <div className="border border-blue-100 rounded-lg overflow-hidden">
                                <div className="bg-blue-50 py-3 px-4 flex items-center gap-2">
                                    <KeyRound className="w-4 h-4 text-blue-700" />
                                    <p className="text-sm font-semibold text-blue-900">
                                        Acceso al Sistema
                                        <span className="text-xs font-normal text-blue-600 ml-2">
                                            ({editingClient ? 'deja en blanco para no cambiar' : 'opcional — crea cuenta de acceso'})
                                        </span>
                                    </p>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                                        <div className="relative">
                                            <Input
                                                type={showPwd ? 'text' : 'password'}
                                                placeholder="Mín. 8 caract., mayúscula, número y especial"
                                                value={formData.password}
                                                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                                className={`pr-10 ${formErrors.password ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                onClick={() => setShowPwd(v => !v)}
                                                tabIndex={-1}
                                            >
                                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <FieldError msg={formErrors.password} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar Contraseña</label>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPwd ? 'text' : 'password'}
                                                placeholder="Repite la contraseña"
                                                value={formData.confirmPassword}
                                                onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className={`pr-10 ${formErrors.confirmPassword ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                onClick={() => setShowConfirmPwd(v => !v)}
                                                tabIndex={-1}
                                            >
                                                {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <FieldError msg={formErrors.confirmPassword} />
                                    </div>
                                </div>
                            </div>

                            {/* Estado — solo al editar y solo administrador */}
                            {editingClient && isAdmin && (
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center space-x-3">
                                        <Switch
                                            checked={formData.estado === 'activo'}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => ({ ...prev, estado: checked ? 'activo' : 'inactivo' }))
                                            }
                                        />
                                        <label className="text-sm text-gray-600">Cliente activo</label>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── MODAL VER DETALLE ───────────────────────────────────────── */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="p-0 max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ borderRadius: 16 }}>
                    {viewingClient && (() => {
                        const isActive = viewingClient.estado === 'activo';
                        const cfg = isActive ? {
                            headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                            chipBg: '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
                            iconBg: '#eff6ff', iconColor: '#1d4ed8',
                        } : {
                            headerBg: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                            chipBg: '#f1f5f9', chipText: '#475569', chipBorder: '#cbd5e1',
                            iconBg: '#f8fafc', iconColor: '#64748b',
                        };
                        const tipoLabel = viewingClient.clientType === 'Empresa' ? 'Empresa' : 'Persona Natural';
                        return (
                            <>
                                {/* Header */}
                                <div style={{ background: cfg.headerBg, color: '#fff', padding: '24px 28px 20px', position: 'relative', flexShrink: 0 }}>
                                    <button onClick={() => setShowDetailModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginRight: 36 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <User className="w-4 h-4" style={{ opacity: 0.75 }} />
                                                <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                                    Ficha del cliente
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                                {getDisplayName(viewingClient)}
                                            </div>
                                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
                                                {tipoLabel}{viewingClient.ciudad ? ` · ${viewingClient.ciudad}` : ''}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                                            {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            {isActive ? 'Activo' : 'Inactivo'}
                                        </div>
                                    </div>
                                </div>
                                {/* Body */}
                                <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                                    {!isActive && (
                                        <div style={{ margin: '16px 24px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                                            <XCircle className="w-4 h-4 shrink-0" />
                                            Este cliente está inactivo y no puede realizar compras en el sistema.
                                        </div>
                                    )}
                                    {/* Identificación */}
                                    <div style={{ padding: '16px 24px 0' }}>
                                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Identificación</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                                <ClientInfoItem icon={<Tag className="w-4 h-4" />}  label="Tipo"      value={tipoLabel}                                                            iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                                <ClientInfoItem icon={<Hash className="w-4 h-4" />} label="Documento" value={`${viewingClient.tipo_documento} ${viewingClient.numero_documento}`}  iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                                {viewingClient.clientType === 'Empresa' && viewingClient.contacto && (
                                                    <ClientInfoItem icon={<User className="w-4 h-4" />} label="Persona de contacto" value={viewingClient.contacto} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Contacto */}
                                    <div style={{ padding: '12px 24px 0' }}>
                                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Contacto</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                                {viewingClient.email     && <ClientInfoItem icon={<Mail className="w-4 h-4" />}     label="Correo"    value={viewingClient.email}     iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                                {viewingClient.telefono  && <ClientInfoItem icon={<Phone className="w-4 h-4" />}    label="Teléfono"  value={viewingClient.telefono}  iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                                {viewingClient.ciudad    && <ClientInfoItem icon={<MapPin className="w-4 h-4" />}   label="Ciudad"    value={viewingClient.ciudad}    iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                                {viewingClient.direccion && <ClientInfoItem icon={<FileText className="w-4 h-4" />} label="Dirección" value={viewingClient.direccion} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                                        <span style={{ fontSize: 11, color: '#cbd5e1' }}>Cliente ID #{viewingClient.id}</span>
                                    </div>
                                </div>
                                {/* Footer */}
                                <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                                    <Button variant="outline" onClick={() => setShowDetailModal(false)} style={{ fontSize: 13 }}>Cerrar</Button>
                                    {isActive && (
                                        <Button onClick={() => { handleEdit(viewingClient); setShowDetailModal(false); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            Editar Cliente
                                        </Button>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* ── MODAL CONFIRMAR ELIMINACIÓN ─────────────────────────────── */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
                if (!open) { setShowDeleteModal(false); setDeletingClient(null); }
            }}>
                <DialogContent className="max-w-md p-0">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <Trash2 className="w-5 h-5" />Eliminar Cliente
                            </DialogTitle>
                            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                        </DialogHeader>
                        {deletingClient && (
                            <div className="mt-4 space-y-3">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-semibold text-blue-900">{getDisplayName(deletingClient)}</p>
                                    <p className="text-sm text-blue-700 mt-1">{deletingClient.tipo_documento} {deletingClient.numero_documento}</p>
                                    <p className="text-sm text-blue-700">{deletingClient.email}</p>
                                </div>
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold">¿Estás seguro?</p>
                                        <p className="text-amber-700 mt-0.5">El cliente será eliminado permanentemente del sistema.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                            <Button variant="outline"
                                onClick={() => { setShowDeleteModal(false); setDeletingClient(null); }}
                                disabled={saving}>
                                Cancelar
                            </Button>
                            <Button onClick={confirmDelete} disabled={saving}
                                className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-900">
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Sí, eliminar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}