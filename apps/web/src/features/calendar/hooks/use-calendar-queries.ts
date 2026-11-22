import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '../api/calendar.api';
import type {
  CalendarConflictsQuery,
  CalendarRangeQuery,
} from '../schemas/calendar.schemas';

export const calendarKeys = {
  all: ['calendar'] as const,
  planning: ['calendar', 'planning'] as const,
  events: (query: CalendarRangeQuery) => ['calendar', 'events', query] as const,
  agenda: (query: CalendarRangeQuery) => ['calendar', 'agenda', query] as const,
  timeline: (query: CalendarRangeQuery) =>
    ['calendar', 'timeline', query] as const,
  conflicts: (query: CalendarConflictsQuery) =>
    ['calendar', 'conflicts', query] as const,
};

export function useCalendarPlanningQuery(enabled = true) {
  return useQuery({
    queryKey: calendarKeys.planning,
    queryFn: () => calendarApi.getPlanningDashboard(),
    enabled,
    staleTime: 15_000,
  });
}

export function useCalendarEventsQuery(
  query: CalendarRangeQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: calendarKeys.events(query),
    queryFn: () => calendarApi.getEvents(query),
    enabled: enabled && Boolean(query.from && query.to),
    staleTime: 15_000,
  });
}

export function useCalendarAgendaQuery(
  query: CalendarRangeQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: calendarKeys.agenda(query),
    queryFn: () => calendarApi.getAgenda(query),
    enabled: enabled && Boolean(query.from && query.to),
    staleTime: 15_000,
  });
}

export function useCalendarTimelineQuery(
  query: CalendarRangeQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: calendarKeys.timeline(query),
    queryFn: () => calendarApi.getTimeline(query),
    enabled: enabled && Boolean(query.from && query.to),
    staleTime: 15_000,
  });
}

export function useCalendarConflictsQuery(
  query: CalendarConflictsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: calendarKeys.conflicts(query),
    queryFn: () => calendarApi.getConflicts(query),
    enabled: enabled && Boolean(query.from && query.to),
    staleTime: 15_000,
  });
}
