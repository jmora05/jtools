import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http';

export type InsumoDisponible = {
  id: number;
  nombreInsumo: string;
  unidadMedida: string;
};

const BASE = getApiBaseUrl();

export async function getInsumosDisponibles(): Promise<InsumoDisponible[]> {
  const res = await fetch(`${BASE}/insumos/disponibles`, {
    headers: buildAuthHeaders(),
  });
  return handleResponse<InsumoDisponible[]>(res);
}
