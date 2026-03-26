import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http';

const BASE_URL = getApiBaseUrl();

export const getCategorias = async () => {
    const response = await fetch(`${BASE_URL}/categorias`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const getCategoriaById = async (id: number) => {
    const response = await fetch(`${BASE_URL}/categorias/${id}`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const createCategoria = async (data: {
    nombreCategoria: string;
    descripcion?: string;
    estado: 'activo' | 'inactivo';
}) => {
    const response = await fetch(`${BASE_URL}/categorias`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const updateCategoria = async (id: number, data: {
    nombreCategoria?: string;
    descripcion?: string;
    estado?: 'activo' | 'inactivo';
}) => {
    const response = await fetch(`${BASE_URL}/categorias/${id}`, {
        method: 'PUT',
        headers: buildAuthHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const deleteCategoria = async (id: number) => {
    const response = await fetch(`${BASE_URL}/categorias/${id}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};