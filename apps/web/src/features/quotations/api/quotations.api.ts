import { apiClient } from '@/shared/api/client';
import {
  parseApproveQuotation,
  parseQuotation,
  type ApproveQuotationResult,
  type CreateQuotationRequest,
  type Quotation,
  type RejectQuotationRequest,
  type UpdateQuotationRequest,
} from '../schemas/quotation.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Quotation endpoints from frozen OpenAPI (narrow F1-07).
 * No list, PDF, or line-item read APIs — do not call them.
 */
export const quotationsApi = {
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
};
