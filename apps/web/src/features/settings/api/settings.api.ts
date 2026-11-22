import { apiClient } from '@/shared/api/client';
import {
  parseTenantSettings,
  parseTenantSettingsUpdateResult,
  type TenantSettings,
  type TenantSettingsUpdateResult,
  type UpdateTenantSettingsRequest,
} from '../schemas/settings.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/** Frozen OpenAPI `/api/v1/settings` (permissions: settings:read / settings:write). */
export const settingsApi = {
  async getSettings(): Promise<TenantSettings> {
    const { data } = await apiClient.get<unknown>('/api/v1/settings');
    return parseTenantSettings(data);
  },

  async updateSettings(
    body: UpdateTenantSettingsRequest,
    version: number,
  ): Promise<TenantSettingsUpdateResult> {
    const { data } = await apiClient.patch<unknown>('/api/v1/settings', body, {
      headers: ifMatchHeader(version),
    });
    return parseTenantSettingsUpdateResult(data);
  },
};
