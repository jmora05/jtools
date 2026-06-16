/**
 * clientesService.ts
 * Capa de acceso a la API REST del módulo Clientes.
 *
 * Todas las funciones delegan autenticación en buildAuthHeaders() (JWT Bearer)
 * y el manejo de errores en handleResponse(), que lanza excepciones tipadas
 * con el mensaje del backend para que el componente pueda mostrarlo directamente.
 *
 * Separación de responsabilidades:
 *   - deleteCliente  → desactivación lógica (estado='inactivo'), cualquier rol
 *   - forceDeleteCliente → eliminación física, solo cuando no hay historial
 *   - getClienteMe / updateClienteMe → rutas de auto-gestión del portal cliente
 */
import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '@/services/http';

// Base URL resuelta en tiempo de ejecución para soportar distintos entornos
// (desarrollo local, staging, producción) sin recompilar.
const BASE_URL = getApiBaseUrl();

/**
 * Obtiene el listado completo de clientes (activos e inactivos).
 * Usado exclusivamente desde el panel de administración; el portal cliente
 * usa getClientesActivos() para no ver registros deshabilitados.
 */
export const getClientes = async () => {
    const response = await fetch(`${BASE_URL}/clientes`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

/**
 * Recupera un cliente por su PK para pre-cargar el formulario de edición
 * o para mostrar el detalle en otros módulos que referencian al cliente.
 */
export const getClienteById = async (id: number) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

/**
 * Devuelve el cliente junto con todas sus ventas y pedidos asociados.
 * El backend incluye tanto ventas directas como registros con tipoVenta='pedido',
 * por lo que esta función sirve para la vista de historial del portal cliente.
 */
export const getHistorialCliente = async (id: number) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}/historial`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

/**
 * Lista solo los clientes con estado='activo'.
 * Se usa en los selectores de ventas/pedidos para garantizar que no se generen
 * transacciones asociadas a clientes deshabilitados.
 */
export const getClientesActivos = async () => {
    const response = await fetch(`${BASE_URL}/clientes/activos`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

/**
 * Crea un nuevo cliente en el sistema. El campo `foto` es opcional y se
 * reserva para implementaciones futuras de avatar de perfil.
 * Si el cuerpo incluye `password`, el backend creará simultáneamente el
 * Usuario de portal vinculado por email.
 */
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

/**
 * Actualiza datos de un cliente existente. Acepta actualizaciones parciales:
 * solo se envían los campos que cambiaron, reduciendo el riesgo de sobrescribir
 * datos concurrentes. También puede usarse exclusivamente para cambiar el estado
 * (activo/inactivo) desde el toggle de la tabla.
 */
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

/**
 * Recupera el perfil del cliente actualmente autenticado en el portal.
 * La ruta /cliente/me usa el token JWT para identificar al cliente sin
 * necesidad de exponer su ID interno en la URL (previene enumeración).
 */
export const getClienteMe = async () => {
    const response = await fetch(`${BASE_URL}/cliente/me`, {
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};

/**
 * Permite al cliente actualizar sus propios datos de contacto desde el portal.
 * No incluye campos sensibles como estado o tipo_documento, que solo pueden
 * modificar los administradores desde el panel de gestión.
 */
export const updateClienteMe = async (data: {
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
}) => {
    const response = await fetch(`${BASE_URL}/cliente/me`, {
        method: 'PUT',
        headers: buildAuthHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

/**
 * Desactivación lógica: el backend cambia el estado del cliente a 'inactivo'.
 * Si el cliente tiene historial de ventas o pedidos, esta es la única operación
 * permitida; la eliminación física se bloquea para preservar la auditoría.
 */
export const deleteCliente = async (id: number) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};
/**
 * Eliminación física del cliente (ruta /force). El backend solo lo permite
 * cuando no existen ventas ni pedidos vinculados; de lo contrario responde 400.
 * El frontend verifica el error y muestra el mensaje del servidor al operador.
 */
export const forceDeleteCliente = async (id: number) => {
    const response = await fetch(`${BASE_URL}/clientes/${id}/force`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
    });
    return handleResponse(response);
};
