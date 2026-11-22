import { apiClient } from '@/shared/api/client';
import {
  parseStaffAssignment,
  parseStaffAssignmentList,
  type CreateStaffAssignmentRequest,
  type StaffAssignment,
} from '../schemas/staff-assignment.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

export const staffAssignmentsApi = {
  async listByBooking(bookingId: string): Promise<StaffAssignment[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/staff-assignments', {
      params: { bookingId },
    });
    return parseStaffAssignmentList(data);
  },

  async create(body: CreateStaffAssignmentRequest): Promise<StaffAssignment> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/staff-assignments',
      body,
    );
    return parseStaffAssignment(data);
  },

  async confirm(id: string, version: number): Promise<StaffAssignment> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/staff-assignments/${id}/confirm`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseStaffAssignment(data);
  },

  async release(id: string, version: number): Promise<StaffAssignment> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/staff-assignments/${id}/release`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseStaffAssignment(data);
  },

  async cancel(
    id: string,
    reason: string,
    version: number,
  ): Promise<StaffAssignment> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/staff-assignments/${id}/cancel`,
      { reason },
      { headers: ifMatchHeader(version) },
    );
    return parseStaffAssignment(data);
  },
};
