import { apiClient } from '@/shared/api/client';
import {
  parseBooking,
  parseWorkspace,
  type AdvanceExecutionStageRequest,
  type AssignExecutionOwnerRequest,
  type Booking,
  type CancelBookingRequest,
  type UpdateBookingStatusRequest,
  type WorkspaceView,
} from '../schemas/booking.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Booking (event hub) endpoints from frozen OpenAPI — narrow F1-08.
 * No list or create. Workspace UI deferred to F1-09.
 * Nested payments/expenses/etc. deferred to later modules.
 */
export const bookingsApi = {
  async getById(id: string): Promise<Booking> {
    const { data } = await apiClient.get<unknown>(`/api/v1/bookings/${id}`);
    return parseBooking(data);
  },

  /**
   * Only `in_preparation` is supported by the controller today
   * (approved → in_preparation via activateBooking).
   */
  async updateStatus(
    id: string,
    body: UpdateBookingStatusRequest,
    version: number,
  ): Promise<Booking> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/bookings/${id}/status`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseBooking(data);
  },

  async cancel(
    id: string,
    body: CancelBookingRequest,
    version: number,
  ): Promise<Booking> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/bookings/${id}/cancel`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseBooking(data);
  },

  async complete(id: string, version: number): Promise<Booking> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/bookings/${id}/complete`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseBooking(data);
  },

  async assignExecutionOwner(
    id: string,
    body: AssignExecutionOwnerRequest,
    version: number,
  ): Promise<WorkspaceView> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/bookings/${id}/execution-owner`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseWorkspace(data);
  },

  async advanceExecutionStage(
    id: string,
    body: AdvanceExecutionStageRequest,
    version: number,
  ): Promise<WorkspaceView> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/bookings/${id}/execution-stages/advance`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseWorkspace(data);
  },
};
