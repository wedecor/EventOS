import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '@/features/workspace/hooks/use-workspace-queries';
import { tasksApi } from '../api/tasks.api';
import type {
  AddChecklistItemRequest,
  CreateTaskRequest,
  UpdateChecklistItemRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
} from '../schemas/task.schemas';

export const taskKeys = {
  all: ['tasks'] as const,
  byBooking: (bookingId: string) =>
    [...taskKeys.all, 'booking', bookingId] as const,
};

function invalidateTaskRelated(
  queryClient: ReturnType<typeof useQueryClient>,
  bookingId: string,
) {
  void queryClient.invalidateQueries({ queryKey: taskKeys.byBooking(bookingId) });
  void queryClient.invalidateQueries({
    queryKey: workspaceKeys.progress(bookingId),
  });
  void queryClient.invalidateQueries({
    queryKey: workspaceKeys.activity(bookingId),
  });
}

export function useTasksByBookingQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: taskKeys.byBooking(bookingId ?? ''),
    queryFn: () => tasksApi.listByBooking(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useCreateTaskMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<CreateTaskRequest, 'bookingId'>) =>
      tasksApi.create({ ...body, bookingId }),
    onSuccess: () => invalidateTaskRelated(queryClient, bookingId),
  });
}

export function useUpdateTaskMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      version,
    }: {
      id: string;
      body: UpdateTaskRequest;
      version: number;
    }) => tasksApi.update(id, body, version),
    onSuccess: () => invalidateTaskRelated(queryClient, bookingId),
  });
}

export function useUpdateTaskStatusMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      version,
    }: {
      id: string;
      body: UpdateTaskStatusRequest;
      version: number;
    }) => tasksApi.updateStatus(id, body, version),
    onSuccess: () => invalidateTaskRelated(queryClient, bookingId),
  });
}

export function useAddChecklistItemMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      body,
    }: {
      taskId: string;
      body: AddChecklistItemRequest;
    }) => tasksApi.addChecklistItem(taskId, body),
    onSuccess: () => invalidateTaskRelated(queryClient, bookingId),
  });
}

export function useUpdateChecklistItemMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      itemId,
      body,
      version,
    }: {
      taskId: string;
      itemId: string;
      body: UpdateChecklistItemRequest;
      version: number;
    }) => tasksApi.updateChecklistItem(taskId, itemId, body, version),
    onSuccess: () => invalidateTaskRelated(queryClient, bookingId),
  });
}
