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

export class ApiError extends Error {
  errores?: string[];
  status?: number;

  constructor(message: string, errores?: string[], status?: number) {
    super(message);
    this.name = 'ApiError';
    this.errores = errores;
    this.status = status;
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let data: any;
  try {
    data = text.trim() ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new ApiError(`Error del servidor (${response.status}): respuesta no válida`, undefined, response.status);
    }
    throw new ApiError('La respuesta del servidor no tiene el formato esperado');
  }

  if (!response.ok) {
    const err = data as ApiErrorShape;
    const errores = err?.errores?.length ? err.errores : undefined;
    const errorMessage = errores
      ? err?.message || `Error del servidor (${response.status})`
      : err?.message || err?.error || `Error del servidor (${response.status})`;
    throw new ApiError(errorMessage, errores, response.status);
  }

  return data as T;
}

