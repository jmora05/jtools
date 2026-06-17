import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type Proceso    = { step: number; description: string; duration: string; responsableId?: number };
export type Medida     = { parameter: string; value: number; unit: string };
export type InsumoFT   = { name: string; quantity: number; unit: string };

export type ParametrosMaquina = {
  unidadInyeccion: {
    tolva:            { velocidad: number; presion: number };
    inyeccion:        { velocidad: number; presion: number };
    segundaInyeccion: { velocidad: number; presion: number };
    carga:            { velocidad: number; presion: number; contrapresion: number };
    decompresion:     { velocidad: number; presion: number };
  };
  prensa: {
    abrir:       { velocidad: number; presion: number };
    cerrar:      { velocidad: number; presion: number };
    seguroMolde: { velocidad: number; presion: number };
    botador:     { velocidad: number; presion: number; numSalidas: number };
  };
  temperaturas: {
    boquilla: number;
    z1: number;
    z2: number;
    z3: number;
  };
  tiempos: {
    enfriamiento: number;
    pausa: number;
    retardoInyeccion: number;
    inyeccion: number;
    segundaInyeccion: number;
    descompresion: number;
  };
};

export type FichaTecnica = {
  id?: number;
  codigoFicha?: string;
  productoId: number;
  estado?: 'Activa' | 'Inactiva';
  procesos: Proceso[];
  medidas?: Medida[];
  insumos?: InsumoFT[];
  notas?: string;
  numeroMolde?: string | null;
  parametrosMaquina?: ParametrosMaquina | null;
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
  procesos: Omit<Proceso, 'step'>[];
  medidas?: Medida[];
  insumos?: InsumoFT[];
  notas?: string;
  numeroMolde?: string;
  parametrosMaquina?: ParametrosMaquina;
};

export type UpdateFichaPayload = Partial<{
  procesos: Omit<Proceso, 'step'>[];
  medidas: Medida[];
  insumos: InsumoFT[];
  notas: string;
  estado: 'Activa' | 'Inactiva';
  numeroMolde: string | null;
  parametrosMaquina: ParametrosMaquina | null;
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

export async function puedeEliminarFichaTecnica(id: number): Promise<{ puedeEliminar: boolean; razon: string; estado?: string }> {
  const res = await fetch(`${BASE}/fichas-tecnicas/${id}/puede-eliminarse`, { headers: buildAuthHeaders() });
  return handleResponse(res);
}