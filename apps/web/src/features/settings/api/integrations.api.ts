import { apiClient } from '@/shared/api/client';
import {
  parseIntegrationConnectionTestResult,
  parseIntegrationSettings,
  parseIntegrationSettingsUpdateResult,
  type IntegrationConnectionTestResult,
  type IntegrationSettings,
  type IntegrationSettingsUpdateResult,
  type UpdateIntegrationSettingsRequest,
} from '../schemas/integrations.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/** `/api/v1/integrations/settings` — secrets are write-only and never returned. */
export const integrationsApi = {
  async getSettings(): Promise<IntegrationSettings> {
    const { data } = await apiClient.get<unknown>('/api/v1/integrations/settings');
    return parseIntegrationSettings(data);
  },

  async updateSettings(
    body: UpdateIntegrationSettingsRequest,
    version: number,
  ): Promise<IntegrationSettingsUpdateResult> {
    const { data } = await apiClient.patch<unknown>(
      '/api/v1/integrations/settings',
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseIntegrationSettingsUpdateResult(data);
  },

  async testEmail(to?: string): Promise<IntegrationConnectionTestResult> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/integrations/settings/test-email',
      to ? { to } : {},
    );
    return parseIntegrationConnectionTestResult(data);
  },

  async testStorage(): Promise<IntegrationConnectionTestResult> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/integrations/settings/test-storage',
      {},
    );
    return parseIntegrationConnectionTestResult(data);
  },
};
