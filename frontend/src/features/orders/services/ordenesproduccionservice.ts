import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';

export type EstadoOrden = 'Pendiente' | 'En Proceso' | 'Pausada' | 'Finalizada' | 'Anulada';
export type TipoOrden   = 'Pedido' | 'Venta';

export type OrdenProduccion = {
  id?: number;
  codigoOrden?: string;
  productoId: number;
  cantidad: number;
  responsableId: number;
  pedidoId?: number | null;
  tipoOrden?: TipoOrden;
  estado?: EstadoOrden;
  fechaEntrega: string;
  fechaInicio?: string;
  fechaFin?: string;
  nota?: string;
  motivoAnulacion?: string;
  createdAt?: string;
  updatedAt?: string;
  producto?: { id: number; nombreProducto: string; referencia: string };
  responsable?: { id: number; nombres: string; apellidos: string; cargo: string };
  pedido?: { id: number; fecha_pedido: string; total: number; ciudad: string } | null;
};

export type CreateOrdenPayload = {
  productoId: number;
  cantidad: number;
  responsableId: number;
  tipoOrden: TipoOrden;
  fechaEntrega: string;
  nota?: string;
};

export type UpdateOrdenPayload = {
  responsableId?: number;
  fechaEntrega?: string;
  nota?: string;
  estado?: EstadoOrden;
};

const BASE = getApiBaseUrl();

export async function getOrdenesProduccion(): Promise<OrdenProduccion[]> {
  const res = await fetch(`${BASE}/ordenes-produccion`, {
    headers: buildAuthHeaders(),
  });
  return handleResponse<OrdenProduccion[]>(res);
}

export async function getOrdenProduccionById(id: number): Promise<OrdenProduccion> {
  const res = await fetch(`${BASE}/ordenes-produccion/${id}`, {
    headers: buildAuthHeaders(),
  });
  return handleResponse<OrdenProduccion>(res);
}

export async function createOrdenProduccion(
  data: CreateOrdenPayload
): Promise<{ message: string; orden: OrdenProduccion }> {
  const res = await fetch(`${BASE}/ordenes-produccion`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateOrdenProduccion(
  id: number,
  data: UpdateOrdenPayload
): Promise<{ message: string; orden: OrdenProduccion }> {
  const res = await fetch(`${BASE}/ordenes-produccion/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function anularOrdenProduccion(
  id: number,
  motivoAnulacion: string
): Promise<{ message: string; orden: OrdenProduccion }> {
  const res = await fetch(`${BASE}/ordenes-produccion/${id}/anular`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ motivoAnulacion }),
  });
  return handleResponse(res);
}

export async function deleteOrdenProduccion(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/ordenes-produccion/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse(res);
}