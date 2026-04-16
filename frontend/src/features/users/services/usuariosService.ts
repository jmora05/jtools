import { getApiBaseUrl, handleResponse, buildAuthHeaders } from '@/services/http';

export type UsuarioCliente = {
  id: number;
  nombres: string;
  apellidos: string;
  razon_social: string | null;
  telefono: string | null;
  ciudad: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
};

export type Usuario = {
  id: number;
  rolesId: number;
  rolNombre: string | null;
  email: string;
  /** Nombre calculado en el backend: nombres+apellidos del cliente, o razon_social, o parte del email */
  displayName: string;
  cliente: UsuarioCliente | null;
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