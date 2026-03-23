// src/services/categoriaProductosService.ts

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

// GET /api/categorias
export const getCategorias = async () => {
    const response = await fetch(`${BASE_URL}/categorias`);
    return handleResponse(response);
};

// GET /api/categorias/:id  (incluye productos asociados)
export const getCategoriaById = async (id: number) => {
    const response = await fetch(`${BASE_URL}/categorias/${id}`);
    return handleResponse(response);
};

// POST /api/categorias
export const createCategoria = async (categoriaData: { nombreCategoria: string; descripcion: string }) => {
    const response = await fetch(`${BASE_URL}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoriaData),
    });
    return handleResponse(response);
};

// PUT /api/categorias/:id
export const updateCategoria = async (id: number, categoriaData: { nombreCategoria: string; descripcion: string }) => {
    const response = await fetch(`${BASE_URL}/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoriaData),
    });
    return handleResponse(response);
};

// DELETE /api/categorias/:id
export const deleteCategoria = async (id: number) => {
    const response = await fetch(`${BASE_URL}/categorias/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};
