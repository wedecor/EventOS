import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api';
import type { UpdateTenantSettingsRequest } from '../schemas/settings.schemas';

export const settingsKeys = {
  all: ['settings'] as const,
  tenant: () => [...settingsKeys.all, 'tenant'] as const,
};

const STALE_MS = 30_000;

export function useTenantSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.tenant(),
    queryFn: () => settingsApi.getSettings(),
    staleTime: STALE_MS,
  });
}

export function useUpdateTenantSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateTenantSettingsRequest;
      version: number;
    }) => settingsApi.updateSettings(body, version),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.tenant() });
    },
  });
}
