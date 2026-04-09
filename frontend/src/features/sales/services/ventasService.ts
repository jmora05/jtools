import { buildAuthHeaders, handleResponse, getApiBaseUrl } from '../../../services/http';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'credito';
export type TipoVenta  = 'directa'  | 'pedido';

export interface VentaBackend {
  id:         number;
  clientesId: number;
  fecha:      string;
  metodoPago: MetodoPago;
  tipoVenta:  TipoVenta;
  total:      number | string;
  cliente?: {
    id:        number;
    nombres:   string;
    apellidos: string;
    email:     string;
    telefono:  string;
  };
  detalles?: {
    id:             number;
    ventasId:       number;
    productosId:    number;
    cantidad:       number;
    precioUnitario: number;
    subtotal:       number;
    producto?: {
      id:             number;
      nombreProducto: string;
      referencia:     string;
      precio:         number;
    };
  }[];
}

export interface CreateVentaDTO {
  clientesId: number;
  fecha:      string;   // 'YYYY-MM-DD'
  metodoPago: MetodoPago;
  tipoVenta:  TipoVenta;
  total:      number;
}

export type UpdateVentaDTO = Partial<CreateVentaDTO>;

// ─── URL helper ───────────────────────────────────────────────────────────────

function ventasUrl(path = '') {
  return `${getApiBaseUrl()}/ventas${path}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/** GET /ventas — lista todas las ventas con cliente y detalles */
export async function getVentas(): Promise<VentaBackend[]> {
  const res = await fetch(ventasUrl(), {
    method:  'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<VentaBackend[]>(res);
}

/** GET /ventas/:id */
export async function getVentaById(id: number): Promise<VentaBackend> {
  const res = await fetch(ventasUrl(`/${id}`), {
    method:  'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<VentaBackend>(res);
}

/** POST /ventas */
export async function createVenta(
  data: CreateVentaDTO
): Promise<{ message: string; venta: VentaBackend }> {
  const res = await fetch(ventasUrl(), {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  return handleResponse<{ message: string; venta: VentaBackend }>(res);
}

/** PUT /ventas/:id */
export async function updateVenta(
  id:   number,
  data: UpdateVentaDTO
): Promise<{ message: string; venta: VentaBackend }> {
  const res = await fetch(ventasUrl(`/${id}`), {
    method:  'PUT',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  return handleResponse<{ message: string; venta: VentaBackend }>(res);
}

/** DELETE /ventas/:id */
export async function deleteVenta(id: number): Promise<{ message: string }> {
  const res = await fetch(ventasUrl(`/${id}`), {
    method:  'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}

// ─── Helpers de conversión frontend ↔ backend ────────────────────────────────

/**
 * Convierte el string del frontend ('Efectivo', 'Tarjeta', etc.)
 * al valor que acepta el backend ('efectivo', 'tarjeta', etc.)
 */
export function toMetodoPago(value: string): MetodoPago {
  const map: Record<string, MetodoPago> = {
    'Efectivo':      'efectivo',
    'Transferencia': 'transferencia',
    'Tarjeta':       'tarjeta',
    'Crédito':       'credito',
  };
  return map[value] ?? (value.toLowerCase() as MetodoPago);
}

/**
 * Convierte el tipo de venta del frontend al backend
 */
export function toTipoVenta(value: string): TipoVenta {
  return value.toLowerCase() as TipoVenta;
}

/**
 * Capitaliza la primera letra  ('efectivo' → 'Efectivo')
 */
export function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Mapea una VentaBackend al shape Sale que usa SalesModule
 */
export function mapVentaToSale(v: VentaBackend) {
  const clientName = v.cliente
    ? `${v.cliente.nombres} ${v.cliente.apellidos}`
    : `Cliente #${v.clientesId}`;

  return {
    id:             v.id,
    clientName,
    clientId:       String(v.clientesId),
    clientDocument: undefined as string | undefined,  // el backend no lo devuelve aquí
    date:           v.fecha.slice(0, 10),
    total:          Number(v.total),
    paymentMethod:  capitalizar(v.metodoPago),
    status:         'Completada' as string,
    type:           capitalizar(v.tipoVenta),
    items: (v.detalles ?? []).map((d) => ({
      id:       String(d.productosId),
      name:     d.producto?.nombreProducto ?? '',
      code:     d.producto?.referencia     ?? '',
      quantity: d.cantidad,
      price:    d.precioUnitario,
    })),
  };
}