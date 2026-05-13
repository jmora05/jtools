import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';

export type NominaBackend = {
  id: number;
  empleado_id: number;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  fecha_pago: string;
  dias_trabajados: number;
  salario_base: number | string;
  auxilio_transporte: number | string;
  total_horas_extras: number | string;
  deducciones: number | string;
  pago_neto: number | string;
  estado: 'pendiente' | 'pagado';
  observaciones?: string;
  empleado?: {
    id: number;
    nombres: string;
    apellidos: string;
    cargo: string;
    area: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
  };
};

export type CreateNominaPayload = {
  empleado_id: number;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  fecha_pago: string;
  dias_trabajados: number;
  salario_base: number;
  auxilio_transporte: number;
  total_horas_extras: number;
  deducciones: number;
  pago_neto: number;
  estado?: 'pendiente' | 'pagado';
  observaciones?: string;
};

const BASE = getApiBaseUrl();

export async function getNominas(): Promise<NominaBackend[]> {
  const res = await fetch(`${BASE}/nomina`, { headers: buildAuthHeaders() });
  return handleResponse<NominaBackend[]>(res);
}

export async function createNomina(data: CreateNominaPayload): Promise<{ message: string; nomina: NominaBackend }> {
  const res = await fetch(`${BASE}/nomina`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateNominaApi(id: number, data: Partial<CreateNominaPayload>): Promise<{ message: string; nomina: NominaBackend }> {
  const res = await fetch(`${BASE}/nomina/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function marcarComoPagada(id: number): Promise<{ message: string; nomina: NominaBackend }> {
  const res = await fetch(`${BASE}/nomina/${id}/pagar`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
  });
  return handleResponse(res);
}

export async function deleteNomina(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/nomina/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse(res);
}
