import { apiClient } from '@/shared/api/client';
import {
  parseProcurementQuote,
  parsePurchaseOrder,
  parseVendorProcurement,
  parseVendorProcurementList,
  type CreateVendorProcurementRequest,
  type ProcurementQuote,
  type PurchaseOrder,
  type VendorProcurement,
} from '../schemas/procurement.schemas';
import {
  parseVendor,
  parseVendorIssueNote,
  parseVendorList,
  type AddVendorIssueNoteRequest,
  type CreateVendorRequest,
  type ListVendorsQuery,
  type UpdateVendorRequest,
  type Vendor,
  type VendorIssueNote,
} from '../schemas/vendor.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Vendor master endpoints from frozen OpenAPI — narrow F1-10.
 * P2-01 adds booking-scoped procurement list/create for workspace.
 */
export const vendorsApi = {
  async list(query: ListVendorsQuery = {}): Promise<Vendor[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/vendors', {
      params: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.category?.trim() ? { category: query.category.trim() } : {}),
      },
    });
    return parseVendorList(data);
  },

  async getById(id: string): Promise<Vendor> {
    const { data } = await apiClient.get<unknown>(`/api/v1/vendors/${id}`);
    return parseVendor(data);
  },

  async create(body: CreateVendorRequest): Promise<Vendor> {
    const { data } = await apiClient.post<unknown>('/api/v1/vendors', body);
    return parseVendor(data);
  },

  async update(
    id: string,
    body: UpdateVendorRequest,
    version: number,
  ): Promise<Vendor> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/vendors/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseVendor(data);
  },

  async addIssueNote(
    id: string,
    body: AddVendorIssueNoteRequest,
  ): Promise<VendorIssueNote> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/vendors/${id}/issue-notes`,
      body,
    );
    return parseVendorIssueNote(data);
  },

  async listProcurementsForBooking(
    bookingId: string,
  ): Promise<VendorProcurement[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/procurements`,
    );
    return parseVendorProcurementList(data);
  },

  async createProcurement(
    bookingId: string,
    body: CreateVendorProcurementRequest,
  ): Promise<VendorProcurement> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/bookings/${bookingId}/procurements`,
      body,
    );
    return parseVendorProcurement(data);
  },

  async listAllProcurements(): Promise<VendorProcurement[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/vendor-procurements');
    return parseVendorProcurementList(data);
  },

  async getProcurement(id: string): Promise<VendorProcurement> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/vendor-procurements/${id}`,
    );
    return parseVendorProcurement(data);
  },

  async transitionProcurement(
    id: string,
    toStatus: string,
    version: number,
  ): Promise<VendorProcurement> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/vendor-procurements/${id}/transition`,
      { toStatus },
      { headers: ifMatchHeader(version) },
    );
    return parseVendorProcurement(data);
  },

  async updateDelivery(
    id: string,
    body: {
      deliveryStatus: string;
      deliveryNotes?: string | null;
      actualCost?: number | null;
    },
    version: number,
  ): Promise<VendorProcurement> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/vendor-procurements/${id}/delivery`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseVendorProcurement(data);
  },

  async createQuote(
    procurementId: string,
    body: {
      amount: number;
      currency?: string;
      validUntil?: string | null;
      notes?: string | null;
      attachmentName?: string | null;
    },
  ): Promise<ProcurementQuote> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/vendor-procurements/${procurementId}/quotes`,
      body,
    );
    return parseProcurementQuote(data);
  },

  async approveQuote(quoteId: string, version: number): Promise<ProcurementQuote> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/procurement-quotes/${quoteId}/approve`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseProcurementQuote(data);
  },

  async createPurchaseOrder(
    procurementId: string,
    body: {
      poNumber?: string;
      totalAmount?: number;
      notes?: string | null;
      issue?: boolean;
    } = {},
  ): Promise<PurchaseOrder> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/vendor-procurements/${procurementId}/purchase-orders`,
      body,
    );
    return parsePurchaseOrder(data);
  },
};
