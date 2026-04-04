import { getApiBaseUrl, buildAuthHeaders, handleResponse } from '../../../services/http';

export type Empleado = {
  id?: number;
  tipoDocumento: 'CC' | 'CE' | 'Pasaporte';
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  cargo: 'Supervisor de Producción' | 'Jefe de Área' | 'Operario' | 'Técnico de Calidad' | 'Asistente';
  area: 'Producción' | 'Calidad' | 'Logística' | 'Mantenimiento' | 'Administración';
  direccion?: string;
  ciudad?: string;
  fechaIngreso: string;
  estado: 'activo' | 'inactivo';
};

const BASE = getApiBaseUrl();

export async function getEmpleados(): Promise<Empleado[]> {
  const res = await fetch(`${BASE}/empleados`, {
    headers: buildAuthHeaders(),
  });
  return handleResponse<Empleado[]>(res);
}

export async function getEmpleadoById(id: number): Promise<Empleado> {
  const res = await fetch(`${BASE}/empleados/${id}`, {
    headers: buildAuthHeaders(),
  });
  return handleResponse<Empleado>(res);
}

export async function createEmpleado(data: Omit<Empleado, 'id'>): Promise<{ message: string; empleado: Empleado }> {
  const res = await fetch(`${BASE}/empleados`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateEmpleado(id: number, data: Partial<Empleado>): Promise<{ message: string; empleado: Empleado }> {
  const res = await fetch(`${BASE}/empleados/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteEmpleado(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/empleados/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse(res);
}