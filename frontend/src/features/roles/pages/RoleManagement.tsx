import { useCallback, useEffect, useRef, useState } from 'react';
import * as permisosService from '@/features/permisos/services/permisosService';
import * as rolesService    from '@/features/roles/services/rolesService';
import { Button }           from '@/shared/components/ui/button';
import { Input }            from '@/shared/components/ui/input';
import { Label }            from '@/shared/components/ui/label';
import { Switch }           from '@/shared/components/ui/switch';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge }            from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { toast } from 'sonner';
import { Permiso } from '../../permisos/services/permisosService';
import {
  Plus, Edit, Trash2, Shield, Eye, AlertTriangle,
  Search, Lock, ChevronLeft, ChevronRight, X,
  CheckCircle2, XCircle, Hash, FileText, User,
} from 'lucide-react';

// ─── Helper para el modal de detalle ─────────────────────────────────────────
function RoleInfoItem({ icon, label, value, iconBg, iconColor }: {
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

// ─── Roles protegidos del sistema ─────────────────────────────────────────────
const PROTECTED_ROLES = ['Administrador', 'Cliente', 'Asistente'] as const;
type ProtectedRole = (typeof PROTECTED_ROLES)[number];

const isProtectedRole = (name: string): boolean =>
  PROTECTED_ROLES.includes(name as ProtectedRole);

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface RoleRow {
  id:              number;
  name:            string;
  description:     string;
  permissions:     number[];
  permissionCount: number;
  isActive:        boolean;
}
interface PermisoRow {
  id:          number;
  name:        string;
  description?: string | null;
  moduleKey?:   string | null;
}
interface FormState { name: string; description: string; permissions: number[]; }

const EMPTY_FORM: FormState = { name: '', description: '', permissions: [] };

// ─── Errores de formulario ────────────────────────────────────────────────────
interface FormErrors {
  name?:        string;
  description?: string;
  permissions?: string;
}

function contarEspeciales(s: string): number {
  return (s.match(/[\d_\-()+]/g) ?? []).length;
}

function validarFormulario(data: FormState): FormErrors {
  const errs: FormErrors = {};
  const NAME_REGEX = /^[\w\sáéíóúÁÉÍÓÚñÑüÜ\-()+]+$/;
  const nombre = data.name.trim();

  // Nombre
  if (!nombre)
    errs.name = 'El nombre del rol es obligatorio';
  else if (nombre.length < 2 || nombre.length > 20)
    errs.name = 'El nombre debe tener entre 2 y 20 caracteres';
  else if (!NAME_REGEX.test(nombre))
    errs.name = 'Solo letras, números, espacios y guiones';
  else if (contarEspeciales(nombre) > 2)
    errs.name = 'El nombre no puede tener más de 2 números o caracteres especiales';
  else if (isProtectedRole(nombre))
    errs.name = `"${nombre}" es un nombre reservado del sistema`;

  // Descripción (opcional)
  if (data.description.trim().length > 200)
    errs.description = 'La descripción no puede superar los 200 caracteres';

  // Permisos
  if (data.permissions.length === 0)
    errs.permissions = 'Debes seleccionar al menos un permiso para este rol';

  return errs;
}

// ─── Componente de error de campo ─────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />{msg}
    </p>
  );
}

// ─── Banner inline ────────────────────────────────────────────────────────────
type BannerVariant = 'error' | 'warning' | 'info';
interface BannerMsg { text: string; variant: BannerVariant; }
const bannerStyles: Record<BannerVariant, string> = {
  error:   'bg-red-50   border-red-200   text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50  border-blue-200  text-blue-800',
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function RoleManagement() {

  // ── Estado de roles ──────────────────────────────────────────────────────────
  const [roles,        setRoles]        = useState<RoleRow[]>([]);
  const [permisos,     setPermisos]     = useState<PermisoRow[]>([]);
  const [loadingData,  setLoadingData]  = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [togglingIds,  setTogglingIds]  = useState<Set<number>>(new Set());

  // ── Estado de modales ────────────────────────────────────────────────────────
  const [showModal,        setShowModal]        = useState(false);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRole,      setEditingRole]      = useState<RoleRow | null>(null);
  const [viewingRole,      setViewingRole]      =
    useState<(RoleRow & { permissionsData?: PermisoRow[] }) | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleRow | null>(null);

  // ── Búsqueda y paginación ────────────────────────────────────────────────────
  const [searchTerm,       setSearchTerm]       = useState('');
  const [moduleSearchTerm, setModuleSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ── Formulario ───────────────────────────────────────────────────────────────
  const [formData,        setFormData]        = useState<FormState>(EMPTY_FORM);
  const [formErrors,      setFormErrors]      = useState<FormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [banner,          setBanner]          = useState<BannerMsg | null>(null);
  const permissionsRef = useRef<number[]>([]);

  // Revalidar en tiempo real después del primer intento de envío
  useEffect(() => {
    if (submitAttempted) {
      setFormErrors(validarFormulario(formData));
    }
  }, [formData, submitAttempted]);

  // ── Carga inicial ─────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setLoadingData(true);
    Promise.all([rolesService.getRoles(), permisosService.getPermisos()])
      .then(([rolesData, permisosData]) => {
        setRoles(
          rolesData.map((r) => ({
            id:              r.id,
            name:            r.name,
            description:     r.description ?? '',
            isActive:        r.isActive !== false,
            permissions:     (r.permisos ?? []).map((p: { id: number }) => p.id),
            permissionCount: (r.permisos ?? []).length,
          }))
        );
        setPermisos(
          permisosData.map((p) => ({
            id:          p.id,
            name:        p.name,
            description: p.description,
            moduleKey:   p.moduleKey,
          }))
        );
      })
      .catch((err: unknown) =>
        toast.error(err instanceof Error ? err.message : 'Error al cargar datos')
      )
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // ── Sincronizar módulos automáticamente al montar ────────────────────────────
  useEffect(() => {
    permisosService.syncSystemModules()
      .then((resp) => { if (resp.created.length > 0) loadData(); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers del formulario ───────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setSubmitAttempted(false);
    setBanner(null);
    permissionsRef.current = [];
    setEditingRole(null);
    setShowModal(false);
  }, []);

  const openCreate = useCallback(() => {
    setEditingRole(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setSubmitAttempted(false);
    setBanner(null);
    permissionsRef.current = [];
    setShowModal(true);
  }, []);

  const handleEdit = useCallback(async (role: RoleRow) => {
    if (isProtectedRole(role.name)) {
      toast.warning(`El rol "${role.name}" es un rol del sistema y no puede editarse.`);
      return;
    }
    if (!role.isActive) {
      toast.warning('Activa el rol antes de editarlo.');
      return;
    }

    setEditingRole(role);
    setFormData({ name: role.name, description: role.description, permissions: [] });
    setFormErrors({});
    setSubmitAttempted(false);
    setBanner(null);
    permissionsRef.current = [];
    setLoadingPerms(true);
    setShowModal(true);
    try {
      const permsDelRol = await rolesService.getRolPermisos(role.id);
      const ids = permsDelRol.map((p: { id: number }) => p.id);
      permissionsRef.current = ids;
      setFormData((prev) => ({ ...prev, permissions: [...ids] }));
    } catch {
      toast.error('No se pudieron cargar los permisos del rol');
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  // Toggle de permiso individual
  const togglePermission = useCallback((id: number) => {
    const next = permissionsRef.current.includes(id)
      ? permissionsRef.current.filter((x) => x !== id)
      : [...permissionsRef.current, id];
    permissionsRef.current = next;
    setFormData((prev) => ({ ...prev, permissions: [...next] }));
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      setSubmitAttempted(true);
      const errs = validarFormulario(formData);
      setFormErrors(errs);

      if (Object.keys(errs).length > 0) {
        setBanner({ text: 'Corrige los errores del formulario antes de continuar', variant: 'warning' });
        return;
      }

      const selectedPerms = permissionsRef.current;
      const payload = {
        name:        formData.name.trim(),
        description: formData.description.trim() || null,
      };

      try {
        let roleId: number;
        if (editingRole) {
          const resp = await rolesService.updateRole(editingRole.id, payload);
          roleId = editingRole.id;
          setRoles((prev) =>
            prev.map((r) =>
              r.id === editingRole.id
                ? { ...r, name: resp.role.name, description: resp.role.description ?? '' }
                : r
            )
          );
          toast.success(resp.message || 'Rol actualizado exitosamente');
        } else {
          const resp = await rolesService.createRole({ ...payload, permisosIds: selectedPerms });
          roleId = resp.role.id;
          setRoles((prev) => [
            ...prev,
            {
              id:              resp.role.id,
              name:            resp.role.name,
              description:     resp.role.description ?? '',
              isActive:        true,
              permissions:     selectedPerms,
              permissionCount: selectedPerms.length,
            },
          ]);
          toast.success(resp.message || 'Rol creado exitosamente');
          resetForm();
          return;
        }
        await rolesService.setRolPermisos(roleId, selectedPerms);
        setRoles((prev) =>
          prev.map((r) =>
            r.id === roleId
              ? { ...r, permissions: selectedPerms, permissionCount: selectedPerms.length }
              : r
          )
        );
        resetForm();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al guardar el rol';
        setBanner({ text: msg, variant: 'error' });
        // Si el backend reporta nombre duplicado, marcarlo inline
        const errores = (err as any)?.errores as string[] | undefined;
        if (errores?.some((e) => e.toLowerCase().includes('nombre'))) {
          setFormErrors((prev) => ({ ...prev, name: 'Ya existe un rol con ese nombre' }));
        }
      }
    },
    [formData, editingRole, resetForm]
  );

  // ── Ver detalle ──────────────────────────────────────────────────────────────
  const handleViewDetail = useCallback(async (role: RoleRow) => {
    setViewingRole(role);
    setShowDetailModal(true);
    try {
      const permsDelRol = await rolesService.getRolPermisos(role.id);
      setViewingRole({
        ...role,
        permissionsData: permsDelRol.map((p: { id: number; name: string }) => ({
          id: p.id, name: p.name,
        })),
      });
    } catch { /* se muestran los datos existentes */ }
  }, []);

  // ── Toggle activo/inactivo ────────────────────────────────────────────────────
  const toggleStatus = useCallback((role: RoleRow) => {
    if (isProtectedRole(role.name)) {
      toast.warning(`El rol "${role.name}" es un rol del sistema y no puede desactivarse.`);
      return;
    }
    setTogglingIds((prev) => new Set(prev).add(role.id));
    rolesService.toggleRolActivo(role.id)
      .then((resp) => {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === role.id ? { ...r, isActive: resp.role.isActive !== false } : r
          )
        );
        toast.success(resp.message);
      })
      .catch((err: unknown) =>
        toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
      )
      .finally(() =>
        setTogglingIds((prev) => { const s = new Set(prev); s.delete(role.id); return s; })
      );
  }, []);

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((role: RoleRow) => {
    if (isProtectedRole(role.name)) {
      toast.warning(`El rol "${role.name}" es un rol del sistema y no puede eliminarse.`);
      return;
    }
    if (!role.isActive) {
      toast.warning('No se puede eliminar un rol inactivo.');
      return;
    }
    setRoleToDelete(role);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!roleToDelete) return;
    rolesService.deleteRole(roleToDelete.id)
      .then((resp) => {
        setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
        toast.success(resp.message || 'Rol eliminado');
        setShowDeleteDialog(false);
        setRoleToDelete(null);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar rol');
        setShowDeleteDialog(false);
        setRoleToDelete(null);
      });
  }, [roleToDelete]);

  // ── Filtrado y paginación ─────────────────────────────────────────────────────
  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPermisos = permisos.filter((p) =>
    p.name.toLowerCase().includes(moduleSearchTerm.toLowerCase())
  );
  const totalPages   = Math.ceil(filteredRoles.length / itemsPerPage);
  const currentRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-blue-900 font-bold mb-2">Roles y Permisos</h1>
            <p className="text-blue-800">Gestiona los roles del sistema y los permisos de cada módulo</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo Rol
          </Button>
        </div>

        {/* ════ TABS ════ */}
        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permisos">Permisos</TabsTrigger>
          </TabsList>

          {/* ── TAB ROLES ── */}
          <TabsContent value="roles" className="space-y-4">

            {/* Búsqueda */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative w-full sm:flex-[3]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <Input
                      placeholder="Buscar roles por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap self-center">
                    {filteredRoles.length} rol(es)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de roles */}
            <Card>
              <CardContent className="p-0">
                {loadingData ? (
                  <div className="flex justify-center items-center py-16 text-gray-500">
                    Cargando roles...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-blue-900">
                        <tr>
                          <th className="text-left py-4 px-6 text-black font-semibold">Rol</th>
                          <th className="text-left py-4 px-6 text-black font-semibold">Descripción</th>
                          <th className="text-left py-4 px-6 text-black font-semibold">Permisos</th>
                          <th className="text-left py-4 px-6 text-black font-semibold">Estado</th>
                          <th className="text-left py-4 px-6 text-black font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRoles.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-gray-500">
                              No se encontraron roles
                            </td>
                          </tr>
                        ) : (
                          currentRoles.map((role) => {
                            const isInactive  = !role.isActive;
                            const isProtected = isProtectedRole(role.name);
                            return (
                              <tr
                                key={role.id}
                                className={`border-b border-blue-100 transition-colors ${
                                  isInactive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'
                                }`}
                              >
                                {/* Nombre */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    <Shield className={`w-4 h-4 shrink-0 ${
                                      isProtected ? 'text-amber-500' : isInactive ? 'text-gray-400' : 'text-blue-600'
                                    }`} />
                                    <span className={`text-sm font-semibold ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
                                      {role.name}
                                    </span>
                                    {isProtected && (
                                      <Badge className="bg-amber-100 text-amber-700 border border-amber-200 gap-1 text-xs">
                                        <Lock className="w-3 h-3" />Sistema
                                      </Badge>
                                    )}
                                  </div>
                                </td>

                                {/* Descripción */}
                                <td className={`py-4 px-6 text-sm ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {role.description || <span className="italic text-gray-400">Sin descripción</span>}
                                </td>

                                {/* Permisos */}
                                <td className="py-4 px-6">
                                  <Badge variant="secondary" className={
                                    isInactive
                                      ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                                  }>
                                    {role.permissionCount} permiso(s)
                                  </Badge>
                                </td>

                                {/* Toggle estado — siempre visible, deshabilitado si protegido */}
                                <td className="py-4 px-6">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex">
                                        <Switch
                                          checked={role.isActive}
                                          onCheckedChange={() => !isProtected && toggleStatus(role)}
                                          disabled={isProtected || togglingIds.has(role.id)}
                                          className={isProtected ? 'opacity-40 cursor-not-allowed' : ''}
                                        />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{isProtected ? 'Rol del sistema — el estado no puede cambiarse' : role.isActive ? 'Desactivar rol' : 'Activar rol'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </td>

                                {/* Acciones — los 3 botones siempre visibles */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-2">

                                    {/* Ver detalle — siempre activo */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm"
                                          onClick={() => handleViewDetail(role)}
                                          className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Ver detalle</p></TooltipContent>
                                    </Tooltip>

                                    {/* Editar — visible pero deshabilitado si protegido o inactivo */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex">
                                          <Button variant="outline" size="sm"
                                            onClick={() => !isProtected && !isInactive && handleEdit(role)}
                                            disabled={isProtected || isInactive}
                                            className={
                                              isProtected || isInactive
                                                ? 'opacity-40 cursor-not-allowed border-blue-900 text-blue-900'
                                                : 'border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white'
                                            }
                                          >
                                            {isProtected ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{isProtected ? 'Rol del sistema — no se puede editar' : isInactive ? 'Rol inactivo — actívalo primero' : 'Editar rol'}</p>
                                      </TooltipContent>
                                    </Tooltip>

                                    {/* Eliminar — visible pero deshabilitado si protegido o inactivo */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex">
                                          <Button variant="outline" size="sm"
                                            onClick={() => !isProtected && !isInactive && handleDelete(role)}
                                            disabled={isProtected || isInactive}
                                            className={
                                              isProtected || isInactive
                                                ? 'opacity-40 cursor-not-allowed border-blue-900 text-blue-900'
                                                : 'border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white'
                                            }
                                          >
                                            {isProtected ? <Lock className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{isProtected ? 'Rol del sistema — no se puede eliminar' : isInactive ? 'Rol inactivo — no se puede eliminar' : 'Eliminar rol'}</p>
                                      </TooltipContent>
                                    </Tooltip>

                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Paginación */}
                {filteredRoles.length > itemsPerPage && (
                  <div className="border-t px-6 py-4 flex justify-center items-center gap-2">
                    <Button variant="outline" size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB MÓDULOS DEL SISTEMA ── */}
          <TabsContent value="permisos" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative w-full sm:flex-[3]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <Input
                      placeholder="Buscar módulos del sistema..."
                      value={moduleSearchTerm}
                      onChange={(e) => setModuleSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap self-center">
                    {filteredPermisos.length} permisos(s)
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-900">
                      <tr>
                        <th className="text-left py-4 px-6 text-black font-semibold">Permisos</th>
                        <th className="text-left py-4 px-6 text-black font-semibold">Descripción</th>
                        <th className="text-left py-4 px-6 text-white font-semibold">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPermisos.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-12 text-gray-500">
                            {moduleSearchTerm ? 'No se encontraron módulos' : 'No hay módulos disponibles'}
                          </td>
                        </tr>
                      ) : (
                        filteredPermisos.map((p) => (
                          <tr key={p.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {p.description ?? <span className="italic text-gray-400">Sin descripción</span>}
                            </td>
                            <td className="py-4 px-6">
                              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 gap-1">
                                <Lock className="w-3 h-3" />Sistema
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Modal crear / editar rol ── */}
        <Dialog open={showModal} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
          <DialogContent className="w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-blue-900 text-xl uppercase">
                {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
              </DialogTitle>
              <DialogDescription>
                {editingRole
                  ? 'Modifica la información del rol y sus permisos.'
                  : 'Completa la información y selecciona al menos un permiso.'}
              </DialogDescription>
            </DialogHeader>

            {/* Banner de validación */}
            {banner && (
              <div className={`flex items-center gap-3 border rounded-lg px-4 py-3 text-sm ${bannerStyles[banner.variant]}`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{banner.text}</span>
                <button type="button" onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* ── Nombre ── */}
              <div className="space-y-2">
                <Label htmlFor="role-name">Nombre del rol *</Label>
                <Input
                  id="role-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Vendedor, Gerente"
                  maxLength={20}
                  className={formErrors.name ? 'border-red-400 focus-visible:ring-red-300' : ''}
                />
                <div className="flex items-center justify-between">
                  <FieldError msg={formErrors.name} />
                  <p className={`text-xs ml-auto tabular-nums ${formData.name.trim().length > 18 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {formData.name.trim().length}/20
                  </p>
                </div>
                {/* Advertencias en tiempo real */}
                {!formErrors.name && contarEspeciales(formData.name.trim()) === 2 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Límite de 2 números/caracteres especiales alcanzado.
                  </p>
                )}
                {!formErrors.name && isProtectedRole(formData.name.trim()) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Este nombre está reservado para roles del sistema.
                  </p>
                )}
              </div>

              {/* ── Descripción ── */}
              <div className="space-y-2">
                <Label htmlFor="role-desc">Descripción</Label>
                <Input
                  id="role-desc"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Opcional"
                  maxLength={200}
                  className={formErrors.description ? 'border-red-400 focus-visible:ring-red-300' : ''}
                />
                <FieldError msg={formErrors.description} />
                <p className="text-xs text-gray-400 text-right">
                  {formData.description.length}/200
                </p>
              </div>

              {/* ── Permisos ── */}
              <div className="space-y-3">
                <Label>Permisos de módulos *</Label>
                {loadingPerms ? (
                  <p className="text-sm text-gray-500">Cargando permisos...</p>
                ) : permisos.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    No hay módulos sincronizados. Ve a la pestaña "Módulos del sistema" y sincroniza primero.
                  </p>
                ) : (
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-1 max-h-64 overflow-y-auto pr-1 rounded-lg ${
                    formErrors.permissions ? 'ring-1 ring-red-400 p-1' : ''
                  }`}>
                    {permisos.map((permiso) => {
                      const checked = formData.permissions.includes(permiso.id);
                      return (
                        <label
                          key={permiso.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                            checked
                              ? 'bg-blue-50 border-blue-300'
                              : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permiso.id)}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <span className="text-sm text-gray-900">{permiso.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <FieldError msg={formErrors.permissions} />
                <p className="text-sm text-gray-500">
                  {formData.permissions.length} módulo(s) seleccionado(s)
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button
                  type="submit"
                  disabled={isProtectedRole(formData.name.trim())}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingRole ? 'Actualizar' : 'Crear'} Rol
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Modal detalle ── */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="p-0 max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ borderRadius: 16 }}>
            {viewingRole && (() => {
              const isActive    = viewingRole.isActive !== false;
              const isProtected = isProtectedRole(viewingRole.name);
              const cfg = isActive ? {
                headerBg:    'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                chipBg:      '#dbeafe', chipText: '#1e3a8a', chipBorder: '#93c5fd',
                iconBg:      '#eff6ff', iconColor: '#1d4ed8', accentColor: '#2563eb',
                permBg:      '#eff6ff', permBorder: '#bfdbfe', permText: '#1e40af',
              } : {
                headerBg:    'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                chipBg:      '#f1f5f9', chipText: '#475569', chipBorder: '#cbd5e1',
                iconBg:      '#f8fafc', iconColor: '#64748b', accentColor: '#64748b',
                permBg:      '#f8fafc', permBorder: '#e2e8f0', permText: '#64748b',
              };
              const permCount = viewingRole.permissionsData?.length ?? viewingRole.permissionCount;
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
                          <Shield className="w-4 h-4" style={{ opacity: 0.75 }} />
                          <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Ficha del rol
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                            {viewingRole.name}
                          </div>
                          {isProtected && (
                            <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(251,191,36,0.25)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 999, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Lock className="w-3 h-3" />Sistema
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                          {permCount} permiso(s) asignado(s)
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: cfg.chipText, boxShadow: '0 1px 4px rgba(0,0,0,0.10)', whiteSpace: 'nowrap' }}>
                        {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {isActive ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {!isActive && (
                      <div style={{ margin: '16px 24px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                        <XCircle className="w-4 h-4 shrink-0" />
                        Este rol está inactivo. Los usuarios con este rol no pueden acceder al sistema.
                      </div>
                    )}

                    {/* Información general */}
                    <div style={{ padding: '16px 24px 0' }}>
                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Información</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                          <RoleInfoItem icon={<Shield className="w-4 h-4" />}   label="Nombre del rol"  value={viewingRole.name}                   iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                          <RoleInfoItem icon={<FileText className="w-4 h-4" />} label="Descripción"     value={viewingRole.description || '—'}     iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                          <RoleInfoItem icon={<User className="w-4 h-4" />}     label="Tipo"            value={isProtected ? 'Sistema' : 'Personalizado'} iconBg={cfg.iconBg} iconColor={cfg.iconColor} />
                        </div>
                      </div>
                    </div>

                    {/* Permisos asignados */}
                    <div style={{ padding: '12px 24px 0' }}>
                      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                          Permisos asignados
                          <span style={{ marginLeft: 8, background: cfg.permBg, color: cfg.permText, border: `1px solid ${cfg.permBorder}`, borderRadius: 999, padding: '1px 10px', fontSize: 11, fontWeight: 700 }}>
                            {permCount}
                          </span>
                        </div>
                        {!viewingRole.permissionsData ? (
                          <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Cargando permisos...</p>
                        ) : viewingRole.permissionsData.length === 0 ? (
                          <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Sin permisos asignados</p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {viewingRole.permissionsData.map((perm) => (
                              <span key={perm.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: cfg.permBg, border: `1px solid ${cfg.permBorder}`, color: cfg.permText, borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600 }}>
                                <Shield className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                                {perm.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '12px 24px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Hash className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                      <span style={{ fontSize: 11, color: '#cbd5e1' }}>Rol ID #{viewingRole.id}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff', flexShrink: 0 }}>
                    <Button variant="outline" onClick={() => setShowDetailModal(false)} style={{ fontSize: 13 }}>Cerrar</Button>
                    {isActive && !isProtected && (
                      <Button onClick={() => { handleEdit(viewingRole); setShowDetailModal(false); }} style={{ background: cfg.accentColor, color: '#fff', fontSize: 13, border: 'none' }}>
                        <Edit className="w-4 h-4 mr-2" />Editar rol
                      </Button>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ── Confirmar eliminación ── */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-blue-900">
                <AlertTriangle className="w-5 h-5 text-amber-500" />Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <span className="block">¿Estás seguro de que deseas eliminar este rol?</span>
                  {roleToDelete && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1">
                      <p className="text-sm">
                        <span className="text-gray-500">Rol: </span>
                        <span className="font-medium text-gray-900">{roleToDelete.name}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Permisos: </span>
                        <span className="text-gray-900">{roleToDelete.permissionCount}</span>
                      </p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setRoleToDelete(null); }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-white hover:bg-red-50 text-blue-900 border border-blue-900">
                Eliminar Rol
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
