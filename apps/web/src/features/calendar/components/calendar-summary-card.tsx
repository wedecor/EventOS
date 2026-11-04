'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ContentCard, ErrorState, LoadingState } from '@/shared/components/page';
import { ApiError } from '@/shared/types/api';
import { useCalendarEventsQuery } from '../hooks/use-calendar-queries';
import { formatCalendarSourceLabel } from '../schemas/calendar.schemas';

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

/**
 * Workspace deep-link into the Unified Operations Calendar (P2-10), scoped to
 * this booking's entries across a -14 / +30 day horizon around today.
 */
export function CalendarSummaryCard({ bookingId }: { bookingId: string }) {
  const range = useMemo(() => {
    const today = new Date();
    const from = new Date(today);
    from.setUTCDate(from.getUTCDate() - 14);
    const to = new Date(today);
    to.setUTCDate(to.getUTCDate() + 30);
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }, []);

  const query = useCalendarEventsQuery(
    { ...range, bookingId },
    Boolean(bookingId),
  );

  const entries = useMemo(() => query.data ?? [], [query.data]);
  const overdue = entries.filter((e) => e.severity === 'overdue').length;
  const warn = entries.filter((e) => e.severity === 'warn').length;
  const bySource = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      counts.set(entry.source, (counts.get(entry.source) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [entries]);

  return (
    <ContentCard title="Operations calendar">
      {query.isLoading ? <LoadingState variant="skeleton" rows={2} /> : null}
      {query.isError ? (
        <ErrorState
          title="Unable to load calendar"
          description={
            query.error instanceof ApiError
              ? query.error.message
              : 'Request failed.'
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {!query.isLoading && !query.isError ? (
        <>
          <dl className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField label="Entries (-14 / +30 days)" value={entries.length} />
            <DetailField label="Overdue" value={overdue} />
            <DetailField label="Warnings" value={warn} />
            <DetailField label="Sources" value={bySource.length} />
          </dl>
          {bySource.length > 0 ? (
            <ul className="mb-4 flex flex-wrap gap-2">
              {bySource.map(([source, count]) => (
                <li
                  key={source}
                  className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground"
                >
                  {formatCalendarSourceLabel(source)}: {count}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">
              No calendar activity for this booking in the current window.
            </p>
          )}
        </>
      ) : null}
      <p className="text-sm text-muted-foreground">
        <Link
          className="underline"
          href={`/app/calendar/?bookingId=${encodeURIComponent(bookingId)}`}
        >
          Open in Operations Calendar
        </Link>
      </p>
    </ContentCard>
  );
}
