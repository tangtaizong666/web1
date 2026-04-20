import { apiRequest } from './api';

export type AuthPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export async function fetchCurrentUser() {
  return apiRequest<{ user: AuthUser }>('/api/auth/me');
}

export async function login(payload: AuthPayload) {
  return apiRequest<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload: AuthPayload) {
  return apiRequest<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  });
}
