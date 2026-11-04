'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import {
  useCalendarAgendaQuery,
  useCalendarConflictsQuery,
  useCalendarEventsQuery,
  useCalendarPlanningQuery,
  useCalendarTimelineQuery,
} from '../hooks/use-calendar-queries';
import {
  formatCalendarSourceLabel,
  formatCalendarWhen,
  type CalendarEntryDto,
  type CalendarEntrySource,
  type CalendarPlanningDashboardDto,
} from '../schemas/calendar.schemas';
import { CalendarFilterPanel } from './calendar-filter-panel';

type ViewMode = 'dashboard' | 'calendar' | 'agenda' | 'timeline' | 'conflicts';
type RangeMode = 'day' | 'week' | 'month';

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'conflicts', label: 'Conflicts' },
];

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() - day);
  return copy;
}

function computeRange(anchor: string, mode: RangeMode): { from: string; to: string } {
  const base = new Date(`${anchor}T00:00:00.000Z`);
  if (mode === 'day') {
    return { from: toIsoDate(base), to: toIsoDate(base) };
  }
  if (mode === 'week') {
    const from = startOfWeek(base);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 6);
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }
  const from = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const to = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0));
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function severityBadgeClass(severity?: string): string {
  if (severity === 'overdue') return 'border-destructive/40 text-destructive';
  if (severity === 'warn') return 'border-amber-500/40 text-amber-600';
  return 'border-border text-muted-foreground';
}

function EntryRow({ entry }: { entry: CalendarEntryDto }) {
  const content = (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm hover:bg-muted/40">
      <div>
        <p className="font-medium">{entry.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatCalendarSourceLabel(entry.source)}
          {entry.status ? ` · ${entry.status}` : ''}
          {entry.bookingId ? ` · Booking ${entry.bookingId.slice(0, 8)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {entry.severity ? (
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-xs',
              severityBadgeClass(entry.severity),
            )}
          >
            {entry.severity}
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {formatCalendarWhen(entry.startAt)}
        </span>
      </div>
    </div>
  );

  if (entry.hrefHint) {
    return (
      <li>
        <Link href={entry.hrefHint}>{content}</Link>
      </li>
    );
  }
  return <li>{content}</li>;
}

function EntryList({
  entries,
  emptyMessage,
}: {
  entries: CalendarEntryDto[];
  emptyMessage: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

function DashboardCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

function DashboardView({
  isLoading,
  isError,
  error,
  data,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: CalendarPlanningDashboardDto | undefined;
  onRetry: () => void;
}) {
  return (
    <>
      <PageSection>
        {isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}
        {isError ? (
          <ErrorState
            title="Unable to load planning dashboard"
            description={
              error instanceof ApiError ? error.message : 'Request failed.'
            }
            onRetry={onRetry}
          />
        ) : null}
        {data ? (
          <ContentCard title="Overview">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardCount
                label="Today's events"
                value={data.counts.todayEvents}
              />
              <DashboardCount
                label="Upcoming events (7d)"
                value={data.counts.upcomingEvents}
              />
              <DashboardCount
                label="Staff scheduled today"
                value={data.counts.todayStaff}
              />
              <DashboardCount
                label="Pending procurements"
                value={data.counts.pendingProcurements}
              />
              <DashboardCount
                label="Inventory dispatches"
                value={data.counts.inventoryDispatches}
              />
              <DashboardCount
                label="Pending reminders"
                value={data.counts.pendingReminders}
              />
              <DashboardCount
                label="Overdue items"
                value={data.counts.overdueItems}
              />
            </dl>
          </ContentCard>
        ) : null}
      </PageSection>

      {data ? (
        <>
          <PageSection>
            <ContentCard title="Today's events">
              <EntryList entries={data.todayEvents} emptyMessage="No events today." />
            </ContentCard>
          </PageSection>
          <PageSection>
            <ContentCard title="Upcoming events (next 7 days)">
              <EntryList
                entries={data.upcomingEvents}
                emptyMessage="No upcoming events."
              />
            </ContentCard>
          </PageSection>
          <PageSection>
            <ContentCard title="Staff scheduled today">
              <EntryList
                entries={data.todayStaff}
                emptyMessage="No staff scheduled today."
              />
            </ContentCard>
          </PageSection>
          <PageSection>
            <ContentCard title="Pending procurements">
              <EntryList
                entries={data.pendingProcurements}
                emptyMessage="No pending procurements."
              />
            </ContentCard>
          </PageSection>
          <PageSection>
            <ContentCard title="Inventory dispatches">
              <EntryList
                entries={data.inventoryDispatches}
                emptyMessage="No dispatch-ready inventory."
              />
            </ContentCard>
          </PageSection>
          <PageSection>
            <ContentCard title="Pending reminders">
              <EntryList
                entries={data.pendingReminders}
                emptyMessage="No pending reminders."
              />
            </ContentCard>
          </PageSection>
          <PageSection>
            <ContentCard title="Overdue items">
              <EntryList entries={data.overdueItems} emptyMessage="Nothing overdue." />
            </ContentCard>
          </PageSection>
        </>
      ) : null}
    </>
  );
}

/**
 * Unified Operations Calendar (P2-10) — read-only aggregation across events,
 * staff, procurement, inventory, reminders, and communications.
 */
export function OperationsCalendarPage() {
  const pathname = usePathname() ?? '/app/calendar/';
  const searchParams = useSearchParams();
  const initialBookingId = searchParams.get('bookingId') ?? '';
  const requestedView = searchParams.get('view');

  const [view, setView] = useState<ViewMode>(() => {
    const match = VIEW_TABS.find((tab) => tab.id === requestedView);
    return match ? match.id : 'dashboard';
  });
  const [rangeMode, setRangeMode] = useState<RangeMode>('week');
  const [anchor, setAnchor] = useState(() => toIsoDate(new Date()));
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [sources, setSources] = useState<CalendarEntrySource[]>([]);
  const [status, setStatus] = useState('');

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: initialBookingId ? 'Booking calendar' : 'Operations Calendar',
  });

  const range = useMemo(
    () => computeRange(anchor, rangeMode),
    [anchor, rangeMode],
  );

  const trimmedBookingId = bookingId.trim();
  const trimmedStatus = status.trim();

  const filter = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      ...(trimmedBookingId ? { bookingId: trimmedBookingId } : {}),
      ...(trimmedStatus ? { status: trimmedStatus } : {}),
      ...(sources.length > 0 ? { sources } : {}),
    }),
    [range, trimmedBookingId, trimmedStatus, sources],
  );

  const conflictsFilter = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      ...(trimmedBookingId ? { bookingId: trimmedBookingId } : {}),
    }),
    [range, trimmedBookingId],
  );

  const planningQuery = useCalendarPlanningQuery(view === 'dashboard');
  const eventsQuery = useCalendarEventsQuery(filter, view === 'calendar');
  const agendaQuery = useCalendarAgendaQuery(filter, view === 'agenda');
  const timelineQuery = useCalendarTimelineQuery(filter, view === 'timeline');
  const conflictsQuery = useCalendarConflictsQuery(
    conflictsFilter,
    view === 'conflicts',
  );

  return (
    <RequirePermission permission="calendar:read">
      <PageLayout>
        <PageHeader
          title="Operations Calendar"
          description="Unified read-only view across events, staff, procurement, inventory, reminders, and communications."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            bookingId ? (
              <Button asChild variant="outline">
                <Link href="/app/calendar/">Clear booking filter</Link>
              </Button>
            ) : undefined
          }
        />

        <PageSection>
          <div className="flex flex-wrap gap-2">
            {VIEW_TABS.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={view === tab.id ? 'default' : 'outline'}
                onClick={() => setView(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </PageSection>

        {view !== 'dashboard' ? (
          <PageSection>
            <ContentCard title="Range">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
                  value={rangeMode}
                  onChange={(e) => setRangeMode(e.target.value as RangeMode)}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
                <input
                  type="date"
                  className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
                  value={anchor}
                  onChange={(e) => setAnchor(e.target.value)}
                />
                <span className="text-xs text-muted-foreground">
                  {range.from} → {range.to}
                </span>
              </div>
            </ContentCard>
          </PageSection>
        ) : null}

        {view === 'calendar' || view === 'agenda' || view === 'timeline' ? (
          <PageSection>
            <CalendarFilterPanel
              sources={sources}
              onSourcesChange={setSources}
              status={status}
              onStatusChange={setStatus}
              bookingId={bookingId}
              onBookingIdChange={setBookingId}
            />
          </PageSection>
        ) : null}

        {view === 'conflicts' ? (
          <PageSection>
            <ContentCard
              title="Filters"
              description={
                bookingId
                  ? `Scoped to booking ${bookingId}`
                  : 'Optionally scope conflicts to a booking'
              }
            >
              <div className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">
                    Booking ID
                  </span>
                  <input
                    className="flex h-9 w-64 rounded-md border border-input bg-card px-3 text-sm"
                    placeholder="Booking UUID"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                  />
                </label>
              </div>
            </ContentCard>
          </PageSection>
        ) : null}

        {view === 'dashboard' ? (
          <DashboardView
            isLoading={planningQuery.isLoading}
            isError={planningQuery.isError}
            error={planningQuery.error}
            data={planningQuery.data}
            onRetry={() => void planningQuery.refetch()}
          />
        ) : null}

        {view === 'calendar' ? (
          <PageSection>
            <ContentCard
              title="Calendar entries"
              description={`${(eventsQuery.data ?? []).length} entr${
                (eventsQuery.data ?? []).length === 1 ? 'y' : 'ies'
              }`}
            >
              {eventsQuery.isLoading ? (
                <LoadingState variant="skeleton" rows={4} />
              ) : null}
              {eventsQuery.isError ? (
                <ErrorState
                  title="Unable to load calendar"
                  description={
                    eventsQuery.error instanceof ApiError
                      ? eventsQuery.error.message
                      : 'Request failed.'
                  }
                  onRetry={() => void eventsQuery.refetch()}
                />
              ) : null}
              {!eventsQuery.isLoading && !eventsQuery.isError ? (
                <EntryList
                  entries={eventsQuery.data ?? []}
                  emptyMessage="No calendar entries in this range."
                />
              ) : null}
            </ContentCard>
          </PageSection>
        ) : null}

        {view === 'agenda' ? (
          <PageSection>
            <ContentCard
              title="Agenda"
              description={`${(agendaQuery.data ?? []).length} entr${
                (agendaQuery.data ?? []).length === 1 ? 'y' : 'ies'
              }`}
            >
              {agendaQuery.isLoading ? (
                <LoadingState variant="skeleton" rows={4} />
              ) : null}
              {agendaQuery.isError ? (
                <ErrorState
                  title="Unable to load agenda"
                  description={
                    agendaQuery.error instanceof ApiError
                      ? agendaQuery.error.message
                      : 'Request failed.'
                  }
                  onRetry={() => void agendaQuery.refetch()}
                />
              ) : null}
              {!agendaQuery.isLoading && !agendaQuery.isError ? (
                <EntryList
                  entries={agendaQuery.data ?? []}
                  emptyMessage="No agenda entries in this range."
                />
              ) : null}
            </ContentCard>
          </PageSection>
        ) : null}

        {view === 'timeline' ? (
          <PageSection>
            <ContentCard
              title="Timeline"
              description={`${(timelineQuery.data ?? []).length} entr${
                (timelineQuery.data ?? []).length === 1 ? 'y' : 'ies'
              }`}
            >
              {timelineQuery.isLoading ? (
                <LoadingState variant="skeleton" rows={4} />
              ) : null}
              {timelineQuery.isError ? (
                <ErrorState
                  title="Unable to load timeline"
                  description={
                    timelineQuery.error instanceof ApiError
                      ? timelineQuery.error.message
                      : 'Request failed.'
                  }
                  onRetry={() => void timelineQuery.refetch()}
                />
              ) : null}
              {!timelineQuery.isLoading && !timelineQuery.isError ? (
                <EntryList
                  entries={timelineQuery.data ?? []}
                  emptyMessage="No timeline entries in this range."
                />
              ) : null}
            </ContentCard>
          </PageSection>
        ) : null}

        {view === 'conflicts' ? (
          <PageSection>
            <ContentCard
              title="Conflicts"
              description={
                conflictsQuery.data
                  ? `${conflictsQuery.data.items.length} item(s) · ${conflictsQuery.data.counts.staffConflicts} staff · ${conflictsQuery.data.counts.inventoryShortages} inventory · ${conflictsQuery.data.counts.procurementDelays} procurement · ${conflictsQuery.data.counts.pendingReminders} reminders`
                  : undefined
              }
            >
              {conflictsQuery.isLoading ? (
                <LoadingState variant="skeleton" rows={4} />
              ) : null}
              {conflictsQuery.isError ? (
                <ErrorState
                  title="Unable to load conflicts"
                  description={
                    conflictsQuery.error instanceof ApiError
                      ? conflictsQuery.error.message
                      : 'Request failed.'
                  }
                  onRetry={() => void conflictsQuery.refetch()}
                />
              ) : null}
              {!conflictsQuery.isLoading &&
              !conflictsQuery.isError &&
              (conflictsQuery.data?.items.length ?? 0) === 0 ? (
                <EmptyState
                  title="No conflicts"
                  description="No conflicts detected in this range."
                />
              ) : null}
              {!conflictsQuery.isLoading &&
              !conflictsQuery.isError &&
              (conflictsQuery.data?.items.length ?? 0) > 0 ? (
                <ul className="space-y-2">
                  {(conflictsQuery.data?.items ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{item.title}</p>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs',
                            severityBadgeClass(item.severity),
                          )}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.message}
                      </p>
                      {item.bookingId ? (
                        <Link
                          className="text-xs underline"
                          href={`/app/bookings/view/?id=${encodeURIComponent(item.bookingId)}`}
                        >
                          Open booking
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </ContentCard>
          </PageSection>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
