import { apiClient } from '@/shared/api/client';
import {
  parseEventNote,
  parseEventNoteList,
  parseWorkspaceActivity,
  parseWorkspaceProgress,
  parseWorkspaceView,
  type CreateEventNoteRequest,
  type EventNote,
  type WorkspaceActivityItem,
  type WorkspaceProgress,
  type WorkspaceView,
} from '../schemas/workspace.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Event workspace endpoints — thin status DTO + P2-01 additive progress/activity/notes.
 */
export const workspaceApi = {
  async getByBookingId(bookingId: string): Promise<WorkspaceView> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/workspace`,
    );
    return parseWorkspaceView(data);
  },

  /**
   * Activates workspace. If-Match must be the booking resource version
   * (WorkspaceDto does not include version).
   */
  async activate(
    bookingId: string,
    bookingVersion: number,
  ): Promise<WorkspaceView> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/bookings/${bookingId}/activate-workspace`,
      {},
      { headers: ifMatchHeader(bookingVersion) },
    );
    return parseWorkspaceView(data);
  },

  async getProgress(bookingId: string): Promise<WorkspaceProgress> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/workspace/progress`,
    );
    return parseWorkspaceProgress(data);
  },

  async getActivity(bookingId: string): Promise<WorkspaceActivityItem[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/workspace/activity`,
    );
    return parseWorkspaceActivity(data);
  },

  async listNotes(bookingId: string): Promise<EventNote[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/notes`,
    );
    return parseEventNoteList(data);
  },

  async createNote(
    bookingId: string,
    body: CreateEventNoteRequest,
  ): Promise<EventNote> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/bookings/${bookingId}/notes`,
      body,
    );
    return parseEventNote(data);
  },

  async deleteNote(bookingId: string, noteId: string): Promise<void> {
    await apiClient.delete(`/api/v1/bookings/${bookingId}/notes/${noteId}`);
  },
};
