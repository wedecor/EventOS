import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/finance.api';
import type {
  CreateFinancialDocumentRequest,
  CreateInvoiceRequest,
  RecordExpenseRequest,
  RecordPaymentRequest,
  SendInvoiceRequest,
  UpdateFinancialDocumentRequest,
  VerifyFinancialDocumentRequest,
} from '../schemas/finance.schemas';

export const financeKeys = {
  all: ['finance'] as const,
  booking: (bookingId: string) =>
    [...financeKeys.all, 'booking', bookingId] as const,
  payments: (bookingId: string) =>
    [...financeKeys.booking(bookingId), 'payments'] as const,
  invoices: (bookingId: string) =>
    [...financeKeys.booking(bookingId), 'invoices'] as const,
  expenses: (bookingId: string) =>
    [...financeKeys.booking(bookingId), 'expenses'] as const,
  profitability: (bookingId: string) =>
    [...financeKeys.booking(bookingId), 'profitability'] as const,
  documents: (bookingId: string) =>
    [...financeKeys.booking(bookingId), 'documents'] as const,
};

export function useBookingPaymentsQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: financeKeys.payments(bookingId ?? ''),
    queryFn: () => financeApi.listPayments(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useBookingInvoicesQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: financeKeys.invoices(bookingId ?? ''),
    queryFn: () => financeApi.listInvoices(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useBookingExpensesQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: financeKeys.expenses(bookingId ?? ''),
    queryFn: () => financeApi.listExpenses(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useBookingProfitabilityQuery(
  bookingId: string | null | undefined,
) {
  return useQuery({
    queryKey: financeKeys.profitability(bookingId ?? ''),
    queryFn: () => financeApi.getProfitability(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useRecordPaymentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RecordPaymentRequest) => financeApi.recordPayment(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.booking(bookingId),
      });
    },
  });
}

export function useVoidPaymentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      financeApi.voidPayment(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.booking(bookingId),
      });
    },
  });
}

export function useCreateInvoiceMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInvoiceRequest) => financeApi.createInvoice(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.booking(bookingId),
      });
    },
  });
}

export function useSendInvoiceMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      version,
    }: {
      id: string;
      body: SendInvoiceRequest;
      version: number;
    }) => financeApi.sendInvoice(id, body, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.invoices(bookingId),
      });
    },
  });
}

export function useVoidInvoiceMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      financeApi.voidInvoice(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.booking(bookingId),
      });
    },
  });
}

export function useRecordExpenseMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RecordExpenseRequest) =>
      financeApi.recordExpense(bookingId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.booking(bookingId),
      });
    },
  });
}

export function useVoidExpenseMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      financeApi.voidExpense(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.booking(bookingId),
      });
    },
  });
}

export function useBookingDocumentsQuery(bookingId: string | null | undefined) {
  return useQuery({
    queryKey: financeKeys.documents(bookingId ?? ''),
    queryFn: () => financeApi.listDocuments(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 15_000,
  });
}

export function useCreateDocumentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFinancialDocumentRequest) =>
      financeApi.createDocument(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.documents(bookingId),
      });
    },
  });
}

export function useUpdateDocumentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      version,
    }: {
      id: string;
      body: UpdateFinancialDocumentRequest;
      version: number;
    }) => financeApi.updateDocument(id, body, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.documents(bookingId),
      });
    },
  });
}

export function useVerifyDocumentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      version,
    }: {
      id: string;
      body: VerifyFinancialDocumentRequest;
      version: number;
    }) => financeApi.verifyDocument(id, body, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.documents(bookingId),
      });
    },
  });
}

export function useRejectDocumentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      version,
    }: {
      id: string;
      body: VerifyFinancialDocumentRequest;
      version: number;
    }) => financeApi.rejectDocument(id, body, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.documents(bookingId),
      });
    },
  });
}

export function useDeleteDocumentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      financeApi.deleteDocument(id, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financeKeys.documents(bookingId),
      });
    },
  });
}
