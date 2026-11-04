import { apiClient } from '@/shared/api/client';
import {
  parseCalendarConflicts,
  parseCalendarEntryList,
  parseCalendarPlanningDashboard,
  toCalendarQueryParams,
  type CalendarConflictsDto,
  type CalendarConflictsQuery,
  type CalendarEntryDto,
  type CalendarPlanningDashboardDto,
  type CalendarRangeQuery,
} from '../schemas/calendar.schemas';

/**
 * Unified Operations Calendar (P2-10) — read-only aggregation endpoints.
 * No write APIs: the calendar projects facts already owned by other modules.
 */
export const calendarApi = {
  async getPlanningDashboard(): Promise<CalendarPlanningDashboardDto> {
    const { data } = await apiClient.get<unknown>('/api/v1/calendar');
    return parseCalendarPlanningDashboard(data);
  },

  async getEvents(query: CalendarRangeQuery): Promise<CalendarEntryDto[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/calendar/events', {
      params: toCalendarQueryParams(query),
    });
    return parseCalendarEntryList(data);
  },

  async getAgenda(query: CalendarRangeQuery): Promise<CalendarEntryDto[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/calendar/agenda', {
      params: toCalendarQueryParams(query),
    });
    return parseCalendarEntryList(data);
  },

  async getTimeline(query: CalendarRangeQuery): Promise<CalendarEntryDto[]> {
    const { data } = await apiClient.get<unknown>(
      '/api/v1/calendar/timeline',
      { params: toCalendarQueryParams(query) },
    );
    return parseCalendarEntryList(data);
  },

  async getConflicts(
    query: CalendarConflictsQuery,
  ): Promise<CalendarConflictsDto> {
    const { data } = await apiClient.get<unknown>(
      '/api/v1/calendar/conflicts',
      {
        params: {
          from: query.from,
          to: query.to,
          ...(query.bookingId ? { bookingId: query.bookingId } : {}),
        },
      },
    );
    return parseCalendarConflicts(data);
  },
};
