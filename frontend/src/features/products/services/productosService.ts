// src/services/productosService.ts

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

// GET /api/productos
export const getProductos = async () => {
    const response = await fetch(`${BASE_URL}/productos`);
    return handleResponse(response);
};

// GET /api/productos/:id
export const getProductoById = async (id: number) => {
    const response = await fetch(`${BASE_URL}/productos/${id}`);
    return handleResponse(response);
};

// GET /api/productos/stock-bajo
export const getProductosStockBajo = async () => {
    const response = await fetch(`${BASE_URL}/productos/stock-bajo`);
    return handleResponse(response);
};

// POST /api/productos
export const createProducto = async (productoData: {
    nombreProducto: string;
    referencia: string;
    categoriaProductoId: number;
    descripcion?: string;
    precio: number;
    stock: number;
    estado: 'activo' | 'inactivo';
}) => {
    const response = await fetch(`${BASE_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoData),
    });
    return handleResponse(response);
};

// PUT /api/productos/:id
export const updateProducto = async (id: number, productoData: {
    nombreProducto?: string;
    referencia?: string;
    categoriaProductoId?: number;
    descripcion?: string;
    precio?: number;
    stock?: number;
    estado?: 'activo' | 'inactivo';
}) => {
    const response = await fetch(`${BASE_URL}/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoData),
    });
    return handleResponse(response);
};

// DELETE /api/productos/:id  (desactiva el producto, no lo borra)
export const deleteProducto = async (id: number) => {
    const response = await fetch(`${BASE_URL}/productos/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};

// GET /api/categorias  (para el selector del formulario)
export const getCategorias = async () => {
    const response = await fetch(`${BASE_URL}/categorias`);
    return handleResponse(response);
};
