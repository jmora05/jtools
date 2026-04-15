import { buildAuthHeaders, handleResponse, getApiBaseUrl } from '../../../services/http';

export type TipoDocumento   = 'CC' | 'CE' | 'PA' | 'RUNT' | 'NIT' | 'RUN';
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

function proveedoresUrl(path = '') {
    return `${getApiBaseUrl()}/proveedores${path}`;
}

export async function getProveedores(): Promise<ProveedorBackend[]> {
    const res = await fetch(proveedoresUrl(), { method: 'GET', headers: buildAuthHeaders() });
    return handleResponse<ProveedorBackend[]>(res);
}

export async function getProveedorById(id: number): Promise<ProveedorBackend> {
    const res = await fetch(proveedoresUrl(`/${id}`), { method: 'GET', headers: buildAuthHeaders() });
    return handleResponse<ProveedorBackend>(res);
}

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

export async function deleteProveedor(id: number): Promise<{ message: string }> {
    const res = await fetch(proveedoresUrl(`/${id}`), {
        method:  'DELETE',
        headers: buildAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
}

// ─── Conversiones frontend ↔ backend ─────────────────────────────────────────

export function mapProveedorToSupplier(p: ProveedorBackend) {
    const esEmpresa = p.tipoDocumento === 'NIT' || p.tipoDocumento === 'RUN';

    let firstName = '';
    let lastName  = '';
    if (!esEmpresa && p.nombreEmpresa) {
        const partes = p.nombreEmpresa.trim().split(/\s+/);
        firstName = partes[0] ?? '';
        lastName  = partes.slice(1).join(' ');
    }

    return {
        id:                  p.id,
        type:                esEmpresa ? 'empresa' : 'persona',
        name:                p.nombreEmpresa,
        firstName,
        lastName,
        documentType:        p.tipoDocumento,
        documentNumber:      p.numeroDocumento,
        contact:             p.personaContacto,
        phone:               p.telefono,
        email:               p.email,
        address:             p.direccion  ?? '',
        city:                p.ciudad     ?? '',
        isActive:            p.estado === 'activo',
        legalRepresentative: '',
    };
}

export function mapSupplierToDTO(form: {
    type:                string;
    name:                string;
    firstName:           string;
    lastName:            string;
    legalRepresentative: string;
    documentType:        string;
    documentNumber:      string;
    contact:             string;
    phone:               string;
    email:               string;
    address:             string;
    city:                string;
    isActive:            boolean;
}): CreateProveedorDTO {
    const nombreFinal = form.type === 'persona'
        ? `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
        : form.name.trim();

    return {
        nombreEmpresa:   nombreFinal,
        tipoDocumento:   form.documentType  as TipoDocumento,
        numeroDocumento: form.documentNumber,
        personaContacto: form.contact,
        telefono:        form.phone,
        email:           form.email,
        direccion:       form.address || undefined,
        ciudad:          form.city    || undefined,
        estado:          form.isActive ? 'activo' : 'inactivo',
    };
}