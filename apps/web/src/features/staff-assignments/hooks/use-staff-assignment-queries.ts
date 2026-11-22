import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '@/features/workspace/hooks/use-workspace-queries';
import { staffAssignmentsApi } from '../api/staff-assignments.api';
import type { CreateStaffAssignmentRequest } from '../schemas/staff-assignment.schemas';

export const staffAssignmentKeys = {
  all: ['staff-assignments'] as const,
  byBooking: (bookingId: string) =>
    [...staffAssignmentKeys.all, 'booking', bookingId] as const,
};

function invalidateAssignmentRelated(
  queryClient: ReturnType<typeof useQueryClient>,
  bookingId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: staffAssignmentKeys.byBooking(bookingId),
  });
  void queryClient.invalidateQueries({
    queryKey: workspaceKeys.progress(bookingId),
  });
  void queryClient.invalidateQueries({
    queryKey: workspaceKeys.activity(bookingId),
  });
}

export function useStaffAssignmentsByBookingQuery(
  bookingId: string | null | undefined,
) {
  return useQuery({
    queryKey: staffAssignmentKeys.byBooking(bookingId ?? ''),
    queryFn: () => staffAssignmentsApi.listByBooking(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useCreateStaffAssignmentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<CreateStaffAssignmentRequest, 'bookingId'>) =>
      staffAssignmentsApi.create({ ...body, bookingId }),
    onSuccess: () => invalidateAssignmentRelated(queryClient, bookingId),
  });
}

export function useConfirmStaffAssignmentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      staffAssignmentsApi.confirm(id, version),
    onSuccess: () => invalidateAssignmentRelated(queryClient, bookingId),
  });
}

export function useReleaseStaffAssignmentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      staffAssignmentsApi.release(id, version),
    onSuccess: () => invalidateAssignmentRelated(queryClient, bookingId),
  });
}

export function useCancelStaffAssignmentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      version,
    }: {
      id: string;
      reason: string;
      version: number;
    }) => staffAssignmentsApi.cancel(id, reason, version),
    onSuccess: () => invalidateAssignmentRelated(queryClient, bookingId),
  });
}
