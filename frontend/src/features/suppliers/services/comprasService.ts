import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http';

const BASE_URL = getApiBaseUrl();

export interface DetalleCompraInput {
    insumosId: number;
    cantidad: number;
    precioUnitario: number;
}

export const getCompras = async () => {
    const response = await fetch(`${BASE_URL}/compras`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const getCompraById = async (id: number) => {
    const response = await fetch(`${BASE_URL}/compras/${id}`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const getComprasByEstado = async (estado: string) => {
    const response = await fetch(`${BASE_URL}/compras/estado/${estado}`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const createCompra = async (compraData: {
    id?: number;
    proveedoresId: number;
    fecha: string;
    metodoPago: 'efectivo' | 'transferencia';
    estado: 'pendiente' | 'en transito' | 'completada';
    detalles?: DetalleCompraInput[];
}) => {
    const response = await fetch(`${BASE_URL}/compras`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify(compraData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw errorData; // lanza el objeto completo, no solo el message
    }
    return response.json();
};

export const updateCompra = async (id: number, compraData: {
    proveedoresId?: number;
    fecha?: string;
    metodoPago?: string;
    detalles?: DetalleCompraInput[];
}) => {
    const response = await fetch(`${BASE_URL}/compras/${id}`, {
        method: 'PUT',
        headers: buildAuthHeaders(),
        body: JSON.stringify(compraData),
    });
    return handleResponse(response);
};

export const cambiarEstadoCompra = async (id: number, estado: string) => {
    const response = await fetch(`${BASE_URL}/compras/${id}/estado`, {
        method: 'PATCH',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ estado }),
    });
    return handleResponse(response);
};

export const deleteCompra = async (id: number) => {
    const response = await fetch(`${BASE_URL}/compras/${id}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }
    return response.json();
};
export const getProveedores = async () => {
    const response = await fetch(`${BASE_URL}/proveedores`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const getInsumos = async () => {
    const response = await fetch(`${BASE_URL}/insumos`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};
