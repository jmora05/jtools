import { getApiBaseUrl, handleResponse, buildAuthHeaders } from '@/services/http';

export type Role = {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getRoles() {
  const response = await fetch(`${getApiBaseUrl()}/roles`, {
    headers: buildAuthHeaders(),
  });
  return handleResponse<Role[]>(response);
}

export async function createRole(payload: { name: string; description?: string | null }) {
  const response = await fetch(`${getApiBaseUrl()}/roles`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; role: Role }>(response);
}

export async function updateRole(id: number, payload: { name?: string; description?: string | null }) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; role: Role }>(response);
}

export async function deleteRole(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
}

export async function getRolPermisos(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}/permisos`, {
    headers: buildAuthHeaders(),
  });
  return handleResponse<import('@/features/permisos/services/permisosService').Permiso[]>(response);
}

export async function setRolPermisos(id: number, permisosIds: number[]) {
  const response = await fetch(`${getApiBaseUrl()}/roles/${id}/permisos`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ permisosIds }),
  });
  return handleResponse<{ message: string; role: Role }>(response);
}