import { API_BASE } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope<T> = { data: T };

let accessToken: string | null =
  typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('eventos.accessToken')
    : null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    sessionStorage.setItem('eventos.accessToken', token);
  } else {
    sessionStorage.removeItem('eventos.accessToken');
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    type ErrorBody = {
      message?: string;
      code?: string;
      error?: { message?: string; code?: string };
    };
    const body: ErrorBody =
      (await parseJson<ErrorBody>(response).catch(() => null)) ?? {};
    const message =
      body.message ?? body.error?.message ?? response.statusText;
    const code = body.code ?? body.error?.code;
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const envelope = await parseJson<ApiEnvelope<T>>(response);
  return envelope.data;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiRequest<{
    accessToken: string;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.accessToken);
}

export async function refreshSession(): Promise<boolean> {
  try {
    const data = await apiRequest<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(response.statusText, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
