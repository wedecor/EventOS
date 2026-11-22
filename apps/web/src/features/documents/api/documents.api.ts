import { apiClient } from '@/shared/api/client';
import {
  downloadBlob,
  filenameFromContentDisposition,
} from '@/shared/lib/download-blob';

export type StoredDocument = {
  id: string;
  category: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  customerId: string | null;
  quotationId: string | null;
  bookingId: string | null;
  invoiceId: string | null;
  uploadedAt: string;
  version: number;
};

function parseList(payload: unknown): StoredDocument[] {
  const data =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: unknown }).data
      : payload;
  if (!Array.isArray(data)) return [];
  return data as StoredDocument[];
}

function parseOne(payload: unknown): StoredDocument {
  const data =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: unknown }).data
      : payload;
  return data as StoredDocument;
}

export const documentsApi = {
  async list(params: {
    customerId?: string;
    quotationId?: string;
    bookingId?: string;
    invoiceId?: string;
  }): Promise<StoredDocument[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/documents', {
      params,
    });
    return parseList(data);
  },

  async upload(input: {
    file: File;
    category: string;
    customerId?: string;
    quotationId?: string;
    bookingId?: string;
    invoiceId?: string;
  }): Promise<StoredDocument> {
    const form = new FormData();
    form.append('file', input.file);
    form.append('category', input.category);
    if (input.customerId) form.append('customerId', input.customerId);
    if (input.quotationId) form.append('quotationId', input.quotationId);
    if (input.bookingId) form.append('bookingId', input.bookingId);
    if (input.invoiceId) form.append('invoiceId', input.invoiceId);
    const { data } = await apiClient.post<unknown>('/api/v1/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return parseOne(data);
  },

  async download(id: string, fallbackName: string): Promise<void> {
    const response = await apiClient.get<Blob>(
      `/api/v1/documents/${id}/download`,
      { responseType: 'blob' },
    );
    const filename = filenameFromContentDisposition(
      response.headers['content-disposition'] as string | undefined,
      fallbackName,
    );
    downloadBlob(response.data, filename);
  },

  async remove(id: string, version: number): Promise<void> {
    await apiClient.delete(`/api/v1/documents/${id}`, {
      headers: { 'If-Match': `"${version}"` },
    });
  },
};
