import { buildAuthHeaders, handleResponse, getApiBaseUrl } from '../../../services/http';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EstadoInsumo = 'disponible' | 'agotado';

export interface InsumoBackend {
  id:             number;
  nombreInsumo:   string;
  descripcion:    string | null;
  precioUnitario: number | string;
  unidadMedida:   string;
  cantidad:       number | null;
  proveedoresId:  number | null;
  proveedor?:     { id: number; nombreEmpresa: string } | null;
  estado:         EstadoInsumo;
  createdAt?:     string;
  updatedAt?:     string;
}

export interface CreateInsumoDTO {
  nombreInsumo:   string;
  descripcion?:   string;
  precioUnitario: number;
  unidadMedida:   string;
  cantidad?:      number | null;
  proveedoresId?: number | null;
  estado?:        EstadoInsumo;
}

export type UpdateInsumoDTO = Partial<CreateInsumoDTO>;

// ─── URL helper ───────────────────────────────────────────────────────────────

function insumosUrl(path = '') {
  return `${getApiBaseUrl()}/insumos${path}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getInsumos(): Promise<InsumoBackend[]> {
  const res = await fetch(insumosUrl(), {
    method:  'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<InsumoBackend[]>(res);
}

export async function createInsumo(
  data: CreateInsumoDTO
): Promise<{ message: string; insumo: InsumoBackend }> {
  const res = await fetch(insumosUrl(), {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  return handleResponse<{ message: string; insumo: InsumoBackend }>(res);
}

export async function updateInsumo(
  id:   number,
  data: UpdateInsumoDTO
): Promise<{ message: string; insumo: InsumoBackend }> {
  const res = await fetch(insumosUrl(`/${id}`), {
    method:  'PUT',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  return handleResponse<{ message: string; insumo: InsumoBackend }>(res);
}

export async function cambiarEstadoInsumo(
  id:     number,
  estado: EstadoInsumo
): Promise<{ message: string; insumo: InsumoBackend }> {
  const res = await fetch(insumosUrl(`/${id}/estado`), {
    method:  'PATCH',
    headers: buildAuthHeaders(),
    body:    JSON.stringify({ estado }),
  });
  return handleResponse<{ message: string; insumo: InsumoBackend }>(res);
}

export async function deleteInsumo(id: number): Promise<{ message: string }> {
  const res = await fetch(insumosUrl(`/${id}/force`),  // ← /force para eliminar físicamente
    {
      method:  'DELETE',
      headers: buildAuthHeaders(),
    });
  return handleResponse<{ message: string }>(res);
}

// ─── Mapeos frontend ↔ backend ────────────────────────────────────────────────

export function mapInsumoToSupply(i: InsumoBackend) {
  return {
    id:            i.id,
    name:          i.nombreInsumo,
    description:   i.descripcion  ?? '',
    price:         Number(i.precioUnitario),
    unit:          i.unidadMedida,
    cantidad:      i.cantidad     ?? null,
    proveedoresId: i.proveedoresId ?? null,
    proveedorNombre: i.proveedor?.nombreEmpresa ?? null,
    status:        i.estado === 'disponible',
  };
}

export function mapSupplyToDTO(form: {
  name:          string;
  description:   string;
  price:         string;
  unit:          string;
  cantidad:      string;
  proveedoresId: number | null;
  status:        boolean;
}): CreateInsumoDTO {
  return {
    nombreInsumo:   form.name,
    descripcion:    form.description || undefined,
    precioUnitario: parseFloat(form.price),
    unidadMedida:   form.unit,
    cantidad:       form.cantidad !== '' ? parseInt(form.cantidad, 10) : null,
    proveedoresId:  form.proveedoresId ?? null,
    estado:         form.status ? 'disponible' : 'agotado',
  };
}