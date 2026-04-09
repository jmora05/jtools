const BASE_URL = 'http://localhost:5000/api';

export type ApiErrorShape = {
  message?: string;
  errores?: string[];
  error?: string;
};

export function getApiBaseUrl() {
  return BASE_URL;
}

export function getAuthToken() {
  return localStorage.getItem('jrepuestos_user') || '';
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
  const data = (await response.json()) as any;
  if (!response.ok) {
    const err = data as ApiErrorShape;
    const errorMessage = err?.errores?.length
      ? err.errores.join(', ')
      : err?.message || err?.error || 'Error desconocido';
    throw new Error(errorMessage);
  }
  return data as T;
}

