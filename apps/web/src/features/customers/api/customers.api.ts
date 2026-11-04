import { apiClient } from '@/shared/api/client';
import {
  parseCustomer,
  type CreateCustomerRequest,
  type Customer,
  type UpdateCustomerRequest,
} from '../schemas/customer.schemas';
import {
  parseCustomerBookings,
  parseCustomerCommunications,
  parseCustomerFinancialSummary,
  parseCustomerOverview,
  parseCustomerRelationship,
  parseCustomerTimeline,
  type CustomerBookingHistoryItem,
  type CustomerCommunicationsSummary,
  type CustomerFinancialSummary,
  type CustomerOverview,
  type CustomerRelationship,
  type CustomerTimelineItem,
} from '../schemas/customer-intelligence.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Customer (clients) endpoints from OpenAPI.
 * List (`GET /clients`) is not shipped — do not call it.
 * P2-11 adds read-only Customer 360 aggregation under /clients/:id/*.
 */
export const customersApi = {
  async create(body: CreateCustomerRequest): Promise<Customer> {
    const { data } = await apiClient.post<unknown>('/api/v1/clients', body);
    return parseCustomer(data);
  },

  async getById(id: string): Promise<Customer> {
    const { data } = await apiClient.get<unknown>(`/api/v1/clients/${id}`);
    return parseCustomer(data);
  },

  async update(
    id: string,
    body: UpdateCustomerRequest,
    version: number,
  ): Promise<Customer> {
    const { data } = await apiClient.patch<unknown>(`/api/v1/clients/${id}`, body, {
      headers: ifMatchHeader(version),
    });
    return parseCustomer(data);
  },

  async getOverview(customerId: string): Promise<CustomerOverview> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/clients/${customerId}/overview`,
    );
    return parseCustomerOverview(data);
  },

  async getTimeline(
    customerId: string,
    params?: { from?: string; to?: string; sources?: string },
  ): Promise<CustomerTimelineItem[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/clients/${customerId}/timeline`,
      { params },
    );
    return parseCustomerTimeline(data);
  },

  async getBookings(customerId: string): Promise<CustomerBookingHistoryItem[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/clients/${customerId}/bookings`,
    );
    return parseCustomerBookings(data);
  },

  async getRelationship(customerId: string): Promise<CustomerRelationship> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/clients/${customerId}/relationship`,
    );
    return parseCustomerRelationship(data);
  },

  async getFinancialSummary(
    customerId: string,
  ): Promise<CustomerFinancialSummary> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/clients/${customerId}/financial-summary`,
    );
    return parseCustomerFinancialSummary(data);
  },

  async getCommunications(
    customerId: string,
  ): Promise<CustomerCommunicationsSummary> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/clients/${customerId}/communications`,
    );
    return parseCustomerCommunications(data);
  },
};
