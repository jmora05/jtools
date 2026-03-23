// src/services/comprasService.ts

const BASE_URL = 'http://localhost:5000/api';

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        const errorMessage = data.errores
            ? data.errores.join(', ')
            : data.message || 'Error desconocido';
        throw new Error(errorMessage);
    }
    return data;
};

// GET /api/compras
export const getCompras = async () => {
    const response = await fetch(`${BASE_URL}/compras`);
    return handleResponse(response);
};

// GET /api/compras/:id
export const getCompraById = async (id: number) => {
    const response = await fetch(`${BASE_URL}/compras/${id}`);
    return handleResponse(response);
};

// GET /api/compras/estado/:estado
export const getComprasByEstado = async (estado: string) => {
    const response = await fetch(`${BASE_URL}/compras/estado/${estado}`);
    return handleResponse(response);
};

// POST /api/compras
export const createCompra = async (compraData: {
    id?: number;
    proveedoresId: number;
    fecha: string;
    metodoPago: 'efectivo' | 'transferencia';
    estado: 'pendiente' | 'en transito' | 'completada';
}) => {
    const response = await fetch(`${BASE_URL}/compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compraData),
    });
    return handleResponse(response);
};

// PUT /api/compras/:id
export const updateCompra = async (id: number, compraData: {
    proveedoresId?: number;
    fecha?: string;
    metodoPago?: string;
}) => {
    const response = await fetch(`${BASE_URL}/compras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compraData),
    });
    return handleResponse(response);
};

// PATCH /api/compras/:id/estado
export const cambiarEstadoCompra = async (id: number, estado: string) => {
    const response = await fetch(`${BASE_URL}/compras/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
    });
    return handleResponse(response);
};

// DELETE /api/compras/:id
export const deleteCompra = async (id: number) => {
    const response = await fetch(`${BASE_URL}/compras/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};

// GET /api/proveedores (para el selector)
export const getProveedores = async () => {
    const response = await fetch(`${BASE_URL}/proveedores`);
    return handleResponse(response);
};

// GET /api/insumos (para el selector)
export const getInsumos = async () => {
    const response = await fetch(`${BASE_URL}/insumos`);
    return handleResponse(response);
};
