import { buildAuthHeaders, handleResponse, getApiBaseUrl } from '@/services/http';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EstadoPedido = 'Pendiente' | 'En Proceso' | 'Pausada' | 'Finalizada' | 'Anulada';

export interface Pedido {
  id:                     number;
  clienteId:              number;
  fecha_pedido:           string;
  total:                  number;
  direccion:              string;
  ciudad:                 string;
  estado?:                EstadoPedido;
  instrucciones_entrega?: string;
  notas_observaciones?:   string;
  createdAt?:             string;
  updatedAt?:             string;
}

export interface CreatePedidoDto {
  clienteId:              number;
  fecha_pedido?:          string;   // opcional — el backend usa DataTypes.NOW por defecto
  total:                  number;
  direccion:              string;
  ciudad:                 string;
  instrucciones_entrega?: string;
  notas_observaciones?:   string;
}

export interface UpdatePedidoDto extends Partial<CreatePedidoDto> {}

// ─── Base URL ─────────────────────────────────────────────────────────────────

const endpoint = () => `${getApiBaseUrl()}/pedidos`;

// ─── GET /api/pedidos ─────────────────────────────────────────────────────────
export async function getPedidos(): Promise<Pedido[]> {
  const res = await fetch(endpoint(), {
    method: 'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<Pedido[]>(res);
}

// ─── GET /api/pedidos/:id ─────────────────────────────────────────────────────
export async function getPedidoById(id: number): Promise<Pedido> {
  const res = await fetch(`${endpoint()}/${id}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<Pedido>(res);
}

// ─── POST /api/pedidos ────────────────────────────────────────────────────────
export async function createPedido(data: CreatePedidoDto): Promise<Pedido> {
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Pedido>(res);
}

// ─── PUT /api/pedidos/:id ─────────────────────────────────────────────────────
export async function updatePedido(id: number, data: UpdatePedidoDto): Promise<Pedido> {
  const res = await fetch(`${endpoint()}/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Pedido>(res);
}

// ─── DELETE /api/pedidos/:id ──────────────────────────────────────────────────
export async function deletePedido(id: number): Promise<{ message: string }> {
  const res = await fetch(`${endpoint()}/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}