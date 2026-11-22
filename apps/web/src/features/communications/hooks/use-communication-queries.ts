import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '../api/communications.api';
import type {
  AddCommunicationAttachmentRequest,
  CreateCommunicationRequest,
  CreateCommunicationTemplateRequest,
  CreateReminderRequest,
  TransitionCommunicationRequest,
  UpdateCommunicationRequest,
  UpdateCommunicationTemplateRequest,
} from '../schemas/communication.schemas';

export const communicationKeys = {
  all: ['communications'] as const,
  lists: ['communications', 'list'] as const,
  listAll: ['communications', 'list', 'all'] as const,
  listByBooking: (bookingId: string) =>
    ['communications', 'list', 'booking', bookingId] as const,
  detail: (id: string) => ['communications', 'detail', id] as const,
  attachments: (id: string) =>
    ['communications', 'attachments', id] as const,
  templates: ['communications', 'templates'] as const,
  reminders: ['communications', 'reminders'] as const,
  remindersAll: ['communications', 'reminders', 'all'] as const,
  remindersByBooking: (bookingId: string) =>
    ['communications', 'reminders', 'booking', bookingId] as const,
};

export function useCommunicationsQuery(bookingId?: string | null) {
  return useQuery({
    queryKey: bookingId
      ? communicationKeys.listByBooking(bookingId)
      : communicationKeys.listAll,
    queryFn: () =>
      bookingId
        ? communicationsApi.listForBooking(bookingId)
        : communicationsApi.listAll(),
    staleTime: 15_000,
  });
}

export function useCommunicationQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: communicationKeys.detail(id ?? ''),
    queryFn: () => communicationsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useCommunicationAttachmentsQuery(
  id: string | null | undefined,
) {
  return useQuery({
    queryKey: communicationKeys.attachments(id ?? ''),
    queryFn: () => communicationsApi.listAttachments(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useCreateCommunicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCommunicationRequest) =>
      communicationsApi.create(body),
    onSuccess: (record) => {
      queryClient.setQueryData(communicationKeys.detail(record.id), record);
      void queryClient.invalidateQueries({ queryKey: communicationKeys.lists });
    },
  });
}

export function useUpdateCommunicationMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateCommunicationRequest;
      version: number;
    }) => communicationsApi.update(id, body, version),
    onSuccess: (record) => {
      queryClient.setQueryData(communicationKeys.detail(record.id), record);
      void queryClient.invalidateQueries({ queryKey: communicationKeys.lists });
    },
  });
}

export function useTransitionCommunicationMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: TransitionCommunicationRequest;
      version: number;
    }) => communicationsApi.transition(id, body, version),
    onSuccess: (record) => {
      queryClient.setQueryData(communicationKeys.detail(record.id), record);
      void queryClient.invalidateQueries({ queryKey: communicationKeys.lists });
    },
  });
}

export function useDeleteCommunicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      communicationsApi.softDelete(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.all });
    },
  });
}

export function useAddAttachmentMutation(communicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddCommunicationAttachmentRequest) =>
      communicationsApi.addAttachment(communicationId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communicationKeys.attachments(communicationId),
      });
    },
  });
}

export function useCommunicationTemplatesQuery() {
  return useQuery({
    queryKey: communicationKeys.templates,
    queryFn: () => communicationsApi.listTemplates(),
    staleTime: 30_000,
  });
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCommunicationTemplateRequest) =>
      communicationsApi.createTemplate(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communicationKeys.templates,
      });
    },
  });
}

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      version,
    }: {
      id: string;
      body: UpdateCommunicationTemplateRequest;
      version: number;
    }) => communicationsApi.updateTemplate(id, body, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communicationKeys.templates,
      });
    },
  });
}

export function useArchiveTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      communicationsApi.archiveTemplate(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communicationKeys.templates,
      });
    },
  });
}

export function useRemindersQuery(bookingId?: string | null) {
  return useQuery({
    queryKey: bookingId
      ? communicationKeys.remindersByBooking(bookingId)
      : communicationKeys.remindersAll,
    queryFn: () =>
      bookingId
        ? communicationsApi.listRemindersForBooking(bookingId)
        : communicationsApi.listReminders(),
    staleTime: 15_000,
  });
}

export function useCreateReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReminderRequest) =>
      communicationsApi.createReminder(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communicationKeys.reminders,
      });
    },
  });
}

export function useCompleteReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      communicationsApi.completeReminder(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communicationKeys.reminders,
      });
    },
  });
}

export function useCancelReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      communicationsApi.cancelReminder(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communicationKeys.reminders,
      });
    },
  });
}
