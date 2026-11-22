import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingKeys } from '@/features/bookings';
import { workspaceApi } from '../api/workspace.api';
import type { CreateEventNoteRequest } from '../schemas/workspace.schemas';

export const workspaceKeys = {
  all: ['workspace'] as const,
  detail: (bookingId: string) =>
    [...workspaceKeys.all, 'detail', bookingId] as const,
  progress: (bookingId: string) =>
    [...workspaceKeys.all, 'progress', bookingId] as const,
  activity: (bookingId: string) =>
    [...workspaceKeys.all, 'activity', bookingId] as const,
  notes: (bookingId: string) =>
    [...workspaceKeys.all, 'notes', bookingId] as const,
};

export function useWorkspaceQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: workspaceKeys.detail(bookingId ?? ''),
    queryFn: () => workspaceApi.getByBookingId(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 30_000,
  });
}

export function useWorkspaceProgressQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: workspaceKeys.progress(bookingId ?? ''),
    queryFn: () => workspaceApi.getProgress(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useWorkspaceActivityQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: workspaceKeys.activity(bookingId ?? ''),
    queryFn: () => workspaceApi.getActivity(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useWorkspaceNotesQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: workspaceKeys.notes(bookingId ?? ''),
    queryFn: () => workspaceApi.listNotes(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useActivateWorkspaceMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingVersion: number) =>
      workspaceApi.activate(bookingId, bookingVersion),
    onSuccess: (workspace) => {
      queryClient.setQueryData(workspaceKeys.detail(bookingId), workspace);
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.activity(bookingId),
      });
    },
  });
}

export function useCreateWorkspaceNoteMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEventNoteRequest) =>
      workspaceApi.createNote(bookingId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.notes(bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.activity(bookingId),
      });
    },
  });
}

export function useDeleteWorkspaceNoteMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => workspaceApi.deleteNote(bookingId, noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.notes(bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.activity(bookingId),
      });
    },
  });
}
