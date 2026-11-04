'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import {
  ContentCard,
  LoadingState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { useSchedulingCalendarQuery } from '../hooks/use-scheduling-queries';

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() - day);
  return copy;
}

export function SchedulingCalendarPage() {
  const pathname = usePathname() ?? '/app/staff/scheduling/';
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'Scheduling' });
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [anchor, setAnchor] = useState(() => toIsoDate(new Date()));

  const range = useMemo(() => {
    const base = new Date(`${anchor}T00:00:00.000Z`);
    if (view === 'day') {
      return { from: toIsoDate(base), to: toIsoDate(base) };
    }
    if (view === 'week') {
      const from = startOfWeek(base);
      const to = new Date(from);
      to.setUTCDate(to.getUTCDate() + 6);
      return { from: toIsoDate(from), to: toIsoDate(to) };
    }
    const from = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
    const to = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0));
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }, [anchor, view]);

  const calendarQuery = useSchedulingCalendarQuery({
    from: range.from,
    to: range.to,
  });

  return (
    <RequirePermission permission="staff:read">
      <PageLayout>
        <PageHeader
          title="Staff scheduling"
          description="Calendar of assignments, leave, and availability"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Button asChild variant="outline">
              <Link href="/app/staff/">Back to staff</Link>
            </Button>
          }
        />

        <PageSection>
          <ContentCard title="Calendar">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <select
                className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
                value={view}
                onChange={(e) =>
                  setView(e.target.value as 'day' | 'week' | 'month')
                }
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

            {calendarQuery.isLoading ? (
              <LoadingState variant="skeleton" rows={4} />
            ) : null}

            <ul className="space-y-2">
              {(calendarQuery.data ?? []).map((entry, index) => (
                <li
                  key={`${entry.type}-${entry.staffMemberId}-${entry.date}-${index}`}
                  className="rounded-md border border-border p-3 text-sm"
                >
                  <p className="font-medium">
                    {entry.staffName} · {entry.label}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {entry.type}
                    {' · '}
                    {entry.date}
                    {entry.endDate && entry.endDate !== entry.date
                      ? ` → ${entry.endDate}`
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
            {!calendarQuery.isLoading &&
            (calendarQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No scheduling entries in this range.
              </p>
            ) : null}
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
