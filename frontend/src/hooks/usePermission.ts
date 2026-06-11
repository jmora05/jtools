import { usePermissions } from '@/context/PermissionContext';

/**
 * Devuelve true si el usuario tiene el permiso del módulo indicado.
 * Usa el moduleId de la UI (ej: 'users', 'roles', 'clients', 'sales').
 *
 * Ejemplo:
 *   const canAccessUsers = usePermission('users');
 */
export function usePermission(moduleId: string): boolean {
  const { hasPermission, isLoaded, hasApiError, allowedModuleKeys } = usePermissions();

  // Si los permisos no cargaron aún o fallaron, no concedemos acceso.
  if (!isLoaded || hasApiError) return false;

  // Sin permisos configurados en BD (rol sin permisos o sync pendiente): denegar.
  if (allowedModuleKeys.length === 0) return false;

  return hasPermission(moduleId);
}
