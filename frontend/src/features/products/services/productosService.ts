import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http';

const BASE_URL = getApiBaseUrl();

export const getProductos = async () => {
    const response = await fetch(`${BASE_URL}/productos`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const getProductoById = async (id: number) => {
    const response = await fetch(`${BASE_URL}/productos/${id}`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const getProductosStockBajo = async () => {
    const response = await fetch(`${BASE_URL}/productos/stock-bajo`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const createProducto = async (productoData: {
    nombreProducto: string;
    referencia: string;
    categoriaProductoId: number;
    descripcion?: string;
    precio: number;
    stock: number;
    estado: 'activo' | 'inactivo';
    imagenUrl?: string; 
}) => {
    const response = await fetch(`${BASE_URL}/productos`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify(productoData),
    });
    return handleResponse(response);
};

export const updateProducto = async (id: number, productoData: {
    nombreProducto?: string;
    referencia?: string;
    categoriaProductoId?: number;
    descripcion?: string;
    precio?: number;
    stock?: number;
    estado?: 'activo' | 'inactivo';
    imagenUrl?: string; 
}) => {
    const response = await fetch(`${BASE_URL}/productos/${id}`, {
        method: 'PUT',
        headers: buildAuthHeaders(),
        body: JSON.stringify(productoData),
    });
    return handleResponse(response);
};

export const deleteProducto = async (id: number) => {
    const response = await fetch(`${BASE_URL}/productos/${id}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

export const getCategorias = async () => {
    const response = await fetch(`${BASE_URL}/categorias`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};