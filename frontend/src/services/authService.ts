import { getApiBaseUrl, handleResponse, buildAuthHeaders } from './http';

export type SafeUser = {
  id: number;
  rolesId: number;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  usuario: SafeUser;
};

export async function login(email: string, password: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(response);
}

export async function register(rolesId: number, email: string, password: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ rolesId, email, password }),
  });
  return handleResponse<{ message: string; usuario: SafeUser }>(response);
}

export async function forgotPassword(email: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ message: string; devCode?: string; expiresInMs?: number }>(response);
}

export async function verifyCode(email: string, code: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/verify-code`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ email, code }),
  });
  return handleResponse<{ message: string }>(response);
}

export async function resendCode(email: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/resend-code`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ message: string; devCode?: string; expiresInMs?: number }>(response);
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ email, code, newPassword }),
  });
  return handleResponse<{ message: string }>(response);
}

