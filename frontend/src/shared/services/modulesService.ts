/**
 * modulesService.ts
 * ─────────────────────────────────────────────────────────────────
 * Obtiene los módulos disponibles para el rol del usuario actual.
 * Un módulo corresponde a un permiso con isModule=true.
 */

import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../services/http';

export interface ModulePermission {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  moduleKey?: string;
  isActive: boolean;
}

/**
 * Obtiene los permisos/módulos asignados a un rol específico.
 * @param rolesId - ID del rol
 * @returns Array de permisos con isModule=true
 */
// Retorna null si el API falla (error de red / 500), o [] si el rol no tiene módulos asignados.
// Esto permite distinguir "error" de "rol sin permisos" en App.tsx.
export async function getModulesByRole(rolesId: number): Promise<ModulePermission[] | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/roles/${rolesId}/permisos`, {
      method: 'GET',
      headers: buildAuthHeaders(),
    });

    const allPermisos = await handleResponse<ModulePermission[]>(response);

    // Devolver todos los permisos activos — el filtro de módulos UI lo hace isModuleAllowed en App.tsx
    return allPermisos.filter(p => p.isActive !== false);
  } catch (err) {
    console.error('Error fetching modules:', err);
    return null;
  }
}

/**
 * Mapeo de moduleKey a ID de módulo en App.tsx.
 * Esto permite saber cuál es el equivalente de cada permiso en la UI.
 */
export const MODULE_KEY_MAP: Record<string, string> = {
  'dashboard': 'dashboard',
  'catalog': 'catalog',
  'product-categories': 'product-categories',
  'configuration': 'configuration',
  'users': 'users',
  'roles': 'roles',
  'clients': 'clients',
  'suppliers': 'suppliers',
  'supplies': 'supplies',
  'purchases': 'purchases',
  'sales': 'sales',
  'news': 'news',
  'production-employees': 'production-employees',
  'production-orders-sub': 'production-orders-sub',
  'production-technical-sheets': 'production-technical-sheets',
  'payroll': 'nomina',
  'client-purchases': 'client-purchases',
  'my-info': 'my-info',
};
