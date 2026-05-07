import { getApiBaseUrl, handleResponse, buildAuthHeaders } from '@/services/http';
import type { Permiso } from '@/features/permisos/services/permisosService';

export type Role = {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
  permisos?: Array<{ id: number; name: string }>;
  createdAt?: string;
  updatedAt?: string;
};

// GET /api/roles — lista roles con sus permisos incluidos
export async function getRoles() {
  const response = await fetch(`${getApiBaseUrl()}/roles`, { headers: buildAuthHeaders() });
  return handleResponse<Role[]>(response);
}

// POST /api/roles — crea rol con permisos (mínimo 1 requerido por el backend)
export async function createRole(payload: { name: string; description?: string | null; permisosIds: number[] }) {
  const response = await fetch(`${getApiBaseUrl()}/roles`, {
    method: 'POST', headers: buildAuthHeaders(), body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; role: Role }>(response);
}

// PUT /api/roles/:id — actualiza datos del rol
export async function updateRole(id: number, payload: { name?: string; description?: string | null }) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}`, {
    method: 'PUT', headers: buildAuthHeaders(), body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; role: Role }>(response);
}

// DELETE /api/roles/:id
export async function deleteRole(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}`, {
    method: 'DELETE', headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
}

// PATCH /api/roles/:id/toggle — activa/desactiva rol
export async function toggleRolActivo(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}/toggle`, {
    method: 'PATCH', headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string; role: Role }>(response);
}

// GET /api/roles/:id/permisos — obtiene permisos de un rol específico
export async function getRolPermisos(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}/permisos`, { headers: buildAuthHeaders() });
  return handleResponse<Permiso[]>(response);
}

// PUT /api/roles/:id/permisos — reemplaza todos los permisos de un rol
export async function setRolPermisos(id: number, permisosIds: number[]) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}/permisos`, {
    method: 'PUT', headers: buildAuthHeaders(), body: JSON.stringify({ permisosIds }),
  });
  return handleResponse<{ message: string; role: Role }>(response);
}
