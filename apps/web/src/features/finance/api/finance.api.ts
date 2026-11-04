import { apiClient } from '@/shared/api/client';
import {
  parseExpense,
  parseExpenseList,
  parseFinancialDocument,
  parseFinancialDocumentList,
  parseInvoice,
  parseInvoiceList,
  parsePayment,
  parsePaymentList,
  parseProfitability,
  type CreateFinancialDocumentRequest,
  type CreateInvoiceRequest,
  type Expense,
  type FinancialDocument,
  type Invoice,
  type Payment,
  type Profitability,
  type RecordExpenseRequest,
  type RecordPaymentRequest,
  type SendInvoiceRequest,
  type UpdateFinancialDocumentRequest,
  type VerifyFinancialDocumentRequest,
} from '../schemas/finance.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Finance hub APIs — booking-scoped reads + record/void/send (F1-13 Option 2).
 * No global lists, GET-by-id, PDF, or attachment upload.
 */
export const financeApi = {
  async listPayments(bookingId: string): Promise<Payment[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/payments`,
    );
    return parsePaymentList(data);
  },

  async recordPayment(body: RecordPaymentRequest): Promise<Payment> {
    const { data } = await apiClient.post<unknown>('/api/v1/payments', body);
    return parsePayment(data);
  },

  async voidPayment(id: string, version: number): Promise<Payment> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/payments/${id}/void`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parsePayment(data);
  },

  async listInvoices(bookingId: string): Promise<Invoice[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/invoices`,
    );
    return parseInvoiceList(data);
  },

  async createInvoice(body: CreateInvoiceRequest): Promise<Invoice> {
    const { data } = await apiClient.post<unknown>('/api/v1/invoices', body);
    return parseInvoice(data);
  },

  async sendInvoice(
    id: string,
    body: SendInvoiceRequest,
    version: number,
  ): Promise<Invoice> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/invoices/${id}/send`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseInvoice(data);
  },

  async voidInvoice(id: string, version: number): Promise<Invoice> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/invoices/${id}/void`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseInvoice(data);
  },

  async listExpenses(bookingId: string): Promise<Expense[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/expenses`,
    );
    return parseExpenseList(data);
  },

  async recordExpense(
    bookingId: string,
    body: RecordExpenseRequest,
  ): Promise<Expense> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/bookings/${bookingId}/expenses`,
      body,
    );
    return parseExpense(data);
  },

  async voidExpense(id: string, version: number): Promise<Expense> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/expenses/${id}/void`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseExpense(data);
  },

  async getProfitability(bookingId: string): Promise<Profitability> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/profitability`,
    );
    return parseProfitability(data);
  },

  async listDocuments(bookingId: string): Promise<FinancialDocument[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/financial-documents`,
    );
    return parseFinancialDocumentList(data);
  },

  async createDocument(
    body: CreateFinancialDocumentRequest,
  ): Promise<FinancialDocument> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/financial-documents',
      body,
    );
    return parseFinancialDocument(data);
  },

  async updateDocument(
    id: string,
    body: UpdateFinancialDocumentRequest,
    version: number,
  ): Promise<FinancialDocument> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/financial-documents/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseFinancialDocument(data);
  },

  async verifyDocument(
    id: string,
    body: VerifyFinancialDocumentRequest,
    version: number,
  ): Promise<FinancialDocument> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/financial-documents/${id}/verify`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseFinancialDocument(data);
  },

  async rejectDocument(
    id: string,
    body: VerifyFinancialDocumentRequest,
    version: number,
  ): Promise<FinancialDocument> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/financial-documents/${id}/reject`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseFinancialDocument(data);
  },

  async deleteDocument(
    id: string,
    version: number,
  ): Promise<FinancialDocument> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/financial-documents/${id}/delete`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseFinancialDocument(data);
  },
};
