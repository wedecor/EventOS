import { apiClient } from '@/shared/api/client';
import {
  downloadBlob,
  filenameFromContentDisposition,
} from '@/shared/lib/download-blob';
import {
  parseApproveQuotation,
  parseQuotation,
  parseQuotationLineItem,
  parseQuotationLineItems,
  parseQuotationPage,
  type AddLineItemRequest,
  type ApproveQuotationResult,
  type CreateQuotationRequest,
  type Quotation,
  type QuotationLineItem,
  type QuotationPage,
  type RejectQuotationRequest,
  type UpdateLineItemRequest,
  type UpdateQuotationRequest,
} from '../schemas/quotation.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Quotation endpoints from OpenAPI (M0/M1 includes line-item read + writes).
 */
export const quotationsApi = {
  async list(params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: string;
    customerId?: string;
    leadId?: string;
    sort?: 'createdAt' | 'quotationNumber';
    order?: 'asc' | 'desc';
  }): Promise<QuotationPage> {
    const { data } = await apiClient.get<unknown>('/api/v1/quotations', {
      params,
    });
    return parseQuotationPage(data);
  },

  async create(body: CreateQuotationRequest): Promise<Quotation> {
    const { data } = await apiClient.post<unknown>('/api/v1/quotations', body);
    return parseQuotation(data);
  },

  async getById(id: string): Promise<Quotation> {
    const { data } = await apiClient.get<unknown>(`/api/v1/quotations/${id}`);
    return parseQuotation(data);
  },

  async update(
    id: string,
    body: UpdateQuotationRequest,
    version: number,
  ): Promise<Quotation> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/quotations/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseQuotation(data);
  },

  async listLineItems(quotationId: string): Promise<QuotationLineItem[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/quotations/${quotationId}/line-items`,
    );
    return parseQuotationLineItems(data);
  },

  async addLineItem(
    quotationId: string,
    body: AddLineItemRequest,
  ): Promise<QuotationLineItem> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/quotations/${quotationId}/line-items`,
      body,
    );
    return parseQuotationLineItem(data);
  },

  async updateLineItem(
    quotationId: string,
    itemId: string,
    body: UpdateLineItemRequest,
    version: number,
  ): Promise<QuotationLineItem> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/quotations/${quotationId}/line-items/${itemId}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseQuotationLineItem(data);
  },

  async removeLineItem(quotationId: string, itemId: string): Promise<void> {
    await apiClient.delete(
      `/api/v1/quotations/${quotationId}/line-items/${itemId}`,
    );
  },

  async send(id: string, version: number): Promise<Quotation> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/quotations/${id}/send`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseQuotation(data);
  },

  async approve(id: string, version: number): Promise<ApproveQuotationResult> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/quotations/${id}/approve`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseApproveQuotation(data);
  },

  async reject(
    id: string,
    body: RejectQuotationRequest,
    version: number,
  ): Promise<Quotation> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/quotations/${id}/reject`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseQuotation(data);
  },

  async revise(id: string, version: number): Promise<Quotation> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/quotations/${id}/revise`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseQuotation(data);
  },

  async downloadPdf(id: string, fallbackName = 'quotation.pdf'): Promise<void> {
    const response = await apiClient.get<Blob>(`/api/v1/quotations/${id}/pdf`, {
      responseType: 'blob',
    });
    const filename = filenameFromContentDisposition(
      response.headers['content-disposition'] as string | undefined,
      fallbackName,
    );
    downloadBlob(response.data, filename);
  },

  async emailPdf(
    id: string,
    body: { to?: string } = {},
  ): Promise<{
    communicationId: string;
    status: string;
    providerAccepted: boolean;
    recipient: string;
  }> {
    const { data } = await apiClient.post<{
      data: {
        communicationId: string;
        status: string;
        providerAccepted: boolean;
        recipient: string;
      };
    }>(`/api/v1/quotations/${id}/email`, body);
    return data.data;
  },
};
