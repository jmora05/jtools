const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('jrepuestos_token') ?? ''}`,
});

// ─── Tipos del backend ────────────────────────────────────────────────────────

export interface VentaBackend {
  id: number;
  clientesId: number;
  fecha: string;
  metodoPago: 'efectivo' | 'transferencia';
  tipoVenta: 'directa' | 'pedido';
  total: string | number;
  cliente?: {
    id: number;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
  };
  detalles?: {
    id: number;
    cantidad: number;
    precioUnitario: number;
    producto?: {
      id: number;
      nombreProducto: string;
      referencia: string;
      precio: number;
    };
  }[];
}

export interface CreateVentaDTO {
  clientesId: number;
  fecha: string;
  metodoPago: 'efectivo' | 'transferencia';
  tipoVenta: 'directa' | 'pedido';
  total: number;
}

// ─── Mappers (backend → frontend) ────────────────────────────────────────────

/** Convierte el string del frontend al enum del backend */
export const toMetodoPago = (value: string): 'efectivo' | 'transferencia' => {
  const map: Record<string, 'efectivo' | 'transferencia'> = {
    Efectivo: 'efectivo',
    Transferencia: 'transferencia',
    Tarjeta: 'transferencia',   // fallback
    Crédito: 'transferencia',   // fallback
  };
  return map[value] ?? 'efectivo';
};

/** Convierte el string del frontend al enum del backend */
export const toTipoVenta = (value: string): 'directa' | 'pedido' => {
  const map: Record<string, 'directa' | 'pedido'> = {
    Directa: 'directa',
    Pedido: 'pedido',
  };
  return map[value] ?? 'directa';
};

/** Convierte una VentaBackend al shape Sale que usa el componente */
export const mapVentaToSale = (v: VentaBackend) => ({
  id: v.id,
  clientName: v.cliente
    ? `${v.cliente.nombres} ${v.cliente.apellidos}`
    : `Cliente #${v.clientesId}`,
  clientId: String(v.clientesId),
  clientDocument: '',
  date: v.fecha.slice(0, 10),
  total: Number(v.total),
  paymentMethod:
    v.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia',
  status: 'Completada',
  type: v.tipoVenta === 'directa' ? 'Directa' : 'Pedido',
  items: (v.detalles ?? []).map((d) => ({
    id: String(d.producto?.id ?? d.id),
    name: d.producto?.nombreProducto ?? 'Producto',
    code: d.producto?.referencia ?? '',
    quantity: d.cantidad,
    price: d.precioUnitario ?? d.producto?.precio ?? 0,
  })),
});

// ─── Llamadas a la API ────────────────────────────────────────────────────────

export const getVentas = async (): Promise<VentaBackend[]> => {
  const res = await fetch(`${BASE_URL}/ventas`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Error al obtener las ventas');
  }
  return res.json();
};

export const getVentaById = async (id: number): Promise<VentaBackend> => {
  const res = await fetch(`${BASE_URL}/ventas/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Error al obtener la venta');
  }
  return res.json();
};

export const createVenta = async (
  dto: CreateVentaDTO
): Promise<{ message: string; venta: VentaBackend }> => {
  const res = await fetch(`${BASE_URL}/ventas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? 'Error al crear la venta');
  return body;
};

export const updateVenta = async (
  id: number,
  dto: Partial<CreateVentaDTO>
): Promise<{ message: string; venta: VentaBackend }> => {
  const res = await fetch(`${BASE_URL}/ventas/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? 'Error al actualizar la venta');
  return body;
};

export const deleteVenta = async (id: number): Promise<{ message: string }> => {
  const res = await fetch(`${BASE_URL}/ventas/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? 'Error al anular la venta');
  return body;
};