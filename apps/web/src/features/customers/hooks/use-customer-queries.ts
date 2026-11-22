import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '../schemas/customer.schemas';

export const customerKeys = {
  all: ['customers'] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  overview: (id: string) => [...customerKeys.all, 'overview', id] as const,
  timeline: (id: string, filters: string) =>
    [...customerKeys.all, 'timeline', id, filters] as const,
  bookings: (id: string) => [...customerKeys.all, 'bookings', id] as const,
  relationship: (id: string) =>
    [...customerKeys.all, 'relationship', id] as const,
  financial: (id: string) => [...customerKeys.all, 'financial', id] as const,
  communications: (id: string) =>
    [...customerKeys.all, 'communications', id] as const,
};

export function useCustomerQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: () => customersApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCustomerOverviewQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: customerKeys.overview(id ?? ''),
    queryFn: () => customersApi.getOverview(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCustomerTimelineQuery(
  id: string | null | undefined,
  filters?: { from?: string; to?: string; sources?: string },
) {
  const key = JSON.stringify(filters ?? {});
  return useQuery({
    queryKey: customerKeys.timeline(id ?? '', key),
    queryFn: () => customersApi.getTimeline(id!, filters),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCustomerBookingsQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: customerKeys.bookings(id ?? ''),
    queryFn: () => customersApi.getBookings(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCustomerRelationshipQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: customerKeys.relationship(id ?? ''),
    queryFn: () => customersApi.getRelationship(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCustomerFinancialQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: customerKeys.financial(id ?? ''),
    queryFn: () => customersApi.getFinancialSummary(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCustomerCommunicationsQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: customerKeys.communications(id ?? ''),
    queryFn: () => customersApi.getCommunications(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomerRequest) => customersApi.create(body),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
    },
  });
}

export function useUpdateCustomerMutation(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateCustomerRequest;
      version: number;
    }) => customersApi.update(customerId, body, version),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(customer.id) });
      void queryClient.invalidateQueries({ queryKey: customerKeys.overview(customer.id) });
    },
  });
}
