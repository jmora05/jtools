import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http';

const BASE_URL = getApiBaseUrl();

// GET - listar todos los clientes
export const getClientes = async () => {
    const response = await fetch(`${BASE_URL}/clientes`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

// GET - obtener cliente por ID
export const getClienteById = async (id: number) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

// GET - historial de ventas y pedidos del cliente
export const getHistorialCliente = async (id: number) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}/historial`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

// GET - listar clientes activos
export const getClientesActivos = async () => {
    const response = await fetch(`${BASE_URL}/clientes/activos`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

// POST - crear cliente
export const createCliente = async (data: {
    nombres: string;
    apellidos: string;
    razon_social: string;
    tipo_documento: string;
    numero_documento: string;
    telefono: string;
    email: string;
    direccion?: string;
    ciudad: string;
    estado: 'activo' | 'inactivo';
    foto?: string | null;
}) => {
    const response = await fetch(`${BASE_URL}/clientes`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

// PUT - actualizar cliente
export const updateCliente = async (id: number, data: {
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    tipo_documento?: string;
    numero_documento?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    estado?: 'activo' | 'inactivo';
    foto?: string | null;
}) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: buildAuthHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

// DELETE - desactivar cliente
export const deleteCliente = async (id: number) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};
export const forceDeleteCliente = async (id: number) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}/force`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};
