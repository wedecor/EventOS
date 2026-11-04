import { apiClient } from '@/shared/api/client';
import {
  parseStaffList,
  parseStaffMember,
  type CreateStaffRequest,
  type ListStaffQuery,
  type StaffMember,
  type UpdateStaffRequest,
} from '../schemas/staff.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Staff master endpoints from frozen OpenAPI — narrow F1-11 / P2-04.
 * Availability, leave, and scheduling live under `staff-scheduling`.
 */
export const staffApi = {
  async list(query: ListStaffQuery = {}): Promise<StaffMember[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/staff', {
      params: {
        ...(query.status ? { status: query.status } : {}),
      },
    });
    return parseStaffList(data);
  },

  async getById(id: string): Promise<StaffMember> {
    const { data } = await apiClient.get<unknown>(`/api/v1/staff/${id}`);
    return parseStaffMember(data);
  },

  async create(body: CreateStaffRequest): Promise<StaffMember> {
    const { data } = await apiClient.post<unknown>('/api/v1/staff', body);
    return parseStaffMember(data);
  },

  async update(
    id: string,
    body: UpdateStaffRequest,
    version: number,
  ): Promise<StaffMember> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/staff/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseStaffMember(data);
  },
};
