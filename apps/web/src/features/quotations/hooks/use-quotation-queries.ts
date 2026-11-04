import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '../api/quotations.api';
import type {
  CreateQuotationRequest,
  RejectQuotationRequest,
  UpdateQuotationRequest,
} from '../schemas/quotation.schemas';

export const quotationKeys = {
  all: ['quotations'] as const,
  detail: (id: string) => [...quotationKeys.all, 'detail', id] as const,
};

export function useQuotationQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: quotationKeys.detail(id ?? ''),
    queryFn: () => quotationsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateQuotationRequest) => quotationsApi.create(body),
    onSuccess: (quotation) => {
      queryClient.setQueryData(quotationKeys.detail(quotation.id), quotation);
    },
  });
}

export function useUpdateQuotationMutation(quotationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateQuotationRequest;
      version: number;
    }) => quotationsApi.update(quotationId, body, version),
    onSuccess: (quotation) => {
      queryClient.setQueryData(quotationKeys.detail(quotation.id), quotation);
    },
  });
}

export function useSendQuotationMutation(quotationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => quotationsApi.send(quotationId, version),
    onSuccess: (quotation) => {
      queryClient.setQueryData(quotationKeys.detail(quotation.id), quotation);
    },
  });
}

export function useApproveQuotationMutation(quotationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => quotationsApi.approve(quotationId, version),
    onSuccess: (quotation) => {
      queryClient.setQueryData(quotationKeys.detail(quotation.id), quotation);
    },
  });
}

export function useRejectQuotationMutation(quotationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: RejectQuotationRequest;
      version: number;
    }) => quotationsApi.reject(quotationId, body, version),
    onSuccess: (quotation) => {
      queryClient.setQueryData(quotationKeys.detail(quotation.id), quotation);
    },
  });
}

export function useReviseQuotationMutation(quotationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => quotationsApi.revise(quotationId, version),
    onSuccess: (quotation) => {
      queryClient.setQueryData(quotationKeys.detail(quotation.id), quotation);
      // Source quotation becomes superseded — refresh if still cached.
      void queryClient.invalidateQueries({
        queryKey: quotationKeys.detail(quotationId),
      });
    },
  });
}
