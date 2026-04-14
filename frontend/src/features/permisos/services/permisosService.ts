import { getApiBaseUrl, handleResponse, buildAuthHeaders } from '@/services/http';

export type Permiso = {
  id: number;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  isActive?: boolean;
  moduleKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getPermisos() {
  const response = await fetch(`${getApiBaseUrl()}/permisos`, { headers: buildAuthHeaders() });
  return handleResponse<Permiso[]>(response);
}

export async function createPermiso(payload: { name: string; description?: string | null }) {
  const response = await fetch(`${getApiBaseUrl()}/permisos`, {
    method: 'POST', headers: buildAuthHeaders(), body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; permiso: Permiso }>(response);
}

export async function updatePermiso(id: number, payload: { name?: string; description?: string | null }) {
  const response = await fetch(`${getApiBaseUrl()}/permisos/${id}`, {
    method: 'PUT', headers: buildAuthHeaders(), body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; permiso: Permiso }>(response);
}

export async function deletePermiso(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/permisos/${id}`, {
    method: 'DELETE', headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
}

export async function togglePermisoActivo(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/permisos/${id}/toggle`, {
    method: 'PATCH', headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string; permiso: Permiso }>(response);
}

export async function syncSystemModules() {
  const response = await fetch(`${getApiBaseUrl()}/permisos/sync-modules`, {
    method: 'POST', headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string; created: string[]; updated: string[] }>(response);
}
