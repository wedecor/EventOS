import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '@/features/workspace/hooks/use-workspace-queries';
import { vendorsApi } from '../api/vendors.api';
import type { CreateVendorProcurementRequest } from '../schemas/procurement.schemas';
import type {
  AddVendorIssueNoteRequest,
  CreateVendorRequest,
  ListVendorsQuery,
  UpdateVendorRequest,
} from '../schemas/vendor.schemas';

export const vendorKeys = {
  all: ['vendors'] as const,
  list: (query: ListVendorsQuery) =>
    [...vendorKeys.all, 'list', query.status ?? '', query.category ?? ''] as const,
  detail: (id: string) => [...vendorKeys.all, 'detail', id] as const,
  procurements: (bookingId: string) =>
    [...vendorKeys.all, 'procurements', bookingId] as const,
  procurementAll: () => [...vendorKeys.all, 'procurements', 'all'] as const,
  procurementDetail: (id: string) =>
    [...vendorKeys.all, 'procurement', id] as const,
};

export function useVendorsQuery(query: ListVendorsQuery = {}) {
  return useQuery({
    queryKey: vendorKeys.list(query),
    queryFn: () => vendorsApi.list(query),
    staleTime: 30_000,
  });
}

export function useVendorQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: vendorKeys.detail(id ?? ''),
    queryFn: () => vendorsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useBookingProcurementsQuery(
  bookingId: string | null | undefined,
) {
  return useQuery({
    queryKey: vendorKeys.procurements(bookingId ?? ''),
    queryFn: () => vendorsApi.listProcurementsForBooking(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useCreateVendorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVendorRequest) => vendorsApi.create(body),
    onSuccess: (vendor) => {
      queryClient.setQueryData(vendorKeys.detail(vendor.id), vendor);
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}

export function useUpdateVendorMutation(vendorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateVendorRequest;
      version: number;
    }) => vendorsApi.update(vendorId, body, version),
    onSuccess: (vendor) => {
      queryClient.setQueryData(vendorKeys.detail(vendor.id), vendor);
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}

export function useAddVendorIssueNoteMutation(vendorId: string) {
  return useMutation({
    mutationFn: (body: AddVendorIssueNoteRequest) =>
      vendorsApi.addIssueNote(vendorId, body),
  });
}

export function useCreateProcurementMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVendorProcurementRequest) =>
      vendorsApi.createProcurement(bookingId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vendorKeys.procurements(bookingId),
      });
      void queryClient.invalidateQueries({
        queryKey: vendorKeys.procurementAll(),
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

export function useAllProcurementsQuery() {
  return useQuery({
    queryKey: vendorKeys.procurementAll(),
    queryFn: () => vendorsApi.listAllProcurements(),
    staleTime: 15_000,
  });
}

export function useProcurementQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: vendorKeys.procurementDetail(id ?? ''),
    queryFn: () => vendorsApi.getProcurement(id!),
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}

function invalidateProcurement(
  queryClient: ReturnType<typeof useQueryClient>,
  procurement: { id: string; bookingId: string },
) {
  void queryClient.invalidateQueries({
    queryKey: vendorKeys.procurementDetail(procurement.id),
  });
  void queryClient.invalidateQueries({
    queryKey: vendorKeys.procurements(procurement.bookingId),
  });
  void queryClient.invalidateQueries({
    queryKey: vendorKeys.procurementAll(),
  });
  void queryClient.invalidateQueries({
    queryKey: workspaceKeys.activity(procurement.bookingId),
  });
  void queryClient.invalidateQueries({
    queryKey: workspaceKeys.progress(procurement.bookingId),
  });
}

export function useTransitionProcurementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      toStatus: string;
      version: number;
    }) =>
      vendorsApi.transitionProcurement(
        input.id,
        input.toStatus,
        input.version,
      ),
    onSuccess: (procurement) => invalidateProcurement(queryClient, procurement),
  });
}

export function useUpdateProcurementDeliveryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      version: number;
      deliveryStatus: string;
      deliveryNotes?: string | null;
      actualCost?: number | null;
    }) =>
      vendorsApi.updateDelivery(
        input.id,
        {
          deliveryStatus: input.deliveryStatus,
          deliveryNotes: input.deliveryNotes,
          actualCost: input.actualCost,
        },
        input.version,
      ),
    onSuccess: (procurement) => invalidateProcurement(queryClient, procurement),
  });
}

export function useCreateProcurementQuoteMutation(procurementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      amount: number;
      notes?: string | null;
      attachmentName?: string | null;
    }) => vendorsApi.createQuote(procurementId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vendorKeys.procurementDetail(procurementId),
      });
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}

export function useApproveProcurementQuoteMutation(procurementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { quoteId: string; version: number }) =>
      vendorsApi.approveQuote(input.quoteId, input.version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vendorKeys.procurementDetail(procurementId),
      });
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}

export function useCreatePurchaseOrderMutation(procurementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: {
      totalAmount?: number;
      notes?: string | null;
      issue?: boolean;
    }) => vendorsApi.createPurchaseOrder(procurementId, body ?? {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vendorKeys.procurementDetail(procurementId),
      });
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}
