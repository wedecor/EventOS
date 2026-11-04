import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/lib/env';
import { ApiError, type ApiErrorBody } from '@/shared/types/api';

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void | Promise<void>;

let accessTokenGetter: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => undefined;
let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function bindAuthTokenGetter(getter: TokenGetter): void {
  accessTokenGetter = getter;
}

export function bindUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

export function bindRefreshHandler(handler: () => Promise<string | null>): void {
  refreshHandler = handler;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as ApiErrorBody).code === 'string' &&
    typeof (value as ApiErrorBody).message === 'string'
  );
}

/**
 * Shared Axios client for the frozen OpenAPI contract.
 * - Sends cookies (`withCredentials`) so HTTP-only refresh tokens work (ADR-008).
 * - Attaches Bearer access tokens from the auth store.
 * - On 401, attempts a single refresh then retries; otherwise clears session.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = accessTokenGetter();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const body = error.response?.data;

    const requestUrl = original?.url ?? '';
    const isAuthBootstrapRequest =
      requestUrl.includes('/api/v1/auth/refresh') ||
      requestUrl.includes('/api/v1/auth/login');

    if (
      status === 401 &&
      original &&
      !original._retry &&
      refreshHandler &&
      !isAuthBootstrapRequest
    ) {
      original._retry = true;
      try {
        refreshPromise ??= refreshHandler().finally(() => {
          refreshPromise = null;
        });
        const nextToken = await refreshPromise;
        if (nextToken) {
          original.headers.Authorization = `Bearer ${nextToken}`;
          return apiClient(original);
        }
      } catch {
        // fall through to unauthorized handling
      }
      await onUnauthorized();
    }

    if (isApiErrorBody(body) && status !== undefined) {
      throw new ApiError(status, body);
    }

    throw error;
  },
);
