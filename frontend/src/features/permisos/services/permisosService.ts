import { getApiBaseUrl, handleResponse, buildAuthHeaders } from '@/services/http';

// Tipo de permiso — solo permisos del sistema (uno por módulo)
export type Permiso = {
  id: number;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  moduleKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// GET /api/permisos — lista los permisos del sistema para los checkboxes de roles
export async function getPermisos() {
  const response = await fetch(`${getApiBaseUrl()}/permisos`, { headers: buildAuthHeaders() });
  return handleResponse<Permiso[]>(response);
}

// POST /api/permisos/sync-modules — sincroniza módulos del sistema como permisos
export async function syncSystemModules() {
  const response = await fetch(`${getApiBaseUrl()}/permisos/sync-modules`, {
    method: 'POST', headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string; created: string[]; updated: string[] }>(response);
}
