import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http';
 
const ENDPOINT = `${getApiBaseUrl()}/novedades`;
 
// ─── Tipos ────────────────────────────────────────────────────────────────────
 
export type EstadoNovedad = 'registrada' | 'aprobada' | 'rechazada';
 
// Objeto Novedad tal como lo usa el componente (campos en español, consistente con el backend)
export interface Novedad {
  id: number;
  titulo: string;
  descripcion_detallada: string;
  estado: EstadoNovedad;
  fecha_registro: string;
  registrado_por: number;
  empleado_responsable: number | null;
  registradoPor?: { id: number; nombres: string; apellidos: string; cargo: string } | null;
  empleadoResponsable?: { id: number; nombres: string; apellidos: string; cargo: string } | null;
}
 
// DTOs que acepta el backend
export interface CreateNovedadDTO {
  titulo: string;
  descripcion_detallada: string;
  registrado_por: number;
  empleado_responsable?: number | null;
  estado?: EstadoNovedad;
  fecha_registro?: string;
}
 
export interface UpdateNovedadDTO {
  titulo?: string;
  descripcion_detallada?: string;
  empleado_responsable?: number | null;
}
 
// ─── Forma cruda del backend (idéntica a Novedad, se deja explícita por claridad) ──
 
type NovedadBackend = Novedad;
 
// ─── Servicio ─────────────────────────────────────────────────────────────────
 
/** GET /api/novedades */
export async function getNovedades(): Promise<Novedad[]> {
  const res = await fetch(ENDPOINT, { headers: buildAuthHeaders() });
  return handleResponse<Novedad[]>(res);
}
 
/** GET /api/novedades/:id */
export async function getNovedadById(id: number): Promise<Novedad> {
  const res = await fetch(`${ENDPOINT}/${id}`, { headers: buildAuthHeaders() });
  return handleResponse<Novedad>(res);
}
 
/** GET /api/novedades/estado/:estado */
export async function getNovedadesByEstado(estado: EstadoNovedad): Promise<Novedad[]> {
  const res = await fetch(`${ENDPOINT}/estado/${estado}`, { headers: buildAuthHeaders() });
  return handleResponse<Novedad[]>(res);
}
 
/** POST /api/novedades */
export async function createNovedad(data: CreateNovedadDTO): Promise<Novedad> {
  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  const body = await handleResponse<{ message: string; novedad: NovedadBackend }>(res);
  return body.novedad;
}
 
/** PUT /api/novedades/:id */
export async function updateNovedad(id: number, data: UpdateNovedadDTO): Promise<Novedad> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method:  'PUT',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  const body = await handleResponse<{ message: string; novedad: NovedadBackend }>(res);
  return body.novedad;
}
 
/** PATCH /api/novedades/:id/estado */
export async function cambiarEstadoNovedad(id: number, estado: EstadoNovedad): Promise<Novedad> {
  const res = await fetch(`${ENDPOINT}/${id}/estado`, {
    method:  'PATCH',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({ estado }),
  });
  const body = await handleResponse<{ message: string; novedad: NovedadBackend }>(res);
  return body.novedad;
}
 
/** DELETE /api/novedades/:id */
export async function deleteNovedad(id: number): Promise<void> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method:  'DELETE',
    headers: buildAuthHeaders(),
  });
  await handleResponse<{ message: string }>(res);
}