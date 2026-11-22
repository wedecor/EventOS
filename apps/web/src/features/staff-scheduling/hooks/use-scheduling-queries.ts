import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffSchedulingApi } from '../api/scheduling.api';
import type {
  CreateAvailabilityRequest,
  CreateLeaveRequest,
  StaffLeave,
} from '../schemas/scheduling.schemas';

export const schedulingKeys = {
  all: ['staff-scheduling'] as const,
  availability: (staffMemberId: string) =>
    [...schedulingKeys.all, 'availability', staffMemberId] as const,
  leave: (staffMemberId: string, status?: string) =>
    [...schedulingKeys.all, 'leave', staffMemberId, status ?? ''] as const,
  workload: (staffMemberId?: string) =>
    [...schedulingKeys.all, 'workload', staffMemberId ?? 'all'] as const,
  calendar: (from: string, to: string, staffMemberId?: string) =>
    [
      ...schedulingKeys.all,
      'calendar',
      from,
      to,
      staffMemberId ?? 'all',
    ] as const,
  recommendations: (bookingId: string) =>
    [...schedulingKeys.all, 'recommendations', bookingId] as const,
  conflicts: (staffMemberId: string, bookingId: string) =>
    [...schedulingKeys.all, 'conflicts', staffMemberId, bookingId] as const,
};

export function useStaffAvailabilityQuery(staffMemberId: string | null) {
  return useQuery({
    queryKey: schedulingKeys.availability(staffMemberId ?? ''),
    queryFn: () => staffSchedulingApi.listAvailability(staffMemberId!),
    enabled: Boolean(staffMemberId),
  });
}

export function useStaffLeaveQuery(
  staffMemberId: string | null,
  status?: StaffLeave['status'],
) {
  return useQuery({
    queryKey: schedulingKeys.leave(staffMemberId ?? '', status),
    queryFn: () => staffSchedulingApi.listLeave(staffMemberId!, status),
    enabled: Boolean(staffMemberId),
  });
}

export function useStaffWorkloadQuery(staffMemberId?: string | null) {
  return useQuery({
    queryKey: schedulingKeys.workload(staffMemberId ?? undefined),
    queryFn: () =>
      staffSchedulingApi.workload(staffMemberId ?? undefined),
    enabled: staffMemberId !== null,
  });
}

export function useSchedulingCalendarQuery(params: {
  from: string;
  to: string;
  staffMemberId?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: schedulingKeys.calendar(
      params.from,
      params.to,
      params.staffMemberId,
    ),
    queryFn: () => staffSchedulingApi.calendar(params),
    enabled: params.enabled !== false && Boolean(params.from && params.to),
  });
}

export function useStaffRecommendationsQuery(bookingId: string | null) {
  return useQuery({
    queryKey: schedulingKeys.recommendations(bookingId ?? ''),
    queryFn: () => staffSchedulingApi.recommendations(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useStaffConflictsQuery(
  staffMemberId: string | null,
  bookingId: string | null,
) {
  return useQuery({
    queryKey: schedulingKeys.conflicts(staffMemberId ?? '', bookingId ?? ''),
    queryFn: () =>
      staffSchedulingApi.conflicts({
        staffMemberId: staffMemberId!,
        bookingId: bookingId!,
      }),
    enabled: Boolean(staffMemberId && bookingId),
  });
}

export function useCreateAvailabilityMutation(staffMemberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAvailabilityRequest) =>
      staffSchedulingApi.createAvailability(body),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: schedulingKeys.availability(staffMemberId),
      });
      void qc.invalidateQueries({ queryKey: schedulingKeys.all });
    },
  });
}

export function useDeleteAvailabilityMutation(staffMemberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffSchedulingApi.deleteAvailability(id),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: schedulingKeys.availability(staffMemberId),
      });
    },
  });
}

export function useCreateLeaveMutation(staffMemberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLeaveRequest) =>
      staffSchedulingApi.createLeave(body),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: schedulingKeys.leave(staffMemberId),
      });
      void qc.invalidateQueries({ queryKey: schedulingKeys.all });
    },
  });
}

export function useReviewLeaveMutation(staffMemberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: 'approved' | 'rejected' | 'cancelled';
      version: number;
      notes?: string | null;
    }) =>
      staffSchedulingApi.reviewLeave(
        input.id,
        input.status,
        input.version,
        input.notes,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: schedulingKeys.leave(staffMemberId),
      });
      void qc.invalidateQueries({ queryKey: schedulingKeys.all });
    },
  });
}
