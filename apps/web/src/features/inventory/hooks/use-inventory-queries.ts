import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';
import type {
  AddDamageNoteRequest,
  CreateInventoryDamageReportRequest,
  CreateInventoryItemRequest,
  CreateInventoryMovementRequest,
  CreateInventoryReservationRequest,
  CreateInventoryVerificationRequest,
  ListInventoryItemsQuery,
  ModifyInventoryReservationRequest,
  TransitionInventoryMovementRequest,
  UpdateInventoryItemRequest,
} from '../schemas/inventory.schemas';

export const inventoryKeys = {
  all: ['inventory'] as const,
  items: ['inventory', 'items'] as const,
  itemList: (query: ListInventoryItemsQuery) =>
    [
      ...inventoryKeys.items,
      'list',
      query.status ?? '',
      query.taxonomy ?? '',
      query.category ?? '',
    ] as const,
  itemDetail: (id: string) => [...inventoryKeys.items, 'detail', id] as const,
  movements: ['inventory', 'movements'] as const,
  movementsAll: ['inventory', 'movements', 'all'] as const,
  movementsByBooking: (bookingId: string) =>
    [...inventoryKeys.movements, 'booking', bookingId] as const,
  movementDetail: (id: string) =>
    [...inventoryKeys.movements, 'detail', id] as const,
  reservations: ['inventory', 'reservations'] as const,
  reservationsByBooking: (bookingId: string) =>
    [...inventoryKeys.reservations, 'booking', bookingId] as const,
  verificationsByMovement: (movementId: string) =>
    ['inventory', 'verifications', movementId] as const,
  damageReportsByMovement: (movementId: string) =>
    ['inventory', 'damage-reports', movementId] as const,
};

export function useInventoryItemsQuery(query: ListInventoryItemsQuery = {}) {
  return useQuery({
    queryKey: inventoryKeys.itemList(query),
    queryFn: () => inventoryApi.listItems(query),
    staleTime: 30_000,
  });
}

export function useInventoryItemQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: inventoryKeys.itemDetail(id ?? ''),
    queryFn: () => inventoryApi.getItemById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInventoryItemRequest) =>
      inventoryApi.createItem(body),
    onSuccess: (item) => {
      queryClient.setQueryData(inventoryKeys.itemDetail(item.id), item);
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.items });
    },
  });
}

export function useUpdateInventoryItemMutation(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateInventoryItemRequest;
      version: number;
    }) => inventoryApi.updateItem(itemId, body, version),
    onSuccess: (item) => {
      queryClient.setQueryData(inventoryKeys.itemDetail(item.id), item);
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.items });
    },
  });
}

export function useAllMovementsQuery() {
  return useQuery({
    queryKey: inventoryKeys.movementsAll,
    queryFn: () => inventoryApi.listAllMovements(),
    staleTime: 15_000,
  });
}

export function useBookingMovementsQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: inventoryKeys.movementsByBooking(bookingId ?? ''),
    queryFn: () => inventoryApi.listMovementsForBooking(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useBookingReservationsQuery(
  bookingId: string | null | undefined,
) {
  return useQuery({
    queryKey: inventoryKeys.reservationsByBooking(bookingId ?? ''),
    queryFn: () => inventoryApi.listReservationsForBooking(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useInventoryMovementQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: inventoryKeys.movementDetail(id ?? ''),
    queryFn: () => inventoryApi.getMovementById(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useMovementVerificationsQuery(
  movementId: string | null | undefined,
) {
  return useQuery({
    queryKey: inventoryKeys.verificationsByMovement(movementId ?? ''),
    queryFn: () => inventoryApi.listVerificationsForMovement(movementId!),
    enabled: Boolean(movementId),
    staleTime: 15_000,
  });
}

export function useMovementDamageReportsQuery(
  movementId: string | null | undefined,
) {
  return useQuery({
    queryKey: inventoryKeys.damageReportsByMovement(movementId ?? ''),
    queryFn: () => inventoryApi.listDamageReportsForMovement(movementId!),
    enabled: Boolean(movementId),
    staleTime: 15_000,
  });
}

export function useCreateMovementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInventoryMovementRequest) =>
      inventoryApi.createMovement(body),
    onSuccess: (movement) => {
      queryClient.setQueryData(
        inventoryKeys.movementDetail(movement.id),
        movement,
      );
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.movementsByBooking(movement.bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.movementsAll,
      });
    },
  });
}

export function useTransitionMovementMutation(movementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: TransitionInventoryMovementRequest;
      version: number;
    }) => inventoryApi.transitionMovement(movementId, body, version),
    onSuccess: (movement) => {
      queryClient.setQueryData(
        inventoryKeys.movementDetail(movement.id),
        movement,
      );
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.movementsByBooking(movement.bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.movementsAll,
      });
    },
  });
}

export function useAddDamageNoteMutation(movementId: string) {
  return useMutation({
    mutationFn: (body: AddDamageNoteRequest) =>
      inventoryApi.addDamageNote(movementId, body),
  });
}

export function useCreateReservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInventoryReservationRequest) =>
      inventoryApi.createReservation(body),
    onSuccess: (reservation) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.reservationsByBooking(reservation.bookingId),
      });
    },
  });
}

export function useModifyReservationMutation(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: ModifyInventoryReservationRequest;
      version: number;
    }) => inventoryApi.modifyReservation(reservationId, body, version),
    onSuccess: (reservation) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.reservationsByBooking(reservation.bookingId),
      });
    },
  });
}

export function useReleaseReservationMutation(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) =>
      inventoryApi.releaseReservation(reservationId, version),
    onSuccess: (reservation) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.reservationsByBooking(reservation.bookingId),
      });
    },
  });
}

export function useCancelReservationMutation(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) =>
      inventoryApi.cancelReservation(reservationId, version),
    onSuccess: (reservation) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.reservationsByBooking(reservation.bookingId),
      });
    },
  });
}

export function useCreateVerificationMutation(movementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInventoryVerificationRequest) =>
      inventoryApi.createVerification(movementId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.verificationsByMovement(movementId),
      });
    },
  });
}

export function useCreateDamageReportMutation(movementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInventoryDamageReportRequest) =>
      inventoryApi.createDamageReport(movementId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.damageReportsByMovement(movementId),
      });
    },
  });
}
