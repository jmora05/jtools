import { buildAuthHeaders, handleResponse, getApiBaseUrl } from '@/services/http';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DetallePedido {
  id:             number;
  pedidosId:      number;   // FK tal como la define el modelo Sequelize
  productosId:    number;
  cantidad:       number;
  precioUnitario: number;
  total:          number;
  // relaciones incluidas por el backend (include Productos)
  producto?: {
    id:             number;
    nombreProducto: string;
    referencia:     string;
    precio:         number;
    stock:          number;
  };
  pedido?: {
    id:          number;
    fecha_pedido:string;
    total:       number;
    ciudad:      string;
  };
}

export interface CreateDetallePedidoDto {
  pedidosId:      number;   // nombre exacto que espera el controller: req.body.pedidosId
  productosId:    number;
  cantidad:       number;
  precioUnitario: number;
}

export interface UpdateDetallePedidoDto {
  cantidad?:       number;
  precioUnitario?: number;
}

// ─── Base URL ─────────────────────────────────────────────────────────────────

const base = () => `${getApiBaseUrl()}/detalle-pedidos`;

// ─── GET /api/detalle-pedidos/pedido/:pedidosId ───────────────────────────────
export async function getDetallesByPedido(pedidosId: number): Promise<DetallePedido[]> {
  const res = await fetch(`${base()}/pedido/${pedidosId}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<DetallePedido[]>(res);
}

// ─── GET /api/detalle-pedidos/:id ─────────────────────────────────────────────
export async function getDetallePedidoById(id: number): Promise<DetallePedido> {
  const res = await fetch(`${base()}/${id}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<DetallePedido>(res);
}

// ─── POST /api/detalle-pedidos ────────────────────────────────────────────────
export async function createDetallePedido(data: CreateDetallePedidoDto): Promise<DetallePedido> {
  const res = await fetch(base(), {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<DetallePedido>(res);
}

// ─── PUT /api/detalle-pedidos/:id ─────────────────────────────────────────────
export async function updateDetallePedido(
  id: number,
  data: UpdateDetallePedidoDto
): Promise<DetallePedido> {
  const res = await fetch(`${base()}/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<DetallePedido>(res);
}

// ─── DELETE /api/detalle-pedidos/:id ──────────────────────────────────────────
export async function deleteDetallePedido(id: number): Promise<{ message: string }> {
  const res = await fetch(`${base()}/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}