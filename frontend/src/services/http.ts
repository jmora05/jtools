const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export type ApiErrorShape = {
  message?: string;
  errores?: string[];
  error?: string;
};

export function getApiBaseUrl() {
  return BASE_URL;
}

export function getAuthToken() {
  return localStorage.getItem('jrepuestos_token') || '';
}

export function buildAuthHeaders(extra?: Record<string, string>) {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

export async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let data: any;
  try {
    data = text.trim() ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new Error(`Error del servidor (${response.status}): respuesta no válida`);
    }
    throw new Error('La respuesta del servidor no tiene el formato esperado');
  }

  if (!response.ok) {
    const err = data as ApiErrorShape;
    const errorMessage = err?.errores?.length
      ? err.errores.join(', ')
      : err?.message || err?.error || `Error del servidor (${response.status})`;
    throw new Error(errorMessage);
  }

  return data as T;
}

