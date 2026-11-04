import { apiClient } from '@/shared/api/client';
import {
  parseAvailability,
  parseAvailabilityList,
  parseCalendar,
  parseConflicts,
  parseLeave,
  parseLeaveList,
  parseRecommendations,
  parseWorkload,
  type CreateAvailabilityRequest,
  type CreateLeaveRequest,
  type SchedulingCalendarEntry,
  type SchedulingConflict,
  type StaffAvailability,
  type StaffLeave,
  type StaffRecommendation,
  type StaffWorkload,
} from '../schemas/scheduling.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

export const staffSchedulingApi = {
  async listAvailability(staffMemberId: string): Promise<StaffAvailability[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/staff-availability', {
      params: { staffMemberId },
    });
    return parseAvailabilityList(data);
  },

  async createAvailability(
    body: CreateAvailabilityRequest,
  ): Promise<StaffAvailability> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/staff-availability',
      body,
    );
    return parseAvailability(data);
  },

  async deleteAvailability(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/staff-availability/${id}`);
  },

  async listLeave(
    staffMemberId: string,
    status?: StaffLeave['status'],
  ): Promise<StaffLeave[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/staff-leave', {
      params: { staffMemberId, ...(status ? { status } : {}) },
    });
    return parseLeaveList(data);
  },

  async createLeave(body: CreateLeaveRequest): Promise<StaffLeave> {
    const { data } = await apiClient.post<unknown>('/api/v1/staff-leave', body);
    return parseLeave(data);
  },

  async reviewLeave(
    id: string,
    status: 'approved' | 'rejected' | 'cancelled',
    version: number,
    notes?: string | null,
  ): Promise<StaffLeave> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/staff-leave/${id}/review`,
      { status, notes },
      { headers: ifMatchHeader(version) },
    );
    return parseLeave(data);
  },

  async calendar(params: {
    from: string;
    to: string;
    staffMemberId?: string;
    view?: 'day' | 'week' | 'month';
  }): Promise<SchedulingCalendarEntry[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/scheduling/calendar', {
      params,
    });
    return parseCalendar(data);
  },

  async workload(staffMemberId?: string): Promise<StaffWorkload[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/scheduling/workload', {
      params: staffMemberId ? { staffMemberId } : {},
    });
    return parseWorkload(data);
  },

  async conflicts(params: {
    staffMemberId: string;
    bookingId: string;
    excludeAssignmentId?: string;
  }): Promise<SchedulingConflict[]> {
    const { data } = await apiClient.get<unknown>(
      '/api/v1/scheduling/conflicts',
      { params },
    );
    return parseConflicts(data);
  },

  async recommendations(bookingId: string): Promise<StaffRecommendation[]> {
    const { data } = await apiClient.get<unknown>(
      '/api/v1/scheduling/recommendations',
      { params: { bookingId } },
    );
    return parseRecommendations(data);
  },
};
