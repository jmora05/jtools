import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http'; // ajusta el path

const ENDPOINT = `${getApiBaseUrl()}/novedades`;

// ─── Tipos ────────────────────────────────────────────────────────────────────

// Estados en minúscula tal como los devuelve el backend
type EstadoBackend = 'registrada' | 'aprobada' | 'rechazada';

// Estados en mayúscula tal como los usa el componente
type EstadoUI = 'Registrada' | 'Aprobada' | 'Rechazada';

// Objeto Novedad tal como lo espera el componente (Issue)
export interface Novedad {
  id: number;
  title: string;
  description: string;
  status: EstadoUI;
  responsibleEmployee: string;
  reportedBy: string;
  reportDate: string;
}

// DTOs que acepta el backend
export interface CreateNovedadDTO {
  titulo: string;
  descripcion_detallada: string;
  registrado_por: number;
  empleado_responsable?: number | null;
  estado?: EstadoBackend;
  fecha_registro?: string;
}

export interface UpdateNovedadDTO {
  titulo?: string;
  descripcion_detallada?: string;
  empleado_responsable?: number | null;
}

// ─── Mapeo backend → componente ───────────────────────────────────────────────

const ESTADO_MAP: Record<EstadoBackend, EstadoUI> = {
  registrada: 'Registrada',
  aprobada:   'Aprobada',
  rechazada:  'Rechazada',
};

const ESTADO_MAP_REVERSE: Record<EstadoUI, EstadoBackend> = {
  Registrada: 'registrada',
  Aprobada:   'aprobada',
  Rechazada:  'rechazada',
};

// Forma cruda que devuelve el backend
interface NovedadBackend {
  id: number;
  titulo: string;
  descripcion_detallada: string;
  estado: EstadoBackend;
  fecha_registro: string;
  registrado_por: number;
  empleado_responsable: number | null;
  registradoPor?: { id: number; nombres: string; apellidos: string; cargo: string };
  empleadoResponsable?: { id: number; nombres: string; apellidos: string; cargo: string };
}

function mapNovedad(n: NovedadBackend): Novedad {
  return {
    id:                  n.id,
    title:               n.titulo,
    description:         n.descripcion_detallada,
    status:              ESTADO_MAP[n.estado] ?? 'Registrada',
    reportDate:          n.fecha_registro?.split('T')[0] ?? '',
    reportedBy:          n.registradoPor
                           ? `${n.registradoPor.nombres} ${n.registradoPor.apellidos}`
                           : String(n.registrado_por),
    responsibleEmployee: n.empleadoResponsable
                           ? `${n.empleadoResponsable.nombres} ${n.empleadoResponsable.apellidos}`
                           : '—',
  };
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

/** GET /api/novedades */
export async function getNovedades(): Promise<Novedad[]> {
  const res = await fetch(ENDPOINT, { headers: buildAuthHeaders() });
  const data = await handleResponse<NovedadBackend[]>(res);
  return data.map(mapNovedad);
}

/** GET /api/novedades/:id */
export async function getNovedadById(id: number): Promise<Novedad> {
  const res = await fetch(`${ENDPOINT}/${id}`, { headers: buildAuthHeaders() });
  const data = await handleResponse<NovedadBackend>(res);
  return mapNovedad(data);
}

/** GET /api/novedades/estado/:estado */
export async function getNovedadesByEstado(estado: EstadoUI): Promise<Novedad[]> {
  const estadoBackend = ESTADO_MAP_REVERSE[estado];
  const res = await fetch(`${ENDPOINT}/estado/${estadoBackend}`, { headers: buildAuthHeaders() });
  const data = await handleResponse<NovedadBackend[]>(res);
  return data.map(mapNovedad);
}

/** POST /api/novedades */
export async function createNovedad(data: CreateNovedadDTO): Promise<Novedad> {
  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  const body = await handleResponse<{ message: string; novedad: NovedadBackend }>(res);
  return mapNovedad(body.novedad);
}

/** PUT /api/novedades/:id — solo editable si estado === 'registrada' */
export async function updateNovedad(id: number, data: UpdateNovedadDTO): Promise<Novedad> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method:  'PUT',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  const body = await handleResponse<{ message: string; novedad: NovedadBackend }>(res);
  return mapNovedad(body.novedad);
}

/** PATCH /api/novedades/:id/estado — aprobar o rechazar */
export async function cambiarEstadoNovedad(id: number, estado: EstadoUI): Promise<Novedad> {
  const res = await fetch(`${ENDPOINT}/${id}/estado`, {
    method:  'PATCH',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({ estado: ESTADO_MAP_REVERSE[estado] }),
  });
  const body = await handleResponse<{ message: string; novedad: NovedadBackend }>(res);
  return mapNovedad(body.novedad);
}

/** DELETE /api/novedades/:id — solo si estado === 'registrada' */
export async function deleteNovedad(id: number): Promise<void> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method:  'DELETE',
    headers: buildAuthHeaders(),
  });
  await handleResponse<{ message: string }>(res);
}
