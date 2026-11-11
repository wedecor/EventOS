import { API_BASE, requireE2eCredentials } from './env';

type Json = Record<string, unknown>;

let cachedToken: string | null = null;

async function loginToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const { email, password } = requireE2eCredentials();
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`API login failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { data: { accessToken: string } };
  cachedToken = body.data.accessToken;
  return cachedToken;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await loginToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${path} → ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function assertEntityExists(path: string): Promise<Json> {
  const body = await apiJson<{ data: Json }>(path);
  return body.data;
}

export async function findBookingIdByQuotation(
  quotationId: string,
): Promise<string | null> {
  const body = await apiJson<{
    data: Array<{ id: string; quotationId: string }>;
  }>('/api/v1/bookings?page=1&pageSize=50&sort=createdAt&order=desc');
  const hit = body.data.find((row) => row.quotationId === quotationId);
  return hit?.id ?? null;
}
