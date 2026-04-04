import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type Material   = { name: string; quantity: number; unit: string };
export type Proceso    = { step: number; description: string; duration: string };
export type Medida     = { parameter: string; value: string; tolerance?: string };
export type InsumoFT   = { name: string; quantity: number; unit: string };

export type FichaTecnica = {
  id?: number;
  codigoFicha?: string;
  productoId: number;
  estado?: 'Activa' | 'Inactiva';
  materiales: Material[];
  procesos: Proceso[];
  medidas?: Medida[];
  insumos?: InsumoFT[];
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
  // Relaciones
  producto?: {
    id: number;
    nombreProducto: string;
    referencia: string;
    estado: string;
    categoria?: { id: number; nombreCategoria: string };
  };
};

export type CreateFichaPayload = {
  productoId: number;
  materiales: Material[];
  procesos: Omit<Proceso, 'step'>[];
  medidas?: Medida[];
  insumos?: InsumoFT[];
  notas?: string;
};

export type UpdateFichaPayload = Partial<{
  materiales: Material[];
  procesos: Omit<Proceso, 'step'>[];
  medidas: Medida[];
  insumos: InsumoFT[];
  notas: string;
  estado: 'Activa' | 'Inactiva';
}>;

// ─── Servicio ─────────────────────────────────────────────────────────────────

const BASE = getApiBaseUrl();

export async function getFichasTecnicas(): Promise<FichaTecnica[]> {
  const res = await fetch(`${BASE}/fichas-tecnicas`, { headers: buildAuthHeaders() });
  return handleResponse<FichaTecnica[]>(res);
}

export async function getFichaTecnicaById(id: number): Promise<FichaTecnica> {
  const res = await fetch(`${BASE}/fichas-tecnicas/${id}`, { headers: buildAuthHeaders() });
  return handleResponse<FichaTecnica>(res);
}

export async function getFichasByProducto(productoId: number): Promise<FichaTecnica[]> {
  const res = await fetch(`${BASE}/fichas-tecnicas/producto/${productoId}`, { headers: buildAuthHeaders() });
  return handleResponse<FichaTecnica[]>(res);
}

export async function createFichaTecnica(
  data: CreateFichaPayload
): Promise<{ message: string; ficha: FichaTecnica }> {
  const res = await fetch(`${BASE}/fichas-tecnicas`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateFichaTecnica(
  id: number,
  data: UpdateFichaPayload
): Promise<{ message: string; ficha: FichaTecnica }> {
  const res = await fetch(`${BASE}/fichas-tecnicas/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteFichaTecnica(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/fichas-tecnicas/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse(res);
}