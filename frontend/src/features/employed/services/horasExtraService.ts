import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http';

const ENDPOINT = `${getApiBaseUrl()}/horas-extra`;

export type TipoRecargo =
  | 'Recargo Nocturno'
  | 'Recargo Diurno Dominical'
  | 'Recargo Nocturno Dominical'
  | 'Hora Extra Diurna'
  | 'Hora Extra Nocturna'
  | 'Hora Extra Diurna Dominical/Festiva';

export type EstadoHoraExtra = 'registrada' | 'aprobada' | 'rechazada';

type EmpleadoResumen = { id: number; nombres: string; apellidos: string; cargo: string };

export interface HoraExtra {
  id: number;
  empleadoId: number;
  tipo: TipoRecargo;
  fecha: string;
  horas: number;
  observaciones: string | null;
  estado: EstadoHoraExtra;
  createdAt: string;
  updatedAt: string;
  empleado?: EmpleadoResumen;
}

export interface CreateHoraExtraDTO {
  empleadoId: number;
  tipo: TipoRecargo;
  fecha: string;
  horas: number;
  observaciones?: string;
}

export interface UpdateHoraExtraDTO {
  empleadoId?: number;
  tipo?: TipoRecargo;
  fecha?: string;
  horas?: number;
  observaciones?: string;
  estado?: EstadoHoraExtra;
}

export async function getHorasExtra(): Promise<HoraExtra[]> {
  const res = await fetch(ENDPOINT, { headers: buildAuthHeaders() });
  return handleResponse<HoraExtra[]>(res);
}

export async function createHoraExtra(data: CreateHoraExtraDTO): Promise<HoraExtra> {
  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  return handleResponse<HoraExtra>(res);
}

export async function updateHoraExtra(id: number, data: UpdateHoraExtraDTO): Promise<HoraExtra> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method:  'PUT',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  return handleResponse<HoraExtra>(res);
}

export async function cambiarEstadoHoraExtra(
  id: number,
  estado: EstadoHoraExtra,
): Promise<HoraExtra> {
  const res = await fetch(`${ENDPOINT}/${id}/estado`, {
    method:  'PATCH',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({ estado }),
  });
  return handleResponse<HoraExtra>(res);
}

export async function deleteHoraExtra(id: number): Promise<void> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method:  'DELETE',
    headers: buildAuthHeaders(),
  });
  await handleResponse<{ message: string }>(res);
}
