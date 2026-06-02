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
  isModule: boolean;
  moduleKey?: string;
  estado: boolean;
}

/**
 * Obtiene los permisos/módulos asignados a un rol específico.
 * @param rolesId - ID del rol
 * @returns Array de permisos con isModule=true
 */
export async function getModulesByRole(rolesId: number): Promise<ModulePermission[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/roles/${rolesId}/permisos`, {
      method: 'GET',
      headers: buildAuthHeaders(),
    });

    const allPermisos = await handleResponse<ModulePermission[]>(response);

    // Filtrar solo los módulos (isModule=true)
    return allPermisos.filter(p => p.isModule && p.estado);
  } catch (err) {
    console.error('Error fetching modules:', err);
    // Retornar array vacío en caso de error para no romper la UI
    return [];
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
  'production-orders': 'production-orders-sub',
  'technical-sheets': 'production-technical-sheets',
  'payroll': 'nomina',
  'client-purchases': 'client-purchases',
  'my-info': 'my-info',
};
