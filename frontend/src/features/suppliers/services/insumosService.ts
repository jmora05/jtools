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
  proveedores?:   { id: number; nombreEmpresa: string }[];
  estado:         EstadoInsumo;
  createdAt?:     string;
  updatedAt?:     string;
}

export interface CreateInsumoDTO {
  nombreInsumo:    string;
  descripcion?:    string;
  precioUnitario:  number;
  unidadMedida:    string;
  cantidad?:       number | null;
  proveedoresIds?: number[];
  estado?:         EstadoInsumo;
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

// ─── Dependencias ─────────────────────────────────────────────────────────────

export interface InsumosDependencias {
  enUso:          boolean;
  compras:        { id: number; fecha: string; estado: string }[];
  productos:      { id: number; nombreProducto: string }[];
  fichasTecnicas: { id: number; codigoFicha: string; estado: string }[];
}

export async function getInsumosDependencias(id: number): Promise<InsumosDependencias> {
  const res = await fetch(insumosUrl(`/${id}/dependencias`), {
    headers: buildAuthHeaders(),
  });
  return handleResponse<InsumosDependencias>(res);
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
  // Preferir many-to-many; si aún no tiene entradas en la junction table,
  // caer al FK legado para mostrar el proveedor existente
  let proveedores = (i.proveedores ?? []).map(p => ({ id: p.id, nombre: p.nombreEmpresa }));
  if (proveedores.length === 0 && i.proveedor) {
    proveedores = [{ id: i.proveedor.id, nombre: i.proveedor.nombreEmpresa }];
  }
  return {
    id:            i.id,
    name:          i.nombreInsumo,
    description:   i.descripcion  ?? '',
    price:         Number(i.precioUnitario),
    unit:          i.unidadMedida,
    cantidad:      i.cantidad     ?? null,
    proveedores,
    proveedoresIds: proveedores.map(p => p.id),
    proveedorNombre: proveedores.length > 0
      ? proveedores.map(p => p.nombre).join(', ')
      : null,
    status:        i.estado === 'disponible',
  };
}

export function mapSupplyToDTO(form: {
  name:           string;
  description:    string;
  price:          string;
  unit:           string;
  cantidad:       string;
  proveedoresIds: number[];
  status:         boolean;
}): CreateInsumoDTO {
  return {
    nombreInsumo:   form.name,
    descripcion:    form.description || undefined,
    precioUnitario: parseFloat(form.price),
    unidadMedida:   form.unit,
    cantidad:       form.cantidad !== '' ? parseInt(form.cantidad, 10) : null,
    proveedoresIds: form.proveedoresIds.length > 0 ? form.proveedoresIds : undefined,
    estado:         form.status ? 'disponible' : 'agotado',
  };
}