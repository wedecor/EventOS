import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '@/features/workspace/hooks/use-workspace-queries';
import {
  checklistTemplatesApi,
  eventChecklistsApi,
} from '../api/checklists.api';
import type {
  ChecklistTemplateStatus,
  CreateChecklistTemplateItemRequest,
  CreateChecklistTemplateRequest,
  UpdateChecklistTemplateRequest,
  UpdateEventChecklistItemRequest,
} from '../schemas/checklist.schemas';

export const checklistTemplateKeys = {
  all: ['checklist-templates'] as const,
  list: (status?: ChecklistTemplateStatus) =>
    [...checklistTemplateKeys.all, 'list', status ?? 'all'] as const,
  detail: (id: string) => [...checklistTemplateKeys.all, 'detail', id] as const,
  versions: (id: string) =>
    [...checklistTemplateKeys.all, 'versions', id] as const,
};

export const eventChecklistKeys = {
  all: ['event-checklists'] as const,
  byBooking: (bookingId: string) =>
    [...eventChecklistKeys.all, 'booking', bookingId] as const,
};

export function useChecklistTemplatesQuery(status?: ChecklistTemplateStatus) {
  return useQuery({
    queryKey: checklistTemplateKeys.list(status),
    queryFn: () => checklistTemplatesApi.list(status),
    staleTime: 30_000,
  });
}

export function useChecklistTemplateQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: checklistTemplateKeys.detail(id ?? ''),
    queryFn: () => checklistTemplatesApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useCreateChecklistTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateChecklistTemplateRequest) =>
      checklistTemplatesApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.all,
      });
    },
  });
}

export function useUpdateChecklistTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      version,
    }: {
      id: string;
      body: UpdateChecklistTemplateRequest;
      version: number;
    }) => checklistTemplatesApi.update(id, body, version),
    onSuccess: (template) => {
      void queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.detail(template.id),
      });
    },
  });
}

export function useArchiveChecklistTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      checklistTemplatesApi.archive(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.all,
      });
    },
  });
}

export function useDuplicateChecklistTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistTemplatesApi.duplicate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.all,
      });
    },
  });
}

export function useAddChecklistTemplateItemMutation(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateChecklistTemplateItemRequest) =>
      checklistTemplatesApi.addItem(templateId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.detail(templateId),
      });
      void queryClient.invalidateQueries({
        queryKey: checklistTemplateKeys.all,
      });
    },
  });
}

export function useEventChecklistsByBookingQuery(
  bookingId: string | null | undefined,
) {
  return useQuery({
    queryKey: eventChecklistKeys.byBooking(bookingId ?? ''),
    queryFn: () => eventChecklistsApi.listByBooking(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useGenerateEventChecklistsMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateIds?: string[]) =>
      eventChecklistsApi.generate({ bookingId, templateIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: eventChecklistKeys.byBooking(bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.progress(bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.activity(bookingId),
      });
    },
  });
}

export function useUpdateEventChecklistItemMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      checklistId,
      itemId,
      body,
      version,
    }: {
      checklistId: string;
      itemId: string;
      body: UpdateEventChecklistItemRequest;
      version: number;
    }) => eventChecklistsApi.updateItem(checklistId, itemId, body, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: eventChecklistKeys.byBooking(bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.progress(bookingId),
      });
    },
  });
}
