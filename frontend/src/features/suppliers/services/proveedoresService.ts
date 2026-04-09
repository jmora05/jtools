import { buildAuthHeaders, handleResponse, getApiBaseUrl } from '../../../services/http';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoDocumento = 'CC' | 'NIT' | 'RUN';
export type EstadoProveedor = 'activo' | 'inactivo';

export interface ProveedorBackend {
  id:               number;
  nombreEmpresa:    string;
  tipoDocumento:    TipoDocumento;
  numeroDocumento:  string;
  personaContacto:  string;
  telefono:         string;
  email:            string;
  direccion?:       string | null;
  ciudad?:          string | null;
  estado:           EstadoProveedor;
  createdAt?:       string;
  updatedAt?:       string;
}

export interface CreateProveedorDTO {
  nombreEmpresa:   string;
  tipoDocumento:   TipoDocumento;
  numeroDocumento: string;
  personaContacto: string;
  telefono:        string;
  email:           string;
  direccion?:      string;
  ciudad?:         string;
  estado?:         EstadoProveedor;
}

export type UpdateProveedorDTO = Partial<CreateProveedorDTO>;

// ─── URL helper ───────────────────────────────────────────────────────────────

function proveedoresUrl(path = '') {
  return `${getApiBaseUrl()}/proveedores${path}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/** GET /proveedores */
export async function getProveedores(): Promise<ProveedorBackend[]> {
  const res = await fetch(proveedoresUrl(), {
    method:  'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<ProveedorBackend[]>(res);
}

/** GET /proveedores/:id */
export async function getProveedorById(id: number): Promise<ProveedorBackend> {
  const res = await fetch(proveedoresUrl(`/${id}`), {
    method:  'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<ProveedorBackend>(res);
}

/** POST /proveedores */
export async function createProveedor(
  data: CreateProveedorDTO
): Promise<{ message: string; proveedor: ProveedorBackend }> {
  const res = await fetch(proveedoresUrl(), {
    method:  'POST',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  return handleResponse<{ message: string; proveedor: ProveedorBackend }>(res);
}

/** PUT /proveedores/:id */
export async function updateProveedor(
  id:   number,
  data: UpdateProveedorDTO
): Promise<{ message: string; proveedor: ProveedorBackend }> {
  const res = await fetch(proveedoresUrl(`/${id}`), {
    method:  'PUT',
    headers: buildAuthHeaders(),
    body:    JSON.stringify(data),
  });
  return handleResponse<{ message: string; proveedor: ProveedorBackend }>(res);
}

/** DELETE /proveedores/:id — desactiva el proveedor */
export async function deleteProveedor(id: number): Promise<{ message: string }> {
  const res = await fetch(proveedoresUrl(`/${id}`), {
    method:  'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}

// ─── Helpers de conversión frontend ↔ backend ────────────────────────────────

/**
 * Mapea un ProveedorBackend al shape que usa SupplierManagement
 */
export function mapProveedorToSupplier(p: ProveedorBackend) {
  return {
    id:             p.id,
    type:           'empresa' as const,   // el backend solo maneja empresas
    name:           p.nombreEmpresa,
    documentType:   p.tipoDocumento,
    documentNumber: p.numeroDocumento,
    contact:        p.personaContacto,
    phone:          p.telefono,
    email:          p.email,
    address:        p.direccion  ?? '',
    city:           p.ciudad     ?? '',
    isActive:       p.estado === 'activo',
    // campos extra que usa el componente pero el backend no devuelve
    legalRepresentative: p.personaContacto,
    firstName:      '',
    lastName:       '',
  };
}

/**
 * Convierte el formData del componente al DTO que espera el backend
 */
export function mapSupplierToDTO(form: {
  name:           string;
  documentType:   string;
  documentNumber: string;
  contact:        string;
  phone:          string;
  email:          string;
  address:        string;
  city:           string;
  isActive:       boolean;
}): CreateProveedorDTO {
  return {
    nombreEmpresa:   form.name,
    tipoDocumento:   form.documentType as TipoDocumento,
    numeroDocumento: form.documentNumber,
    personaContacto: form.contact,
    telefono:        form.phone,
    email:           form.email,
    direccion:       form.address || undefined,
    ciudad:          form.city    || undefined,
    estado:          form.isActive ? 'activo' : 'inactivo',
  };
}