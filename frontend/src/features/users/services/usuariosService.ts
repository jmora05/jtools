import { getApiBaseUrl, handleResponse, buildAuthHeaders } from '@/services/http';

export type Usuario = {
  id: number;
  rolesId: number;
  email: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getUsuarios() {
  const response = await fetch(`${getApiBaseUrl()}/usuarios`, {
    headers: buildAuthHeaders(),
  });
  return handleResponse<Usuario[]>(response);
}

export async function createUsuario(payload: { rolesId: number; email: string; password: string }) {
  const response = await fetch(`${getApiBaseUrl()}/usuarios`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; usuario: Usuario }>(response);
}

export async function updateUsuario(
  id: number,
  payload: { rolesId?: number; email?: string; password?: string }
) {
  const response = await fetch(`${getApiBaseUrl()}/usuarios/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; usuario: Usuario }>(response);
}

export async function deleteUsuario(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/usuarios/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
}

