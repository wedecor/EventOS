import { apiClient } from '@/shared/api/client';
import type { operations } from '@/types/api.generated';
import {
  parseAuthSuccessEnvelope,
  type AuthSessionPayload,
  type ChangePasswordRequestBody,
  type LoginRequestBody,
  type RefreshRequestBody,
} from '../schemas/auth.schemas';

type LogoutResponse =
  operations['AuthController_logout']['responses'][200]['content']['application/json'];

/**
 * Auth endpoints from frozen OpenAPI (`/api/v1/auth/*`).
 * Request bodies use generated OpenAPI types.
 * Success payloads are Zod-parsed (OpenAPI `data` is currently untyped).
 */
export const authApi = {
  async login(credentials: LoginRequestBody): Promise<AuthSessionPayload> {
    const { data } = await apiClient.post<unknown>('/api/v1/auth/login', credentials);
    return parseAuthSuccessEnvelope(data);
  },

  /**
   * Refresh via HTTP-only cookie (ADR-008). Empty body is valid per OpenAPI
   * (`refreshToken` optional for non-browser clients).
   */
  async refresh(body: RefreshRequestBody = {}): Promise<AuthSessionPayload> {
    const { data } = await apiClient.post<unknown>('/api/v1/auth/refresh', body);
    return parseAuthSuccessEnvelope(data);
  },

  async logout(): Promise<void> {
    await apiClient.post<LogoutResponse>('/api/v1/auth/logout', {});
  },

  /**
   * Self-service password change (JWT required; no settings:* permission).
   * Backend revokes all refresh sessions on success — caller should clear local session.
   */
  async changePassword(body: ChangePasswordRequestBody): Promise<void> {
    await apiClient.post<unknown>('/api/v1/auth/change-password', body);
  },
};
