import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { integrationsApi } from '../api/integrations.api';
import type { UpdateIntegrationSettingsRequest } from '../schemas/integrations.schemas';

export const integrationsKeys = {
  all: ['integrations'] as const,
  settings: () => [...integrationsKeys.all, 'settings'] as const,
};

const STALE_MS = 30_000;

export function useIntegrationSettingsQuery() {
  return useQuery({
    queryKey: integrationsKeys.settings(),
    queryFn: () => integrationsApi.getSettings(),
    staleTime: STALE_MS,
  });
}

export function useUpdateIntegrationSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateIntegrationSettingsRequest;
      version: number;
    }) => integrationsApi.updateSettings(body, version),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: integrationsKeys.settings(),
      });
    },
  });
}

export function useTestEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (to?: string) => integrationsApi.testEmail(to),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: integrationsKeys.settings(),
      });
    },
  });
}

export function useTestStorageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationsApi.testStorage(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: integrationsKeys.settings(),
      });
    },
  });
}
