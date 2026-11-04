import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings.api';
import type {
  AdvanceExecutionStageRequest,
  AssignExecutionOwnerRequest,
  CancelBookingRequest,
  UpdateBookingStatusRequest,
} from '../schemas/booking.schemas';

export const bookingKeys = {
  all: ['bookings'] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
};

export function useBookingQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? ''),
    queryFn: () => bookingsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useUpdateBookingStatusMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateBookingStatusRequest;
      version: number;
    }) => bookingsApi.updateStatus(bookingId, body, version),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
    },
  });
}

export function useCancelBookingMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: CancelBookingRequest;
      version: number;
    }) => bookingsApi.cancel(bookingId, body, version),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
    },
  });
}

export function useCompleteBookingMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => bookingsApi.complete(bookingId, version),
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
    },
  });
}

export function useAssignExecutionOwnerMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: AssignExecutionOwnerRequest;
      version: number;
    }) => bookingsApi.assignExecutionOwner(bookingId, body, version),
    onSuccess: () => {
      // WorkspaceDto has no version — reload full booking for If-Match.
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
    },
  });
}

export function useAdvanceExecutionStageMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: AdvanceExecutionStageRequest;
      version: number;
    }) => bookingsApi.advanceExecutionStage(bookingId, body, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
    },
  });
}
